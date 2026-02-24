
-- Fix: Change RESTRICTIVE UPDATE policies on companies to PERMISSIVE
-- RESTRICTIVE-only policies deny all access since there's no permissive baseline

-- Drop existing restrictive UPDATE policies
DROP POLICY IF EXISTS "Admins can update any company" ON public.companies;
DROP POLICY IF EXISTS "Company owners can update their company" ON public.companies;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can update any company"
ON public.companies
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company owners can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
