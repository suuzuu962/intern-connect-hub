-- Add semantic permission keys for university dashboard features
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('student.view', 'View students', 'Student Permissions', 6, 0),
  ('college.manage', 'Manage colleges', 'College Permissions', 7, 0),
  ('coordinator.view', 'View coordinators', 'Coordinator Permissions', 8, 0)
ON CONFLICT DO NOTHING;