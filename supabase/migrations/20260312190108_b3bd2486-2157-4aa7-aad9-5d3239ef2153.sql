
-- Webhook delivery logs table
CREATE TABLE public.webhook_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  webhook_url text NOT NULL,
  request_payload jsonb DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhook delivery logs"
  ON public.webhook_delivery_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_webhook_delivery_logs_plugin_id ON public.webhook_delivery_logs(plugin_id);
CREATE INDEX idx_webhook_delivery_logs_created_at ON public.webhook_delivery_logs(created_at DESC);

-- Seed default feature toggle plugins for Career Chatbot and Resume Analysis
INSERT INTO public.plugins (name, slug, description, category, icon, is_enabled, allowed_roles)
VALUES
  ('Career Chatbot', 'career-chatbot', 'AI-powered career advisor chatbot for students', 'feature_toggle', 'bot', true, ARRAY['student']),
  ('Resume Analysis', 'resume-analysis', 'AI-powered profile and resume analysis tool', 'feature_toggle', 'file-search', true, ARRAY['student'])
ON CONFLICT DO NOTHING;
