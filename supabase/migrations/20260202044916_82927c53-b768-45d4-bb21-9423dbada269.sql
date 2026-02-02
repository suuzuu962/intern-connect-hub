-- Create user_permissions table for individual user permission overrides
CREATE TABLE public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    feature_key TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    visible_fields TEXT[] DEFAULT '{}'::text[],
    hidden_fields TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID,
    UNIQUE (user_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all user permissions
CREATE POLICY "Admins can manage user permissions" 
ON public.user_permissions 
AS PERMISSIVE
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions" 
ON public.user_permissions 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_feature_key ON public.user_permissions(feature_key);