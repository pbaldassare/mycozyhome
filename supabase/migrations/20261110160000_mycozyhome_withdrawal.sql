-- Specifiche §6: con un professionista con P.IVA il cliente ha il pulsante "recedi dal contratto qui",
-- per 14 giorni dalla prenotazione e finché il servizio non è completato. Vale anche come annullamento.
ALTER TABLE mycozyhome.bookings
  ADD COLUMN IF NOT EXISTS withdrawal_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawal_name text,
  ADD COLUMN IF NOT EXISTS withdrawal_channel text;

CREATE OR REPLACE FUNCTION mycozyhome.withdraw_booking(p_booking_id uuid, p_name text, p_channel text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE b mycozyhome.bookings;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF length(trim(COALESCE(p_name, ''))) < 3 OR p_channel NOT IN ('email', 'app') THEN RAISE EXCEPTION 'FC_INVALID_INPUT'; END IF;
  SELECT * INTO b FROM mycozyhome.bookings WHERE id = p_booking_id AND client_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF NOT EXISTS (SELECT 1 FROM mycozyhome.professionals WHERE id = b.professional_id AND has_vat_number)
     OR now() > b.created_at + interval '14 days' THEN
    RAISE EXCEPTION 'FC_BOOKING_NOT_CANCELLABLE';
  END IF;
  UPDATE mycozyhome.bookings
  SET withdrawal_at = now(), withdrawal_name = left(trim(p_name), 120), withdrawal_channel = p_channel
  WHERE id = p_booking_id;
  PERFORM mycozyhome.cancel_booking(p_booking_id, 'Recesso dal contratto');
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.withdraw_booking(uuid, text, text) TO authenticated;
