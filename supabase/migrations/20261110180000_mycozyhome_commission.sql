-- Specifiche §4 (PT, TP 9.2): commissione 12% sul prezzo, 10% dal 10° servizio completato
-- con lo stesso cliente. Il professionista riceve il netto; la commissione resta sulla prenotazione.
ALTER TABLE mycozyhome.bookings ADD COLUMN IF NOT EXISTS platform_commission numeric;

-- Conta i servizi già pagati (escluso quello in corso di pagamento): dal 10° in poi 10%.
CREATE OR REPLACE FUNCTION mycozyhome.commission_rate(p_client uuid, p_professional uuid) RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT CASE WHEN count(*) >= 9 THEN 0.10 ELSE 0.12 END
  FROM mycozyhome.bookings
  WHERE client_id = p_client AND professional_id = p_professional
    AND status = 'completed' AND payment_status = 'released';
$$;

-- Paga il professionista al netto della commissione.
CREATE OR REPLACE FUNCTION mycozyhome.pay_professional(p_booking_id uuid, p_type text, p_description text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE b record; v_gross numeric; v_comm numeric;
BEGIN
  SELECT bk.*, p.user_id AS prof_user_id INTO b
  FROM mycozyhome.bookings bk JOIN mycozyhome.professionals p ON p.id = bk.professional_id WHERE bk.id = p_booking_id;
  v_gross := COALESCE(b.payment_held_amount, b.total_amount);
  v_comm := round(v_gross * mycozyhome.commission_rate(b.client_id, b.professional_id), 2);
  PERFORM mycozyhome.ensure_professional_wallet(b.professional_id, b.prof_user_id);
  UPDATE mycozyhome.professional_wallets SET balance = balance + (v_gross - v_comm), updated_at = now()
  WHERE professional_id = b.professional_id;
  INSERT INTO mycozyhome.wallet_transactions (user_id, professional_id, booking_id, type, amount, direction, description)
  VALUES (b.prof_user_id, b.professional_id, p_booking_id, p_type, v_gross - v_comm, 'credit',
          p_description || ' (commissione ' || to_char(v_comm, 'FM999990.00') || ' €)');
  UPDATE mycozyhome.bookings
  SET payment_status = 'released', payment_released_at = now(), platform_commission = v_comm, updated_at = now()
  WHERE id = p_booking_id;
END; $$;
REVOKE EXECUTE ON FUNCTION mycozyhome.pay_professional(uuid, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION mycozyhome.release_booking_payment(p_booking_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_booking RECORD;
BEGIN
  SELECT b.* INTO v_booking FROM mycozyhome.bookings b WHERE b.id = p_booking_id FOR UPDATE OF b;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_booking.payment_status NOT IN ('pending_release') THEN RETURN FALSE; END IF;
  IF EXISTS (SELECT 1 FROM mycozyhome.disputes d WHERE d.booking_id = p_booking_id
    AND d.status IN ('open', 'investigating', 'escalated')) THEN RETURN FALSE; END IF;
  IF v_booking.dispute_deadline_at IS NOT NULL AND v_booking.dispute_deadline_at > now() THEN RETURN FALSE; END IF;
  PERFORM mycozyhome.pay_professional(p_booking_id, 'release', 'Pagamento servizio completato');
  RETURN TRUE;
END; $$;

CREATE OR REPLACE FUNCTION mycozyhome.resolve_dispute_payment(p_dispute_id uuid, p_favor text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_dispute RECORD; v_booking RECORD; v_amount NUMERIC;
BEGIN
  IF NOT mycozyhome.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo gli admin possono risolvere i pagamenti delle dispute';
  END IF;
  SELECT * INTO v_dispute FROM mycozyhome.disputes WHERE id = p_dispute_id;
  IF NOT FOUND OR v_dispute.booking_id IS NULL THEN RETURN FALSE; END IF;
  SELECT b.* INTO v_booking FROM mycozyhome.bookings b WHERE b.id = v_dispute.booking_id;
  v_amount := COALESCE(v_booking.payment_held_amount, v_booking.total_amount);
  IF p_favor = 'client' AND v_booking.payment_status IN ('disputed', 'pending_release', 'held') THEN
    PERFORM mycozyhome.ensure_client_wallet(v_booking.client_id);
    UPDATE mycozyhome.client_wallets SET balance = balance + v_amount, updated_at = now()
    WHERE user_id = v_booking.client_id;
    INSERT INTO mycozyhome.wallet_transactions (user_id, booking_id, type, amount, direction, description)
    VALUES (v_booking.client_id, v_booking.id, 'dispute_refund', v_amount, 'credit', 'Rimborso da contestazione');
    UPDATE mycozyhome.bookings SET payment_status = 'refunded', updated_at = now() WHERE id = v_booking.id;
    RETURN TRUE;
  ELSIF p_favor = 'professional' AND v_booking.payment_status IN ('disputed', 'pending_release', 'held') THEN
    PERFORM mycozyhome.pay_professional(v_booking.id, 'dispute_payout', 'Pagamento dopo contestazione');
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END; $$;
