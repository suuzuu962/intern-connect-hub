import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, Globe, Mail, Bell, Shield, Save, Users, Building2, 
  GraduationCap, Briefcase, CreditCard, FileText, Lock, Eye,
  UserCheck, School, Network, Database, AlertTriangle, Wrench, RefreshCw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  settings: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'input' | 'number';
  value: boolean | string | number;
}

const defaultSettings: Record<string, any> = {
  // General Settings
  platformName: 'Internship Portal',
  supportEmail: 'support@example.com',
  maintenanceMode: false,
  debugMode: false,
  
  // Registration Settings
  allowNewRegistrations: true,
  requireEmailVerification: true,
  allowStudentRegistration: true,
  allowCompanyRegistration: true,
  allowUniversityRegistration: true,
  allowCoordinatorRegistration: true,
  
  // User Management
  maxApplicationsPerStudent: 10,
  maxInternshipsPerCompany: 50,
  maxCollegesPerUniversity: 100,
  maxCoordinatorsPerCollege: 5,
  sessionTimeout: 15,
  
  // Company Settings
  autoApproveCompanies: false,
  requireCompanyDocuments: true,
  allowCompanyEditing: true,
  enableCompanyRating: false,
  
  // Internship Settings
  allowInternshipPosting: true,
  requireInternshipApproval: false,
  enableApplicationDeadlines: true,
  allowRemoteInternships: true,
  allowPaidInternships: true,
  allowFreeInternships: true,
  enableStipendTracking: true,
  
  // Student Features
  enableStudentDiary: true,
  enableResumeUpload: true,
  enableProfileCustomization: true,
  enableSkillsMatching: true,
  enableInternshipRecommendations: true,
  
  // University Features
  enableUniversityDashboard: true,
  enableCollegeManagement: true,
  enableCoordinatorAssignment: true,
  enableStudentTracking: true,
  enableLoginLogs: true,
  
  // Coordinator Features
  enableDiaryApproval: true,
  enableStudentMonitoring: true,
  enableBulkOperations: false,
  
  // Payment Features
  enablePayments: true,
  enableRefunds: true,
  enableSubscriptions: true,
  paymentGateway: 'stripe',
  
  // Notification Settings
  notifyAdminOnNewCompany: true,
  notifyAdminOnNewUniversity: true,
  notifyAdminOnNewStudent: false,
  notifyOnApplicationSubmission: true,
  notifyOnApplicationStatusChange: true,
  notifyOnInternshipExpiry: true,
  enableEmailNotifications: true,
  enablePushNotifications: false,
  
  // Security Settings
  enableTwoFactorAuth: false,
  enforceStrongPasswords: true,
  enableSessionTracking: true,
  enableIPTracking: true,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  enableAuditLogs: true,
  
  // Data & Privacy
  enableDataExport: true,
  enableAccountDeletion: true,
  dataRetentionDays: 365,
  enableAnalytics: true,
  
  // API & Integration
  enableAPI: false,
  apiRateLimit: 100,
  enableWebhooks: false,

  // Social Media & Support
  socialTwitterUrl: '',
  socialInstagramUrl: '',
  socialLinkedinUrl: '',
  socialFacebookUrl: '',
  socialTelegramUrl: '',
  socialDiscordUrl: '',
  socialYoutubeUrl: '',
  supportPhone: '+91 8147 747 147',
  supportAddress: 'Shastri Nagar 1st Cross 3rd House, Bellary, Karnataka, India - 583101',
};

