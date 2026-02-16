ALTER TABLE public.custom_roles DROP CONSTRAINT custom_roles_scope_check;

ALTER TABLE public.custom_roles ADD CONSTRAINT custom_roles_scope_check 
  CHECK (scope = ANY (ARRAY['super_admin'::text, 'admin'::text, 'university'::text, 'college'::text, 'coordinator'::text, 'company'::text, 'student'::text]));