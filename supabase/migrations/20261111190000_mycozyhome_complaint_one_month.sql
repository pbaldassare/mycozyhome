-- Policy §5 (Condizioni e Policy v2.1): reclamo interno entro 1 mese dalla decisione (prima 6 mesi).
CREATE OR REPLACE FUNCTION mycozyhome.create_appeal(p_kind text, p_booking_id uuid, p_dispute_id uuid, p_message text)
RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_decider uuid; v_decided_at timestamptz; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF length(trim(COALESCE(p_message, ''))) < 10 THEN RAISE EXCEPTION 'FC_REPORT_REASON_REQUIRED'; END IF;

  IF p_kind = 'human_review' THEN
    PERFORM 1 FROM mycozyhome.bookings b LEFT JOIN mycozyhome.professionals p ON p.id = b.professional_id
    WHERE b.id = p_booking_id AND (b.client_id = v_uid OR p.user_id = v_uid);
    IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  ELSIF p_kind = 'complaint' THEN
    SELECT resolved_by, resolved_at INTO v_decider, v_decided_at FROM mycozyhome.disputes
    WHERE id = p_dispute_id AND v_uid IN (reporter_id, reported_id) AND resolved_at IS NOT NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
    IF now() > v_decided_at + interval '1 month' THEN RAISE EXCEPTION 'FC_COMPLAINT_WINDOW'; END IF;
  ELSE
    RAISE EXCEPTION 'FC_INVALID_INPUT';
  END IF;

  INSERT INTO mycozyhome.appeals (kind, user_id, booking_id, dispute_id, original_decider, message)
  VALUES (p_kind, v_uid, p_booking_id, p_dispute_id, v_decider, trim(p_message))
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
