-- MyCozyHome: schema dedicato `mycozyhome` nel progetto Supabase condiviso.
-- Generato dallo stato finale dello schema public del vecchio progetto
-- (equivalente alle migrazioni precedenti), con tutti i riferimenti riscritti
-- da public.* a mycozyhome.*. Non tocca oggetti di altre app.
SET check_function_bodies = false;
CREATE SCHEMA mycozyhome;
GRANT USAGE ON SCHEMA mycozyhome TO anon, authenticated, service_role;
CREATE TYPE mycozyhome.app_role AS ENUM (
    'admin',
    'professional',
    'client'
);
CREATE TYPE mycozyhome.document_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);
CREATE TYPE mycozyhome.professional_status AS ENUM (
    'pending',
    'in_review',
    'approved',
    'rejected',
    'suspended'
);
CREATE TYPE mycozyhome.service_type AS ENUM (
    'cleaning',
    'office_cleaning',
    'ironing',
    'sanitization',
    'dog_sitter',
    'wardrobe_seasonal',
    'decluttering',
    'post_renovation',
    'seasonal_cleaning',
    'garden_care',
    'home_organizing',
    'dog_walking',
    'pet_care_travel',
    'pet_space_cleaning'
);
CREATE FUNCTION mycozyhome.check_professional_revenue_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE
  v_revenue numeric;
  v_has_vat boolean;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT has_vat_number INTO v_has_vat FROM mycozyhome.professionals WHERE id = NEW.professional_id;
    IF v_has_vat = false THEN
      v_revenue := mycozyhome.get_professional_annual_revenue(NEW.professional_id);
      IF v_revenue >= 5000 THEN
        UPDATE mycozyhome.professionals
        SET revenue_blocked = true, updated_at = now()
        WHERE id = NEW.professional_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION mycozyhome.complete_booking_on_tracking_checkout() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE mycozyhome.bookings SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = NEW.booking_id AND status IN ('confirmed', 'pending');
  END IF;
  RETURN NEW;
