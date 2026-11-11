-- Specifiche §13 (TP 10, DAC7): i dati fiscali dei professionisti si conservano 10 anni
-- anche dopo la chiusura dell'account. Prima di anonimizzare il profilo li copiamo qui.
CREATE TABLE mycozyhome.fiscal_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  first_name text, last_name text, email text, birth_date date, fiscal_code text, vat_number text,
  address text, city text, province text, postal_code text, iban text,
  archived_at timestamptz NOT NULL DEFAULT now(),
  retain_until date NOT NULL DEFAULT (current_date + interval '10 years')::date
);
ALTER TABLE mycozyhome.fiscal_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads fiscal archive" ON mycozyhome.fiscal_archive FOR SELECT TO authenticated
  USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
GRANT SELECT ON mycozyhome.fiscal_archive TO authenticated;

SELECT cron.schedule('mycozyhome-purge-fiscal-archive', '45 3 * * *',
  $$DELETE FROM mycozyhome.fiscal_archive WHERE retain_until < current_date$$);

CREATE OR REPLACE FUNCTION mycozyhome.leave_mycozyhome() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_prof_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  SELECT id INTO v_prof_id FROM mycozyhome.professionals WHERE user_id = v_uid;
  IF EXISTS (
    SELECT 1 FROM mycozyhome.bookings
    WHERE (client_id = v_uid OR professional_id = v_prof_id)
      AND (status IN ('pending', 'confirmed') OR payment_status IN ('held', 'pending_release', 'disputed'))
  ) THEN
    RAISE EXCEPTION 'FC_LEAVE_ACTIVE_BOOKINGS';
  END IF;
  IF EXISTS (SELECT 1 FROM mycozyhome.payout_requests WHERE user_id = v_uid AND status = 'pending') THEN
    RAISE EXCEPTION 'FC_LEAVE_ACTIVE_BOOKINGS';
  END IF;

  -- DAC7: copia dei dati fiscali prima dell'anonimizzazione.
  INSERT INTO mycozyhome.fiscal_archive (user_id, professional_id, first_name, last_name, email, birth_date,
    fiscal_code, vat_number, address, city, province, postal_code, iban)
  SELECT p.user_id, p.id, p.first_name, p.last_name, p.email, p.birth_date, p.fiscal_code, p.vat_number,
         p.address, p.city, p.province, p.postal_code,
         (SELECT pr.iban FROM mycozyhome.payout_requests pr WHERE pr.user_id = v_uid ORDER BY pr.created_at DESC LIMIT 1)
  FROM mycozyhome.professionals p WHERE p.user_id = v_uid;

  UPDATE mycozyhome.client_profiles
  SET first_name = 'Utente', last_name = 'eliminato', email = NULL, phone = NULL, avatar_url = NULL,
      address = NULL, city = NULL, province = NULL, postal_code = NULL, latitude = NULL, longitude = NULL,
      preferences = '{}'::jsonb, updated_at = now()
  WHERE user_id = v_uid;
  UPDATE mycozyhome.professionals
  SET first_name = 'Utente', last_name = 'eliminato', email = '', phone = '', birth_date = NULL,
      fiscal_code = NULL, avatar_url = NULL, address = NULL, postal_code = NULL, bio = NULL,
      latitude = NULL, longitude = NULL, formatted_address = NULL, vat_number = NULL,
      status = 'suspended', preferences = '{}'::jsonb, updated_at = now()
  WHERE user_id = v_uid;
  UPDATE mycozyhome.professional_services SET is_active = false WHERE professional_id = v_prof_id;
  DELETE FROM mycozyhome.favorites WHERE client_id = v_uid;
  DELETE FROM mycozyhome.user_roles WHERE user_id = v_uid;
END; $$;
