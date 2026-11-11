-- Policy §2-3 (DSA art. 16): "Segnala" su profili e recensioni, anche senza account.
-- Motivo, dove si trova, nome ed email, dichiarazione di buona fede; urgenti (sicurezza/minori) in cima.
-- ponytail: conferma di ricezione e decisione mostrate a schermo; via email quando arriva Resend.
CREATE TABLE mycozyhome.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('professional', 'review')),
  target_id uuid NOT NULL,
  location text NOT NULL,
  reason text NOT NULL,
  urgent boolean NOT NULL DEFAULT false,
  reporter_id uuid,
  reporter_name text,
  reporter_email text,
  good_faith boolean NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  decision text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mycozyhome.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read content reports" ON mycozyhome.content_reports FOR SELECT TO authenticated
  USING (mycozyhome.is_admin());
GRANT SELECT ON mycozyhome.content_reports TO authenticated;

CREATE FUNCTION mycozyhome.report_content(p_target_type text, p_target_id uuid, p_location text, p_reason text,
  p_urgent boolean, p_name text, p_email text, p_good_faith boolean) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_id uuid; v_email text := lower(trim(COALESCE(p_email, '')));
BEGIN
  IF length(trim(COALESCE(p_reason, ''))) < 10 THEN RAISE EXCEPTION 'FC_REPORT_REASON_REQUIRED'; END IF;
  IF NOT COALESCE(p_good_faith, false) OR p_target_type NOT IN ('professional', 'review') THEN
    RAISE EXCEPTION 'FC_INVALID_INPUT';
  END IF;
  -- Nome ed email obbligatori, salvo i casi di abusi su minori (urgenti).
  IF NOT COALESCE(p_urgent, false) AND (length(trim(COALESCE(p_name, ''))) < 2 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'FC_INVALID_INPUT';
  END IF;
  -- Freno agli abusi: massimo 10 segnalazioni al giorno per email o account.
  IF (SELECT count(*) FROM mycozyhome.content_reports
      WHERE created_at > now() - interval '1 day'
        AND ((v_email <> '' AND reporter_email = v_email) OR (auth.uid() IS NOT NULL AND reporter_id = auth.uid()))) >= 10 THEN
    RAISE EXCEPTION 'FC_RATE_LIMIT';
  END IF;

  INSERT INTO mycozyhome.content_reports (target_type, target_id, location, reason, urgent, reporter_id,
    reporter_name, reporter_email, good_faith)
  VALUES (p_target_type, p_target_id, left(trim(COALESCE(p_location, '')), 500), left(trim(p_reason), 4000),
    COALESCE(p_urgent, false), auth.uid(), nullif(left(trim(COALESCE(p_name, '')), 200), ''), nullif(left(v_email, 200), ''), true)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.report_content(text, uuid, text, text, boolean, text, text, boolean) TO anon, authenticated;

CREATE FUNCTION mycozyhome.decide_content_report(p_report_id uuid, p_decision text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NOT mycozyhome.is_admin() THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF length(trim(COALESCE(p_decision, ''))) < 10 THEN RAISE EXCEPTION 'FC_REPORT_REASON_REQUIRED'; END IF;
  UPDATE mycozyhome.content_reports
  SET status = 'closed', decision = trim(p_decision), decided_by = auth.uid(), decided_at = now()
  WHERE id = p_report_id AND status = 'open';
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.decide_content_report(uuid, text) TO authenticated;
