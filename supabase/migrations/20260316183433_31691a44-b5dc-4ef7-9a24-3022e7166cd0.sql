
-- Seed default feature access configs for all roles
-- Each role gets features: some locked (upgrade required), one unlocked (default free)

INSERT INTO public.feature_access_config (role, feature_key, feature_label, is_locked, upgrade_message)
VALUES
  -- Student: 1 free, rest locked
  ('student', 'student_overview', 'Student Overview', false, null),
  ('student', 'resume_analysis', 'AI Resume Analysis', true, 'Upgrade to get AI-powered resume feedback and suggestions.'),
  ('student', 'internship_recommendations', 'Smart Internship Recommendations', true, 'Upgrade for personalized internship matches based on your profile.'),
  ('student', 'career_chatbot', 'AI Career Chatbot', true, 'Upgrade to access the AI career guidance chatbot.'),

  -- Company: 1 free, rest locked
  ('company', 'company_overview', 'Company Overview', false, null),
  ('company', 'company_analytics', 'Company Analytics Dashboard', true, 'Upgrade to access detailed analytics and insights.'),
  ('company', 'application_funnel', 'Application Funnel', true, 'Upgrade to visualize your application pipeline.'),
  ('company', 'shortlist_tool', 'Shortlist Tool', true, 'Upgrade to use advanced shortlisting and filtering.'),
  ('company', 'bulk_messaging', 'Bulk Messaging', true, 'Upgrade to send bulk messages to applicants.'),

  -- University: 1 free, rest locked
  ('university', 'university_overview', 'University Overview', false, null),
  ('university', 'university_analytics', 'University Analytics', true, 'Upgrade to access comprehensive university analytics.'),
  ('university', 'university_login_logs', 'Login Activity Logs', true, 'Upgrade to monitor login activity across your institution.'),

  -- Coordinator: 1 free, rest locked
  ('coordinator', 'coordinator_overview', 'Coordinator Overview', false, null),
  ('coordinator', 'attendance_tracker', 'Attendance Tracker', true, 'Upgrade to access the student attendance tracking system.'),
  ('coordinator', 'diary_approval', 'Diary Approval', true, 'Upgrade to review and approve student internship diaries.')
ON CONFLICT DO NOTHING;
