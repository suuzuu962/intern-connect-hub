-- Allow college coordinators to update other coordinators in their college
CREATE POLICY "College coordinators can update their college coordinators"
ON public.college_coordinators
FOR UPDATE
USING (
  college_id IN (
    SELECT cc.college_id
    FROM college_coordinators cc
    WHERE cc.user_id = auth.uid()
      AND cc.is_approved = true
      AND cc.is_active = true
  )
);

-- Allow college coordinators to delete coordinators in their college
CREATE POLICY "College coordinators can delete their college coordinators"
ON public.college_coordinators
FOR DELETE
USING (
  college_id IN (
    SELECT cc.college_id
    FROM college_coordinators cc
    WHERE cc.user_id = auth.uid()
      AND cc.is_approved = true
      AND cc.is_active = true
  )
);