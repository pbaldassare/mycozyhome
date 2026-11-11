-- Specifiche §11 (TP 12.2): recensione entro 3 giorni dal servizio; il professionista può rispondere.
ALTER TABLE mycozyhome.reviews
  ADD COLUMN IF NOT EXISTS professional_reply text,
  ADD COLUMN IF NOT EXISTS professional_reply_at timestamptz;

CREATE FUNCTION mycozyhome.review_within_window() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM mycozyhome.bookings b WHERE b.id = NEW.booking_id
      AND COALESCE(b.completed_at, (b.scheduled_date + b.scheduled_time_end) AT TIME ZONE 'Europe/Rome') < now() - interval '3 days'
  ) THEN
    RAISE EXCEPTION 'FC_REVIEW_EXPIRED';
  END IF;
  NEW.professional_reply := NULL; NEW.professional_reply_at := NULL;
  RETURN NEW;
END; $$;
CREATE TRIGGER review_within_window BEFORE INSERT ON mycozyhome.reviews
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.review_within_window();

CREATE FUNCTION mycozyhome.reply_to_review(p_review_id uuid, p_reply text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF length(trim(COALESCE(p_reply, ''))) < 2 THEN RAISE EXCEPTION 'FC_INVALID_INPUT'; END IF;
  UPDATE mycozyhome.reviews r SET professional_reply = left(trim(p_reply), 1000), professional_reply_at = now()
  FROM mycozyhome.professionals p
  WHERE r.id = p_review_id AND p.id = r.professional_id AND p.user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.reply_to_review(uuid, text) TO authenticated;
