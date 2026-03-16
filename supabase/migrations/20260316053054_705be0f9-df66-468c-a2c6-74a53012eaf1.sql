
ALTER TABLE public.notifications ADD COLUMN sender_id uuid;

-- Allow companies to read notifications they sent
CREATE POLICY "Companies can view notifications they sent"
ON public.notifications
FOR SELECT
TO authenticated
USING (sender_id = auth.uid());

-- Allow students to read their own notifications (if not already covered)
-- Already covered by existing policies
