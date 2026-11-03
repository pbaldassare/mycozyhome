-- MyCozyHome v2: prenotazione rapida, pacchetti a prezzo fisso, tracking "in arrivo",
-- prenotazioni ricorrenti, mance, recensioni dettagliate e foto prima/dopo.

-- 1. Pacchetti a prezzo fisso (in aggiunta alla tariffa oraria).
CREATE TABLE mycozyhome.service_packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id uuid NOT NULL REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE,
    service_type mycozyhome.service_type NOT NULL,
    name text NOT NULL CHECK (length(trim(name)) BETWEEN 3 AND 80),
    description text CHECK (length(description) <= 300),
    hours numeric NOT NULL CHECK (hours >= 1 AND hours <= 12 AND hours * 2 = trunc(hours * 2)),
    price numeric(10,2) NOT NULL CHECK (price >= 5 AND price <= 2000),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_service_packages_professional ON mycozyhome.service_packages (professional_id);
ALTER TABLE mycozyhome.service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view packages" ON mycozyhome.service_packages FOR SELECT USING (true);
CREATE POLICY "Professionals manage their packages" ON mycozyhome.service_packages FOR ALL TO authenticated
  USING (professional_id IN (SELECT id FROM mycozyhome.professionals WHERE user_id = auth.uid()))
  WITH CHECK (professional_id IN (SELECT id FROM mycozyhome.professionals WHERE user_id = auth.uid()));
GRANT SELECT ON mycozyhome.service_packages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON mycozyhome.service_packages TO authenticated;

-- 2. Nuove colonne della prenotazione.
ALTER TABLE mycozyhome.bookings
  ADD COLUMN package_id uuid REFERENCES mycozyhome.service_packages(id) ON DELETE SET NULL,
  ADD COLUMN series_id uuid,
  ADD COLUMN en_route_at timestamp with time zone,
  ADD COLUMN pro_latitude numeric,
  ADD COLUMN pro_longitude numeric,
  ADD COLUMN pro_location_at timestamp with time zone,
  ADD COLUMN tip_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN tipped_at timestamp with time zone;
CREATE INDEX idx_bookings_series ON mycozyhome.bookings (series_id) WHERE series_id IS NOT NULL;
CREATE INDEX idx_bookings_prof_date ON mycozyhome.bookings (professional_id, scheduled_date);

