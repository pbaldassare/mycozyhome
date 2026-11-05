-- P.IVA obbligatoria in registrazione, salvo dichiarazione di prestazione occasionale.
ALTER TABLE mycozyhome.professionals ADD COLUMN IF NOT EXISTS occasional_declared_at timestamp with time zone;
COMMENT ON COLUMN mycozyhome.professionals.occasional_declared_at IS 'Quando il professionista senza P.IVA ha dichiarato di lavorare in modo occasionale e non continuativo';
CREATE OR REPLACE VIEW mycozyhome.professional_private AS
  SELECT * FROM mycozyhome.professionals
  WHERE user_id = auth.uid() OR mycozyhome.is_admin();

-- Blocco lato database: chi ha il profilo completo deve avere P.IVA (11 cifre) o la dichiarazione.
-- Vale solo per le modifiche dell'utente; i trigger di sistema (rating, blocchi) passano.
CREATE FUNCTION mycozyhome.require_vat_or_occasional() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR mycozyhome.is_admin() OR NOT NEW.profile_completed THEN
    RETURN NEW;
  END IF;
  IF NOT ((NEW.has_vat_number AND COALESCE(NEW.vat_number, '') ~ '^\d{11}$') OR NEW.occasional_declared_at IS NOT NULL) THEN
    RAISE EXCEPTION 'FC_VAT_REQUIRED';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER require_vat_or_occasional BEFORE INSERT OR UPDATE ON mycozyhome.professionals
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.require_vat_or_occasional();
