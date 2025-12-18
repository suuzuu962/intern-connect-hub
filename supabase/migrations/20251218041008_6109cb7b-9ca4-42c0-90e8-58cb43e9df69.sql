-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('company', 'student');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    logo_url TEXT,
    industry TEXT,
    location TEXT,
    website TEXT,
    description TEXT,
    employee_count TEXT,
    founded_year INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are viewable by everyone"
ON public.companies FOR SELECT
USING (true);

CREATE POLICY "Company owners can update their company"
ON public.companies FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their company"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    university TEXT,
    degree TEXT,
    graduation_year INTEGER,
    skills TEXT[],
    resume_url TEXT,
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students are viewable by authenticated users"
ON public.students FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Students can update their own profile"
ON public.students FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their student profile"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create internship categories
CREATE TYPE public.internship_type AS ENUM ('full_time', 'part_time', 'contract');
CREATE TYPE public.work_mode AS ENUM ('remote', 'onsite', 'hybrid');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

-- Create internships table
CREATE TABLE public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    domain TEXT,
    skills TEXT[],
    location TEXT,
    internship_type internship_type NOT NULL DEFAULT 'full_time',
    work_mode work_mode NOT NULL DEFAULT 'onsite',
    duration TEXT,
    stipend DECIMAL(10,2),
    is_paid BOOLEAN DEFAULT false,
    fees DECIMAL(10,2),
    start_date DATE,
    application_deadline DATE,
    positions_available INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active internships are viewable by everyone"
ON public.internships FOR SELECT
USING (is_active = true OR company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can create internships"
ON public.internships FOR INSERT
TO authenticated
WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can update their internships"
ON public.internships FOR UPDATE
TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can delete their internships"
ON public.internships FOR DELETE
TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Create applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    status application_status NOT NULL DEFAULT 'pending',
    cover_letter TEXT,
    resume_url TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(internship_id, student_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own applications"
ON public.applications FOR SELECT
TO authenticated
USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR internship_id IN (SELECT id FROM internships WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
);

CREATE POLICY "Students can create applications"
ON public.applications FOR INSERT
TO authenticated
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their own applications"
ON public.applications FOR UPDATE
TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Companies can update application status"
ON public.applications FOR UPDATE
TO authenticated
USING (internship_id IN (SELECT id FROM internships WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create subscriptions table for notification preferences
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, type)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own subscriptions"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own subscriptions"
ON public.subscriptions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create internship_diary table for student entries
CREATE TABLE public.internship_diary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    entry_date DATE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    hours_worked DECIMAL(4,2),
    skills_learned TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.internship_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own diary entries"
ON public.internship_diary FOR SELECT
TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can create diary entries"
ON public.internship_diary FOR INSERT
TO authenticated
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their own diary entries"
ON public.internship_diary FOR UPDATE
TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can delete their own diary entries"
ON public.internship_diary FOR DELETE
TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_diary_updated_at BEFORE UPDATE ON public.internship_diary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;