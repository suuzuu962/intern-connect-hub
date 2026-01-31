import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Globe, Mail, Bell, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

export const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'Internship Portal',
    supportEmail: 'support@example.com',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    maxApplicationsPerStudent: 10,
    autoApproveCompanies: false,
    notifyAdminOnNewCompany: true,
    notifyAdminOnNewUniversity: true,
  });

  const handleSave = () => {
    toast.success('Platform settings saved successfully');
  };

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
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable platform access</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Registration Settings
            </CardTitle>
            <CardDescription>Control user registration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow New Registrations</Label>
                <p className="text-sm text-muted-foreground">Enable new user sign-ups</p>
              </div>
              <Switch
                checked={settings.allowNewRegistrations}
                onCheckedChange={(checked) => setSettings({ ...settings, allowNewRegistrations: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">Users must verify email</p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="maxApplications">Max Applications Per Student</Label>
              <Input
                id="maxApplications"
                type="number"
                value={settings.maxApplicationsPerStudent}
                onChange={(e) => setSettings({ ...settings, maxApplicationsPerStudent: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Approval Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Approval Settings
            </CardTitle>
            <CardDescription>Configure approval workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Approve Companies</Label>
                <p className="text-sm text-muted-foreground">Skip manual company verification</p>
              </div>
              <Switch
                checked={settings.autoApproveCompanies}
                onCheckedChange={(checked) => setSettings({ ...settings, autoApproveCompanies: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Admin Notifications
            </CardTitle>
            <CardDescription>Configure admin notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>New Company Registration</Label>
                <p className="text-sm text-muted-foreground">Notify when companies register</p>
              </div>
              <Switch
                checked={settings.notifyAdminOnNewCompany}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyAdminOnNewCompany: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>New University Registration</Label>
                <p className="text-sm text-muted-foreground">Notify when universities register</p>
              </div>
              <Switch
                checked={settings.notifyAdminOnNewUniversity}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyAdminOnNewUniversity: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
