
-- Insert default role templates
INSERT INTO public.custom_roles (name, description, scope, is_system) VALUES
('College Admin', 'Full administrative access for college management including students, coordinators, and activities', 'college', true),
('Coordinator Viewer', 'Read-only access to view students, activities, and college analytics', 'coordinator', true),
('Report Manager', 'Access to analytics, reports, and data export features', 'university', true);

-- Assign permissions to College Admin (broad college-level access)
INSERT INTO public.custom_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.custom_roles WHERE name = 'College Admin' AND is_system = true),
  id
FROM public.permissions
WHERE key IN (
  'internship.view_all',
  'internship.view_own',
  'application.view',
  'application.shortlist',
  'application.reject',
  'application.select',
  'application.export',
  'activity.add',
  'activity.edit_own',
  'activity.review',
  'activity.mark_reviewed',
  'activity.view_college',
  'user.create',
  'user.edit',
  'user.assign_roles',
  'analytics.view_college',
  'analytics.export_reports'
);

-- Assign permissions to Coordinator Viewer (read-only)
INSERT INTO public.custom_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.custom_roles WHERE name = 'Coordinator Viewer' AND is_system = true),
  id
FROM public.permissions
WHERE key IN (
  'internship.view_all',
  'internship.view_own',
  'application.view',
  'activity.view_college',
  'analytics.view_college'
);

-- Assign permissions to Report Manager (analytics + export)
INSERT INTO public.custom_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.custom_roles WHERE name = 'Report Manager' AND is_system = true),
  id
FROM public.permissions
WHERE key IN (
  'internship.view_all',
  'application.view',
  'application.export',
  'activity.view_college',
  'activity.view_university',
  'analytics.view_college',
  'analytics.view_university',
  'analytics.export_reports'
);
