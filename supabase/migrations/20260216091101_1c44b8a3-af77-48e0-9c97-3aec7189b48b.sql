
-- Add new service types to the enum
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'wardrobe_seasonal';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'decluttering';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'post_renovation';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'seasonal_cleaning';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'garden_care';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'home_organizing';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'dog_walking';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'pet_care_travel';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'pet_space_cleaning';