END; $$;
CREATE FUNCTION mycozyhome.ensure_client_wallet(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  INSERT INTO mycozyhome.client_wallets (user_id, balance) VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
END; $$;
CREATE FUNCTION mycozyhome.ensure_professional_wallet(p_professional_id uuid, p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  INSERT INTO mycozyhome.professional_wallets (professional_id, user_id, balance)
  VALUES (p_professional_id, p_user_id, 0)
  ON CONFLICT (professional_id) DO NOTHING;
END; $$;
CREATE FUNCTION mycozyhome.get_client_wallet_balance() RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_user_id UUID := auth.uid(); v_balance NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RETURN 0; END IF;
  PERFORM mycozyhome.ensure_client_wallet(v_user_id);
  SELECT balance INTO v_balance FROM mycozyhome.client_wallets WHERE user_id = v_user_id;
  RETURN COALESCE(v_balance, 0);
END; $$;
CREATE FUNCTION mycozyhome.get_professional_annual_revenue(_prof_id uuid) RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT COALESCE(SUM(total_amount), 0)::numeric
  FROM mycozyhome.bookings
  WHERE professional_id = _prof_id
    AND status = 'completed'
    AND completed_at >= date_trunc('year', now())
    AND completed_at <  date_trunc('year', now()) + interval '1 year';
$$;
CREATE FUNCTION mycozyhome.get_professional_rating(p_professional_id uuid) RETURNS TABLE(average_rating numeric, review_count bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*) as review_count
  FROM mycozyhome.reviews
  WHERE professional_id = p_professional_id
    AND is_visible = true
    AND admin_hidden = false;
$$;
CREATE FUNCTION mycozyhome.get_user_role(_user_id uuid) RETURNS mycozyhome.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT role
  FROM mycozyhome.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;
CREATE FUNCTION mycozyhome.handle_new_client() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'app' = 'mycozyhome' THEN
    INSERT INTO mycozyhome.client_profiles (user_id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION mycozyhome.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE FUNCTION mycozyhome.has_role(_user_id uuid, _role mycozyhome.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM mycozyhome.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
CREATE FUNCTION mycozyhome.hold_booking_payment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_balance NUMERIC;
BEGIN
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
    RAISE EXCEPTION 'Importo prenotazione non valido';
  END IF;
  PERFORM mycozyhome.ensure_client_wallet(NEW.client_id);
  SELECT balance INTO v_balance FROM mycozyhome.client_wallets WHERE user_id = NEW.client_id FOR UPDATE;
  IF COALESCE(v_balance, 0) < NEW.total_amount THEN
    RAISE EXCEPTION 'Saldo crediti insufficiente. Ricarica il wallet per prenotare.';
  END IF;
  UPDATE mycozyhome.client_wallets SET balance = balance - NEW.total_amount, updated_at = now()
  WHERE user_id = NEW.client_id;
  NEW.payment_status := 'held';
  NEW.payment_held_amount := NEW.total_amount;
  RETURN NEW;
END; $$;
CREATE FUNCTION mycozyhome.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  -- For now, we'll use a simple approach where admin access is granted via service key
  -- In production, you would check against an admin_users table or user metadata
  -- This allows frontend admin pages to work during development
  RETURN true; -- Placeholder: in production, check auth.jwt() claims or admin table
END;
$$;
CREATE FUNCTION mycozyhome.is_client_blocked(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT COALESCE((SELECT cp.is_blocked FROM mycozyhome.client_profiles cp WHERE cp.user_id = _user_id), false);
$$;
CREATE FUNCTION mycozyhome.is_professional_user_blocked(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT COALESCE((SELECT p.is_blocked FROM mycozyhome.professionals p WHERE p.user_id = _user_id), false);
$$;
CREATE FUNCTION mycozyhome.log_booking_payment_hold() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.payment_status = 'held' AND NEW.payment_held_amount IS NOT NULL THEN
    INSERT INTO mycozyhome.wallet_transactions (user_id, booking_id, type, amount, direction, description)
    VALUES (NEW.client_id, NEW.id, 'hold', NEW.payment_held_amount, 'debit', 'Crediti bloccati per prenotazione');
  END IF;
  RETURN NEW;
END; $$;
CREATE FUNCTION mycozyhome.process_pending_payment_releases() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_booking RECORD; v_count INTEGER := 0;
BEGIN
  FOR v_booking IN SELECT id FROM mycozyhome.bookings
    WHERE payment_status = 'pending_release'
      AND dispute_deadline_at IS NOT NULL AND dispute_deadline_at <= now()
  LOOP
    IF mycozyhome.release_booking_payment(v_booking.id) THEN v_count := v_count + 1; END IF;
  END LOOP;
  RETURN v_count;
END; $$;
CREATE FUNCTION mycozyhome.refund_booking_payment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_amount NUMERIC;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled'
     AND OLD.payment_status IN ('held', 'pending_release', 'disputed') THEN
    v_amount := COALESCE(OLD.payment_held_amount, OLD.total_amount);
    PERFORM mycozyhome.ensure_client_wallet(OLD.client_id);
    UPDATE mycozyhome.client_wallets SET balance = balance + v_amount, updated_at = now()
    WHERE user_id = OLD.client_id;
    INSERT INTO mycozyhome.wallet_transactions (user_id, booking_id, type, amount, direction, description)
    VALUES (OLD.client_id, OLD.id, 'refund', v_amount, 'credit', 'Rimborso crediti per annullamento');
    NEW.payment_status := 'refunded';
  END IF;
  RETURN NEW;
END; $$;
CREATE FUNCTION mycozyhome.release_booking_payment(p_booking_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_booking RECORD;
BEGIN
  SELECT b.*, p.user_id AS prof_user_id INTO v_booking
  FROM mycozyhome.bookings b JOIN mycozyhome.professionals p ON p.id = b.professional_id
  WHERE b.id = p_booking_id FOR UPDATE OF b;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_booking.payment_status NOT IN ('pending_release') THEN RETURN FALSE; END IF;
  IF EXISTS (SELECT 1 FROM mycozyhome.disputes d WHERE d.booking_id = p_booking_id
    AND d.status IN ('open', 'investigating', 'escalated')) THEN RETURN FALSE; END IF;
  IF v_booking.dispute_deadline_at IS NOT NULL AND v_booking.dispute_deadline_at > now() THEN RETURN FALSE; END IF;
  PERFORM mycozyhome.ensure_professional_wallet(v_booking.professional_id, v_booking.prof_user_id);
  UPDATE mycozyhome.professional_wallets SET balance = balance + v_booking.payment_held_amount, updated_at = now()
  WHERE professional_id = v_booking.professional_id;
  INSERT INTO mycozyhome.wallet_transactions (user_id, professional_id, booking_id, type, amount, direction, description)
  VALUES (v_booking.prof_user_id, v_booking.professional_id, p_booking_id, 'release',
    v_booking.payment_held_amount, 'credit', 'Pagamento servizio completato');
  UPDATE mycozyhome.bookings SET payment_status = 'released', payment_released_at = now(), updated_at = now()
  WHERE id = p_booking_id;
  RETURN TRUE;
END; $$;
CREATE FUNCTION mycozyhome.resolve_dispute_payment(p_dispute_id uuid, p_favor text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_dispute RECORD; v_booking RECORD; v_amount NUMERIC;
BEGIN
  IF NOT mycozyhome.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo gli admin possono risolvere i pagamenti delle dispute';
  END IF;
  SELECT * INTO v_dispute FROM mycozyhome.disputes WHERE id = p_dispute_id;
  IF NOT FOUND OR v_dispute.booking_id IS NULL THEN RETURN FALSE; END IF;
  SELECT b.*, p.user_id AS prof_user_id INTO v_booking
  FROM mycozyhome.bookings b JOIN mycozyhome.professionals p ON p.id = b.professional_id
  WHERE b.id = v_dispute.booking_id;
  v_amount := COALESCE(v_booking.payment_held_amount, v_booking.total_amount);
  IF p_favor = 'client' AND v_booking.payment_status IN ('disputed', 'pending_release', 'held') THEN
    PERFORM mycozyhome.ensure_client_wallet(v_booking.client_id);
    UPDATE mycozyhome.client_wallets SET balance = balance + v_amount, updated_at = now()
    WHERE user_id = v_booking.client_id;
    INSERT INTO mycozyhome.wallet_transactions (user_id, booking_id, type, amount, direction, description)
    VALUES (v_booking.client_id, v_booking.id, 'dispute_refund', v_amount, 'credit', 'Rimborso da contestazione');
    UPDATE mycozyhome.bookings SET payment_status = 'refunded', updated_at = now() WHERE id = v_booking.id;
    RETURN TRUE;
  ELSIF p_favor = 'professional' AND v_booking.payment_status IN ('disputed', 'pending_release', 'held') THEN
    PERFORM mycozyhome.ensure_professional_wallet(v_booking.professional_id, v_booking.prof_user_id);
    UPDATE mycozyhome.professional_wallets SET balance = balance + v_amount, updated_at = now()
    WHERE professional_id = v_booking.professional_id;
    INSERT INTO mycozyhome.wallet_transactions (user_id, professional_id, booking_id, type, amount, direction, description)
    VALUES (v_booking.prof_user_id, v_booking.professional_id, v_booking.id,
      'dispute_payout', v_amount, 'credit', 'Pagamento dopo contestazione');
    UPDATE mycozyhome.bookings SET payment_status = 'released', payment_released_at = now(), updated_at = now()
    WHERE id = v_booking.id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END; $$;
CREATE FUNCTION mycozyhome.simulate_wallet_top_up(p_amount numeric) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_user_id UUID := auth.uid(); v_new_balance NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non autenticato'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 10000 THEN
    RAISE EXCEPTION 'Importo non valido (max €10.000 per ricarica simulata)';
  END IF;
  PERFORM mycozyhome.ensure_client_wallet(v_user_id);
  UPDATE mycozyhome.client_wallets SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = v_user_id RETURNING balance INTO v_new_balance;
  INSERT INTO mycozyhome.wallet_transactions (user_id, type, amount, direction, description)
  VALUES (v_user_id, 'top_up', p_amount, 'credit', 'Ricarica crediti simulata');
  RETURN v_new_balance;
END; $$;
CREATE FUNCTION mycozyhome.start_booking_payment_release() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed'
     AND OLD.payment_status = 'held' THEN
    NEW.payment_status := 'pending_release';
    NEW.completed_at := COALESCE(NEW.completed_at, now());
    NEW.dispute_deadline_at := COALESCE(NEW.completed_at, now()) + interval '5 days';
  END IF;
  RETURN NEW;
END; $$;
CREATE FUNCTION mycozyhome.suspend_payment_on_dispute() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_booking RECORD;
BEGIN
  IF NEW.booking_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO v_booking FROM mycozyhome.bookings WHERE id = NEW.booking_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF v_booking.completed_at IS NOT NULL THEN
    IF now() > v_booking.completed_at + interval '5 days' THEN
      RAISE EXCEPTION 'Termine per contestare scaduto (5 giorni dal completamento del servizio)';
    END IF;
  ELSIF v_booking.scheduled_date IS NOT NULL THEN
    IF now() > (v_booking.scheduled_date::timestamptz + interval '5 days') THEN
      RAISE EXCEPTION 'Termine per contestare scaduto (5 giorni dalla data del servizio)';
    END IF;
  END IF;
  IF v_booking.payment_status NOT IN ('held', 'pending_release') THEN
    RAISE EXCEPTION 'Non è possibile contestare il pagamento per questa prenotazione';
  END IF;
  IF v_booking.payment_status IN ('held', 'pending_release') THEN
    UPDATE mycozyhome.bookings SET payment_status = 'disputed', updated_at = now() WHERE id = NEW.booking_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE FUNCTION mycozyhome.update_client_rating() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  UPDATE mycozyhome.client_profiles
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM mycozyhome.client_reviews
      WHERE client_id = NEW.client_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM mycozyhome.client_reviews
      WHERE client_id = NEW.client_id
    )
  WHERE user_id = NEW.client_id;
  RETURN NEW;
END;
$$;
CREATE FUNCTION mycozyhome.update_conversation_last_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  UPDATE mycozyhome.conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE FUNCTION mycozyhome.update_offers_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE service_requests SET offers_count = offers_count + 1 WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE service_requests SET offers_count = offers_count - 1 WHERE id = OLD.request_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE FUNCTION mycozyhome.update_professional_rating() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  UPDATE mycozyhome.professionals
  SET 
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM mycozyhome.reviews
      WHERE professional_id = NEW.professional_id
        AND is_visible = true
        AND admin_hidden = false
    ),
    review_count = (
      SELECT COUNT(*)
      FROM mycozyhome.reviews
      WHERE professional_id = NEW.professional_id
        AND is_visible = true
        AND admin_hidden = false
    )
  WHERE id = NEW.professional_id;
  RETURN NEW;
END;
$$;
CREATE FUNCTION mycozyhome.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TABLE mycozyhome.booking_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    check_in_at timestamp with time zone,
    check_in_latitude numeric,
    check_in_longitude numeric,
    check_in_distance_m numeric,
    check_in_in_range boolean,
    check_out_at timestamp with time zone,
    check_out_latitude numeric,
    check_out_longitude numeric,
    check_out_distance_m numeric,
    check_out_in_range boolean,
    actual_hours numeric,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    auto_checked_in boolean DEFAULT false,
    auto_checked_out boolean DEFAULT false,
    left_zone_count integer DEFAULT 0,
    last_ping_at timestamp with time zone,
    total_out_of_range_minutes numeric DEFAULT 0
);
CREATE TABLE mycozyhome.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    service_type text NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time_start time without time zone NOT NULL,
    scheduled_time_end time without time zone NOT NULL,
    address text NOT NULL,
    latitude numeric,
    longitude numeric,
    status text DEFAULT 'pending'::text NOT NULL,
    total_hours numeric NOT NULL,
    hourly_rate numeric NOT NULL,
    total_amount numeric NOT NULL,
    promo_code text,
    discount_amount numeric DEFAULT 0,
    notes text,
    cancellation_reason text,
    cancelled_by uuid,
    cancelled_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_status text DEFAULT 'none'::text NOT NULL,
    payment_held_amount numeric(12,2),
    dispute_deadline_at timestamp with time zone,
    payment_released_at timestamp with time zone,
    CONSTRAINT bookings_payment_status_check CHECK ((payment_status = ANY (ARRAY['none'::text, 'held'::text, 'pending_release'::text, 'released'::text, 'refunded'::text, 'disputed'::text])))
);
CREATE TABLE mycozyhome.client_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    first_name text,
    last_name text,
    email text,
    phone text,
    avatar_url text,
    address text,
    city text,
    province text,
    postal_code text,
    latitude numeric,
    longitude numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    average_rating numeric DEFAULT 0,
    review_count integer DEFAULT 0,
    is_blocked boolean DEFAULT false NOT NULL,
    blocked_at timestamp with time zone,
    blocked_reason text,
    blocked_by uuid
);
CREATE TABLE mycozyhome.client_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    client_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE TABLE mycozyhome.client_wallets (
    user_id uuid NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_wallets_balance_check CHECK ((balance >= (0)::numeric))
);
CREATE TABLE mycozyhome.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid,
    professional_id uuid NOT NULL,
    client_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_message_at timestamp with time zone DEFAULT now(),
    unread_count_client integer DEFAULT 0,
    unread_count_professional integer DEFAULT 0,
    CONSTRAINT conversations_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'blocked'::text])))
);
CREATE TABLE mycozyhome.dispute_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dispute_id uuid NOT NULL,
    uploader_id uuid NOT NULL,
    file_type text NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dispute_evidence_file_type_check CHECK ((file_type = ANY (ARRAY['image'::text, 'document'::text, 'chat_export'::text])))
);
CREATE TABLE mycozyhome.disputes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid,
    conversation_id uuid,
    reporter_id uuid NOT NULL,
    reporter_type text NOT NULL,
    reported_id uuid NOT NULL,
    reported_type text NOT NULL,
    reason text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    resolution text,
    admin_notes text,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT disputes_reason_check CHECK ((reason = ANY (ARRAY['no_show'::text, 'poor_quality'::text, 'inappropriate_behavior'::text, 'payment_issue'::text, 'damage'::text, 'late_arrival'::text, 'early_departure'::text, 'other'::text]))),
    CONSTRAINT disputes_reported_type_check CHECK ((reported_type = ANY (ARRAY['professional'::text, 'client'::text]))),
    CONSTRAINT disputes_reporter_type_check CHECK ((reporter_type = ANY (ARRAY['professional'::text, 'client'::text]))),
    CONSTRAINT disputes_status_check CHECK ((status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved_reporter'::text, 'resolved_reported'::text, 'rejected'::text, 'escalated'::text])))
);
CREATE TABLE mycozyhome.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE mycozyhome.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    sender_type text NOT NULL,
    content text NOT NULL,
    message_type text DEFAULT 'text'::text NOT NULL,
    file_url text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_blocked boolean DEFAULT false,
    original_content text,
    CONSTRAINT messages_message_type_check CHECK ((message_type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'system'::text]))),
    CONSTRAINT messages_sender_type_check CHECK ((sender_type = ANY (ARRAY['professional'::text, 'client'::text, 'system'::text])))
);
CREATE TABLE mycozyhome.professional_areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    city text NOT NULL,
    province text,
    max_distance_km integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    formatted_address text
);
CREATE TABLE mycozyhome.professional_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT professional_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);
CREATE TABLE mycozyhome.professional_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    document_type text NOT NULL,
    document_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    status mycozyhome.document_status DEFAULT 'pending'::mycozyhome.document_status NOT NULL,
    admin_notes text,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by uuid
);
CREATE TABLE mycozyhome.professional_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    client_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE mycozyhome.professional_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    service_type mycozyhome.service_type NOT NULL,
    hourly_rate numeric(10,2) NOT NULL,
    min_hours integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    years_experience integer DEFAULT 0,
    description text
);
CREATE TABLE mycozyhome.professional_wallets (
    professional_id uuid NOT NULL,
    user_id uuid NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT professional_wallets_balance_check CHECK ((balance >= (0)::numeric))
);
CREATE TABLE mycozyhome.professionals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    birth_date date,
    fiscal_code text,
    avatar_url text,
    address text,
    city text NOT NULL,
    province text,
    postal_code text,
    bio text,
    years_experience integer DEFAULT 0,
    status mycozyhome.professional_status DEFAULT 'pending'::mycozyhome.professional_status NOT NULL,
    profile_completed boolean DEFAULT false,
    documents_submitted boolean DEFAULT false,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone,
    approved_by uuid,
    latitude numeric(10,8),
    longitude numeric(11,8),
    formatted_address text,
    max_radius_km integer DEFAULT 10,
    average_rating numeric DEFAULT 0,
    review_count integer DEFAULT 0,
    has_vat_number boolean DEFAULT false NOT NULL,
    vat_number text,
    vat_registered_at timestamp with time zone,
    revenue_blocked boolean DEFAULT false NOT NULL,
    is_blocked boolean DEFAULT false NOT NULL,
    blocked_at timestamp with time zone,
    blocked_reason text,
    blocked_by uuid
);
CREATE TABLE mycozyhome.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    client_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_visible boolean DEFAULT true,
    admin_hidden boolean DEFAULT false,
    admin_notes text,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE TABLE mycozyhome.service_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    price_type text DEFAULT 'custom'::text NOT NULL,
    hourly_rate numeric,
    total_price numeric,
    estimated_hours numeric,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    client_accepted_at timestamp with time zone,
    professional_confirmed_at timestamp with time zone,
    booking_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE mycozyhome.service_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    service_type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    preferred_date date,
    preferred_time_start time without time zone,
    preferred_time_end time without time zone,
    flexible_dates boolean DEFAULT false,
    address text NOT NULL,
    city text NOT NULL,
    province text,
    latitude numeric,
    longitude numeric,
    budget_min numeric,
    budget_max numeric,
    estimated_hours numeric,
    status text DEFAULT 'open'::text NOT NULL,
    offers_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE mycozyhome.shop_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    product_name text NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT shop_order_items_quantity_check CHECK ((quantity > 0))
);
CREATE TABLE mycozyhome.shop_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    shipping_address text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT shop_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])))
);
CREATE TABLE mycozyhome.shop_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT shop_products_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT shop_products_stock_check CHECK ((stock >= 0))
);
CREATE TABLE mycozyhome.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_type text NOT NULL,
    category text NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone DEFAULT now(),
    CONSTRAINT support_tickets_category_check CHECK ((category = ANY (ARRAY['technical'::text, 'billing'::text, 'service'::text, 'report'::text, 'other'::text]))),
    CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text]))),
    CONSTRAINT support_tickets_user_type_check CHECK ((user_type = ANY (ARRAY['professional'::text, 'client'::text])))
);
CREATE TABLE mycozyhome.ticket_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    responder_id uuid NOT NULL,
    responder_type text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    attachment_url text,
    attachment_name text,
    CONSTRAINT ticket_responses_responder_type_check CHECK ((responder_type = ANY (ARRAY['user'::text, 'admin'::text])))
);
CREATE TABLE mycozyhome.tracking_pings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tracking_id uuid NOT NULL,
    booking_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    distance_m numeric DEFAULT 0 NOT NULL,
    in_range boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE mycozyhome.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role mycozyhome.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE mycozyhome.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    professional_id uuid,
    booking_id uuid,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    direction text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wallet_transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT wallet_transactions_direction_check CHECK ((direction = ANY (ARRAY['credit'::text, 'debit'::text]))),
    CONSTRAINT wallet_transactions_type_check CHECK ((type = ANY (ARRAY['top_up'::text, 'hold'::text, 'refund'::text, 'release'::text, 'payout'::text, 'dispute_refund'::text, 'dispute_payout'::text])))
);
ALTER TABLE ONLY mycozyhome.booking_tracking
    ADD CONSTRAINT booking_tracking_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.client_profiles
    ADD CONSTRAINT client_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.client_profiles
    ADD CONSTRAINT client_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY mycozyhome.client_reviews
    ADD CONSTRAINT client_reviews_booking_id_professional_id_key UNIQUE (booking_id, professional_id);
