-- Add geolocation columns to professionals table
ALTER TABLE public.professionals
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN formatted_address TEXT,
ADD COLUMN max_radius_km INTEGER DEFAULT 10;

-- Add geolocation columns to professional_areas table
ALTER TABLE public.professional_areas
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN formatted_address TEXT;

-- Create index for geospatial queries
CREATE INDEX idx_professionals_location ON public.professionals (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_professional_areas_location ON public.professional_areas (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;