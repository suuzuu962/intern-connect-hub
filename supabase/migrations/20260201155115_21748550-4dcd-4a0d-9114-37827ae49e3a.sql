-- Drop the existing UPDATE policies for internships
DROP POLICY IF EXISTS "Admins can update any internship" ON public.internships;
DROP POLICY IF EXISTS "Companies can update their internships" ON public.internships;

-- Create a PERMISSIVE policy for admins (at least one permissive must pass)
CREATE POLICY "Admins can update any internship" 
ON public.internships 
AS PERMISSIVE
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create a PERMISSIVE policy for companies (allowing company owners to update their own)
CREATE POLICY "Companies can update their internships" 
ON public.internships 
AS PERMISSIVE
FOR UPDATE 
TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Also fix DELETE policies
DROP POLICY IF EXISTS "Admins can delete any internship" ON public.internships;
DROP POLICY IF EXISTS "Companies can delete their internships" ON public.internships;

CREATE POLICY "Admins can delete any internship" 
ON public.internships 
AS PERMISSIVE
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can delete their internships" 
ON public.internships 
AS PERMISSIVE
FOR DELETE 
TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));