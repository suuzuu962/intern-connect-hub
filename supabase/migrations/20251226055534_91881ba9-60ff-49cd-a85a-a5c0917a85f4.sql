-- Add policy for admins to insert students
CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to insert user_roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to insert profiles
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to insert companies
CREATE POLICY "Admins can insert companies"
ON public.companies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));