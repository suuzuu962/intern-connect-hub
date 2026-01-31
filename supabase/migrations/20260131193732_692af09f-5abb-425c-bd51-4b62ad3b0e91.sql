-- Create advertisement banners table
CREATE TABLE public.advertisement_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'hero' CHECK (position IN ('hero', 'sidebar')),
  target_roles TEXT[] DEFAULT '{}',
  target_regions TEXT[] DEFAULT '{}',
  target_cities TEXT[] DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  display_hours_start INTEGER DEFAULT 0 CHECK (display_hours_start >= 0 AND display_hours_start <= 23),
  display_hours_end INTEGER DEFAULT 23 CHECK (display_hours_end >= 0 AND display_hours_end <= 23),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create role permissions table for feature access control
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  visible_fields TEXT[] DEFAULT '{}',
  hidden_fields TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(role, feature_key)
);

-- Enable RLS
ALTER TABLE public.advertisement_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for advertisement_banners
CREATE POLICY "Anyone can view active banners"
  ON public.advertisement_banners FOR SELECT
  USING (is_active = true AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Admins can manage all banners"
  ON public.advertisement_banners FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for role_permissions
CREATE POLICY "Anyone can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_advertisement_banners_updated_at
  BEFORE UPDATE ON public.advertisement_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default role permissions
INSERT INTO public.role_permissions (role, feature_key, is_enabled, settings) VALUES
  ('student', 'view_internships', true, '{"show_salary": true, "show_company_contact": false}'),
  ('student', 'apply_internships', true, '{}'),
  ('student', 'view_companies', true, '{"show_contact_info": false}'),
  ('student', 'diary_entries', true, '{}'),
  ('company', 'post_internships', true, '{}'),
  ('company', 'view_applications', true, '{"show_student_contact": true}'),
  ('company', 'view_students', true, '{"show_email": false, "show_phone": false}'),
  ('university', 'view_students', true, '{"show_full_profile": true}'),
  ('university', 'manage_colleges', true, '{}'),
  ('university', 'view_coordinators', true, '{}'),
  ('college_coordinator', 'view_students', true, '{"show_full_profile": true}'),
  ('college_coordinator', 'approve_diary', true, '{}'),
  ('college_coordinator', 'view_internships', true, '{}');