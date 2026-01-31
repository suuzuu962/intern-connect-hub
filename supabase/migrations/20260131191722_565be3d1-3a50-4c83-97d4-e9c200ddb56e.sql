-- Create platform_settings table for persistence
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view platform settings" 
ON public.platform_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update platform settings" 
ON public.platform_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert platform settings" 
ON public.platform_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Insert default settings
INSERT INTO public.platform_settings (key, value) VALUES 
('all_settings', '{
  "platformName": "Internship Portal",
  "supportEmail": "support@example.com",
  "maintenanceMode": false,
  "debugMode": false,
  "allowNewRegistrations": true,
  "requireEmailVerification": true,
  "allowStudentRegistration": true,
  "allowCompanyRegistration": true,
  "allowUniversityRegistration": true,
  "allowCoordinatorRegistration": true,
  "maxApplicationsPerStudent": 10,
  "maxInternshipsPerCompany": 50,
  "maxCollegesPerUniversity": 100,
  "maxCoordinatorsPerCollege": 5,
  "sessionTimeout": 30,
  "autoApproveCompanies": false,
  "requireCompanyDocuments": true,
  "allowCompanyEditing": true,
  "enableCompanyRating": false,
  "allowInternshipPosting": true,
  "requireInternshipApproval": false,
  "enableApplicationDeadlines": true,
  "allowRemoteInternships": true,
  "allowPaidInternships": true,
  "allowFreeInternships": true,
  "enableStipendTracking": true,
  "enableStudentDiary": true,
  "enableResumeUpload": true,
  "enableProfileCustomization": true,
  "enableSkillsMatching": true,
  "enableInternshipRecommendations": true,
  "enableUniversityDashboard": true,
  "enableCollegeManagement": true,
  "enableCoordinatorAssignment": true,
  "enableStudentTracking": true,
  "enableLoginLogs": true,
  "enableDiaryApproval": true,
  "enableStudentMonitoring": true,
  "enableBulkOperations": false,
  "enablePayments": true,
  "enableRefunds": true,
  "enableSubscriptions": true,
  "paymentGateway": "stripe",
  "notifyAdminOnNewCompany": true,
  "notifyAdminOnNewUniversity": true,
  "notifyAdminOnNewStudent": false,
  "notifyOnApplicationSubmission": true,
  "notifyOnApplicationStatusChange": true,
  "notifyOnInternshipExpiry": true,
  "enableEmailNotifications": true,
  "enablePushNotifications": false,
  "enableTwoFactorAuth": false,
  "enforceStrongPasswords": true,
  "enableSessionTracking": true,
  "enableIPTracking": true,
  "maxLoginAttempts": 5,
  "lockoutDuration": 15,
  "enableAuditLogs": true,
  "enableDataExport": true,
  "enableAccountDeletion": true,
  "dataRetentionDays": 365,
  "enableAnalytics": true,
  "enableAPI": false,
  "apiRateLimit": 100,
  "enableWebhooks": false
}'::jsonb);