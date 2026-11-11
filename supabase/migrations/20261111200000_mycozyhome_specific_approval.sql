-- TU art. 23 / TP art. 24 (artt. 1341-1342 c.c.): approvazione specifica separata, registrata con l'accettazione.
ALTER TABLE mycozyhome.terms_acceptances ADD COLUMN IF NOT EXISTS specific_approval boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION mycozyhome.record_terms_on_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'terms_version' THEN
    INSERT INTO mycozyhome.terms_acceptances (user_id, role, terms_version, adult_and_truthful, specific_approval)
    VALUES (NEW.id,
            CASE WHEN NEW.raw_user_meta_data->>'role' = 'professional' THEN 'professional' ELSE 'client' END,
            left(NEW.raw_user_meta_data->>'terms_version', 40),
            COALESCE((NEW.raw_user_meta_data->>'adult_and_truthful')::boolean, false),
            COALESCE((NEW.raw_user_meta_data->>'specific_approval')::boolean, false));
  END IF;
  RETURN NEW;
END; $$;
