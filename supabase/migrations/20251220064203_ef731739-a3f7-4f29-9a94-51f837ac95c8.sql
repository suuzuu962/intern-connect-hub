-- Add target_role column to notifications for group targeting
ALTER TABLE public.notifications 
ADD COLUMN target_role text DEFAULT NULL;

-- Add index for faster queries by target_role
CREATE INDEX idx_notifications_target_role ON public.notifications(target_role);

-- Update RLS policy to allow admins to create notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Admins can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update notifications
CREATE POLICY "Admins can update any notification" 
ON public.notifications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all notifications
CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update user view policy to include role-based notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Users can view their notifications" 
ON public.notifications 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR (
    target_role IS NOT NULL 
    AND has_role(auth.uid(), target_role::app_role)
  )
);