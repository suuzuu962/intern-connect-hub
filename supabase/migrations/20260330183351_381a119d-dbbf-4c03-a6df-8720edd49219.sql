
-- Add platform_user_id column to profiles
ALTER TABLE public.profiles ADD COLUMN platform_user_id text UNIQUE;

-- Create function to generate alphanumeric user ID in EL-XXXXXXXX format
CREATE OR REPLACE FUNCTION public.generate_platform_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
  code text;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    new_id := 'EL-' || code;
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE platform_user_id = new_id) THEN
      NEW.platform_user_id := new_id;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-generate platform_user_id on insert
CREATE TRIGGER generate_platform_user_id_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.platform_user_id IS NULL)
  EXECUTE FUNCTION public.generate_platform_user_id();

-- Backfill existing profiles that don't have a platform_user_id
DO $$
DECLARE
  r RECORD;
  new_id text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
  code text;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE platform_user_id IS NULL LOOP
    LOOP
      code := '';
      FOR i IN 1..8 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;
      new_id := 'EL-' || code;
      
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE platform_user_id = new_id) THEN
        UPDATE public.profiles SET platform_user_id = new_id WHERE id = r.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;
