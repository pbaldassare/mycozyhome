-- Specifiche 5/11/2026 §5: niente tracciamento continuo. Il professionista fa
-- un solo check-in (posizione e orario in quel momento) e poi "Servizio completato".
-- Ogni tentativo di check-in resta in tracking_pings come log tecnico.

-- Raggio e finestra in un solo punto. ponytail: raggio 150 m in attesa della decisione legale (le specifiche dicono 5 m, irrealistico col GPS).
CREATE OR REPLACE FUNCTION mycozyhome.checkin_rules(OUT radius_m numeric, OUT early interval, OUT late interval)
    LANGUAGE sql IMMUTABLE AS $$ SELECT 150::numeric, interval '30 minutes', interval '10 minutes' $$;

CREATE OR REPLACE FUNCTION mycozyhome.check_in(p_booking_id uuid, p_lat numeric, p_lng numeric) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE
  v_uid uuid := auth.uid(); v_b mycozyhome.bookings; v_t mycozyhome.booking_tracking;
  v_r record; v_start timestamptz; v_dist numeric; v_in_range boolean; v_in_time boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF p_lat IS NULL OR p_lng IS NULL THEN RAISE EXCEPTION 'FC_INVALID_INPUT'; END IF;
  SELECT b.* INTO v_b FROM mycozyhome.bookings b JOIN mycozyhome.professionals p ON p.id = b.professional_id
  WHERE b.id = p_booking_id AND p.user_id = v_uid FOR UPDATE OF b;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF v_b.status <> 'confirmed' THEN RAISE EXCEPTION 'FC_BOOKING_NOT_CANCELLABLE'; END IF;

  SELECT * INTO v_t FROM mycozyhome.booking_tracking WHERE booking_id = p_booking_id ORDER BY created_at LIMIT 1;
  IF v_t.check_in_at IS NOT NULL THEN
    RETURN jsonb_build_object('valid', true, 'already', true, 'distance_m', v_t.check_in_distance_m);
  END IF;
  IF v_t.id IS NULL THEN
    INSERT INTO mycozyhome.booking_tracking (booking_id, professional_id, status)
    VALUES (p_booking_id, v_b.professional_id, 'pending') RETURNING * INTO v_t;
  END IF;

  v_r := mycozyhome.checkin_rules();
  v_start := (v_b.scheduled_date + v_b.scheduled_time_start) AT TIME ZONE 'Europe/Rome';
  v_dist := CASE WHEN v_b.latitude IS NULL OR v_b.longitude IS NULL THEN NULL ELSE round(
    6371000 * 2 * asin(sqrt(
      power(sin(radians(p_lat - v_b.latitude) / 2), 2) +
      cos(radians(v_b.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v_b.longitude) / 2), 2)))) END;
  v_in_range := v_dist IS NOT NULL AND v_dist <= v_r.radius_m;
  v_in_time := now() BETWEEN v_start - v_r.early AND v_start + v_r.late;

  INSERT INTO mycozyhome.tracking_pings (tracking_id, booking_id, professional_id, latitude, longitude, distance_m, in_range)
  VALUES (v_t.id, p_booking_id, v_b.professional_id, p_lat, p_lng, COALESCE(v_dist, -1), v_in_range AND v_in_time);

  IF v_in_range AND v_in_time THEN
    UPDATE mycozyhome.booking_tracking
    SET check_in_at = now(), check_in_latitude = p_lat, check_in_longitude = p_lng,
        check_in_distance_m = v_dist, check_in_in_range = true, status = 'checked_in'
    WHERE id = v_t.id;
  END IF;

  RETURN jsonb_build_object(
    'valid', v_in_range AND v_in_time, 'distance_m', v_dist, 'radius_m', v_r.radius_m,
    'reason', CASE WHEN NOT v_in_time AND now() < v_start - v_r.early THEN 'too_early'
                   WHEN NOT v_in_time THEN 'too_late'
                   WHEN NOT v_in_range THEN 'too_far' END);
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.check_in(uuid, numeric, numeric) TO authenticated;

-- "Servizio completato": nessuna posizione, solo l'orario.
CREATE OR REPLACE FUNCTION mycozyhome.complete_service(p_booking_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_b mycozyhome.bookings;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  SELECT b.* INTO v_b FROM mycozyhome.bookings b JOIN mycozyhome.professionals p ON p.id = b.professional_id
  WHERE b.id = p_booking_id AND p.user_id = v_uid FOR UPDATE OF b;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF v_b.status <> 'confirmed' THEN RAISE EXCEPTION 'FC_BOOKING_NOT_CANCELLABLE'; END IF;
  IF now() < (v_b.scheduled_date + v_b.scheduled_time_start) AT TIME ZONE 'Europe/Rome' THEN
    RAISE EXCEPTION 'FC_SERVICE_NOT_STARTED';
  END IF;

  UPDATE mycozyhome.bookings SET status = 'completed', completed_at = now(), updated_at = now() WHERE id = p_booking_id;
  UPDATE mycozyhome.booking_tracking
  SET check_out_at = now(), status = 'completed',
      actual_hours = CASE WHEN check_in_at IS NULL THEN NULL ELSE round(extract(epoch FROM now() - check_in_at) / 3600, 2) END
  WHERE booking_id = p_booking_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.complete_service(uuid) TO authenticated;

-- Le posizioni si scrivono solo dalle due funzioni qui sopra.
REVOKE INSERT, UPDATE ON mycozyhome.booking_tracking, mycozyhome.tracking_pings FROM authenticated;

-- Log dei check-in conservati 90 giorni (specifiche §5), non più 30.
SELECT cron.unschedule('mycozyhome-purge-pings');
SELECT cron.schedule('mycozyhome-purge-pings', '30 3 * * *',
  $$DELETE FROM mycozyhome.tracking_pings WHERE created_at < now() - interval '90 days'$$);
