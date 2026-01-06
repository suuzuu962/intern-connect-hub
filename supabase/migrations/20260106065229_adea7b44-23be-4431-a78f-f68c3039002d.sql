-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'university';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'college_coordinator';

-- Create universities table
CREATE TABLE public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  logo_url text,
  contact_person_name text,
  contact_person_email text,
  contact_person_phone text,
  contact_person_designation text,
  address text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create university_users table (for additional users - max 3)
CREATE TABLE public.university_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create colleges table
CREATE TABLE public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  contact_person_name text,
  contact_person_email text,
  contact_person_phone text,
  contact_person_designation text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create college_coordinators table
CREATE TABLE public.college_coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  designation text,
  address text,
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create login_logs table
CREATE TABLE public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  role text NOT NULL,
  ip_address text,
  user_agent text,
  login_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add college_id to students table for mapping
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.colleges(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Universities RLS policies
CREATE POLICY "Universities viewable by authenticated users" ON public.universities FOR SELECT USING (true);
CREATE POLICY "University owners can update their university" ON public.universities FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can create their university" ON public.universities FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all universities" ON public.universities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- University users RLS policies
CREATE POLICY "University owners can view their users" ON public.university_users FOR SELECT USING (
  university_id IN (SELECT id FROM public.universities WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "University owners can manage their users" ON public.university_users FOR ALL USING (
  university_id IN (SELECT id FROM public.universities WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all university users" ON public.university_users FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Colleges RLS policies
CREATE POLICY "Colleges viewable by authenticated users" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "University owners can manage their colleges" ON public.colleges FOR ALL USING (
  university_id IN (SELECT id FROM public.universities WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all colleges" ON public.colleges FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- College coordinators RLS policies
CREATE POLICY "Coordinators viewable by relevant parties" ON public.college_coordinators FOR SELECT USING (
  user_id = auth.uid()
  OR university_id IN (SELECT id FROM public.universities WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Coordinators can update their profile" ON public.college_coordinators FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can create coordinator profile" ON public.college_coordinators FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Universities can update coordinators" ON public.college_coordinators FOR UPDATE USING (
  university_id IN (SELECT id FROM public.universities WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all coordinators" ON public.college_coordinators FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Login logs RLS policies
CREATE POLICY "Users can view their own logs" ON public.login_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Universities can view relevant logs" ON public.login_logs FOR SELECT USING (
  user_id IN (
    SELECT user_id FROM public.university_users WHERE university_id IN (SELECT id FROM public.universities WHERE user_id = auth.uid())
    UNION
    SELECT user_id FROM public.college_coordinators WHERE university_id IN (SELECT id FROM public.universities WHERE user_id = auth.uid())
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Anyone can insert login logs" ON public.login_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all logs" ON public.login_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON public.colleges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_college_coordinators_updated_at BEFORE UPDATE ON public.college_coordinators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();