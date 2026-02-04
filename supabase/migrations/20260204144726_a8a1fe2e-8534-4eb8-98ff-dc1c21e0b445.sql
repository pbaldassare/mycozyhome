-- Create enum for professional status
CREATE TYPE public.professional_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'suspended');

-- Create enum for document status
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for services
CREATE TYPE public.service_type AS ENUM ('cleaning', 'office_cleaning', 'ironing', 'sanitization', 'babysitter', 'dog_sitter');

-- Create professionals table
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Personal data
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date DATE,
  fiscal_code TEXT,
  avatar_url TEXT,
  
  -- Address
  address TEXT,
  city TEXT NOT NULL,
  province TEXT,
  postal_code TEXT,
  
  -- Professional data
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  
  -- Status and verification
  status professional_status NOT NULL DEFAULT 'pending',
  profile_completed BOOLEAN DEFAULT FALSE,
  documents_submitted BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Create professional services table (many-to-many with pricing)
CREATE TABLE public.professional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  service_type service_type NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  min_hours INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, service_type)
);

-- Create professional availability table
CREATE TABLE public.professional_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, day_of_week)
);

-- Create professional coverage areas
CREATE TABLE public.professional_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  city TEXT NOT NULL,
  province TEXT,
  max_distance_km INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.professional_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- 'id_card', 'fiscal_code', 'certificate', etc.
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  status document_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for professionals
CREATE POLICY "Professionals can view their own profile"
ON public.professionals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Professionals can insert their own profile"
ON public.professionals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can update their own profile"
ON public.professionals FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for professional_services
CREATE POLICY "Professionals can manage their own services"
ON public.professional_services FOR ALL
USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

-- RLS Policies for professional_availability
CREATE POLICY "Professionals can manage their own availability"
ON public.professional_availability FOR ALL
USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

-- RLS Policies for professional_areas
CREATE POLICY "Professionals can manage their own areas"
ON public.professional_areas FOR ALL
USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

-- RLS Policies for professional_documents
CREATE POLICY "Professionals can manage their own documents"
ON public.professional_documents FOR ALL
USING (professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid()));

-- Public read policy for approved professionals (for clients to see)
CREATE POLICY "Anyone can view approved professionals"
ON public.professionals FOR SELECT
USING (status = 'approved');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for professionals
CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('professional-documents', 'professional-documents', false);

-- Storage policies for professional documents
CREATE POLICY "Professionals can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'professional-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Professionals can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'professional-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Professionals can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'professional-documents' AND auth.uid()::text = (storage.foldername(name))[1]);