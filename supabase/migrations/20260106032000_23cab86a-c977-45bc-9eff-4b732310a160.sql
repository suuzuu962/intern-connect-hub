-- Drop and recreate the internship_type enum with new values
ALTER TYPE internship_type RENAME TO internship_type_old;

CREATE TYPE internship_type AS ENUM ('free', 'paid', 'stipended');

-- Update existing internships to use new type
ALTER TABLE public.internships 
  ALTER COLUMN internship_type DROP DEFAULT,
  ALTER COLUMN internship_type TYPE internship_type USING 
    CASE 
      WHEN internship_type::text = 'full_time' THEN 'free'::internship_type
      WHEN internship_type::text = 'part_time' THEN 'free'::internship_type
      WHEN internship_type::text = 'contract' THEN 'paid'::internship_type
      ELSE 'free'::internship_type
    END,
  ALTER COLUMN internship_type SET DEFAULT 'free'::internship_type;

-- Drop old enum type
DROP TYPE internship_type_old;