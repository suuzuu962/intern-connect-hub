
-- Create company_limits table to store per-company operational limits set during approval
CREATE TABLE public.company_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  max_internships INTEGER NOT NULL DEFAULT 5,
  max_active_internships INTEGER NOT NULL DEFAULT 3,
  max_applications_per_internship INTEGER NOT NULL DEFAULT 100,
  can_post_paid_internships BOOLEAN NOT NULL DEFAULT true,
  can_post_free_internships BOOLEAN NOT NULL DEFAULT true,
  can_view_student_contact BOOLEAN NOT NULL DEFAULT true,
  can_view_resumes BOOLEAN NOT NULL DEFAULT true,
  can_feature_listings BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  set_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.company_limits ENABLE ROW LEVEL SECURITY;

-- Admins can manage all limits
CREATE POLICY "Admins can manage company limits"
ON public.company_limits
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Companies can view their own limits
CREATE POLICY "Companies can view own limits"
ON public.company_limits
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_company_limits_updated_at
BEFORE UPDATE ON public.company_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
