-- Tabella inserzioni/richieste di servizio pubblicate dai clienti
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  flexible_dates BOOLEAN DEFAULT false,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  budget_min NUMERIC,
  budget_max NUMERIC,
  estimated_hours NUMERIC,
  status TEXT NOT NULL DEFAULT 'open',
  offers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella offerte dei professionisti alle inserzioni
CREATE TABLE public.service_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  price_type TEXT NOT NULL DEFAULT 'custom',
  hourly_rate NUMERIC,
  total_price NUMERIC,
  estimated_hours NUMERIC,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  client_accepted_at TIMESTAMP WITH TIME ZONE,
  professional_confirmed_at TIMESTAMP WITH TIME ZONE,
  booking_id UUID REFERENCES public.bookings(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indici
CREATE INDEX idx_service_requests_client ON public.service_requests(client_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_service_requests_service_type ON public.service_requests(service_type);
CREATE INDEX idx_service_requests_city ON public.service_requests(city);
CREATE INDEX idx_service_offers_request ON public.service_offers(request_id);
CREATE INDEX idx_service_offers_professional ON public.service_offers(professional_id);
CREATE INDEX idx_service_offers_status ON public.service_offers(status);

-- Unique constraint: un professionista può fare una sola offerta per inserzione
ALTER TABLE public.service_offers ADD CONSTRAINT unique_offer_per_request UNIQUE (request_id, professional_id);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_offers ENABLE ROW LEVEL SECURITY;

-- RLS per service_requests
CREATE POLICY "Anyone can view open service requests"
ON public.service_requests FOR SELECT
USING (status = 'open');

CREATE POLICY "Clients can view their own requests"
ON public.service_requests FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create service requests"
ON public.service_requests FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own requests"
ON public.service_requests FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Admin can view all service requests"
ON public.service_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update all service requests"
ON public.service_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS per service_offers
CREATE POLICY "Professionals can create offers"
ON public.service_offers FOR INSERT
WITH CHECK (professional_id IN (
  SELECT id FROM professionals WHERE user_id = auth.uid()
));

CREATE POLICY "Professionals can view their own offers"
ON public.service_offers FOR SELECT
USING (professional_id IN (
  SELECT id FROM professionals WHERE user_id = auth.uid()
));

CREATE POLICY "Professionals can update their own offers"
ON public.service_offers FOR UPDATE
USING (professional_id IN (
  SELECT id FROM professionals WHERE user_id = auth.uid()
));

CREATE POLICY "Clients can view offers on their requests"
ON public.service_offers FOR SELECT
USING (request_id IN (
  SELECT id FROM service_requests WHERE client_id = auth.uid()
));

CREATE POLICY "Clients can update offers on their requests"
ON public.service_offers FOR UPDATE
USING (request_id IN (
  SELECT id FROM service_requests WHERE client_id = auth.uid()
));

CREATE POLICY "Admin can view all offers"
ON public.service_offers FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_service_offers_updated_at
BEFORE UPDATE ON public.service_offers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger per aggiornare offers_count
CREATE OR REPLACE FUNCTION public.update_offers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE TRIGGER trigger_update_offers_count
AFTER INSERT OR DELETE ON public.service_offers
FOR EACH ROW EXECUTE FUNCTION public.update_offers_count();