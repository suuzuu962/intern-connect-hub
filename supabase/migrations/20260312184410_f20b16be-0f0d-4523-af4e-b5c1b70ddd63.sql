
-- Plugins table: stores all plugin configurations
CREATE TABLE public.plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text NOT NULL DEFAULT 'integration',
  icon text DEFAULT 'plug',
  is_enabled boolean NOT NULL DEFAULT false,
  is_installed boolean NOT NULL DEFAULT true,
  version text DEFAULT '1.0.0',
  config jsonb DEFAULT '{}'::jsonb,
  allowed_roles text[] DEFAULT '{}'::text[],
  webhook_url text,
  webhook_events text[] DEFAULT '{}'::text[],
  api_key_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  installed_by uuid,
  CONSTRAINT valid_category CHECK (category IN ('integration', 'feature_toggle', 'addon', 'webhook'))
);

-- Plugin usage logs
CREATE TABLE public.plugin_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid REFERENCES public.plugins(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS for plugins: only admins can manage, authenticated can read enabled
CREATE POLICY "Admins can manage all plugins" ON public.plugins FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view enabled plugins" ON public.plugins FOR SELECT TO authenticated
  USING (is_enabled = true);

-- RLS for plugin usage logs
CREATE POLICY "Admins can manage plugin logs" ON public.plugin_usage_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert plugin logs" ON public.plugin_usage_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Updated at trigger
CREATE TRIGGER update_plugins_updated_at BEFORE UPDATE ON public.plugins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default plugins
INSERT INTO public.plugins (name, slug, description, category, icon, is_enabled, config, allowed_roles) VALUES
  ('Google Analytics', 'google-analytics', 'Track website traffic and user behavior with Google Analytics integration.', 'integration', 'bar-chart', false, '{"tracking_id": "", "enable_demographics": false}'::jsonb, '{admin}'),
  ('Payment Gateway', 'payment-gateway', 'Process payments via Razorpay/Stripe for paid internships and subscriptions.', 'integration', 'credit-card', false, '{"provider": "razorpay", "mode": "test", "key_id": ""}'::jsonb, '{admin,company}'),
  ('Email Service', 'email-service', 'Send transactional emails via SendGrid, Mailgun, or SMTP.', 'integration', 'mail', false, '{"provider": "sendgrid", "api_key": "", "from_email": ""}'::jsonb, '{admin}'),
  ('SMS Notifications', 'sms-notifications', 'Send SMS alerts to users via Twilio or MSG91.', 'integration', 'smartphone', false, '{"provider": "twilio", "account_sid": "", "auth_token": "", "from_number": ""}'::jsonb, '{admin}'),
  ('Internship Diary', 'internship-diary', 'Allow students to maintain daily internship logs approved by coordinators.', 'feature_toggle', 'book-open', true, '{}'::jsonb, '{student,college_coordinator,admin}'),
  ('Career Chatbot', 'career-chatbot', 'AI-powered career guidance chatbot for students.', 'feature_toggle', 'bot', true, '{}'::jsonb, '{student,admin}'),
  ('Resume Analysis', 'resume-analysis', 'AI-powered resume scoring and improvement suggestions.', 'feature_toggle', 'file-search', true, '{}'::jsonb, '{student,admin}'),
  ('Attendance Tracker', 'attendance-tracker', 'Track student attendance for institutional internship programs.', 'feature_toggle', 'calendar-check', true, '{}'::jsonb, '{college_coordinator,admin}'),
  ('Bulk Messaging', 'bulk-messaging', 'Allow companies to send bulk messages to applicants.', 'feature_toggle', 'mail-plus', true, '{}'::jsonb, '{company,admin}'),
  ('Advanced Analytics', 'advanced-analytics', 'Enhanced analytics dashboard with custom date ranges and drill-downs.', 'addon', 'trending-up', false, '{"retention_days": 90}'::jsonb, '{admin,university,company}'),
  ('Custom Reports', 'custom-reports', 'Build and schedule custom data reports with CSV export.', 'addon', 'file-bar-chart', true, '{}'::jsonb, '{admin}'),
  ('Institutional Memos', 'institutional-memos', 'Internal communication system between universities, colleges, and coordinators.', 'addon', 'file-text', true, '{}'::jsonb, '{university,college_coordinator,admin}'),
  ('Application Webhook', 'application-webhook', 'Trigger webhooks when internship applications are submitted or updated.', 'webhook', 'webhook', false, '{"events": ["application.created", "application.updated", "application.status_changed"]}'::jsonb, '{admin,company}'),
  ('Company Approval Webhook', 'company-approval-webhook', 'Notify external systems when companies are approved or rejected.', 'webhook', 'webhook', false, '{"events": ["company.approved", "company.rejected"]}'::jsonb, '{admin}');
