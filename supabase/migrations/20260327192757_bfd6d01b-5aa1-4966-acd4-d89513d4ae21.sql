
-- Add role and permissions columns to university_users
ALTER TABLE public.university_users 
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'scout',
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;
