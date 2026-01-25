-- Add new columns for multi-select internship modes and durations
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS internship_modes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS internship_durations text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_domains text[] DEFAULT '{}';