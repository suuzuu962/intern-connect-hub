-- Ensure a default "Student Standard" role exists
INSERT INTO public.custom_roles (id, name, description, scope, is_system)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Student Standard Access',
  'Default standard access role automatically assigned to all students. Includes viewing internships, companies, applications, and diary entries.',
  'student',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Assign default student permissions to this role
INSERT INTO public.custom_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id
FROM public.permissions
WHERE key IN (
  'internship.view_all',
  'application.view',
  'company.view',
  'activity.add',
  'activity.edit_own',
  'diary.view'
)
ON CONFLICT DO NOTHING;

-- Create a function to auto-assign student standard role on student creation
CREATE OR REPLACE FUNCTION public.auto_assign_student_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-assign the Student Standard Access role
  INSERT INTO public.user_custom_roles (user_id, role_id)
  VALUES (NEW.user_id, '00000000-0000-0000-0000-000000000001')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on students table
DROP TRIGGER IF EXISTS trigger_auto_assign_student_role ON public.students;
CREATE TRIGGER trigger_auto_assign_student_role
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_student_role();

-- Backfill: assign to existing students who don't have this role
INSERT INTO public.user_custom_roles (user_id, role_id)
SELECT s.user_id, '00000000-0000-0000-0000-000000000001'
FROM public.students s
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_custom_roles ucr
  WHERE ucr.user_id = s.user_id AND ucr.role_id = '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;