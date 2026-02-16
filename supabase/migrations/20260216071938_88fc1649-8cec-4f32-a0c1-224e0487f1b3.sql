
-- Create custom_roles table for university/college/coordinator RBAC
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  scope text NOT NULL DEFAULT 'university' CHECK (scope IN ('university', 'college', 'coordinator')),
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create permissions table with all granular permissions
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  group_name text NOT NULL,
  group_order int NOT NULL DEFAULT 0,
  permission_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create custom_role_permissions junction table
CREATE TABLE public.custom_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create user_custom_roles table to assign custom roles to users
CREATE TABLE public.user_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_roles
CREATE POLICY "Admins can manage custom roles"
ON public.custom_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view custom roles"
ON public.custom_roles FOR SELECT
USING (true);

-- RLS Policies for permissions
CREATE POLICY "Anyone can view permissions"
ON public.permissions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage permissions"
ON public.permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for custom_role_permissions
CREATE POLICY "Admins can manage role permissions"
ON public.custom_role_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view role permissions"
ON public.custom_role_permissions FOR SELECT
USING (true);

-- RLS Policies for user_custom_roles
CREATE POLICY "Admins can manage user custom roles"
ON public.user_custom_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own custom roles"
ON public.user_custom_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can view user custom roles"
ON public.user_custom_roles FOR SELECT
USING (true);

-- Update timestamp trigger
CREATE TRIGGER update_custom_roles_updated_at
BEFORE UPDATE ON public.custom_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all permissions
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
-- Internship Permissions (group 1)
('internship.create', 'Create internship', 'Internship Permissions', 1, 1),
('internship.edit', 'Edit internship', 'Internship Permissions', 1, 2),
('internship.delete', 'Delete internship', 'Internship Permissions', 1, 3),
('internship.publish', 'Publish internship', 'Internship Permissions', 1, 4),
('internship.close', 'Close internship', 'Internship Permissions', 1, 5),
('internship.view_all', 'View all internships', 'Internship Permissions', 1, 6),
('internship.view_own', 'View only own internships', 'Internship Permissions', 1, 7),
-- Application Permissions (group 2)
('application.view', 'View applications', 'Application Permissions', 2, 1),
('application.shortlist', 'Shortlist students', 'Application Permissions', 2, 2),
('application.reject', 'Reject students', 'Application Permissions', 2, 3),
('application.select', 'Select students', 'Application Permissions', 2, 4),
('application.export', 'Export applications', 'Application Permissions', 2, 5),
-- Activity Permissions (group 3)
('activity.add', 'Add activity', 'Activity Permissions', 3, 1),
('activity.edit_own', 'Edit own activity', 'Activity Permissions', 3, 2),
('activity.review', 'Review activity', 'Activity Permissions', 3, 3),
('activity.mark_reviewed', 'Mark activity reviewed', 'Activity Permissions', 3, 4),
('activity.view_college', 'View college activities', 'Activity Permissions', 3, 5),
('activity.view_university', 'View university aggregated activities', 'Activity Permissions', 3, 6),
-- User Management Permissions (group 4)
('user.create', 'Create users', 'User Management Permissions', 4, 1),
('user.edit', 'Edit users', 'User Management Permissions', 4, 2),
('user.delete', 'Delete users', 'User Management Permissions', 4, 3),
('user.assign_roles', 'Assign roles', 'User Management Permissions', 4, 4),
('user.suspend', 'Suspend users', 'User Management Permissions', 4, 5),
-- Analytics Permissions (group 5)
('analytics.view_college', 'View college analytics', 'Analytics Permissions', 5, 1),
('analytics.view_university', 'View university analytics', 'Analytics Permissions', 5, 2),
('analytics.export_reports', 'Export reports', 'Analytics Permissions', 5, 3);

-- Seed Super Admin role with all permissions
INSERT INTO public.custom_roles (name, description, scope, is_system)
VALUES ('Super Admin', 'Full access to all features', 'university', true);

INSERT INTO public.custom_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.custom_roles WHERE name = 'Super Admin' AND is_system = true),
  id
FROM public.permissions;
