-- Drop existing restrictive policies and recreate them as permissive
-- This fixes the issue where RESTRICTIVE policies require ALL policies to pass

-- Companies table: Fix policies to be PERMISSIVE
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Company owners can update their company" ON public.companies;
DROP POLICY IF EXISTS "Users can create their company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update any company" ON public.companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;

-- Recreate as PERMISSIVE policies (default behavior - ANY matching policy allows access)
CREATE POLICY "Companies are viewable by everyone" 
ON public.companies 
FOR SELECT 
USING (true);

CREATE POLICY "Company owners can update their company" 
ON public.companies 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their company" 
ON public.companies 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any company" 
ON public.companies 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete companies" 
ON public.companies 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));