ALTER TABLE ONLY mycozyhome.client_reviews
    ADD CONSTRAINT client_reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.client_wallets
    ADD CONSTRAINT client_wallets_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY mycozyhome.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.dispute_evidence
    ADD CONSTRAINT dispute_evidence_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.favorites
    ADD CONSTRAINT favorites_client_id_professional_id_key UNIQUE (client_id, professional_id);
ALTER TABLE ONLY mycozyhome.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.professional_areas
    ADD CONSTRAINT professional_areas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.professional_availability
    ADD CONSTRAINT professional_availability_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.professional_availability
    ADD CONSTRAINT professional_availability_professional_id_day_of_week_key UNIQUE (professional_id, day_of_week);
ALTER TABLE ONLY mycozyhome.professional_documents
    ADD CONSTRAINT professional_documents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.professional_favorites
    ADD CONSTRAINT professional_favorites_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.professional_favorites
    ADD CONSTRAINT professional_favorites_professional_id_client_id_key UNIQUE (professional_id, client_id);
ALTER TABLE ONLY mycozyhome.professional_services
    ADD CONSTRAINT professional_services_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.professional_services
    ADD CONSTRAINT professional_services_professional_id_service_type_key UNIQUE (professional_id, service_type);
ALTER TABLE ONLY mycozyhome.professional_wallets
    ADD CONSTRAINT professional_wallets_pkey PRIMARY KEY (professional_id);
