
-- Table for periodic GPS pings during a booking
CREATE TABLE public.tracking_pings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id uuid NOT NULL REFERENCES public.booking_tracking(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  distance_m numeric NOT NULL DEFAULT 0,
  in_range boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracking_pings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Professionals can insert their own pings"
ON public.tracking_pings FOR INSERT
WITH CHECK (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));

CREATE POLICY "Professionals can view their own pings"
ON public.tracking_pings FOR SELECT
USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));

CREATE POLICY "Admin can view all pings"
ON public.tracking_pings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view pings for their bookings"
ON public.tracking_pings FOR SELECT
USING (booking_id IN (SELECT b.id FROM bookings b WHERE b.client_id = auth.uid()));

-- Enable realtime for tracking_pings only
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_pings;

-- Add geofence event columns to booking_tracking
ALTER TABLE public.booking_tracking 
  ADD COLUMN IF NOT EXISTS auto_checked_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_checked_out boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS left_zone_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_ping_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS total_out_of_range_minutes numeric DEFAULT 0;
