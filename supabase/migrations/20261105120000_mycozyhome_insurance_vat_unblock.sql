-- Approvazione solo con carta d'identità e polizza RC approvate.
CREATE FUNCTION mycozyhome.require_docs_for_approval() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' AND EXISTS (
    SELECT 1 FROM unnest(ARRAY['id_card', 'insurance']) t
    WHERE NOT EXISTS (SELECT 1 FROM mycozyhome.professional_documents d
      WHERE d.professional_id = NEW.id AND d.document_type = t AND d.status = 'approved')
  ) THEN
    RAISE EXCEPTION 'FC_DOCS_REQUIRED';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER require_docs_for_approval BEFORE UPDATE ON mycozyhome.professionals
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.require_docs_for_approval();

-- Registrazione P.IVA: toglie anche il blocco del limite 5.000 € (il professionista da solo non può).
CREATE FUNCTION mycozyhome.register_vat_number(p_vat text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_vat text := regexp_replace(COALESCE(p_vat, ''), '\D', '', 'g');
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF v_vat !~ '^\d{11}$' THEN RAISE EXCEPTION 'FC_VAT_REQUIRED'; END IF;
  UPDATE mycozyhome.professionals
  SET has_vat_number = true, vat_number = v_vat, vat_registered_at = now(), revenue_blocked = false
  WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION mycozyhome.register_vat_number(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION mycozyhome.register_vat_number(text) TO authenticated;
