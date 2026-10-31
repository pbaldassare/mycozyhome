-- Fase 0: soldi, ruoli e colonne riservate.
-- Le funzioni non sono più eseguibili per default; prenotazioni create e
-- modificate solo da RPC che calcolano prezzi e stati nel DB; colonne di
-- moderazione modificabili solo dall'admin; ruoli assegnati dal server.

-- 1. Funzioni: nessun EXECUTE di default, poi grant espliciti.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA mycozyhome FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA mycozyhome REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Usate dentro le policy RLS (girano col ruolo di chi interroga).
GRANT EXECUTE ON FUNCTION mycozyhome.has_role(uuid, mycozyhome.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mycozyhome.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mycozyhome.is_client_blocked(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mycozyhome.is_professional_user_blocked(uuid) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION mycozyhome.get_client_wallet_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION mycozyhome.get_professional_rating(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mycozyhome.resolve_dispute_payment(uuid, text) TO authenticated;

-- 2. Fatturato annuo: calcolo interno per il trigger, lettura solo per il
--    professionista stesso o per l'admin.
CREATE FUNCTION mycozyhome._annual_revenue(_prof_id uuid) RETURNS numeric
    LANGUAGE sql STABLE
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT COALESCE(SUM(total_amount), 0)::numeric
  FROM mycozyhome.bookings
  WHERE professional_id = _prof_id
    AND status = 'completed'
    AND completed_at >= date_trunc('year', now())
    AND completed_at <  date_trunc('year', now()) + interval '1 year';
$$;

CREATE OR REPLACE FUNCTION mycozyhome.get_professional_annual_revenue(_prof_id uuid) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NOT (mycozyhome.is_admin()
          OR EXISTS (SELECT 1 FROM mycozyhome.professionals WHERE id = _prof_id AND user_id = auth.uid())) THEN
    RAISE EXCEPTION 'FC_FORBIDDEN';
  END IF;
  RETURN mycozyhome._annual_revenue(_prof_id);
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.get_professional_annual_revenue(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION mycozyhome.check_professional_revenue_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE
  v_has_vat boolean;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT has_vat_number INTO v_has_vat FROM mycozyhome.professionals WHERE id = NEW.professional_id;
    IF v_has_vat = false AND mycozyhome._annual_revenue(NEW.professional_id) >= 5000 THEN
      UPDATE mycozyhome.professionals
      SET revenue_blocked = true, updated_at = now()
      WHERE id = NEW.professional_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Impostazioni dell'app (gestite dall'admin).
CREATE TABLE mycozyhome.app_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid
);
ALTER TABLE mycozyhome.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read settings" ON mycozyhome.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage settings" ON mycozyhome.app_settings TO authenticated
  USING (mycozyhome.is_admin()) WITH CHECK (mycozyhome.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON mycozyhome.app_settings TO authenticated;
INSERT INTO mycozyhome.app_settings (key, value) VALUES ('demo_top_up_enabled', 'false'::jsonb);

-- 4. Ricarica simulata: solo se l'admin la abilita, con tetti.
CREATE OR REPLACE FUNCTION mycozyhome.simulate_wallet_top_up(p_amount numeric) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_user_id UUID := auth.uid(); v_new_balance NUMERIC; v_today NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF NOT COALESCE((SELECT value = 'true'::jsonb FROM mycozyhome.app_settings WHERE key = 'demo_top_up_enabled'), false) THEN
    RAISE EXCEPTION 'FC_TOP_UP_DISABLED';
  END IF;
  IF NOT mycozyhome.has_role(v_user_id, 'client') THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 500 THEN
    RAISE EXCEPTION 'FC_TOP_UP_AMOUNT';
  END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_today FROM mycozyhome.wallet_transactions
  WHERE user_id = v_user_id AND type = 'top_up' AND created_at > now() - interval '1 day';
  IF v_today + p_amount > 1000 THEN RAISE EXCEPTION 'FC_TOP_UP_DAILY_LIMIT'; END IF;
  PERFORM mycozyhome.ensure_client_wallet(v_user_id);
  UPDATE mycozyhome.client_wallets SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = v_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO mycozyhome.wallet_transactions (user_id, type, amount, direction, description)
  VALUES (v_user_id, 'top_up', p_amount, 'credit', 'Ricarica crediti simulata');
  RETURN v_new_balance;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.simulate_wallet_top_up(numeric) TO authenticated;

-- 5. Codici promozionali validati nel DB.
CREATE TABLE mycozyhome.promo_codes (
    code text PRIMARY KEY CHECK (code = upper(code)),
    percent_off integer NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
    description text,
    active boolean NOT NULL DEFAULT true,
    valid_until timestamptz,
    single_use_per_user boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mycozyhome.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage promo codes" ON mycozyhome.promo_codes TO authenticated
  USING (mycozyhome.is_admin()) WITH CHECK (mycozyhome.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON mycozyhome.promo_codes TO authenticated;
INSERT INTO mycozyhome.promo_codes (code, percent_off, description) VALUES
  ('BENVENUTO10', 10, 'Benvenuto: 10% sulla prima prenotazione'),
  ('PRIMA20', 20, 'Prima prenotazione: 20%'),
  ('PULITO15', 15, '15% sulla prossima pulizia');

CREATE FUNCTION mycozyhome._promo_percent(p_user_id uuid, p_code text) RETURNS integer
    LANGUAGE plpgsql STABLE
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_promo mycozyhome.promo_codes;
BEGIN
  SELECT * INTO v_promo FROM mycozyhome.promo_codes
  WHERE code = upper(trim(p_code)) AND active AND (valid_until IS NULL OR valid_until > now());
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_PROMO_INVALID'; END IF;
  IF v_promo.single_use_per_user AND EXISTS (
    SELECT 1 FROM mycozyhome.bookings
    WHERE client_id = p_user_id AND promo_code = v_promo.code AND status <> 'cancelled'
  ) THEN
    RAISE EXCEPTION 'FC_PROMO_USED';
  END IF;
  RETURN v_promo.percent_off;
END; $$;

CREATE FUNCTION mycozyhome.validate_promo_code(p_code text) RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  RETURN mycozyhome._promo_percent(auth.uid(), p_code);
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.validate_promo_code(text) TO authenticated;

-- 6. Prenotazioni: creazione e cambi di stato solo via RPC.
CREATE FUNCTION mycozyhome.create_booking(
    p_professional_id uuid,
    p_service_type text,
    p_scheduled_date date,
    p_time_start time,
    p_hours numeric,
    p_address text,
    p_notes text DEFAULT NULL,
    p_promo_code text DEFAULT NULL,
    p_latitude numeric DEFAULT NULL,
    p_longitude numeric DEFAULT NULL
) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rate numeric; v_min integer; v_prof_user uuid;
  v_total numeric; v_discount numeric := 0; v_pct integer; v_code text; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF NOT mycozyhome.has_role(v_uid, 'client') THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
  IF mycozyhome.is_client_blocked(v_uid) THEN RAISE EXCEPTION 'FC_ACCOUNT_BLOCKED'; END IF;
  IF p_hours IS NULL OR p_hours < 1 OR p_hours > 12 OR p_hours * 2 <> trunc(p_hours * 2) THEN
    RAISE EXCEPTION 'FC_BOOKING_HOURS';
  END IF;
  IF p_scheduled_date IS NULL OR p_scheduled_date < current_date OR p_scheduled_date > current_date + 365 THEN
    RAISE EXCEPTION 'FC_BOOKING_DATE';
  END IF;
  IF p_time_start IS NULL OR p_time_start::interval + p_hours * interval '1 hour' > interval '24 hours' THEN
    RAISE EXCEPTION 'FC_BOOKING_TIME';
  END IF;
  IF length(trim(COALESCE(p_address, ''))) < 5 THEN RAISE EXCEPTION 'FC_BOOKING_ADDRESS'; END IF;

  SELECT ps.hourly_rate, ps.min_hours, p.user_id INTO v_rate, v_min, v_prof_user
  FROM mycozyhome.professional_services ps
  JOIN mycozyhome.professionals p ON p.id = ps.professional_id
  WHERE ps.professional_id = p_professional_id
    AND ps.service_type::text = p_service_type
    AND ps.is_active
    AND p.status = 'approved' AND NOT p.is_blocked AND NOT p.revenue_blocked
  LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_SERVICE_UNAVAILABLE'; END IF;
  IF v_prof_user = v_uid THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
  IF p_hours < COALESCE(v_min, 1) THEN RAISE EXCEPTION 'FC_BOOKING_MIN_HOURS'; END IF;

  v_total := round(v_rate * p_hours, 2);
  IF NULLIF(trim(COALESCE(p_promo_code, '')), '') IS NOT NULL THEN
    v_code := upper(trim(p_promo_code));
    v_pct := mycozyhome._promo_percent(v_uid, v_code);
    v_discount := round(v_total * v_pct / 100.0, 2);
  END IF;

  INSERT INTO mycozyhome.bookings (
    client_id, professional_id, service_type, scheduled_date, scheduled_time_start, scheduled_time_end,
    address, latitude, longitude, status, total_hours, hourly_rate, total_amount, promo_code,
    discount_amount, notes
  ) VALUES (
    v_uid, p_professional_id, p_service_type, p_scheduled_date, p_time_start,
    p_time_start + p_hours * interval '1 hour',
    trim(p_address), p_latitude, p_longitude, 'pending', p_hours, v_rate, v_total - v_discount, v_code,
    v_discount, NULLIF(trim(COALESCE(p_notes, '')), '')
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.create_booking(uuid, text, date, time, numeric, text, text, text, numeric, numeric) TO authenticated;

-- Il cliente annulla una prenotazione non ancora iniziata (rimborso dal trigger esistente).
CREATE FUNCTION mycozyhome.cancel_booking(p_booking_id uuid, p_reason text DEFAULT NULL) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_booking mycozyhome.bookings;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  SELECT * INTO v_booking FROM mycozyhome.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND OR v_booking.client_id <> v_uid THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF v_booking.status NOT IN ('pending', 'confirmed') THEN RAISE EXCEPTION 'FC_BOOKING_NOT_CANCELLABLE'; END IF;
  IF EXISTS (SELECT 1 FROM mycozyhome.booking_tracking WHERE booking_id = p_booking_id AND check_in_at IS NOT NULL) THEN
    RAISE EXCEPTION 'FC_BOOKING_NOT_CANCELLABLE';
  END IF;
  UPDATE mycozyhome.bookings
  SET status = 'cancelled', cancelled_at = now(), cancelled_by = v_uid,
      cancellation_reason = NULLIF(left(trim(COALESCE(p_reason, '')), 500), ''), updated_at = now()
  WHERE id = p_booking_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.cancel_booking(uuid, text) TO authenticated;

-- Il professionista conferma o rifiuta (annulla) una sua prenotazione.
CREATE FUNCTION mycozyhome.professional_set_booking_status(p_booking_id uuid, p_status text, p_reason text DEFAULT NULL) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_booking mycozyhome.bookings;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF mycozyhome.is_professional_user_blocked(v_uid) THEN RAISE EXCEPTION 'FC_ACCOUNT_BLOCKED'; END IF;
  SELECT b.* INTO v_booking FROM mycozyhome.bookings b
  JOIN mycozyhome.professionals p ON p.id = b.professional_id
  WHERE b.id = p_booking_id AND p.user_id = v_uid
  FOR UPDATE OF b;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF p_status = 'confirmed' AND v_booking.status = 'pending' THEN
    UPDATE mycozyhome.bookings SET status = 'confirmed', updated_at = now() WHERE id = p_booking_id;
  ELSIF p_status = 'cancelled' AND v_booking.status IN ('pending', 'confirmed')
        AND NOT EXISTS (SELECT 1 FROM mycozyhome.booking_tracking WHERE booking_id = p_booking_id AND check_in_at IS NOT NULL) THEN
    UPDATE mycozyhome.bookings
    SET status = 'cancelled', cancelled_at = now(), cancelled_by = v_uid,
        cancellation_reason = NULLIF(left(trim(COALESCE(p_reason, '')), 500), ''), updated_at = now()
    WHERE id = p_booking_id;
  ELSE
    RAISE EXCEPTION 'FC_BOOKING_STATUS';
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.professional_set_booking_status(uuid, text, text) TO authenticated;

DROP POLICY "Clients can create bookings" ON mycozyhome.bookings;
DROP POLICY "Professionals can update their bookings" ON mycozyhome.bookings;
REVOKE INSERT, UPDATE, DELETE ON mycozyhome.bookings FROM anon, authenticated;

-- 7. Colonne riservate all'admin su professionals e client_profiles.
--    I trigger girano col ruolo di chi scrive: le funzioni SECURITY DEFINER
--    (rating, tetto di fatturato) girano come owner e passano.
CREATE FUNCTION mycozyhome.guard_professional_columns() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR mycozyhome.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.approved_at := NULL; NEW.approved_by := NULL; NEW.admin_notes := NULL;
    NEW.average_rating := 0; NEW.review_count := 0; NEW.revenue_blocked := false;
    NEW.is_blocked := false; NEW.blocked_at := NULL; NEW.blocked_reason := NULL; NEW.blocked_by := NULL;
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status IN ('pending', 'rejected') AND NEW.status = 'in_review') THEN
    RAISE EXCEPTION 'FC_FORBIDDEN';
  END IF;
  IF (NEW.id, NEW.user_id, NEW.approved_at, NEW.approved_by, NEW.admin_notes, NEW.average_rating,
      NEW.review_count, NEW.revenue_blocked, NEW.is_blocked, NEW.blocked_at, NEW.blocked_reason, NEW.blocked_by)
     IS DISTINCT FROM
     (OLD.id, OLD.user_id, OLD.approved_at, OLD.approved_by, OLD.admin_notes, OLD.average_rating,
      OLD.review_count, OLD.revenue_blocked, OLD.is_blocked, OLD.blocked_at, OLD.blocked_reason, OLD.blocked_by) THEN
    RAISE EXCEPTION 'FC_FORBIDDEN';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER guard_professional_columns BEFORE INSERT OR UPDATE ON mycozyhome.professionals
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.guard_professional_columns();

CREATE FUNCTION mycozyhome.guard_client_profile_columns() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR mycozyhome.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.average_rating := 0; NEW.review_count := 0;
    NEW.is_blocked := false; NEW.blocked_at := NULL; NEW.blocked_reason := NULL; NEW.blocked_by := NULL;
    RETURN NEW;
  END IF;
  IF (NEW.id, NEW.user_id, NEW.average_rating, NEW.review_count, NEW.is_blocked, NEW.blocked_at,
      NEW.blocked_reason, NEW.blocked_by)
     IS DISTINCT FROM
     (OLD.id, OLD.user_id, OLD.average_rating, OLD.review_count, OLD.is_blocked, OLD.blocked_at,
      OLD.blocked_reason, OLD.blocked_by) THEN
    RAISE EXCEPTION 'FC_FORBIDDEN';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER guard_client_profile_columns BEFORE INSERT OR UPDATE ON mycozyhome.client_profiles
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.guard_client_profile_columns();

-- 8. Ruoli assegnati dal server alla registrazione.
ALTER TABLE mycozyhome.professionals ADD CONSTRAINT professionals_user_id_key UNIQUE (user_id);

CREATE OR REPLACE FUNCTION mycozyhome.handle_new_client() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'app' = 'mycozyhome' THEN
    IF NEW.raw_user_meta_data->>'role' = 'professional' THEN
      INSERT INTO mycozyhome.professionals (user_id, first_name, last_name, email, phone, city, status)
      VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
              COALESCE(NEW.raw_user_meta_data->>'last_name', ''), NEW.email, '', '', 'pending')
      ON CONFLICT (user_id) DO NOTHING;
      INSERT INTO mycozyhome.user_roles (user_id, role) VALUES (NEW.id, 'professional')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      INSERT INTO mycozyhome.client_profiles (user_id, email, first_name, last_name)
      VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name')
      ON CONFLICT (user_id) DO NOTHING;
      INSERT INTO mycozyhome.user_roles (user_id, role) VALUES (NEW.id, 'client')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Un utente di un'altra app (auth condivisa) sceglie di usare MyCozyHome come cliente.
CREATE FUNCTION mycozyhome.join_as_client() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_email text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF EXISTS (SELECT 1 FROM mycozyhome.user_roles WHERE user_id = v_uid) THEN RETURN; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  INSERT INTO mycozyhome.client_profiles (user_id, email) VALUES (v_uid, v_email)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO mycozyhome.user_roles (user_id, role) VALUES (v_uid, 'client');
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.join_as_client() TO authenticated;

-- Il profilo professionista lo crea il server: dal client solo chi ha già il ruolo.
DROP POLICY "Professionals can insert their own profile" ON mycozyhome.professionals;
CREATE POLICY "Professionals can insert their own profile" ON mycozyhome.professionals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND mycozyhome.has_role(auth.uid(), 'professional'));
DROP POLICY "Users can insert their own profile" ON mycozyhome.client_profiles;
CREATE POLICY "Users can insert their own profile" ON mycozyhome.client_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND mycozyhome.has_role(auth.uid(), 'client'));

-- Ruoli per gli utenti già registrati su MyCozyHome; via il profilo creato per errore
-- a un utente di un'altra app (nessuna prenotazione collegata).
INSERT INTO mycozyhome.user_roles (user_id, role)
SELECT c.user_id, 'client' FROM mycozyhome.client_profiles c
JOIN auth.users u ON u.id = c.user_id
WHERE u.raw_user_meta_data->>'app' = 'mycozyhome'
ON CONFLICT (user_id, role) DO NOTHING;
DELETE FROM mycozyhome.client_profiles c
USING auth.users u
WHERE u.id = c.user_id AND COALESCE(u.raw_user_meta_data->>'app', '') <> 'mycozyhome'
  AND NOT EXISTS (SELECT 1 FROM mycozyhome.user_roles r WHERE r.user_id = c.user_id)
  AND NOT EXISTS (SELECT 1 FROM mycozyhome.bookings b WHERE b.client_id = c.user_id);

-- 9. Rilascio dei pagamenti: lo fa il DB ogni 15 minuti, non più il client.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.schedule('mycozyhome-release-payments', '*/15 * * * *',
  'SELECT mycozyhome.process_pending_payment_releases()');
