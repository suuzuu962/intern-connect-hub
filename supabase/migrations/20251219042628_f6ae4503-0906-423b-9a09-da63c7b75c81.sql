-- Add missing fields to students table for comprehensive profile
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS usn text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS semester integer,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS interested_domains text[],
ADD COLUMN IF NOT EXISTS accuracy_confirmation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;