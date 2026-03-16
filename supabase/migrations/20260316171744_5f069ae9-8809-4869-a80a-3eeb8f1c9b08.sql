
-- Table for upgrade/meeting requests
CREATE TABLE public.upgrade_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  feature_requested TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  phone TEXT,
  message TEXT,
  whatsapp_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can create upgrade requests"
  ON public.upgrade_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own requests
CREATE POLICY "Users can view own upgrade requests"
  ON public.upgrade_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all requests
CREATE POLICY "Admins can manage all upgrade requests"
  ON public.upgrade_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add feature_access_config table for admin to configure locked features per role
CREATE TABLE public.feature_access_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  feature_label TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  upgrade_message TEXT DEFAULT 'This feature requires an upgrade. Schedule a 1:1 meeting to learn more.',
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, feature_key)
);

ALTER TABLE public.feature_access_config ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read feature access config
CREATE POLICY "Authenticated users can view feature access config"
  ON public.feature_access_config FOR SELECT TO authenticated
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage feature access config"
  ON public.feature_access_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default locked features for each role
INSERT INTO public.feature_access_config (role, feature_key, feature_label, is_locked) VALUES
  -- Student locked features
  ('student', 'resume-analysis', 'Resume Analysis', true),
  ('student', 'internship-recommendations', 'Internship Recommendations', true),
  -- Company locked features  
  ('company', 'analytics', 'Analytics Dashboard', true),
  ('company', 'application-funnel', 'Application Funnel', true),
  ('company', 'shortlist-tool', 'Shortlist Tool', true),
  ('company', 'bulk-message', 'Bulk Messaging', true),
  -- University locked features
  ('university', 'analytics', 'Analytics Dashboard', true),
  -- Coordinator locked features
  ('coordinator', 'attendance', 'Attendance Tracker', true);
