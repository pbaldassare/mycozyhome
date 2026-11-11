-- Specifiche §10 (TP 13.3, Regolamento P2B, TU 7.8, TP 9.8):
-- sospensione, esclusione con preavviso di 30 giorni (professionisti), ban con lista dei bannati
-- (nome, email, telefono, codice fiscale) conservata 5 anni e controllata alla registrazione.
-- Motivazione scritta sempre obbligatoria; la decisione la prende un admin.
-- ponytail: i ban scaduti vengono ignorati, la cancellazione fisica arriva con le pulizie automatiche.
CREATE TABLE mycozyhome.banned_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('client', 'professional')),
  user_id uuid,
  full_name text,
  email text,
  phone text,
  fiscal_code text,
  reason text NOT NULL,
  banned_by uuid,
  banned_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '5 years'
);
ALTER TABLE mycozyhome.banned_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage banned list" ON mycozyhome.banned_list FOR ALL TO authenticated
  USING (mycozyhome.is_admin()) WITH CHECK (mycozyhome.is_admin());
GRANT SELECT, UPDATE ON mycozyhome.banned_list TO authenticated; -- togliere un ban = farlo scadere ora (resta lo storico)

ALTER TABLE mycozyhome.professionals ADD COLUMN IF NOT EXISTS exclusion_due_at timestamptz;

CREATE FUNCTION mycozyhome.is_banned(p_email text, p_phone text, p_fiscal_code text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM mycozyhome.banned_list
    WHERE expires_at > now() AND (
      (p_email IS NOT NULL AND lower(email) = lower(trim(p_email))) OR
      (p_phone IS NOT NULL AND regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
         AND length(regexp_replace(p_phone, '\D', '', 'g')) >= 6) OR
      (p_fiscal_code IS NOT NULL AND upper(fiscal_code) = upper(trim(p_fiscal_code)))));
$$;

-- Alla registrazione MyCozyHome (metadati con terms_version): email e telefono.
CREATE FUNCTION mycozyhome.block_banned_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'terms_version'
     AND mycozyhome.is_banned(NEW.email, NEW.raw_user_meta_data->>'phone', NULL) THEN
    RAISE EXCEPTION 'FC_BANNED';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER mycozyhome_block_banned_signup BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.block_banned_signup();

-- Telefono e codice fiscale arrivano dopo, nel profilo: stesso controllo.
CREATE FUNCTION mycozyhome.block_banned_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_fc text := CASE WHEN TG_TABLE_NAME = 'professionals' THEN to_jsonb(NEW)->>'fiscal_code' END;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT mycozyhome.is_admin()
     AND mycozyhome.is_banned(NULL, NEW.phone, v_fc) THEN
    RAISE EXCEPTION 'FC_BANNED';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_block_banned_profile BEFORE INSERT OR UPDATE OF phone, fiscal_code ON mycozyhome.professionals
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.block_banned_profile();
CREATE TRIGGER trg_block_banned_profile BEFORE INSERT OR UPDATE OF phone ON mycozyhome.client_profiles
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.block_banned_profile();

CREATE FUNCTION mycozyhome.add_to_banned_list(p_role text, p_user_id uuid, p_reason text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF p_role = 'professional' THEN
    INSERT INTO mycozyhome.banned_list (role, user_id, full_name, email, phone, fiscal_code, reason, banned_by)
    SELECT 'professional', user_id, concat_ws(' ', first_name, last_name), email, phone, fiscal_code, p_reason, auth.uid()
    FROM mycozyhome.professionals WHERE user_id = p_user_id;
  ELSE
    INSERT INTO mycozyhome.banned_list (role, user_id, full_name, email, phone, reason, banned_by)
    SELECT 'client', user_id, concat_ws(' ', first_name, last_name), email, phone, p_reason, auth.uid()
    FROM mycozyhome.client_profiles WHERE user_id = p_user_id;
  END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION mycozyhome.add_to_banned_list(text, uuid, text) FROM PUBLIC, anon, authenticated;

-- p_action: suspend | exclude_30 (solo professionisti) | ban
CREATE FUNCTION mycozyhome.admin_sanction(p_role text, p_user_id uuid, p_action text, p_reason text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_reason text := trim(COALESCE(p_reason, ''));
BEGIN
  IF NOT mycozyhome.is_admin() THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF length(v_reason) < 10 THEN RAISE EXCEPTION 'FC_REPORT_REASON_REQUIRED'; END IF;
  IF p_action NOT IN ('suspend', 'exclude_30', 'ban') OR (p_action = 'exclude_30' AND p_role <> 'professional') THEN
    RAISE EXCEPTION 'FC_INVALID_INPUT';
  END IF;

  IF p_role = 'professional' THEN
    UPDATE mycozyhome.professionals
    SET is_blocked = true, blocked_at = now(), blocked_by = auth.uid(), status = 'suspended',
        blocked_reason = CASE p_action
          WHEN 'exclude_30' THEN 'Esclusione dal ' || to_char(now() + interval '30 days', 'DD/MM/YYYY') || ': ' || v_reason
          WHEN 'ban' THEN 'Esclusione definitiva: ' || v_reason
          ELSE 'Sospensione: ' || v_reason END,
        exclusion_due_at = CASE WHEN p_action = 'exclude_30' THEN now() + interval '30 days' END
    WHERE user_id = p_user_id;
  ELSE
    UPDATE mycozyhome.client_profiles
    SET is_blocked = true, blocked_at = now(), blocked_by = auth.uid(),
        blocked_reason = CASE WHEN p_action = 'ban' THEN 'Esclusione definitiva: ' ELSE 'Sospensione: ' END || v_reason
    WHERE user_id = p_user_id;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;

  IF p_action = 'ban' THEN PERFORM mycozyhome.add_to_banned_list(p_role, p_user_id, v_reason); END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.admin_sanction(text, uuid, text, text) TO authenticated;

-- Allo scadere dei 30 giorni l'esclusione diventa definitiva.
CREATE FUNCTION mycozyhome.apply_due_exclusions() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT user_id, blocked_reason FROM mycozyhome.professionals
           WHERE exclusion_due_at <= now() AND is_blocked LOOP
    PERFORM mycozyhome.add_to_banned_list('professional', r.user_id, r.blocked_reason);
    UPDATE mycozyhome.professionals SET exclusion_due_at = NULL WHERE user_id = r.user_id;
  END LOOP;
END; $$;
REVOKE EXECUTE ON FUNCTION mycozyhome.apply_due_exclusions() FROM PUBLIC, anon, authenticated;
SELECT cron.schedule('mycozyhome-apply-exclusions', '15 4 * * *', $$SELECT mycozyhome.apply_due_exclusions()$$);