export const PlatformSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'all_settings')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.value) {
        setSettings({ ...defaultSettings, ...(data.value as Record<string, any>) });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'all_settings',
          value: settings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Platform settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const categories: SettingCategory[] = [
    {
      id: 'general',
      title: 'General Settings',
      icon: Globe,
      description: 'Basic platform configuration',
      settings: [
        { id: 'platformName', label: 'Platform Name', description: 'Display name of the platform', type: 'input', value: settings.platformName },
        { id: 'supportEmail', label: 'Support Email', description: 'Contact email for support', type: 'input', value: settings.supportEmail },
        { id: 'maintenanceMode', label: 'Maintenance Mode', description: 'Temporarily disable platform access for non-admins', type: 'toggle', value: settings.maintenanceMode },
        { id: 'debugMode', label: 'Debug Mode', description: 'Enable detailed logging and error messages', type: 'toggle', value: settings.debugMode },
      ]
    },
    {
      id: 'registration',
      title: 'Registration Controls',
      icon: UserCheck,
      description: 'Control user registration options',
      settings: [
        { id: 'allowNewRegistrations', label: 'Allow New Registrations', description: 'Enable new user sign-ups globally', type: 'toggle', value: settings.allowNewRegistrations },
        { id: 'requireEmailVerification', label: 'Require Email Verification', description: 'Users must verify email before access', type: 'toggle', value: settings.requireEmailVerification },
        { id: 'allowStudentRegistration', label: 'Student Registration', description: 'Allow students to register', type: 'toggle', value: settings.allowStudentRegistration },
        { id: 'allowCompanyRegistration', label: 'Company Registration', description: 'Allow companies to register', type: 'toggle', value: settings.allowCompanyRegistration },
        { id: 'allowUniversityRegistration', label: 'University Registration', description: 'Allow universities to register', type: 'toggle', value: settings.allowUniversityRegistration },
        { id: 'allowCoordinatorRegistration', label: 'Coordinator Registration', description: 'Allow coordinators to self-register', type: 'toggle', value: settings.allowCoordinatorRegistration },
      ]
    },
    {
      id: 'limits',
      title: 'User Limits',
      icon: Users,
      description: 'Set limits for various user actions',
      settings: [
        { id: 'maxApplicationsPerStudent', label: 'Max Applications/Student', description: 'Maximum internship applications per student', type: 'number', value: settings.maxApplicationsPerStudent },
        { id: 'maxInternshipsPerCompany', label: 'Max Internships/Company', description: 'Maximum active internships per company', type: 'number', value: settings.maxInternshipsPerCompany },
        { id: 'maxCollegesPerUniversity', label: 'Max Colleges/University', description: 'Maximum colleges under a university', type: 'number', value: settings.maxCollegesPerUniversity },
        { id: 'maxCoordinatorsPerCollege', label: 'Max Coordinators/College', description: 'Maximum coordinators per college', type: 'number', value: settings.maxCoordinatorsPerCollege },
        { id: 'sessionTimeout', label: 'Idle Timeout (min)', description: 'Auto logout after inactivity (minutes)', type: 'number', value: settings.sessionTimeout },
      ]
    },
    {
      id: 'company',
      title: 'Company Settings',
      icon: Building2,
      description: 'Configure company-related features',
      settings: [
        { id: 'autoApproveCompanies', label: 'Auto-Approve Companies', description: 'Skip manual verification for new companies', type: 'toggle', value: settings.autoApproveCompanies },
        { id: 'requireCompanyDocuments', label: 'Require Documents', description: 'Companies must upload documents', type: 'toggle', value: settings.requireCompanyDocuments },
        { id: 'allowCompanyEditing', label: 'Allow Profile Editing', description: 'Companies can edit their profile', type: 'toggle', value: settings.allowCompanyEditing },
        { id: 'enableCompanyRating', label: 'Enable Ratings', description: 'Allow students to rate companies', type: 'toggle', value: settings.enableCompanyRating },
      ]
    },
    {
      id: 'internship',
      title: 'Internship Settings',
      icon: Briefcase,
      description: 'Configure internship posting and management',
      settings: [
        { id: 'allowInternshipPosting', label: 'Allow Posting', description: 'Companies can post internships', type: 'toggle', value: settings.allowInternshipPosting },
        { id: 'requireInternshipApproval', label: 'Require Approval', description: 'Admin must approve internships', type: 'toggle', value: settings.requireInternshipApproval },
        { id: 'enableApplicationDeadlines', label: 'Application Deadlines', description: 'Enable deadline enforcement', type: 'toggle', value: settings.enableApplicationDeadlines },
        { id: 'allowRemoteInternships', label: 'Allow Remote', description: 'Enable remote internship option', type: 'toggle', value: settings.allowRemoteInternships },
        { id: 'allowPaidInternships', label: 'Allow Paid Internships', description: 'Enable paid internship type', type: 'toggle', value: settings.allowPaidInternships },
        { id: 'allowFreeInternships', label: 'Allow Free Internships', description: 'Enable free internship type', type: 'toggle', value: settings.allowFreeInternships },
        { id: 'enableStipendTracking', label: 'Stipend Tracking', description: 'Track stipend payments', type: 'toggle', value: settings.enableStipendTracking },
      ]
    },
    {
      id: 'student',
      title: 'Student Features',
      icon: GraduationCap,
      description: 'Configure student-related features',
      settings: [
        { id: 'enableStudentDiary', label: 'Internship Diary', description: 'Enable diary feature for students', type: 'toggle', value: settings.enableStudentDiary },
        { id: 'enableResumeUpload', label: 'Resume Upload', description: 'Allow resume uploads', type: 'toggle', value: settings.enableResumeUpload },
        { id: 'enableProfileCustomization', label: 'Profile Customization', description: 'Allow profile customization', type: 'toggle', value: settings.enableProfileCustomization },
        { id: 'enableSkillsMatching', label: 'Skills Matching', description: 'Match skills with internships', type: 'toggle', value: settings.enableSkillsMatching },
        { id: 'enableInternshipRecommendations', label: 'Recommendations', description: 'Show internship recommendations', type: 'toggle', value: settings.enableInternshipRecommendations },
      ]
    },
    {
      id: 'university',
      title: 'University Features',
      icon: School,
      description: 'Configure university dashboard features',
      settings: [
        { id: 'enableUniversityDashboard', label: 'University Dashboard', description: 'Enable university admin panel', type: 'toggle', value: settings.enableUniversityDashboard },
        { id: 'enableCollegeManagement', label: 'College Management', description: 'Manage affiliated colleges', type: 'toggle', value: settings.enableCollegeManagement },
        { id: 'enableCoordinatorAssignment', label: 'Coordinator Assignment', description: 'Assign coordinators to colleges', type: 'toggle', value: settings.enableCoordinatorAssignment },
        { id: 'enableStudentTracking', label: 'Student Tracking', description: 'Track student progress', type: 'toggle', value: settings.enableStudentTracking },
        { id: 'enableLoginLogs', label: 'Login Logs', description: 'Track user login history', type: 'toggle', value: settings.enableLoginLogs },
      ]
    },
    {
      id: 'coordinator',
      title: 'Coordinator Features',
      icon: Network,
      description: 'Configure coordinator capabilities',
      settings: [
        { id: 'enableDiaryApproval', label: 'Diary Approval', description: 'Coordinators can approve diaries', type: 'toggle', value: settings.enableDiaryApproval },
        { id: 'enableStudentMonitoring', label: 'Student Monitoring', description: 'Monitor assigned students', type: 'toggle', value: settings.enableStudentMonitoring },
        { id: 'enableBulkOperations', label: 'Bulk Operations', description: 'Allow bulk student actions', type: 'toggle', value: settings.enableBulkOperations },
      ]
    },
    {
      id: 'payments',
      title: 'Payment Settings',
      icon: CreditCard,
      description: 'Configure payment and billing features',
      settings: [
        { id: 'enablePayments', label: 'Enable Payments', description: 'Allow payment processing', type: 'toggle', value: settings.enablePayments },
        { id: 'enableRefunds', label: 'Enable Refunds', description: 'Allow refund processing', type: 'toggle', value: settings.enableRefunds },
        { id: 'enableSubscriptions', label: 'Enable Subscriptions', description: 'Allow subscription plans', type: 'toggle', value: settings.enableSubscriptions },
        { id: 'paymentGateway', label: 'Payment Gateway', description: 'Primary payment processor', type: 'input', value: settings.paymentGateway },
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: Bell,
      description: 'Configure notification preferences',
      settings: [
        { id: 'notifyAdminOnNewCompany', label: 'New Company Alert', description: 'Notify when companies register', type: 'toggle', value: settings.notifyAdminOnNewCompany },
        { id: 'notifyAdminOnNewUniversity', label: 'New University Alert', description: 'Notify when universities register', type: 'toggle', value: settings.notifyAdminOnNewUniversity },
        { id: 'notifyAdminOnNewStudent', label: 'New Student Alert', description: 'Notify when students register', type: 'toggle', value: settings.notifyAdminOnNewStudent },
        { id: 'notifyOnApplicationSubmission', label: 'Application Alerts', description: 'Notify on new applications', type: 'toggle', value: settings.notifyOnApplicationSubmission },
        { id: 'notifyOnApplicationStatusChange', label: 'Status Change Alerts', description: 'Notify on status changes', type: 'toggle', value: settings.notifyOnApplicationStatusChange },
        { id: 'notifyOnInternshipExpiry', label: 'Expiry Alerts', description: 'Notify before internship expires', type: 'toggle', value: settings.notifyOnInternshipExpiry },
        { id: 'enableEmailNotifications', label: 'Email Notifications', description: 'Send email notifications', type: 'toggle', value: settings.enableEmailNotifications },
        { id: 'enablePushNotifications', label: 'Push Notifications', description: 'Enable push notifications', type: 'toggle', value: settings.enablePushNotifications },
      ]
    },
    {
      id: 'security',
      title: 'Security Settings',
      icon: Shield,
      description: 'Configure security and access controls',
      settings: [
        { id: 'enableTwoFactorAuth', label: 'Two-Factor Auth', description: 'Enable 2FA for users', type: 'toggle', value: settings.enableTwoFactorAuth },
        { id: 'enforceStrongPasswords', label: 'Strong Passwords', description: 'Require complex passwords', type: 'toggle', value: settings.enforceStrongPasswords },
        { id: 'enableSessionTracking', label: 'Session Tracking', description: 'Track active sessions', type: 'toggle', value: settings.enableSessionTracking },
        { id: 'enableIPTracking', label: 'IP Tracking', description: 'Log user IP addresses', type: 'toggle', value: settings.enableIPTracking },
        { id: 'maxLoginAttempts', label: 'Max Login Attempts', description: 'Lock after failed attempts', type: 'number', value: settings.maxLoginAttempts },
        { id: 'lockoutDuration', label: 'Lockout Duration (min)', description: 'Account lockout time', type: 'number', value: settings.lockoutDuration },
        { id: 'enableAuditLogs', label: 'Audit Logs', description: 'Log admin actions', type: 'toggle', value: settings.enableAuditLogs },
      ]
    },
    {
      id: 'data',
      title: 'Data & Privacy',
      icon: Database,
      description: 'Configure data handling and privacy',
      settings: [
        { id: 'enableDataExport', label: 'Data Export', description: 'Allow users to export data', type: 'toggle', value: settings.enableDataExport },
        { id: 'enableAccountDeletion', label: 'Account Deletion', description: 'Allow users to delete accounts', type: 'toggle', value: settings.enableAccountDeletion },
        { id: 'dataRetentionDays', label: 'Data Retention (days)', description: 'Keep data for specified days', type: 'number', value: settings.dataRetentionDays },
        { id: 'enableAnalytics', label: 'Platform Analytics', description: 'Collect usage analytics', type: 'toggle', value: settings.enableAnalytics },
      ]
    },
    {
      id: 'api',
      title: 'API & Integrations',
      icon: Wrench,
      description: 'Configure API access and integrations',
      settings: [
        { id: 'enableAPI', label: 'Enable API', description: 'Enable public API access', type: 'toggle', value: settings.enableAPI },
        { id: 'apiRateLimit', label: 'Rate Limit (req/min)', description: 'API rate limit per minute', type: 'number', value: settings.apiRateLimit },
        { id: 'enableWebhooks', label: 'Enable Webhooks', description: 'Allow webhook integrations', type: 'toggle', value: settings.enableWebhooks },
      ]
    },
    {
      id: 'social',
      title: 'Social Media & Support',
      icon: Globe,
      description: 'Manage social media links and support contact info shown in the footer',
      settings: [
        { id: 'supportEmail', label: 'Support Email', description: 'Contact email for support', type: 'input', value: settings.supportEmail },
        { id: 'supportPhone', label: 'Support Phone', description: 'Contact phone number', type: 'input', value: settings.supportPhone },
        { id: 'supportAddress', label: 'Address', description: 'Physical office address', type: 'input', value: settings.supportAddress },
        { id: 'socialTwitterUrl', label: 'X (Twitter)', description: 'Twitter / X profile URL', type: 'input', value: settings.socialTwitterUrl },
        { id: 'socialInstagramUrl', label: 'Instagram', description: 'Instagram profile URL', type: 'input', value: settings.socialInstagramUrl },
        { id: 'socialLinkedinUrl', label: 'LinkedIn', description: 'LinkedIn page URL', type: 'input', value: settings.socialLinkedinUrl },
        { id: 'socialFacebookUrl', label: 'Facebook', description: 'Facebook page URL', type: 'input', value: settings.socialFacebookUrl },
        { id: 'socialTelegramUrl', label: 'Telegram', description: 'Telegram channel URL', type: 'input', value: settings.socialTelegramUrl },
        { id: 'socialDiscordUrl', label: 'Discord', description: 'Discord server invite URL', type: 'input', value: settings.socialDiscordUrl },
        { id: 'socialYoutubeUrl', label: 'YouTube', description: 'YouTube channel URL', type: 'input', value: settings.socialYoutubeUrl },
      ]
    },
  ];

  const renderSettingInput = (setting: SettingItem) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <Switch
            checked={settings[setting.id] as boolean}
            onCheckedChange={(checked) => updateSetting(setting.id, checked)}
          />
        );
      case 'input':
        return (
          <Input
            value={settings[setting.id] as string}
            onChange={(e) => updateSetting(setting.id, e.target.value)}
            className="max-w-[200px]"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={settings[setting.id] as number}
            onChange={(e) => updateSetting(setting.id, parseInt(e.target.value) || 0)}
            className="max-w-[100px]"
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Platform Settings
          </h2>
          <p className="text-muted-foreground">Configure global platform settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Warning */}
      {settings.maintenanceMode && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">Maintenance Mode Active</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">Only admins can access the platform. All other users will see a maintenance page.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="grid gap-6 md:grid-cols-2 pr-4">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <category.icon className="h-5 w-5 text-primary" />
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.settings.map((setting, index) => (
                  <div key={setting.id}>
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label htmlFor={setting.id} className="text-sm font-medium">
                          {setting.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                      </div>
                      {renderSettingInput(setting)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
