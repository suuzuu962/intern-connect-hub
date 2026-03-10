
-- Create new storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('public-assets', 'public-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('private-documents', 'private-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('resume-storage', 'resume-storage', false);

-- RLS policies for public-assets (logos, cover images, avatars)
CREATE POLICY "Anyone can view public assets" ON storage.objects FOR SELECT USING (bucket_id = 'public-assets');
CREATE POLICY "Authenticated users can upload public assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own public assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'public-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own public assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'public-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for private-documents (company profiles, registration docs, college IDs)
CREATE POLICY "Users can upload their own private documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view their own private documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can view all private documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'private-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own private documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own private documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for resume-storage (resumes - accessible by owner, admins, and companies with applications)
CREATE POLICY "Users can upload their own resumes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resume-storage' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view their own resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resume-storage' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can view all resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resume-storage' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own resumes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resume-storage' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own resumes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resume-storage' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Rate limiting table for bot prevention
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  action text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_ip_action ON public.rate_limits (ip_hash, action, attempted_at);

-- Auto-cleanup old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE attempted_at < now() - interval '1 hour';
$$;

-- RLS for rate_limits - allow inserts from anyone, no reads
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert rate limits" ON public.rate_limits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view rate limits" ON public.rate_limits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