ALTER TABLE ONLY mycozyhome.professionals
    ADD CONSTRAINT professionals_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.reviews
    ADD CONSTRAINT reviews_booking_id_client_id_key UNIQUE (booking_id, client_id);
ALTER TABLE ONLY mycozyhome.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.service_offers
    ADD CONSTRAINT service_offers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.shop_order_items
    ADD CONSTRAINT shop_order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.shop_orders
    ADD CONSTRAINT shop_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.shop_products
    ADD CONSTRAINT shop_products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.ticket_responses
    ADD CONSTRAINT ticket_responses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.tracking_pings
    ADD CONSTRAINT tracking_pings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.service_offers
    ADD CONSTRAINT unique_offer_per_request UNIQUE (request_id, professional_id);
ALTER TABLE ONLY mycozyhome.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mycozyhome.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE ONLY mycozyhome.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);
CREATE INDEX idx_bookings_client_id ON mycozyhome.bookings USING btree (client_id);
CREATE INDEX idx_bookings_professional_id ON mycozyhome.bookings USING btree (professional_id);
CREATE INDEX idx_bookings_status ON mycozyhome.bookings USING btree (status);
CREATE INDEX idx_client_profiles_is_blocked ON mycozyhome.client_profiles USING btree (is_blocked) WHERE (is_blocked = true);
CREATE INDEX idx_conversations_client_id ON mycozyhome.conversations USING btree (client_id);
CREATE INDEX idx_conversations_professional_id ON mycozyhome.conversations USING btree (professional_id);
CREATE INDEX idx_favorites_client_id ON mycozyhome.favorites USING btree (client_id);
CREATE INDEX idx_favorites_professional_id ON mycozyhome.favorites USING btree (professional_id);
CREATE INDEX idx_messages_conversation_id ON mycozyhome.messages USING btree (conversation_id);
CREATE INDEX idx_messages_created_at ON mycozyhome.messages USING btree (created_at DESC);
CREATE INDEX idx_professional_areas_location ON mycozyhome.professional_areas USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));
CREATE INDEX idx_professionals_is_blocked ON mycozyhome.professionals USING btree (is_blocked) WHERE (is_blocked = true);
CREATE INDEX idx_professionals_location ON mycozyhome.professionals USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));
CREATE INDEX idx_reviews_client_id ON mycozyhome.reviews USING btree (client_id);
CREATE INDEX idx_reviews_professional_id ON mycozyhome.reviews USING btree (professional_id);
CREATE INDEX idx_service_offers_professional ON mycozyhome.service_offers USING btree (professional_id);
CREATE INDEX idx_service_offers_request ON mycozyhome.service_offers USING btree (request_id);
CREATE INDEX idx_service_offers_status ON mycozyhome.service_offers USING btree (status);
CREATE INDEX idx_service_requests_city ON mycozyhome.service_requests USING btree (city);
CREATE INDEX idx_service_requests_client ON mycozyhome.service_requests USING btree (client_id);
CREATE INDEX idx_service_requests_service_type ON mycozyhome.service_requests USING btree (service_type);
CREATE INDEX idx_service_requests_status ON mycozyhome.service_requests USING btree (status);
CREATE TRIGGER on_message_created AFTER INSERT ON mycozyhome.messages FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_conversation_last_message();
CREATE TRIGGER on_review_created AFTER INSERT OR UPDATE ON mycozyhome.reviews FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_professional_rating();
CREATE TRIGGER trg_check_revenue_limit AFTER INSERT OR UPDATE OF status ON mycozyhome.bookings FOR EACH ROW EXECUTE FUNCTION mycozyhome.check_professional_revenue_limit();
CREATE TRIGGER trg_complete_booking_on_tracking AFTER UPDATE ON mycozyhome.booking_tracking FOR EACH ROW EXECUTE FUNCTION mycozyhome.complete_booking_on_tracking_checkout();
CREATE TRIGGER trg_hold_booking_payment BEFORE INSERT ON mycozyhome.bookings FOR EACH ROW EXECUTE FUNCTION mycozyhome.hold_booking_payment();
CREATE TRIGGER trg_log_booking_payment_hold AFTER INSERT ON mycozyhome.bookings FOR EACH ROW EXECUTE FUNCTION mycozyhome.log_booking_payment_hold();
CREATE TRIGGER trg_refund_booking_payment BEFORE UPDATE ON mycozyhome.bookings FOR EACH ROW EXECUTE FUNCTION mycozyhome.refund_booking_payment();
CREATE TRIGGER trg_shop_orders_updated BEFORE UPDATE ON mycozyhome.shop_orders FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_updated_at_column();
CREATE TRIGGER trg_shop_products_updated BEFORE UPDATE ON mycozyhome.shop_products FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_updated_at_column();
CREATE TRIGGER trg_start_booking_payment_release BEFORE UPDATE ON mycozyhome.bookings FOR EACH ROW EXECUTE FUNCTION mycozyhome.start_booking_payment_release();
CREATE TRIGGER trg_suspend_payment_on_dispute BEFORE INSERT ON mycozyhome.disputes FOR EACH ROW EXECUTE FUNCTION mycozyhome.suspend_payment_on_dispute();
CREATE TRIGGER trigger_update_offers_count AFTER INSERT OR DELETE ON mycozyhome.service_offers FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_offers_count();
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON mycozyhome.client_profiles FOR EACH ROW EXECUTE FUNCTION mycozyhome.handle_updated_at();
CREATE TRIGGER update_client_rating_trigger AFTER INSERT OR UPDATE ON mycozyhome.client_reviews FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_client_rating();
CREATE TRIGGER update_client_reviews_updated_at BEFORE UPDATE ON mycozyhome.client_reviews FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON mycozyhome.conversations FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON mycozyhome.disputes FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON mycozyhome.professionals FOR EACH ROW EXECUTE FUNCTION mycozyhome.handle_updated_at();
CREATE TRIGGER update_service_offers_updated_at BEFORE UPDATE ON mycozyhome.service_offers FOR EACH ROW EXECUTE FUNCTION mycozyhome.handle_updated_at();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON mycozyhome.service_requests FOR EACH ROW EXECUTE FUNCTION mycozyhome.handle_updated_at();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON mycozyhome.support_tickets FOR EACH ROW EXECUTE FUNCTION mycozyhome.update_updated_at_column();
ALTER TABLE ONLY mycozyhome.booking_tracking
    ADD CONSTRAINT booking_tracking_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES mycozyhome.bookings(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.bookings
    ADD CONSTRAINT bookings_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.client_reviews
    ADD CONSTRAINT client_reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES mycozyhome.bookings(id);
ALTER TABLE ONLY mycozyhome.client_reviews
    ADD CONSTRAINT client_reviews_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id);
