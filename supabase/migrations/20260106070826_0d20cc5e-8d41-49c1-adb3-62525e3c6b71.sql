-- Add diary approval status tracking columns to internship_diary
ALTER TABLE public.internship_diary 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS coordinator_remarks text;

-- Add RLS policy for coordinators to view diary entries of students in their college
CREATE POLICY "Coordinators can view diary entries of their college students"
ON public.internship_diary
FOR SELECT
USING (
  student_id IN (
    SELECT s.id FROM students s
    WHERE s.college_id IN (
      SELECT cc.college_id FROM college_coordinators cc
      WHERE cc.user_id = auth.uid() AND cc.is_approved = true
    )
  )
);

-- Add RLS policy for coordinators to update diary approval status
CREATE POLICY "Coordinators can update diary approval status"
ON public.internship_diary
FOR UPDATE
USING (
  student_id IN (
    SELECT s.id FROM students s
    WHERE s.college_id IN (
      SELECT cc.college_id FROM college_coordinators cc
      WHERE cc.user_id = auth.uid() AND cc.is_approved = true
    )
  )
);