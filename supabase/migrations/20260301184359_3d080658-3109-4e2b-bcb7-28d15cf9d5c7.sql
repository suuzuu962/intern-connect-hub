
-- Internal memos table for communication between university/college/coordinator
CREATE TABLE public.institutional_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  sender_role text NOT NULL,
  sender_name text NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('university', 'college', 'coordinator', 'broadcast')),
  recipient_id uuid,
  subject text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'read', 'archived')),
  parent_memo_id uuid REFERENCES public.institutional_memos(id),
  university_id uuid NOT NULL,
  college_id uuid,
  attachments jsonb DEFAULT '[]'::jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.institutional_memos ENABLE ROW LEVEL SECURITY;

-- University owners can see all memos in their university
CREATE POLICY "University owners can view memos" ON public.institutional_memos
FOR SELECT USING (
  university_id IN (SELECT id FROM universities WHERE user_id = auth.uid())
  OR sender_id = auth.uid()
  OR recipient_id = auth.uid()
);

CREATE POLICY "University owners can create memos" ON public.institutional_memos
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);

CREATE POLICY "Users can update their memos" ON public.institutional_memos
FOR UPDATE USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "Admins can manage all memos" ON public.institutional_memos
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Student attendance table
CREATE TABLE public.student_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  session_name text,
  session_type text DEFAULT 'regular' CHECK (session_type IN ('regular', 'lab', 'seminar', 'internship')),
  hours_logged numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'excused')),
  marked_by uuid,
  remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, attendance_date, session_name)
);

ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON public.student_attendance
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- Coordinators can manage attendance for their college students
CREATE POLICY "Coordinators can manage college attendance" ON public.student_attendance
FOR ALL USING (
  college_id IN (
    SELECT college_id FROM college_coordinators
    WHERE user_id = auth.uid() AND is_approved = true AND is_active = true
  )
) WITH CHECK (
  college_id IN (
    SELECT college_id FROM college_coordinators
    WHERE user_id = auth.uid() AND is_approved = true AND is_active = true
  )
);

-- University owners can view attendance
CREATE POLICY "University owners can view attendance" ON public.student_attendance
FOR SELECT USING (
  college_id IN (
    SELECT c.id FROM colleges c
    JOIN universities u ON c.university_id = u.id
    WHERE u.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all attendance" ON public.student_attendance
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
