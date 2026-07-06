-- Platform block status for clients and professionals (block, don't delete)

ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS blocked_by uuid;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS blocked_by uuid;

CREATE INDEX IF NOT EXISTS idx_client_profiles_is_blocked ON public.client_profiles(is_blocked) WHERE is_blocked = true;
CREATE INDEX IF NOT EXISTS idx_professionals_is_blocked ON public.professionals(is_blocked) WHERE is_blocked = true;

-- Helper: client blocked by auth user id
CREATE OR REPLACE FUNCTION public.is_client_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT cp.is_blocked FROM public.client_profiles cp WHERE cp.user_id = _user_id),
    false
  );
$$;

-- Helper: professional blocked by auth user id
CREATE OR REPLACE FUNCTION public.is_professional_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_blocked FROM public.professionals p WHERE p.user_id = _user_id),
    false
  );
$$;

-- Admin policies for client_profiles
CREATE POLICY "Admin can view all client profiles"
ON public.client_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update client profiles"
ON public.client_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten professional admin policies to use has_role
DROP POLICY IF EXISTS "Admin can view all professionals" ON public.professionals;
DROP POLICY IF EXISTS "Admin can update professionals" ON public.professionals;

CREATE POLICY "Admin can view all professionals"
ON public.professionals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update professionals"
ON public.professionals
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict platform actions for blocked users (chat and support remain allowed)

DROP POLICY IF EXISTS "Clients can create service requests" ON public.service_requests;
CREATE POLICY "Clients can create service requests"
ON public.service_requests FOR INSERT
WITH CHECK (
  auth.uid() = client_id
  AND NOT public.is_client_blocked(auth.uid())
);

DROP POLICY IF EXISTS "Clients can update their own requests" ON public.service_requests;
CREATE POLICY "Clients can update their own requests"
ON public.service_requests FOR UPDATE
USING (
  auth.uid() = client_id
  AND NOT public.is_client_blocked(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can create offers" ON public.service_offers;
CREATE POLICY "Professionals can create offers"
ON public.service_offers FOR INSERT
WITH CHECK (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  AND NOT public.is_professional_user_blocked(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can update their own offers" ON public.service_offers;
CREATE POLICY "Professionals can update their own offers"
ON public.service_offers FOR UPDATE
USING (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  AND NOT public.is_professional_user_blocked(auth.uid())
);

DROP POLICY IF EXISTS "Clients can create bookings" ON public.bookings;
CREATE POLICY "Clients can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  auth.uid() = client_id
  AND NOT public.is_client_blocked(auth.uid())
);

DROP POLICY IF EXISTS "Clients can update offers on their requests" ON public.service_offers;
CREATE POLICY "Clients can update offers on their requests"
ON public.service_offers FOR UPDATE
USING (
  request_id IN (SELECT id FROM public.service_requests WHERE client_id = auth.uid())
  AND NOT public.is_client_blocked(auth.uid())
);

DROP POLICY IF EXISTS "Professionals can update their bookings" ON public.bookings;
CREATE POLICY "Professionals can update their bookings"
ON public.bookings FOR UPDATE
USING (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  AND NOT public.is_professional_user_blocked(auth.uid())
);
