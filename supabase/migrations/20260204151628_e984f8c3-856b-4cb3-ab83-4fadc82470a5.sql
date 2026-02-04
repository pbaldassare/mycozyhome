-- Create reviews table for ratings after completed services
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_visible boolean DEFAULT true,
  admin_hidden boolean DEFAULT false,
  admin_notes text,
  UNIQUE(booking_id, client_id)
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Clients can create reviews for their completed bookings
CREATE POLICY "Clients can create reviews for their bookings"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Everyone can view visible reviews
CREATE POLICY "Anyone can view visible reviews"
ON public.reviews
FOR SELECT
USING (is_visible = true AND admin_hidden = false);

-- Clients can view their own reviews
CREATE POLICY "Clients can view their own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = client_id);

-- Professionals can view reviews about them
CREATE POLICY "Professionals can view their reviews"
ON public.reviews
FOR SELECT
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
);

-- Create function to calculate average rating for a professional
CREATE OR REPLACE FUNCTION public.get_professional_rating(p_professional_id uuid)
RETURNS TABLE(average_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*) as review_count
  FROM public.reviews
  WHERE professional_id = p_professional_id
    AND is_visible = true
    AND admin_hidden = false;
$$;

-- Add rating columns to professionals table for caching
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Function to update professional rating cache
CREATE OR REPLACE FUNCTION public.update_professional_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.professionals
  SET 
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM public.reviews
      WHERE professional_id = NEW.professional_id
        AND is_visible = true
        AND admin_hidden = false
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE professional_id = NEW.professional_id
        AND is_visible = true
        AND admin_hidden = false
    )
  WHERE id = NEW.professional_id;
  RETURN NEW;
END;
$$;

-- Trigger to update rating on new review
CREATE TRIGGER on_review_created
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_rating();

-- Create bookings table (needed for reviews relationship)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time_start time NOT NULL,
  scheduled_time_end time NOT NULL,
  address text NOT NULL,
  latitude numeric,
  longitude numeric,
  status text NOT NULL DEFAULT 'pending',
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
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Clients can view their own bookings
CREATE POLICY "Clients can view their bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = client_id);

-- Clients can create bookings
CREATE POLICY "Clients can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Professionals can view bookings assigned to them
CREATE POLICY "Professionals can view their assigned bookings"
ON public.bookings
FOR SELECT
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
);

-- Professionals can update booking status
CREATE POLICY "Professionals can update their bookings"
ON public.bookings
FOR UPDATE
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
);

-- Create dispute_evidence bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-evidence', 'dispute-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for dispute evidence storage
CREATE POLICY "Users can upload dispute evidence"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'dispute-evidence'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their dispute evidence"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'dispute-evidence'
  AND (
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE (d.reporter_id = auth.uid() OR d.reported_id = auth.uid())
      AND (storage.foldername(name))[1] = d.id::text
    )
  )
);

-- Add booking_id foreign key to disputes if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'disputes_booking_id_fkey'
  ) THEN
    ALTER TABLE public.disputes
    ADD CONSTRAINT disputes_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON public.reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional_id ON public.bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);