ALTER TABLE ONLY mycozyhome.client_wallets
    ADD CONSTRAINT client_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.conversations
    ADD CONSTRAINT conversations_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.dispute_evidence
    ADD CONSTRAINT dispute_evidence_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES mycozyhome.disputes(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.disputes
    ADD CONSTRAINT disputes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES mycozyhome.bookings(id) ON DELETE SET NULL;
ALTER TABLE ONLY mycozyhome.disputes
    ADD CONSTRAINT disputes_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES mycozyhome.conversations(id);
ALTER TABLE ONLY mycozyhome.favorites
    ADD CONSTRAINT favorites_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES mycozyhome.conversations(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.professional_areas
    ADD CONSTRAINT professional_areas_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.professional_availability
    ADD CONSTRAINT professional_availability_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.professional_documents
    ADD CONSTRAINT professional_documents_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.professional_documents
    ADD CONSTRAINT professional_documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE ONLY mycozyhome.professional_favorites
    ADD CONSTRAINT professional_favorites_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.professional_services
    ADD CONSTRAINT professional_services_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.professional_wallets
    ADD CONSTRAINT professional_wallets_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.professionals
    ADD CONSTRAINT professionals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE ONLY mycozyhome.reviews
    ADD CONSTRAINT reviews_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.service_offers
    ADD CONSTRAINT service_offers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES mycozyhome.bookings(id);
ALTER TABLE ONLY mycozyhome.service_offers
    ADD CONSTRAINT service_offers_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id);
ALTER TABLE ONLY mycozyhome.service_offers
    ADD CONSTRAINT service_offers_request_id_fkey FOREIGN KEY (request_id) REFERENCES mycozyhome.service_requests(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.shop_order_items
    ADD CONSTRAINT shop_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES mycozyhome.shop_orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.shop_order_items
    ADD CONSTRAINT shop_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES mycozyhome.shop_products(id);
ALTER TABLE ONLY mycozyhome.ticket_responses
    ADD CONSTRAINT ticket_responses_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES mycozyhome.support_tickets(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.tracking_pings
    ADD CONSTRAINT tracking_pings_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES mycozyhome.bookings(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.tracking_pings
    ADD CONSTRAINT tracking_pings_tracking_id_fkey FOREIGN KEY (tracking_id) REFERENCES mycozyhome.booking_tracking(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY mycozyhome.wallet_transactions
    ADD CONSTRAINT wallet_transactions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES mycozyhome.bookings(id) ON DELETE SET NULL;
ALTER TABLE ONLY mycozyhome.wallet_transactions
    ADD CONSTRAINT wallet_transactions_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES mycozyhome.professionals(id) ON DELETE SET NULL;
CREATE POLICY "Admin can create tickets for users" ON mycozyhome.support_tickets FOR INSERT WITH CHECK (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can respond to tickets" ON mycozyhome.ticket_responses FOR INSERT WITH CHECK (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can update all service requests" ON mycozyhome.service_requests FOR UPDATE USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can update all tickets" ON mycozyhome.support_tickets FOR UPDATE USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can update client profiles" ON mycozyhome.client_profiles FOR UPDATE USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can update professional documents" ON mycozyhome.professional_documents FOR UPDATE USING (true);
CREATE POLICY "Admin can update professionals" ON mycozyhome.professionals FOR UPDATE USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all bookings" ON mycozyhome.bookings FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all client profiles" ON mycozyhome.client_profiles FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all offers" ON mycozyhome.service_offers FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all pings" ON mycozyhome.tracking_pings FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all professional documents" ON mycozyhome.professional_documents FOR SELECT USING (true);
CREATE POLICY "Admin can view all professionals" ON mycozyhome.professionals FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all responses" ON mycozyhome.ticket_responses FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all service requests" ON mycozyhome.service_requests FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all tickets" ON mycozyhome.support_tickets FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admin can view all tracking" ON mycozyhome.booking_tracking FOR SELECT TO authenticated USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can delete products" ON mycozyhome.shop_products FOR DELETE TO authenticated USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can insert products" ON mycozyhome.shop_products FOR INSERT TO authenticated WITH CHECK (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can manage roles" ON mycozyhome.user_roles TO authenticated USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can update any order" ON mycozyhome.shop_orders FOR UPDATE TO authenticated USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can update products" ON mycozyhome.shop_products FOR UPDATE TO authenticated USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can view all orders" ON mycozyhome.shop_orders FOR SELECT TO authenticated USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can view all professional wallets" ON mycozyhome.professional_wallets FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can view all roles" ON mycozyhome.user_roles FOR SELECT TO authenticated USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can view all wallet transactions" ON mycozyhome.wallet_transactions FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Admins can view all wallets" ON mycozyhome.client_wallets FOR SELECT USING (mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role));
CREATE POLICY "Anyone can view approved professionals" ON mycozyhome.professionals FOR SELECT USING ((status = 'approved'::mycozyhome.professional_status));
CREATE POLICY "Anyone can view client reviews" ON mycozyhome.client_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can view open service requests" ON mycozyhome.service_requests FOR SELECT USING ((status = 'open'::text));
CREATE POLICY "Anyone can view professional services" ON mycozyhome.professional_services FOR SELECT USING (true);
CREATE POLICY "Anyone can view visible reviews" ON mycozyhome.reviews FOR SELECT USING (((is_visible = true) AND (admin_hidden = false)));
CREATE POLICY "Approved professionals and admins can view active products" ON mycozyhome.shop_products FOR SELECT TO authenticated USING ((((is_active = true) AND (EXISTS ( SELECT 1
   FROM mycozyhome.professionals p
  WHERE ((p.user_id = auth.uid()) AND (p.status = 'approved'::mycozyhome.professional_status))))) OR mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role)));
CREATE POLICY "Clients can create bookings" ON mycozyhome.bookings FOR INSERT WITH CHECK (((auth.uid() = client_id) AND (NOT mycozyhome.is_client_blocked(auth.uid()))));
CREATE POLICY "Clients can create reviews for their bookings" ON mycozyhome.reviews FOR INSERT WITH CHECK ((auth.uid() = client_id));
CREATE POLICY "Clients can create service requests" ON mycozyhome.service_requests FOR INSERT WITH CHECK (((auth.uid() = client_id) AND (NOT mycozyhome.is_client_blocked(auth.uid()))));
CREATE POLICY "Clients can update offers on their requests" ON mycozyhome.service_offers FOR UPDATE USING (((request_id IN ( SELECT service_requests.id
   FROM mycozyhome.service_requests
  WHERE (service_requests.client_id = auth.uid()))) AND (NOT mycozyhome.is_client_blocked(auth.uid()))));
CREATE POLICY "Clients can update their own requests" ON mycozyhome.service_requests FOR UPDATE USING (((auth.uid() = client_id) AND (NOT mycozyhome.is_client_blocked(auth.uid()))));
CREATE POLICY "Clients can view offers on their requests" ON mycozyhome.service_offers FOR SELECT USING ((request_id IN ( SELECT service_requests.id
   FROM mycozyhome.service_requests
  WHERE (service_requests.client_id = auth.uid()))));
CREATE POLICY "Clients can view pings for their bookings" ON mycozyhome.tracking_pings FOR SELECT USING ((booking_id IN ( SELECT b.id
   FROM mycozyhome.bookings b
  WHERE (b.client_id = auth.uid()))));
CREATE POLICY "Clients can view reviews about them" ON mycozyhome.client_reviews FOR SELECT USING ((auth.uid() = client_id));
CREATE POLICY "Clients can view their bookings" ON mycozyhome.bookings FOR SELECT USING ((auth.uid() = client_id));
CREATE POLICY "Clients can view their own requests" ON mycozyhome.service_requests FOR SELECT USING ((auth.uid() = client_id));
CREATE POLICY "Clients can view their own reviews" ON mycozyhome.reviews FOR SELECT USING ((auth.uid() = client_id));
CREATE POLICY "Clients can view tracking for their bookings" ON mycozyhome.booking_tracking FOR SELECT TO authenticated USING ((booking_id IN ( SELECT b.id
   FROM mycozyhome.bookings b
  WHERE (b.client_id = auth.uid()))));
CREATE POLICY "Professionals can add favorites" ON mycozyhome.professional_favorites FOR INSERT WITH CHECK ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can cancel own pending orders" ON mycozyhome.shop_orders FOR UPDATE TO authenticated USING (((status = 'pending'::text) AND (professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid())))));
CREATE POLICY "Professionals can create client reviews" ON mycozyhome.client_reviews FOR INSERT WITH CHECK ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can create offers" ON mycozyhome.service_offers FOR INSERT WITH CHECK (((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))) AND (NOT mycozyhome.is_professional_user_blocked(auth.uid()))));
CREATE POLICY "Professionals can create their own orders" ON mycozyhome.shop_orders FOR INSERT TO authenticated WITH CHECK ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can insert items for own orders" ON mycozyhome.shop_order_items FOR INSERT TO authenticated WITH CHECK ((order_id IN ( SELECT o.id
   FROM (mycozyhome.shop_orders o
     JOIN mycozyhome.professionals p ON ((p.id = o.professional_id)))
  WHERE (p.user_id = auth.uid()))));
CREATE POLICY "Professionals can insert their own pings" ON mycozyhome.tracking_pings FOR INSERT WITH CHECK ((professional_id IN ( SELECT p.id
   FROM mycozyhome.professionals p
  WHERE (p.user_id = auth.uid()))));
CREATE POLICY "Professionals can insert their own profile" ON mycozyhome.professionals FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Professionals can insert their own tracking" ON mycozyhome.booking_tracking FOR INSERT TO authenticated WITH CHECK ((professional_id IN ( SELECT p.id
   FROM mycozyhome.professionals p
  WHERE (p.user_id = auth.uid()))));
