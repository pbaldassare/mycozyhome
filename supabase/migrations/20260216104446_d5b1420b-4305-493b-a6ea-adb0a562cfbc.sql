
-- Create booking_tracking table
CREATE TABLE public.booking_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  check_in_at timestamptz,
  check_in_latitude numeric,
  check_in_longitude numeric,
  check_in_distance_m numeric,
  check_in_in_range boolean,
  check_out_at timestamptz,
  check_out_latitude numeric,
  check_out_longitude numeric,
  check_out_distance_m numeric,
  check_out_in_range boolean,
  actual_hours numeric,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_tracking ENABLE ROW LEVEL SECURITY;

-- Professionals can insert their own tracking records
CREATE POLICY "Professionals can insert their own tracking"
ON public.booking_tracking
FOR INSERT
TO authenticated
WITH CHECK (
  professional_id IN (
    SELECT p.id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- Professionals can update their own tracking records
CREATE POLICY "Professionals can update their own tracking"
ON public.booking_tracking
FOR UPDATE
TO authenticated
USING (
  professional_id IN (
    SELECT p.id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- Professionals can view their own tracking records
CREATE POLICY "Professionals can view their own tracking"
ON public.booking_tracking
FOR SELECT
TO authenticated
USING (
  professional_id IN (
    SELECT p.id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- Clients can view tracking for their bookings
CREATE POLICY "Clients can view tracking for their bookings"
ON public.booking_tracking
FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT b.id FROM public.bookings b WHERE b.client_id = auth.uid()
  )
);

-- Admin can view all tracking records
CREATE POLICY "Admin can view all tracking"
ON public.booking_tracking
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
