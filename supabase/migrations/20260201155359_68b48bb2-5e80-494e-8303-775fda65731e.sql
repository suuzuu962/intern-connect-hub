-- Add a SELECT policy for admins to view ALL internships
CREATE POLICY "Admins can view all internships" 
ON public.internships 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));