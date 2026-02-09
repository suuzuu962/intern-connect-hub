import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Shield, Users, Building2, GraduationCap, UserCheck, Save, RefreshCw } from 'lucide-react';
import { UserPermissions } from './UserPermissions';
import { BulkUserPermissions } from './BulkUserPermissions';

interface Permission {
  id: string;
  role: string;
  feature_key: string;
  is_enabled: boolean;
  visible_fields: string[];
  hidden_fields: string[];
  settings: Record<string, unknown>;
}

const ROLES = [
  { value: 'student', label: 'Students', icon: Users, color: 'text-blue-500' },
  { value: 'company', label: 'Companies', icon: Building2, color: 'text-green-500' },
  { value: 'university', label: 'Universities', icon: GraduationCap, color: 'text-purple-500' },
  { value: 'college_coordinator', label: 'Coordinators', icon: UserCheck, color: 'text-orange-500' },
];

const FEATURE_DEFINITIONS = {
  student: [
    {
      key: 'view_internships',
      label: 'View Internships',
      description: 'Access to browse and view internship listings',
      dataFields: [
        { key: 'show_salary', label: 'Show Salary/Stipend' },
        { key: 'show_company_contact', label: 'Show Company Contact Info' },
        { key: 'show_application_count', label: 'Show Application Count' },
      ],
    },
    {
      key: 'apply_internships',
      label: 'Apply for Internships',
      description: 'Ability to submit applications',
      dataFields: [],
    },
    {
      key: 'view_companies',
      label: 'View Companies',
      description: 'Access to company profiles',
      dataFields: [
        { key: 'show_contact_info', label: 'Show Contact Information' },
        { key: 'show_employee_count', label: 'Show Employee Count' },
      ],
    },
    {
      key: 'diary_entries',
      label: 'Internship Diary',
      description: 'Create and manage diary entries',
      dataFields: [],
    },
  ],
  company: [
    {
      key: 'post_internships',
      label: 'Post Internships',
      description: 'Create and manage internship listings',
      dataFields: [
        { key: 'unlimited_posts', label: 'Unlimited Posts' },
        { key: 'featured_listing', label: 'Featured Listing Access' },
      ],
    },
    {
      key: 'view_applications',
      label: 'View Applications',
      description: 'Access to student applications',
      dataFields: [
        { key: 'show_student_contact', label: 'Show Student Contact' },
        { key: 'show_resume', label: 'Show Resume' },
        { key: 'show_cover_letter', label: 'Show Cover Letter' },
      ],
    },
    {
      key: 'view_students',
      label: 'Browse Students',
      description: 'Search and view student profiles',
      dataFields: [
        { key: 'show_email', label: 'Show Email Address' },
        { key: 'show_phone', label: 'Show Phone Number' },
        { key: 'show_address', label: 'Show Address' },
      ],
    },
  ],
  university: [
    {
      key: 'view_students',
      label: 'View Students',
      description: 'Access to student information',
      dataFields: [
        { key: 'show_full_profile', label: 'Show Full Profile' },
        { key: 'show_applications', label: 'Show Application History' },
      ],
    },
    {
      key: 'manage_colleges',
      label: 'Manage Colleges',
      description: 'Add and manage affiliated colleges',
      dataFields: [],
    },
    {
      key: 'view_coordinators',
      label: 'View Coordinators',
      description: 'Access coordinator information',
      dataFields: [],
    },
  ],
  college_coordinator: [
    {
      key: 'view_students',
      label: 'View Students',
      description: 'Access to college student information',
      dataFields: [
        { key: 'show_full_profile', label: 'Show Full Profile' },
        { key: 'show_personal_info', label: 'Show Personal Information' },
      ],
    },
    {
      key: 'approve_diary',
      label: 'Approve Diary Entries',
      description: 'Review and approve student diary entries',
      dataFields: [],
    },
    {
      key: 'view_internships',
      label: 'View Internships',
      description: 'Access to internship listings',
      dataFields: [],
    },
  ],
};

