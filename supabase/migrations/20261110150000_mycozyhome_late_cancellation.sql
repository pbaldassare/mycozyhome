-- Specifiche §6: il cliente che annulla una prenotazione confermata nelle ultime 3 ore
-- riceve il 50%; al professionista va il 50% al netto della commissione.
-- Annullamento prima, prenotazione non ancora accettata o annullamento del professionista: 100%.
ALTER TABLE mycozyhome.bookings
  ADD COLUMN IF NOT EXISTS cancellation_refund numeric,
  ADD COLUMN IF NOT EXISTS cancellation_professional_amount numeric,
  ADD COLUMN IF NOT EXISTS cancellation_commission numeric;

-- PT / TP 9.2: 12%, 10% dal 10° servizio completato con lo stesso cliente.
CREATE OR REPLACE FUNCTION mycozyhome.commission_rate(p_client uuid, p_professional uuid) RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT CASE WHEN count(*) >= 9 THEN 0.10 ELSE 0.12 END
  FROM mycozyhome.bookings WHERE client_id = p_client AND professional_id = p_professional AND status = 'completed';
$$;

-- Quanto torna al cliente se annulla adesso (usato anche dall'app per la conferma).
CREATE OR REPLACE FUNCTION mycozyhome.cancellation_quote(p_booking_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE b mycozyhome.bookings; v_paid numeric; v_late boolean;
BEGIN
  SELECT * INTO b FROM mycozyhome.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR b.client_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  v_paid := COALESCE(b.payment_held_amount, b.total_amount);
  v_late := b.status = 'confirmed'
    AND now() >= ((b.scheduled_date + b.scheduled_time_start) AT TIME ZONE 'Europe/Rome') - interval '3 hours';
  RETURN jsonb_build_object('late', v_late, 'paid', v_paid,
    'refund', CASE WHEN v_late THEN round(v_paid * 0.5, 2) ELSE v_paid END,
    'retained', CASE WHEN v_late THEN v_paid - round(v_paid * 0.5, 2) ELSE 0 END);
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.cancellation_quote(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION mycozyhome.refund_booking_payment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_amount numeric; v_refund numeric; v_fee numeric; v_comm numeric; v_pro_user uuid; v_late boolean;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled'
     AND OLD.payment_status IN ('held', 'pending_release', 'disputed') THEN
    v_amount := COALESCE(OLD.payment_held_amount, OLD.total_amount);
    v_late := OLD.status = 'confirmed' AND NEW.cancelled_by = OLD.client_id
      AND now() >= ((OLD.scheduled_date + OLD.scheduled_time_start) AT TIME ZONE 'Europe/Rome') - interval '3 hours';
    v_refund := CASE WHEN v_late THEN round(v_amount * 0.5, 2) ELSE v_amount END;

    PERFORM mycozyhome.ensure_client_wallet(OLD.client_id);
    UPDATE mycozyhome.client_wallets SET balance = balance + v_refund, updated_at = now() WHERE user_id = OLD.client_id;
    INSERT INTO mycozyhome.wallet_transactions (user_id, booking_id, type, amount, direction, description)
    VALUES (OLD.client_id, OLD.id, 'refund', v_refund, 'credit',
            CASE WHEN v_late THEN 'Rimborso 50% per annullamento nelle ultime 3 ore' ELSE 'Rimborso crediti per annullamento' END);
    NEW.cancellation_refund := v_refund;
    NEW.payment_status := 'refunded';

    IF v_late THEN
      v_comm := round((v_amount - v_refund) * mycozyhome.commission_rate(OLD.client_id, OLD.professional_id), 2);
      v_fee := v_amount - v_refund - v_comm;
      SELECT user_id INTO v_pro_user FROM mycozyhome.professionals WHERE id = OLD.professional_id;
      PERFORM mycozyhome.ensure_professional_wallet(OLD.professional_id, v_pro_user);
      UPDATE mycozyhome.professional_wallets SET balance = balance + v_fee, updated_at = now()
      WHERE professional_id = OLD.professional_id;
      INSERT INTO mycozyhome.wallet_transactions (user_id, professional_id, booking_id, type, amount, direction, description)
      VALUES (v_pro_user, OLD.professional_id, OLD.id, 'release', v_fee, 'credit',
              'Annullamento tardivo del cliente: 50% al netto della commissione');
      NEW.cancellation_professional_amount := v_fee;
      NEW.cancellation_commission := v_comm;
      NEW.payment_status := 'released';
      NEW.payment_released_at := now();
    END IF;
  END IF;
  RETURN NEW;
END; $$;
