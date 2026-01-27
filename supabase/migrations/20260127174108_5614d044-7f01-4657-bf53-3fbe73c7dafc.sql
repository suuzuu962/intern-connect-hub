-- Add new fields for domain-based course selection, permanent address, and about me
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS course TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS custom_course TEXT,
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS permanent_country TEXT,
ADD COLUMN IF NOT EXISTS permanent_state TEXT,
ADD COLUMN IF NOT EXISTS permanent_city TEXT,
ADD COLUMN IF NOT EXISTS about_me TEXT;