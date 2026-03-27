
CREATE TABLE public.university_user_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'scout',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.university_user_requests ENABLE ROW LEVEL SECURITY;

-- University owners can create requests and view their own
CREATE POLICY "University owners can insert requests"
  ON public.university_user_requests FOR INSERT TO authenticated
  WITH CHECK (
    university_id IN (SELECT id FROM universities WHERE user_id = auth.uid())
  );

CREATE POLICY "University owners can view their requests"
  ON public.university_user_requests FOR SELECT TO authenticated
  USING (
    university_id IN (SELECT id FROM universities WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Admins can manage all requests
CREATE POLICY "Admins can manage all requests"
  ON public.university_user_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
