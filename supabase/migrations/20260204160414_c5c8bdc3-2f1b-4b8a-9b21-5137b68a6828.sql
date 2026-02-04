-- Add per-service experience and description fields
ALTER TABLE public.professional_services
ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS description text;