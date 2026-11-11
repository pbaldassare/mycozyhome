-- Specifiche §7 (TU 7.5, 13.4): segnalazione di esecuzione non conforme entro 48 ore, con motivazione
-- obbligatoria; segnalazione di danni entro 7 giorni, con descrizione e foto. La segnalazione NON blocca
-- il pagamento: finisce nella coda admin (sospensione/esclusione del professionista).
ALTER TABLE mycozyhome.disputes ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION mycozyhome.suspend_payment_on_dispute() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_booking RECORD; v_ref timestamptz;
BEGIN
  IF NEW.booking_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO v_booking FROM mycozyhome.bookings WHERE id = NEW.booking_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF length(trim(COALESCE(NEW.description, ''))) < 10 THEN RAISE EXCEPTION 'FC_REPORT_REASON_REQUIRED'; END IF;
  v_ref := COALESCE(v_booking.completed_at,
                    (v_booking.scheduled_date + v_booking.scheduled_time_end) AT TIME ZONE 'Europe/Rome');
  v_ref := v_ref + (CASE WHEN NEW.reason = 'damage' THEN interval '7 days' ELSE interval '48 hours' END);
  IF now() > v_ref THEN
    RAISE EXCEPTION 'FC_REPORT_WINDOW';
  END IF;
  RETURN NEW; -- nessun blocco del pagamento
END; $$;

-- Il versamento non aspetta più le segnalazioni aperte: conta solo la finestra di 3 ore.
CREATE OR REPLACE FUNCTION mycozyhome.release_booking_payment(p_booking_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_booking RECORD;
BEGIN
  SELECT b.* INTO v_booking FROM mycozyhome.bookings b WHERE b.id = p_booking_id FOR UPDATE OF b;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_booking.payment_status NOT IN ('pending_release') THEN RETURN FALSE; END IF;
  IF v_booking.dispute_deadline_at IS NOT NULL AND v_booking.dispute_deadline_at > now() THEN RETURN FALSE; END IF;
  PERFORM mycozyhome.pay_professional(p_booking_id, 'release', 'Pagamento servizio completato');
  RETURN TRUE;
END; $$;
