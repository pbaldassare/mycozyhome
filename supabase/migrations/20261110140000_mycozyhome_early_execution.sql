-- Specifiche §6: con un professionista con P.IVA il cliente deve spuntare la richiesta di
-- esecuzione anticipata. Si salva data, ora, versione del testo (l'ID è quello della prenotazione).
ALTER TABLE mycozyhome.bookings
  ADD COLUMN IF NOT EXISTS early_execution_at timestamptz,
  ADD COLUMN IF NOT EXISTS early_execution_version text;

CREATE FUNCTION mycozyhome.enforce_early_execution() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v text := nullif(current_setting('mycozyhome.early_execution', true), '');
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF; -- seed e job di sistema
  IF EXISTS (SELECT 1 FROM mycozyhome.professionals WHERE id = NEW.professional_id AND has_vat_number) THEN
    IF v IS NULL THEN RAISE EXCEPTION 'FC_EARLY_EXECUTION_REQUIRED'; END IF;
    NEW.early_execution_at := now();
    NEW.early_execution_version := left(v, 40);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER enforce_early_execution BEFORE INSERT ON mycozyhome.bookings
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.enforce_early_execution();

-- Nuove entrate: stessi parametri + versione del testo spuntato (NULL se non spuntato).
CREATE FUNCTION mycozyhome.create_booking_v3(
    p_professional_id uuid, p_service_type text, p_scheduled_date date, p_time_start time, p_hours numeric,
    p_address text, p_notes text DEFAULT NULL, p_promo_code text DEFAULT NULL, p_latitude numeric DEFAULT NULL,
    p_longitude numeric DEFAULT NULL, p_package_id uuid DEFAULT NULL, p_early_execution text DEFAULT NULL
) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  PERFORM set_config('mycozyhome.early_execution', COALESCE(p_early_execution, ''), true);
  RETURN mycozyhome.create_booking_v2(p_professional_id, p_service_type, p_scheduled_date, p_time_start, p_hours,
    p_address, p_notes, p_promo_code, p_latitude, p_longitude, p_package_id, NULL);
END; $$;

CREATE FUNCTION mycozyhome.create_booking_series_v2(
    p_professional_id uuid, p_service_type text, p_first_date date, p_time_start time, p_hours numeric,
    p_address text, p_every_weeks integer, p_count integer, p_notes text DEFAULT NULL, p_promo_code text DEFAULT NULL,
    p_latitude numeric DEFAULT NULL, p_longitude numeric DEFAULT NULL, p_package_id uuid DEFAULT NULL,
    p_early_execution text DEFAULT NULL
) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  PERFORM set_config('mycozyhome.early_execution', COALESCE(p_early_execution, ''), true);
  RETURN mycozyhome.create_booking_series(p_professional_id, p_service_type, p_first_date, p_time_start, p_hours,
    p_address, p_every_weeks, p_count, p_notes, p_promo_code, p_latitude, p_longitude, p_package_id);
END; $$;

GRANT EXECUTE ON FUNCTION mycozyhome.create_booking_v3(uuid, text, date, time, numeric, text, text, text, numeric, numeric, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION mycozyhome.create_booking_series_v2(uuid, text, date, time, numeric, text, integer, integer, text, text, numeric, numeric, uuid, text) TO authenticated;
