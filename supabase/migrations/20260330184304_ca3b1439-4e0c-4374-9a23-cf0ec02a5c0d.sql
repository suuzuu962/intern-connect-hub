
-- Update the generate function to accept a role prefix
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
  prefix text := 'EL';
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    new_id := prefix || '-' || code;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE platform_user_id = new_id) THEN
      NEW.platform_user_id := new_id;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create function to update platform_user_id with role prefix when role is assigned
CREATE OR REPLACE FUNCTION public.update_platform_user_id_with_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  prefix text;
  new_id text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
  code text;
BEGIN
  -- Determine prefix based on role
  CASE NEW.role::text
    WHEN 'student' THEN prefix := 'STU';
    WHEN 'company' THEN prefix := 'COM';
    WHEN 'university' THEN prefix := 'UNI';
    WHEN 'admin' THEN prefix := 'ADM';
    WHEN 'college_coordinator' THEN prefix := 'COL';
    ELSE prefix := 'EL';
  END CASE;

  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    new_id := prefix || '-' || code;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE platform_user_id = new_id) THEN
      UPDATE public.profiles SET platform_user_id = new_id WHERE user_id = NEW.user_id;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on user_roles to update platform_user_id with role prefix
CREATE TRIGGER update_platform_user_id_on_role_assign
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_user_id_with_role();

-- Backfill existing users with role-based prefixes
DO $$
DECLARE
  r RECORD;
  prefix text;
  new_id text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
  code text;
BEGIN
  FOR r IN 
    SELECT p.id, p.user_id, ur.role::text as role_name
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  LOOP
    CASE r.role_name
      WHEN 'student' THEN prefix := 'STU';
      WHEN 'company' THEN prefix := 'COM';
      WHEN 'university' THEN prefix := 'UNI';
      WHEN 'admin' THEN prefix := 'ADM';
      WHEN 'college_coordinator' THEN prefix := 'COL';
      ELSE prefix := 'EL';
    END CASE;

    LOOP
      code := '';
      FOR i IN 1..8 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;
      new_id := prefix || '-' || code;
      
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE platform_user_id = new_id) THEN
        UPDATE public.profiles SET platform_user_id = new_id WHERE id = r.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;
