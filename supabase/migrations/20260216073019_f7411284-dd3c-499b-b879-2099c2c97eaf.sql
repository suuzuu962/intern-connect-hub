
-- Create RBAC audit log table
CREATE TABLE public.rbac_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  performed_by uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rbac_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view RBAC audit logs"
ON public.rbac_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert RBAC audit logs"
ON public.rbac_audit_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for fast lookups
CREATE INDEX idx_rbac_audit_logs_created_at ON public.rbac_audit_logs (created_at DESC);
CREATE INDEX idx_rbac_audit_logs_entity ON public.rbac_audit_logs (entity_type, entity_id);
