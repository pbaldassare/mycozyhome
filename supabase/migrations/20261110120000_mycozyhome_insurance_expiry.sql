-- Specifiche §1-2: data di scadenza della polizza RC; niente approvazione con polizza scaduta.
ALTER TABLE mycozyhome.professional_documents ADD COLUMN IF NOT EXISTS expires_on date;

CREATE OR REPLACE FUNCTION mycozyhome.require_docs_for_approval() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' AND EXISTS (
    SELECT 1 FROM unnest(ARRAY['id_card', 'insurance']) t
    WHERE NOT EXISTS (SELECT 1 FROM mycozyhome.professional_documents d
      WHERE d.professional_id = NEW.id AND d.document_type = t AND d.status = 'approved'
        AND (t <> 'insurance' OR d.expires_on IS NULL OR d.expires_on >= current_date))
  ) THEN
    RAISE EXCEPTION 'FC_DOCS_REQUIRED';
  END IF;
  RETURN NEW;
END; $$;
