-- Specifiche §5 (GDPR art. 22) e §10-11 (TP 14, DSA art. 20):
-- human_review = "Chiedi la verifica di una persona" su un esito automatico (check-in, cliente assente,
--   mancata presentazione): l'operatore controlla solo che la regola sia stata applicata ai dati.
-- complaint = reclamo interno contro una decisione, entro 6 mesi, esaminato da un operatore
--   diverso da chi ha deciso, con risposta motivata entro 60 giorni.
CREATE TABLE mycozyhome.appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('human_review', 'complaint')),
  user_id uuid NOT NULL,
  booking_id uuid,
  dispute_id uuid,
  original_decider uuid,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered')),
  answer text,
  answered_by uuid,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  reply_due_at timestamptz NOT NULL DEFAULT now() + interval '60 days'
);
ALTER TABLE mycozyhome.appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin appeals" ON mycozyhome.appeals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR mycozyhome.is_admin());
GRANT SELECT ON mycozyhome.appeals TO authenticated;

CREATE FUNCTION mycozyhome.create_appeal(p_kind text, p_booking_id uuid, p_dispute_id uuid, p_message text)
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
    IF now() > v_decided_at + interval '6 months' THEN RAISE EXCEPTION 'FC_COMPLAINT_WINDOW'; END IF;
  ELSE
    RAISE EXCEPTION 'FC_INVALID_INPUT';
  END IF;

  INSERT INTO mycozyhome.appeals (kind, user_id, booking_id, dispute_id, original_decider, message)
  VALUES (p_kind, v_uid, p_booking_id, p_dispute_id, v_decider, trim(p_message))
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.create_appeal(text, uuid, uuid, text) TO authenticated;

CREATE FUNCTION mycozyhome.answer_appeal(p_appeal_id uuid, p_answer text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE a mycozyhome.appeals;
BEGIN
  IF NOT mycozyhome.is_admin() THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF length(trim(COALESCE(p_answer, ''))) < 10 THEN RAISE EXCEPTION 'FC_REPORT_REASON_REQUIRED'; END IF;
  SELECT * INTO a FROM mycozyhome.appeals WHERE id = p_appeal_id AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF a.original_decider = auth.uid() THEN RAISE EXCEPTION 'FC_SAME_OPERATOR'; END IF;
  UPDATE mycozyhome.appeals
  SET status = 'answered', answer = trim(p_answer), answered_by = auth.uid(), answered_at = now()
  WHERE id = p_appeal_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.answer_appeal(uuid, text) TO authenticated;

-- Chi chiude una segnalazione resta registrato: serve al reclamo (operatore diverso).
CREATE FUNCTION mycozyhome.stamp_dispute_resolver() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.resolved_by := auth.uid();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_stamp_dispute_resolver BEFORE UPDATE ON mycozyhome.disputes
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.stamp_dispute_resolver();