CREATE POLICY "Professionals can manage their own areas" ON mycozyhome.professional_areas USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can manage their own availability" ON mycozyhome.professional_availability USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can manage their own documents" ON mycozyhome.professional_documents USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can manage their own services" ON mycozyhome.professional_services USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can remove favorites" ON mycozyhome.professional_favorites FOR DELETE USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can update their bookings" ON mycozyhome.bookings FOR UPDATE USING (((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))) AND (NOT mycozyhome.is_professional_user_blocked(auth.uid()))));
CREATE POLICY "Professionals can update their own offers" ON mycozyhome.service_offers FOR UPDATE USING (((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))) AND (NOT mycozyhome.is_professional_user_blocked(auth.uid()))));
CREATE POLICY "Professionals can update their own profile" ON mycozyhome.professionals FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Professionals can update their own tracking" ON mycozyhome.booking_tracking FOR UPDATE TO authenticated USING ((professional_id IN ( SELECT p.id
   FROM mycozyhome.professionals p
  WHERE (p.user_id = auth.uid()))));
CREATE POLICY "Professionals can view own wallet" ON mycozyhome.professional_wallets FOR SELECT USING ((user_id = auth.uid()));
CREATE POLICY "Professionals can view their assigned bookings" ON mycozyhome.bookings FOR SELECT USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can view their client reviews" ON mycozyhome.client_reviews FOR SELECT USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can view their favorites" ON mycozyhome.professional_favorites FOR SELECT USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can view their own offers" ON mycozyhome.service_offers FOR SELECT USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can view their own orders" ON mycozyhome.shop_orders FOR SELECT TO authenticated USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Professionals can view their own pings" ON mycozyhome.tracking_pings FOR SELECT USING ((professional_id IN ( SELECT p.id
   FROM mycozyhome.professionals p
  WHERE (p.user_id = auth.uid()))));
