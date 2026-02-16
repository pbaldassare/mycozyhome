-- Remove babysitter from service_type enum
-- First update any remaining references
DELETE FROM professional_services WHERE service_type = 'babysitter';

-- Recreate enum without babysitter
ALTER TYPE service_type RENAME TO service_type_old;

CREATE TYPE service_type AS ENUM (
  'cleaning',
  'office_cleaning',
  'ironing',
  'sanitization',
  'dog_sitter',
  'wardrobe_seasonal',
  'decluttering',
  'post_renovation',
  'seasonal_cleaning',
  'garden_care',
  'home_organizing',
  'dog_walking',
  'pet_care_travel',
  'pet_space_cleaning'
);

ALTER TABLE professional_services 
  ALTER COLUMN service_type TYPE service_type USING service_type::text::service_type;

DROP TYPE service_type_old;