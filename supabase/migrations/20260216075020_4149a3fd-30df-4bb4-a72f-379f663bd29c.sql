-- Expand permissions to cover all super admin and institutional workflows

-- Student Permissions (group_order: 6) — add more granular controls
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('student.edit', 'Edit student profiles', 'Student Permissions', 6, 1),
  ('student.delete', 'Delete students', 'Student Permissions', 6, 2),
  ('student.export', 'Export student data', 'Student Permissions', 6, 3),
  ('student.view_contact', 'View student contact info', 'Student Permissions', 6, 4),
  ('student.view_resume', 'View student resumes', 'Student Permissions', 6, 5)
ON CONFLICT DO NOTHING;

-- College Permissions (group_order: 7) — add more granular controls
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('college.create', 'Create colleges', 'College Permissions', 7, 1),
  ('college.edit', 'Edit college details', 'College Permissions', 7, 2),
  ('college.delete', 'Delete colleges', 'College Permissions', 7, 3),
  ('college.view', 'View colleges', 'College Permissions', 7, 4),
  ('college.assign_coordinator', 'Assign coordinators to colleges', 'College Permissions', 7, 5)
ON CONFLICT DO NOTHING;

-- Coordinator Permissions (group_order: 8) — add more granular controls
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('coordinator.create', 'Create coordinator accounts', 'Coordinator Permissions', 8, 1),
  ('coordinator.edit', 'Edit coordinator profiles', 'Coordinator Permissions', 8, 2),
  ('coordinator.delete', 'Delete coordinators', 'Coordinator Permissions', 8, 3),
  ('coordinator.approve', 'Approve coordinator accounts', 'Coordinator Permissions', 8, 4),
  ('coordinator.suspend', 'Suspend coordinators', 'Coordinator Permissions', 8, 5)
ON CONFLICT DO NOTHING;

-- Dashboard & Navigation (group_order: 9)
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('dashboard.view_overview', 'View dashboard overview', 'Dashboard Permissions', 9, 0),
  ('dashboard.view_org_chart', 'View organization chart', 'Dashboard Permissions', 9, 1),
  ('dashboard.view_login_logs', 'View login logs', 'Dashboard Permissions', 9, 2),
  ('dashboard.view_profile', 'View and edit own profile', 'Dashboard Permissions', 9, 3)
ON CONFLICT DO NOTHING;

-- Diary / Activity Management (group_order: 10)
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('diary.view', 'View diary entries', 'Diary Permissions', 10, 0),
  ('diary.approve', 'Approve diary entries', 'Diary Permissions', 10, 1),
  ('diary.reject', 'Reject diary entries', 'Diary Permissions', 10, 2),
  ('diary.add_remarks', 'Add coordinator remarks', 'Diary Permissions', 10, 3),
  ('diary.export', 'Export diary reports', 'Diary Permissions', 10, 4)
ON CONFLICT DO NOTHING;

-- Company Management (group_order: 11)
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('company.view', 'View company profiles', 'Company Permissions', 11, 0),
  ('company.approve', 'Approve company registrations', 'Company Permissions', 11, 1),
  ('company.reject', 'Reject company registrations', 'Company Permissions', 11, 2),
  ('company.edit', 'Edit company details', 'Company Permissions', 11, 3),
  ('company.delete', 'Delete companies', 'Company Permissions', 11, 4),
  ('company.set_limits', 'Set company posting limits', 'Company Permissions', 11, 5)
ON CONFLICT DO NOTHING;

-- University Management (group_order: 12)
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('university.view', 'View university profiles', 'University Permissions', 12, 0),
  ('university.edit', 'Edit university details', 'University Permissions', 12, 1),
  ('university.verify', 'Verify universities', 'University Permissions', 12, 2),
  ('university.suspend', 'Suspend universities', 'University Permissions', 12, 3),
  ('university.manage_users', 'Manage university sub-users', 'University Permissions', 12, 4)
ON CONFLICT DO NOTHING;

-- Notification & Communication (group_order: 13)
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('notification.send', 'Send notifications', 'Notification Permissions', 13, 0),
  ('notification.send_bulk', 'Send bulk notifications', 'Notification Permissions', 13, 1),
  ('notification.manage', 'Manage notification settings', 'Notification Permissions', 13, 2)
ON CONFLICT DO NOTHING;

-- Platform Administration (group_order: 14)
INSERT INTO public.permissions (key, label, group_name, group_order, permission_order) VALUES
  ('platform.view_settings', 'View platform settings', 'Platform Administration', 14, 0),
  ('platform.edit_settings', 'Edit platform settings', 'Platform Administration', 14, 1),
  ('platform.manage_banners', 'Manage advertisement banners', 'Platform Administration', 14, 2),
  ('platform.view_payments', 'View payment transactions', 'Platform Administration', 14, 3),
  ('platform.manage_payments', 'Manage payment transactions', 'Platform Administration', 14, 4),
  ('platform.view_security_logs', 'View security & audit logs', 'Platform Administration', 14, 5),
  ('platform.manage_admins', 'Manage admin accounts', 'Platform Administration', 14, 6),
  ('platform.manage_roles', 'Manage RBAC roles & permissions', 'Platform Administration', 14, 7),
  ('platform.export_data', 'Export platform data & reports', 'Platform Administration', 14, 8)
ON CONFLICT DO NOTHING;