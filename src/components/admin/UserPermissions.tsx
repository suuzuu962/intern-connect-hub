import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Search, UserCog, Save, X, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserPermission {
  id: string;
  user_id: string;
  feature_key: string;
  is_enabled: boolean;
  settings: Record<string, unknown>;
}

interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

interface FeatureDefinition {
  key: string;
  label: string;
  description: string;
  dataFields: { key: string; label: string }[];
}

interface UserPermissionsProps {
  roleType: 'company' | 'university' | 'college_coordinator';
  features: FeatureDefinition[];
}

export const UserPermissions = ({ roleType, features }: UserPermissionsProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [changes, setChanges] = useState<Map<string, Partial<UserPermission>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleType]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    let data: User[] = [];

    if (roleType === 'company') {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, user_id, name')
        .order('name');
      
      if (!error && companies) {
        // Get profiles for emails
        const userIds = companies.map(c => c.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, avatar_url')
          .in('user_id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        data = companies.map(c => ({
          id: c.id,
          user_id: c.user_id,
          name: c.name,
          email: profileMap.get(c.user_id)?.email || '',
          avatar_url: profileMap.get(c.user_id)?.avatar_url,
        }));
      }
    } else if (roleType === 'university') {
      const { data: universities, error } = await supabase
        .from('universities')
        .select('id, user_id, name, email, logo_url')
        .order('name');
      
      if (!error && universities) {
        data = universities.map(u => ({
          id: u.id,
          user_id: u.user_id,
          name: u.name,
          email: u.email,
          avatar_url: u.logo_url,
        }));
      }
    } else if (roleType === 'college_coordinator') {
      const { data: coordinators, error } = await supabase
        .from('college_coordinators')
        .select('id, user_id, name, email')
        .order('name');
      
      if (!error && coordinators) {
        // Get profiles for avatars
        const userIds = coordinators.map(c => c.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        data = coordinators.map(c => ({
          id: c.id,
          user_id: c.user_id,
          name: c.name,
          email: c.email,
          avatar_url: profileMap.get(c.user_id)?.avatar_url,
        }));
      }
    }

    setUsers(data);
    setFilteredUsers(data);
    setLoading(false);
  };

  const fetchUserPermissions = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user permissions:', error);
    } else {
      setUserPermissions((data || []) as unknown as UserPermission[]);
    }
    setChanges(new Map());
  };

  const getPermission = (featureKey: string): UserPermission | undefined => {
    return userPermissions.find(p => p.feature_key === featureKey);
  };

  const getSettingValue = (featureKey: string, settingKey: string): boolean => {
    const perm = getPermission(featureKey);
    const change = changes.get(featureKey);
    
    if (change?.settings && settingKey in change.settings) {
      return change.settings[settingKey] as boolean;
    }
    
    return (perm?.settings?.[settingKey] as boolean) ?? false;
  };

  const isFeatureEnabled = (featureKey: string): boolean => {
    const perm = getPermission(featureKey);
    const change = changes.get(featureKey);
    
    if (change && 'is_enabled' in change) {
      return change.is_enabled!;
    }
    
    return perm?.is_enabled ?? true;
  };

  const updateFeatureToggle = (featureKey: string, enabled: boolean) => {
    const existing = changes.get(featureKey) || {};
    setChanges(new Map(changes.set(featureKey, { ...existing, is_enabled: enabled, feature_key: featureKey })));
  };

  const updateSetting = (featureKey: string, settingKey: string, value: boolean) => {
    const existing = changes.get(featureKey) || {};
    const existingSettings = existing.settings || getPermission(featureKey)?.settings || {};
    setChanges(new Map(changes.set(featureKey, {
      ...existing,
      settings: { ...existingSettings, [settingKey]: value },
      feature_key: featureKey,
    })));
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const updates = Array.from(changes.entries()).map(([featureKey, change]) => {
      const existing = getPermission(featureKey);
      
      return {
        id: existing?.id,
        user_id: selectedUser.user_id,
        feature_key: featureKey,
        is_enabled: change.is_enabled ?? existing?.is_enabled ?? true,
        settings: change.settings || existing?.settings || {},
        updated_by: user?.id,
      };
    });

    for (const update of updates) {
      if (update.id) {
        await supabase
          .from('user_permissions')
          .update({
            is_enabled: update.is_enabled,
            settings: update.settings as unknown as Record<string, never>,
            updated_by: update.updated_by,
          })
          .eq('id', update.id);
      } else {
        await supabase
          .from('user_permissions')
          .insert([{
            user_id: update.user_id,
            feature_key: update.feature_key,
            is_enabled: update.is_enabled,
            settings: update.settings as unknown as Record<string, never>,
          }]);
      }
    }

    toast({ title: 'Success', description: 'User permissions saved successfully' });
    setChanges(new Map());
    fetchUserPermissions(selectedUser.user_id);
    setSaving(false);
  };

  const hasChanges = changes.size > 0;

  const getRoleLabel = () => {
    switch (roleType) {
      case 'company': return 'Companies';
      case 'university': return 'Universities';
      case 'college_coordinator': return 'Coordinators';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Individual User Permissions - {getRoleLabel()}
        </CardTitle>
        <CardDescription>
          Override role-level permissions for specific users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Selection */}
          <div className="border rounded-lg p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No users found</div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {selectedUser?.id === user.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Permissions Editor */}
          <div className="md:col-span-2 border rounded-lg p-4">
            {!selectedUser ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Select a user to manage their permissions
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar_url || undefined} />
                      <AvatarFallback>{selectedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedUser.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null);
                        setChanges(new Map());
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasChanges || saving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                      {hasChanges && (
                        <Badge variant="secondary" className="ml-1">{changes.size}</Badge>
                      )}
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[240px]">
                  <div className="space-y-3">
                    {features.map((feature) => {
                      const enabled = isFeatureEnabled(feature.key);
                      const hasDataFields = feature.dataFields.length > 0;

                      return (
                        <div
                          key={feature.key}
                          className={`border rounded-lg p-3 ${!enabled ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{feature.label}</p>
                              <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </div>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(v) => updateFeatureToggle(feature.key, v)}
                            />
                          </div>
                          {hasDataFields && enabled && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="grid grid-cols-2 gap-2">
                                {feature.dataFields.map((field) => (
                                  <div key={field.key} className="flex items-center gap-2">
                                    <Checkbox
                                      id={`user-${selectedUser.id}-${feature.key}-${field.key}`}
                                      checked={getSettingValue(feature.key, field.key)}
                                      onCheckedChange={(v) =>
                                        updateSetting(feature.key, field.key, v as boolean)
                                      }
                                    />
                                    <label
                                      htmlFor={`user-${selectedUser.id}-${feature.key}-${field.key}`}
                                      className="text-xs cursor-pointer"
                                    >
                                      {field.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
