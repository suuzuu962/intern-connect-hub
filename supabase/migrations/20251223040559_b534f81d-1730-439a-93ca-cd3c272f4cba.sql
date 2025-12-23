-- Add college_id_url column to students table for college ID card upload
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS college_id_url text;