CREATE POLICY "Professionals can view their own profile" ON mycozyhome.professionals FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Professionals can view their own tracking" ON mycozyhome.booking_tracking FOR SELECT TO authenticated USING ((professional_id IN ( SELECT p.id
   FROM mycozyhome.professionals p
  WHERE (p.user_id = auth.uid()))));
CREATE POLICY "Professionals can view their reviews" ON mycozyhome.reviews FOR SELECT USING ((professional_id IN ( SELECT professionals.id
   FROM mycozyhome.professionals
  WHERE (professionals.user_id = auth.uid()))));
CREATE POLICY "Users can add favorites" ON mycozyhome.favorites FOR INSERT WITH CHECK ((auth.uid() = client_id));
CREATE POLICY "Users can create conversations" ON mycozyhome.conversations FOR INSERT WITH CHECK (((auth.uid() = professional_id) OR (auth.uid() = client_id)));
CREATE POLICY "Users can create disputes" ON mycozyhome.disputes FOR INSERT WITH CHECK ((auth.uid() = reporter_id));
CREATE POLICY "Users can create tickets" ON mycozyhome.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own profile" ON mycozyhome.client_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can remove their own favorites" ON mycozyhome.favorites FOR DELETE USING ((auth.uid() = client_id));
CREATE POLICY "Users can respond to their tickets" ON mycozyhome.ticket_responses FOR INSERT WITH CHECK (((responder_type = 'user'::text) AND (EXISTS ( SELECT 1
   FROM mycozyhome.support_tickets
  WHERE ((support_tickets.id = ticket_responses.ticket_id) AND (support_tickets.user_id = auth.uid()))))));
