-- Add new columns for multi-select domains and skills
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS internship_domains text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS internship_skills text[] DEFAULT '{}';