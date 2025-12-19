-- Add college field to students table (separate from university)
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS college text;