CREATE POLICY "Users can send messages in their conversations" ON mycozyhome.messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM mycozyhome.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.professional_id = auth.uid()) OR (conversations.client_id = auth.uid()))))));
CREATE POLICY "Users can update read status in their conversations" ON mycozyhome.messages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM mycozyhome.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.client_id = auth.uid()) OR (c.professional_id = auth.uid())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM mycozyhome.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.client_id = auth.uid()) OR (c.professional_id = auth.uid()))))));
CREATE POLICY "Users can update their conversations" ON mycozyhome.conversations FOR UPDATE USING (((client_id = auth.uid()) OR (professional_id = auth.uid()))) WITH CHECK (((client_id = auth.uid()) OR (professional_id = auth.uid())));
CREATE POLICY "Users can update their own profile" ON mycozyhome.client_profiles FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can upload evidence to their disputes" ON mycozyhome.dispute_evidence FOR INSERT WITH CHECK ((auth.uid() = uploader_id));
CREATE POLICY "Users can view disputes they're involved in" ON mycozyhome.disputes FOR SELECT USING (((auth.uid() = reporter_id) OR (auth.uid() = reported_id)));
CREATE POLICY "Users can view evidence for their disputes" ON mycozyhome.dispute_evidence FOR SELECT USING ((EXISTS ( SELECT 1
   FROM mycozyhome.disputes
  WHERE ((disputes.id = dispute_evidence.dispute_id) AND ((disputes.reporter_id = auth.uid()) OR (disputes.reported_id = auth.uid()))))));
CREATE POLICY "Users can view messages in their conversations" ON mycozyhome.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM mycozyhome.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.professional_id = auth.uid()) OR (conversations.client_id = auth.uid()))))));
CREATE POLICY "Users can view own client wallet" ON mycozyhome.client_wallets FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own wallet transactions" ON mycozyhome.wallet_transactions FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can view responses to their tickets" ON mycozyhome.ticket_responses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM mycozyhome.support_tickets
  WHERE ((support_tickets.id = ticket_responses.ticket_id) AND (support_tickets.user_id = auth.uid())))));
CREATE POLICY "Users can view their conversations" ON mycozyhome.conversations FOR SELECT USING (((auth.uid() = professional_id) OR (auth.uid() = client_id)));
CREATE POLICY "Users can view their own favorites" ON mycozyhome.favorites FOR SELECT USING ((auth.uid() = client_id));
CREATE POLICY "Users can view their own profile" ON mycozyhome.client_profiles FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own roles" ON mycozyhome.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own tickets" ON mycozyhome.support_tickets FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "View items of accessible orders" ON mycozyhome.shop_order_items FOR SELECT TO authenticated USING ((order_id IN ( SELECT shop_orders.id
   FROM mycozyhome.shop_orders)));
ALTER TABLE mycozyhome.booking_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.client_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.client_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.professional_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.professional_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.professional_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.service_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.tracking_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycozyhome.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY mycozyhome.booking_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY mycozyhome.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY mycozyhome.tracking_pings;
-- Privilegi come nel progetto originale (le policy RLS restringono l'accesso)
GRANT ALL ON ALL TABLES IN SCHEMA mycozyhome TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mycozyhome TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA mycozyhome TO anon, authenticated, service_role;
-- Privilegi di default per oggetti futuri nello schema
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA mycozyhome GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA mycozyhome GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA mycozyhome GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
-- Profilo cliente automatico solo per le registrazioni di MyCozyHome
-- (trigger dedicato: il trigger on_auth_user_created delle altre app resta invariato)
CREATE TRIGGER mycozyhome_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.handle_new_client();
-- Storage: bucket con prefisso mycozyhome-
INSERT INTO storage.buckets (id, name, public) VALUES
  ('mycozyhome-chat-attachments', 'mycozyhome-chat-attachments', false),
  ('mycozyhome-dispute-evidence', 'mycozyhome-dispute-evidence', false),
  ('mycozyhome-professional-documents', 'mycozyhome-professional-documents', false),
  ('mycozyhome-shop-products', 'mycozyhome-shop-products', true),
  ('mycozyhome-support-attachments', 'mycozyhome-support-attachments', false)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "mycozyhome: Admin can download professional documents" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'mycozyhome-professional-documents'::text) AND mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role)));
CREATE POLICY "mycozyhome: Admin can view professional documents" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'mycozyhome-professional-documents'::text) AND mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role)));
CREATE POLICY "mycozyhome: Admins can delete product images" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'mycozyhome-shop-products'::text) AND mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role)));
CREATE POLICY "mycozyhome: Admins can update product images" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'mycozyhome-shop-products'::text) AND mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role)));
CREATE POLICY "mycozyhome: Admins can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'mycozyhome-shop-products'::text) AND mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role)));
CREATE POLICY "mycozyhome: Authenticated users can upload support attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'mycozyhome-support-attachments'::text));
CREATE POLICY "mycozyhome: Product images are publicly readable" ON storage.objects FOR SELECT USING ((bucket_id = 'mycozyhome-shop-products'::text));
CREATE POLICY "mycozyhome: Professionals can delete their own documents" ON storage.objects FOR DELETE USING (((bucket_id = 'mycozyhome-professional-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "mycozyhome: Professionals can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'mycozyhome-professional-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "mycozyhome: Professionals can view their own documents" ON storage.objects FOR SELECT USING (((bucket_id = 'mycozyhome-professional-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "mycozyhome: Users can upload chat attachments" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'mycozyhome-chat-attachments'::text) AND (auth.uid() IS NOT NULL)));
CREATE POLICY "mycozyhome: Users can upload dispute evidence" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'mycozyhome-dispute-evidence'::text) AND (auth.uid() IS NOT NULL)));
CREATE POLICY "mycozyhome: Users can view attachments in their conversations" ON storage.objects FOR SELECT USING (((bucket_id = 'mycozyhome-chat-attachments'::text) AND (EXISTS ( SELECT 1
   FROM mycozyhome.conversations c
  WHERE (((c.client_id = auth.uid()) OR (c.professional_id = auth.uid())) AND ((storage.foldername(objects.name))[1] = (c.id)::text))))));
CREATE POLICY "mycozyhome: Users can view their dispute evidence" ON storage.objects FOR SELECT USING (((bucket_id = 'mycozyhome-dispute-evidence'::text) AND (EXISTS ( SELECT 1
   FROM mycozyhome.disputes d
  WHERE (((d.reporter_id = auth.uid()) OR (d.reported_id = auth.uid())) AND ((storage.foldername(objects.name))[1] = (d.id)::text))))));
CREATE POLICY "mycozyhome: Users can view their support attachments" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'mycozyhome-support-attachments'::text));
