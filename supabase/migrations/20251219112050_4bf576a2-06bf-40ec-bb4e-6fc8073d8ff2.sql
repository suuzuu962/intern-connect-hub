-- Add new columns for designation info and internship offerings
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS designation_title text,
ADD COLUMN IF NOT EXISTS designation_name text,
ADD COLUMN IF NOT EXISTS designation_email text,
ADD COLUMN IF NOT EXISTS designation_phone text,
ADD COLUMN IF NOT EXISTS internship_mode text,
ADD COLUMN IF NOT EXISTS internship_domain text,
ADD COLUMN IF NOT EXISTS internship_duration text,
ADD COLUMN IF NOT EXISTS stipend_offered text;