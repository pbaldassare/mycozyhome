-- Specifiche §4-6: versamento 3 ore dopo "Servizio completato"; nelle stesse 3 ore il cliente può
-- segnalare la mancata presentazione (esito automatico sul check-in); il professionista, dopo un
-- check-in valido, può segnalare "cliente assente / accesso negato" (60% / 40%).
ALTER TABLE mycozyhome.bookings
  ADD COLUMN IF NOT EXISTS no_show_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_show_outcome text,
  ADD COLUMN IF NOT EXISTS client_absent_at timestamptz,
  ADD COLUMN IF NOT EXISTS absence_indemnity numeric;

CREATE OR REPLACE FUNCTION mycozyhome.start_booking_payment_release() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed'
     AND OLD.payment_status = 'held' THEN
    NEW.payment_status := 'pending_release';
    NEW.completed_at := COALESCE(NEW.completed_at, now());
    NEW.dispute_deadline_at := COALESCE(NEW.completed_at, now()) + interval '3 hours';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION mycozyhome.has_valid_checkin(p_booking_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT EXISTS (SELECT 1 FROM mycozyhome.booking_tracking
                 WHERE booking_id = p_booking_id AND check_in_at IS NOT NULL AND check_in_in_range);
$$;

-- Cliente: "Il professionista non si è presentato", entro 3 ore da "Servizio completato".
CREATE OR REPLACE FUNCTION mycozyhome.report_professional_no_show(p_booking_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE b mycozyhome.bookings; v_amount numeric;
BEGIN
  SELECT * INTO b FROM mycozyhome.bookings WHERE id = p_booking_id AND client_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF b.status <> 'completed' OR b.payment_status <> 'pending_release' OR b.no_show_reported_at IS NOT NULL
     OR now() > b.completed_at + interval '3 hours' THEN
    RAISE EXCEPTION 'FC_NO_SHOW_WINDOW';
  END IF;
  UPDATE mycozyhome.bookings SET no_show_reported_at = now() WHERE id = p_booking_id;

  IF mycozyhome.has_valid_checkin(p_booking_id) THEN
    PERFORM mycozyhome.pay_professional(p_booking_id, 'release', 'Pagamento servizio (check-in valido)');
    UPDATE mycozyhome.bookings SET no_show_outcome = 'paid_checkin_valid' WHERE id = p_booking_id;
    RETURN 'paid_checkin_valid';
  END IF;

  v_amount := COALESCE(b.payment_held_amount, b.total_amount);
  PERFORM mycozyhome.ensure_client_wallet(b.client_id);
  UPDATE mycozyhome.client_wallets SET balance = balance + v_amount, updated_at = now() WHERE user_id = b.client_id;
  INSERT INTO mycozyhome.wallet_transactions (user_id, booking_id, type, amount, direction, description)
  VALUES (b.client_id, b.id, 'refund', v_amount, 'credit', 'Rimborso: professionista non presentato (nessun check-in)');
  UPDATE mycozyhome.bookings
  SET payment_status = 'refunded', cancellation_refund = v_amount, no_show_outcome = 'refunded_no_checkin', updated_at = now()
  WHERE id = p_booking_id;
  RETURN 'refunded_no_checkin';
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.report_professional_no_show(uuid) TO authenticated;

-- Professionista: "Cliente assente / accesso negato", solo dopo un check-in valido.
-- 40% torna al cliente; sul 60% la quota pari alla commissione va a MyCozyHome come indennizzo (TU 8.3).
CREATE OR REPLACE FUNCTION mycozyhome.report_client_absent(p_booking_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE b mycozyhome.bookings; v_pro_user uuid; v_amount numeric; v_refund numeric; v_indemnity numeric; v_pro numeric;
BEGIN
  SELECT bk.* INTO b FROM mycozyhome.bookings bk JOIN mycozyhome.professionals p ON p.id = bk.professional_id
  WHERE bk.id = p_booking_id AND p.user_id = auth.uid() FOR UPDATE OF bk;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF b.status <> 'confirmed' OR b.payment_status <> 'held' THEN RAISE EXCEPTION 'FC_BOOKING_NOT_CANCELLABLE'; END IF;
  IF NOT mycozyhome.has_valid_checkin(p_booking_id) THEN RAISE EXCEPTION 'FC_CHECKIN_REQUIRED'; END IF;

  v_amount := COALESCE(b.payment_held_amount, b.total_amount);
  v_refund := round(v_amount * 0.4, 2);
  v_indemnity := round((v_amount - v_refund) * mycozyhome.commission_rate(b.client_id, b.professional_id), 2);
  v_pro := v_amount - v_refund - v_indemnity;
  SELECT auth.uid() INTO v_pro_user;

  PERFORM mycozyhome.ensure_client_wallet(b.client_id);
  UPDATE mycozyhome.client_wallets SET balance = balance + v_refund, updated_at = now() WHERE user_id = b.client_id;
  INSERT INTO mycozyhome.wallet_transactions (user_id, booking_id, type, amount, direction, description)
  VALUES (b.client_id, b.id, 'refund', v_refund, 'credit', 'Rimborso 40%: cliente assente o accesso negato');

  PERFORM mycozyhome.ensure_professional_wallet(b.professional_id, v_pro_user);
  UPDATE mycozyhome.professional_wallets SET balance = balance + v_pro, updated_at = now() WHERE professional_id = b.professional_id;
  INSERT INTO mycozyhome.wallet_transactions (user_id, professional_id, booking_id, type, amount, direction, description)
  VALUES (v_pro_user, b.professional_id, b.id, 'release', v_pro, 'credit', 'Cliente assente: 60% al netto dell''indennizzo MyCozyHome');

  -- Prima il pagamento, poi lo stato: così il trigger di rimborso non riparte.
  UPDATE mycozyhome.bookings
  SET payment_status = 'released', payment_released_at = now(), client_absent_at = now(),
      cancellation_refund = v_refund, cancellation_professional_amount = v_pro, absence_indemnity = v_indemnity
  WHERE id = p_booking_id;
  UPDATE mycozyhome.bookings
  SET status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(),
      cancellation_reason = 'Cliente assente o accesso negato', updated_at = now()
  WHERE id = p_booking_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.report_client_absent(uuid) TO authenticated;
