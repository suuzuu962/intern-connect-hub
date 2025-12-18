-- Add extended company profile fields
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS long_description text,
ADD COLUMN IF NOT EXISTS about_company text,
ADD COLUMN IF NOT EXISTS gst_pan text,
ADD COLUMN IF NOT EXISTS domain_category text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS contact_person_name text,
ADD COLUMN IF NOT EXISTS contact_person_email text,
ADD COLUMN IF NOT EXISTS contact_person_phone text,
ADD COLUMN IF NOT EXISTS contact_person_designation text,
ADD COLUMN IF NOT EXISTS certifications text[],
ADD COLUMN IF NOT EXISTS awards text[],
ADD COLUMN IF NOT EXISTS company_profile_url text,
ADD COLUMN IF NOT EXISTS registration_profile_url text,
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS declaration_accepted boolean DEFAULT false;

-- Create storage bucket for company files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('company-files', 'company-files', true, 1048576)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for company files
CREATE POLICY "Company files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-files');

CREATE POLICY "Authenticated users can upload company files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-files');

CREATE POLICY "Users can update their own company files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-files');

CREATE POLICY "Users can delete their own company files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-files');