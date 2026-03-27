CREATE POLICY "Public can view platform settings"
ON public.platform_settings
FOR SELECT
TO public
USING (key = 'all_settings');