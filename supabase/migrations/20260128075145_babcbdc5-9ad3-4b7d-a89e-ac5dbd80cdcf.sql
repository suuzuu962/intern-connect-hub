-- Add year_of_study column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS year_of_study INTEGER;