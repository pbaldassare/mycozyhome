-- P.IVA obbligatoria in registrazione, salvo dichiarazione di prestazione occasionale.
ALTER TABLE mycozyhome.professionals ADD COLUMN IF NOT EXISTS occasional_declared_at timestamp with time zone;
COMMENT ON COLUMN mycozyhome.professionals.occasional_declared_at IS 'Quando il professionista senza P.IVA ha dichiarato di lavorare in modo occasionale e non continuativo';
CREATE OR REPLACE VIEW mycozyhome.professional_private AS
  SELECT * FROM mycozyhome.professionals
  WHERE user_id = auth.uid() OR mycozyhome.is_admin();