-- 3. create_booking_v2: pacchetti e controllo sovrapposizioni.
--    La vecchia create_booking resta intatta (sostituirla richiede un DROP).
CREATE FUNCTION mycozyhome.create_booking_v2(
    p_professional_id uuid,
    p_service_type text,
    p_scheduled_date date,
    p_time_start time,
    p_hours numeric,
    p_address text,
    p_notes text DEFAULT NULL,
    p_promo_code text DEFAULT NULL,
    p_latitude numeric DEFAULT NULL,
    p_longitude numeric DEFAULT NULL,
    p_package_id uuid DEFAULT NULL,
    p_series_id uuid DEFAULT NULL
) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rate numeric; v_min integer; v_prof_user uuid; v_hours numeric := p_hours;
  v_total numeric; v_discount numeric := 0; v_pct integer; v_code text; v_id uuid;
  v_pkg mycozyhome.service_packages;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF NOT mycozyhome.has_role(v_uid, 'client') THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
  IF mycozyhome.is_client_blocked(v_uid) THEN RAISE EXCEPTION 'FC_ACCOUNT_BLOCKED'; END IF;

  IF p_package_id IS NOT NULL THEN
    SELECT * INTO v_pkg FROM mycozyhome.service_packages
    WHERE id = p_package_id AND professional_id = p_professional_id
      AND service_type::text = p_service_type AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'FC_SERVICE_UNAVAILABLE'; END IF;
    v_hours := v_pkg.hours;
  END IF;

  IF v_hours IS NULL OR v_hours < 1 OR v_hours > 12 OR v_hours * 2 <> trunc(v_hours * 2) THEN
    RAISE EXCEPTION 'FC_BOOKING_HOURS';
  END IF;
  IF p_scheduled_date IS NULL OR p_scheduled_date < current_date OR p_scheduled_date > current_date + 365 THEN
    RAISE EXCEPTION 'FC_BOOKING_DATE';
  END IF;
  IF p_time_start IS NULL OR p_time_start::interval + v_hours * interval '1 hour' > interval '24 hours' THEN
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

  IF p_package_id IS NULL THEN
    IF v_hours < COALESCE(v_min, 1) THEN RAISE EXCEPTION 'FC_BOOKING_MIN_HOURS'; END IF;
    v_total := round(v_rate * v_hours, 2);
  ELSE
    v_total := v_pkg.price;
    v_rate := round(v_pkg.price / v_pkg.hours, 2);
  END IF;

  -- Il professionista non può avere due servizi sovrapposti.
  PERFORM 1 FROM mycozyhome.bookings b
  WHERE b.professional_id = p_professional_id AND b.scheduled_date = p_scheduled_date
    AND b.status IN ('pending', 'confirmed')
    AND b.scheduled_time_start < p_time_start + v_hours * interval '1 hour'
    AND b.scheduled_time_end > p_time_start;
  IF FOUND THEN RAISE EXCEPTION 'FC_SLOT_TAKEN'; END IF;

  IF NULLIF(trim(COALESCE(p_promo_code, '')), '') IS NOT NULL THEN
    v_code := upper(trim(p_promo_code));
    v_pct := mycozyhome._promo_percent(v_uid, v_code);
    v_discount := round(v_total * v_pct / 100.0, 2);
  END IF;

  INSERT INTO mycozyhome.bookings (
    client_id, professional_id, service_type, scheduled_date, scheduled_time_start, scheduled_time_end,
    address, latitude, longitude, status, total_hours, hourly_rate, total_amount, promo_code,
    discount_amount, notes, package_id, series_id
  ) VALUES (
    v_uid, p_professional_id, p_service_type, p_scheduled_date, p_time_start,
    p_time_start + v_hours * interval '1 hour',
    trim(p_address), p_latitude, p_longitude, 'pending', v_hours, v_rate, v_total - v_discount, v_code,
    v_discount, NULLIF(trim(COALESCE(p_notes, '')), ''), p_package_id, p_series_id
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.create_booking_v2(uuid, text, date, time, numeric, text, text, text, numeric, numeric, uuid, uuid) TO authenticated;

-- 4. Serie ricorrente: tutte le date o nessuna (una transazione sola).
--    Il codice promo vale solo per la prima prenotazione della serie.
CREATE FUNCTION mycozyhome.create_booking_series(
    p_professional_id uuid,
    p_service_type text,
    p_first_date date,
    p_time_start time,
    p_hours numeric,
    p_address text,
    p_every_weeks integer,
    p_count integer,
    p_notes text DEFAULT NULL,
    p_promo_code text DEFAULT NULL,
    p_latitude numeric DEFAULT NULL,
    p_longitude numeric DEFAULT NULL,
    p_package_id uuid DEFAULT NULL
) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_series uuid := gen_random_uuid(); i integer;
BEGIN
  IF p_every_weeks IS NULL OR p_every_weeks < 1 OR p_every_weeks > 4
     OR p_count IS NULL OR p_count < 2 OR p_count > 12 THEN
    RAISE EXCEPTION 'FC_SERIES_INVALID';
  END IF;
  FOR i IN 0 .. p_count - 1 LOOP
    PERFORM mycozyhome.create_booking_v2(
      p_professional_id, p_service_type, p_first_date + i * p_every_weeks * 7, p_time_start, p_hours,
      p_address, p_notes, CASE WHEN i = 0 THEN p_promo_code END, p_latitude, p_longitude,
      p_package_id, v_series);
  END LOOP;
  RETURN v_series;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.create_booking_series(uuid, text, date, time, numeric, text, integer, integer, text, text, numeric, numeric, uuid) TO authenticated;

-- 5. Ricerca per servizio: professionisti liberi in quella data e fascia oraria.
CREATE FUNCTION mycozyhome.available_professionals(
    p_service_type text,
    p_date date,
    p_time_start time,
    p_hours numeric,
    p_latitude numeric DEFAULT NULL,
    p_longitude numeric DEFAULT NULL
) RETURNS TABLE (
    id uuid, first_name text, last_name text, avatar_url text, city text,
    average_rating numeric, review_count integer, years_experience integer,
    hourly_rate numeric, min_hours integer, min_package_price numeric, distance_km numeric
)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT x.id, x.first_name, x.last_name, x.avatar_url, x.city, x.average_rating, x.review_count,
         x.years_experience, x.hourly_rate, x.min_hours, x.min_package_price, x.distance_km
  FROM (
    SELECT p.id, p.first_name, p.last_name, p.avatar_url, p.city,
           p.average_rating, p.review_count, p.years_experience,
           ps.hourly_rate, ps.min_hours,
           (SELECT min(sp.price) FROM mycozyhome.service_packages sp
             WHERE sp.professional_id = p.id AND sp.service_type = ps.service_type AND sp.is_active) AS min_package_price,
           CASE WHEN p_latitude IS NULL OR p_longitude IS NULL OR p.latitude IS NULL OR p.longitude IS NULL THEN NULL
                ELSE round((6371 * 2 * asin(sqrt(
                  power(sin(radians(p.latitude - p_latitude) / 2), 2) +
                  cos(radians(p_latitude)) * cos(radians(p.latitude)) *
                  power(sin(radians(p.longitude - p_longitude) / 2), 2))))::numeric, 1)
           END AS distance_km,
           COALESCE(p.max_radius_km, 10) AS radius
    FROM mycozyhome.professionals p
    JOIN mycozyhome.professional_services ps ON ps.professional_id = p.id
    WHERE ps.service_type::text = p_service_type AND ps.is_active
      AND p.status = 'approved' AND NOT p.is_blocked AND NOT p.revenue_blocked
      AND EXISTS (
        SELECT 1 FROM mycozyhome.professional_availability a
        WHERE a.professional_id = p.id AND a.is_available
          AND a.day_of_week = extract(dow FROM p_date)
          AND a.start_time <= p_time_start
          AND a.end_time >= p_time_start + p_hours * interval '1 hour')
      AND NOT EXISTS (
        SELECT 1 FROM mycozyhome.bookings b
        WHERE b.professional_id = p.id AND b.scheduled_date = p_date
          AND b.status IN ('pending', 'confirmed')
          AND b.scheduled_time_start < p_time_start + p_hours * interval '1 hour'
          AND b.scheduled_time_end > p_time_start)
  ) x
  WHERE x.distance_km IS NULL OR x.distance_km <= x.radius
  ORDER BY x.distance_km NULLS LAST, x.average_rating DESC NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.available_professionals(text, date, time, numeric, numeric, numeric) TO anon, authenticated;

-- 6. Tracking "in arrivo": il professionista parte e condivide la posizione fino al check-in.
CREATE FUNCTION mycozyhome.professional_set_en_route(p_booking_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  UPDATE mycozyhome.bookings b SET en_route_at = now(), updated_at = now()
  FROM mycozyhome.professionals p
  WHERE b.id = p_booking_id AND p.id = b.professional_id AND p.user_id = auth.uid()
    AND b.status = 'confirmed' AND b.scheduled_date BETWEEN current_date - 1 AND current_date + 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_BOOKING_STATUS'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.professional_set_en_route(uuid) TO authenticated;

CREATE FUNCTION mycozyhome.professional_update_location(p_booking_id uuid, p_latitude numeric, p_longitude numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF p_latitude NOT BETWEEN -90 AND 90 OR p_longitude NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'FC_FORBIDDEN';
  END IF;
  UPDATE mycozyhome.bookings b
  SET pro_latitude = p_latitude, pro_longitude = p_longitude, pro_location_at = now()
  FROM mycozyhome.professionals p
  WHERE b.id = p_booking_id AND p.id = b.professional_id AND p.user_id = auth.uid()
    AND b.status = 'confirmed' AND b.en_route_at IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_BOOKING_STATUS'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.professional_update_location(uuid, numeric, numeric) TO authenticated;

-- Aggiornamenti live di prenotazioni per cliente (tracking) e professionista (nuovi lavori).
ALTER PUBLICATION supabase_realtime ADD TABLE mycozyhome.bookings;

-- 7. Mancia: rinviata (serve cambiare il vincolo dei tipi in wallet_transactions).

-- 8. Recensioni dettagliate.
ALTER TABLE mycozyhome.reviews
  ADD COLUMN rating_punctuality smallint CHECK (rating_punctuality BETWEEN 1 AND 5),
  ADD COLUMN rating_quality smallint CHECK (rating_quality BETWEEN 1 AND 5),
  ADD COLUMN rating_kindness smallint CHECK (rating_kindness BETWEEN 1 AND 5);

-- 9. Foto della prenotazione: prima/dopo del professionista, foto della recensione del cliente.
CREATE FUNCTION mycozyhome.can_access_booking(p_booking text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT mycozyhome.is_admin() OR EXISTS (
    SELECT 1 FROM mycozyhome.bookings b
    LEFT JOIN mycozyhome.professionals p ON p.id = b.professional_id
    WHERE b.id::text = p_booking AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
  );
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.can_access_booking(text) TO authenticated;

CREATE TABLE mycozyhome.booking_photos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid NOT NULL REFERENCES mycozyhome.bookings(id) ON DELETE CASCADE,
    uploaded_by uuid NOT NULL DEFAULT auth.uid(),
    kind text NOT NULL CHECK (kind IN ('before', 'after', 'review')),
    path text NOT NULL CHECK (path LIKE booking_id::text || '/%'),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_photos_booking ON mycozyhome.booking_photos (booking_id);
ALTER TABLE mycozyhome.booking_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking parties can view photos" ON mycozyhome.booking_photos FOR SELECT TO authenticated
  USING (mycozyhome.can_access_booking(booking_id::text));
CREATE POLICY "Professionals add before/after photos" ON mycozyhome.booking_photos FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND kind IN ('before', 'after') AND EXISTS (
    SELECT 1 FROM mycozyhome.bookings b JOIN mycozyhome.professionals p ON p.id = b.professional_id
    WHERE b.id = booking_photos.booking_id AND p.user_id = auth.uid() AND b.status IN ('confirmed', 'completed')));
CREATE POLICY "Clients add review photos" ON mycozyhome.booking_photos FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND kind = 'review' AND EXISTS (
    SELECT 1 FROM mycozyhome.bookings b
    WHERE b.id = booking_photos.booking_id AND b.client_id = auth.uid() AND b.status = 'completed'));
CREATE POLICY "Uploaders delete their photos" ON mycozyhome.booking_photos FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());
GRANT SELECT, INSERT, DELETE ON mycozyhome.booking_photos TO authenticated;

-- Le foto delle recensioni visibili sono pubbliche come le recensioni stesse.
CREATE FUNCTION mycozyhome.review_photos(p_professional_id uuid)
RETURNS TABLE (booking_id uuid, path text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT ph.booking_id, ph.path FROM mycozyhome.booking_photos ph
  JOIN mycozyhome.reviews r ON r.booking_id = ph.booking_id
  WHERE r.professional_id = p_professional_id AND r.is_visible AND NOT r.admin_hidden
    AND ph.kind IN ('review', 'before', 'after')
  ORDER BY ph.created_at DESC LIMIT 40;
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.review_photos(uuid) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('mycozyhome-booking-photos', 'mycozyhome-booking-photos', false, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
CREATE POLICY "mycozyhome: Booking parties upload photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mycozyhome-booking-photos' AND mycozyhome.can_access_booking((storage.foldername(name))[1]));
CREATE POLICY "mycozyhome: Booking parties view photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mycozyhome-booking-photos' AND (
    mycozyhome.can_access_booking((storage.foldername(name))[1])
    OR EXISTS (SELECT 1 FROM mycozyhome.reviews r
               WHERE r.booking_id::text = (storage.foldername(name))[1] AND r.is_visible AND NOT r.admin_hidden)));
