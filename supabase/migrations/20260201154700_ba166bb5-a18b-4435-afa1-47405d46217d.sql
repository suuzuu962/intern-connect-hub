-- Drop existing restrictive admin policies
DROP POLICY IF EXISTS "Admins can update any internship" ON public.internships;
DROP POLICY IF EXISTS "Admins can delete any internship" ON public.internships;

-- Recreate as PERMISSIVE policies (default is PERMISSIVE when not specified, but we're explicit)
CREATE POLICY "Admins can update any internship" 
ON public.internships 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any internship" 
ON public.internships 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));