
-- Create client_reviews table (professionals review clients)
CREATE TABLE public.client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  client_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, professional_id)
);

-- Enable RLS
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- Professionals can create reviews for their bookings
CREATE POLICY "Professionals can create client reviews"
ON public.client_reviews
FOR INSERT
WITH CHECK (
  professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  )
);

-- Professionals can view their own reviews
CREATE POLICY "Professionals can view their client reviews"
ON public.client_reviews
FOR SELECT
USING (
  professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  )
);

-- Clients can view reviews about themselves
CREATE POLICY "Clients can view reviews about them"
ON public.client_reviews
FOR SELECT
USING (auth.uid() = client_id);

-- Anyone can view client reviews (for rating display)
CREATE POLICY "Anyone can view client reviews"
ON public.client_reviews
FOR SELECT
USING (true);

-- Add average_rating and review_count to client_profiles
ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS average_rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update client rating
CREATE OR REPLACE FUNCTION public.update_client_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.client_profiles
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM public.client_reviews
      WHERE client_id = NEW.client_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.client_reviews
      WHERE client_id = NEW.client_id
    )
  WHERE user_id = NEW.client_id;
  RETURN NEW;
END;
$$;

-- Trigger to auto-update client rating
CREATE TRIGGER update_client_rating_trigger
AFTER INSERT OR UPDATE ON public.client_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_client_rating();

-- Updated_at trigger
CREATE TRIGGER update_client_reviews_updated_at
BEFORE UPDATE ON public.client_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
