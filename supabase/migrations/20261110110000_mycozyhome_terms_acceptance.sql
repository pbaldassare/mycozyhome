-- Specifiche §1: per ogni accettazione dei Termini conservare data, ora, IP,
-- versione accettata (e in futuro l'id della firma OTP).
CREATE TABLE mycozyhome.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('client', 'professional')),
  terms_version text NOT NULL,
  adult_and_truthful boolean NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text,
  otp_signature_id text
);
CREATE INDEX terms_acceptances_user_idx ON mycozyhome.terms_acceptances (user_id);
ALTER TABLE mycozyhome.terms_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own acceptances" ON mycozyhome.terms_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
GRANT SELECT ON mycozyhome.terms_acceptances TO authenticated;

-- Scatta solo per le registrazioni di MyCozyHome (che mandano terms_version nei metadati).
CREATE FUNCTION mycozyhome.record_terms_on_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'terms_version' THEN
    INSERT INTO mycozyhome.terms_acceptances (user_id, role, terms_version, adult_and_truthful)
    VALUES (NEW.id,
            CASE WHEN NEW.raw_user_meta_data->>'role' = 'professional' THEN 'professional' ELSE 'client' END,
            left(NEW.raw_user_meta_data->>'terms_version', 40),
            COALESCE((NEW.raw_user_meta_data->>'adult_and_truthful')::boolean, false));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER mycozyhome_record_terms AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.record_terms_on_signup();

-- L'IP lo vede solo una richiesta HTTP: il client lo timbra al primo accesso.
CREATE FUNCTION mycozyhome.stamp_terms_ip() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE h json := nullif(current_setting('request.headers', true), '')::json;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  UPDATE mycozyhome.terms_acceptances
  SET ip = left(split_part(COALESCE(h->>'x-forwarded-for', h->>'cf-connecting-ip', ''), ',', 1), 64),
      user_agent = left(h->>'user-agent', 300)
  WHERE user_id = auth.uid() AND ip IS NULL;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.stamp_terms_ip() TO authenticated;