export const RolePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState('student');
  const [changes, setChanges] = useState<Map<string, Partial<Permission>>>(new Map());

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch permissions', variant: 'destructive' });
    } else {
      setPermissions((data || []) as unknown as Permission[]);
    }
    setLoading(false);
  };

  const getPermission = (role: string, featureKey: string): Permission | undefined => {
    return permissions.find(p => p.role === role && p.feature_key === featureKey);
  };

  const getSettingValue = (role: string, featureKey: string, settingKey: string): boolean => {
    const perm = getPermission(role, featureKey);
    const change = changes.get(`${role}-${featureKey}`);
    
    if (change?.settings && settingKey in change.settings) {
      return change.settings[settingKey] as boolean;
    }
    
    return (perm?.settings?.[settingKey] as boolean) ?? false;
  };

  const isFeatureEnabled = (role: string, featureKey: string): boolean => {
    const perm = getPermission(role, featureKey);
    const change = changes.get(`${role}-${featureKey}`);
    
    if (change && 'is_enabled' in change) {
      return change.is_enabled!;
    }
    
    return perm?.is_enabled ?? true;
  };

  const updateFeatureToggle = (role: string, featureKey: string, enabled: boolean) => {
    const key = `${role}-${featureKey}`;
    const existing = changes.get(key) || {};
    setChanges(new Map(changes.set(key, { ...existing, is_enabled: enabled, role, feature_key: featureKey })));
  };

  const updateSetting = (role: string, featureKey: string, settingKey: string, value: boolean) => {
    const key = `${role}-${featureKey}`;
    const existing = changes.get(key) || {};
    const existingSettings = existing.settings || getPermission(role, featureKey)?.settings || {};
    setChanges(new Map(changes.set(key, {
      ...existing,
      settings: { ...existingSettings, [settingKey]: value },
      role,
      feature_key: featureKey,
    })));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const updates = Array.from(changes.entries()).map(([key, change]) => {
      const [role, feature_key] = key.split('-');
      const existing = getPermission(role, feature_key);
      
      return {
        id: existing?.id,
        role: change.role || role,
        feature_key: change.feature_key || feature_key,
        is_enabled: change.is_enabled ?? existing?.is_enabled ?? true,
        settings: change.settings || existing?.settings || {},
        updated_by: user?.id,
      };
    });

    for (const update of updates) {
      if (update.id) {
        await supabase
          .from('role_permissions')
          .update({
            is_enabled: update.is_enabled,
            settings: update.settings as unknown as Record<string, never>,
            updated_by: update.updated_by,
          })
          .eq('id', update.id);
      } else {
        await supabase
          .from('role_permissions')
          .insert([{
            role: update.role,
            feature_key: update.feature_key,
            is_enabled: update.is_enabled,
            settings: update.settings as unknown as Record<string, never>,
          }]);
      }
    }

    toast({ title: 'Success', description: 'Permissions saved successfully' });
    setChanges(new Map());
    fetchPermissions();
    setSaving(false);
  };

  const hasChanges = changes.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Role Permissions
          </h2>
          <p className="text-muted-foreground">Control feature access and data visibility per role</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPermissions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
            {hasChanges && (
              <Badge variant="secondary" className="ml-2">{changes.size}</Badge>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeRole} onValueChange={setActiveRole}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          {ROLES.map(role => (
            <TabsTrigger key={role.value} value={role.value} className="flex items-center gap-2">
              <role.icon className={`h-4 w-4 ${role.color}`} />
              <span className="hidden sm:inline">{role.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {ROLES.map(role => (
          <TabsContent key={role.value} value={role.value} className="mt-6">
            <div className="grid gap-4">
              {FEATURE_DEFINITIONS[role.value as keyof typeof FEATURE_DEFINITIONS]?.map(feature => {
                const enabled = isFeatureEnabled(role.value, feature.key);
                const hasDataFields = feature.dataFields.length > 0;

                return (
                  <Card key={feature.key} className={!enabled ? 'opacity-60' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{feature.label}</CardTitle>
                          <CardDescription>{feature.description}</CardDescription>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(v) => updateFeatureToggle(role.value, feature.key, v)}
                        />
                      </div>
                    </CardHeader>
                    {hasDataFields && enabled && (
                      <CardContent>
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium mb-3">Data Visibility Settings</p>
                          <div className="grid grid-cols-2 gap-3">
                            {feature.dataFields.map(field => (
                              <div key={field.key} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${role.value}-${feature.key}-${field.key}`}
                                  checked={getSettingValue(role.value, feature.key, field.key)}
                                  onCheckedChange={(v) => 
                                    updateSetting(role.value, feature.key, field.key, v as boolean)
                                  }
                                />
                                <label
                                  htmlFor={`${role.value}-${feature.key}-${field.key}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {field.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Individual User Permissions for Company, University, and Coordinator */}
            {(role.value === 'company' || role.value === 'university' || role.value === 'college_coordinator') && (
              <>
                <UserPermissions
                  roleType={role.value}
                  features={FEATURE_DEFINITIONS[role.value as keyof typeof FEATURE_DEFINITIONS] || []}
                />
                <BulkUserPermissions
                  roleType={role.value}
                  features={FEATURE_DEFINITIONS[role.value as keyof typeof FEATURE_DEFINITIONS] || []}
                />
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permissions Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {ROLES.map(role => {
              const features = FEATURE_DEFINITIONS[role.value as keyof typeof FEATURE_DEFINITIONS] || [];
              const enabledCount = features.filter(f => isFeatureEnabled(role.value, f.key)).length;
              
              return (
                <div key={role.value} className="text-center p-4 rounded-lg bg-muted/50">
                  <role.icon className={`h-8 w-8 mx-auto mb-2 ${role.color}`} />
                  <p className="font-medium">{role.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {enabledCount}/{features.length} features enabled
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
