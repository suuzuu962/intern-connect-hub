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
import { Search, UsersRound, Save, X, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface BulkUserPermissionsProps {
  roleType: 'company' | 'university' | 'college_coordinator';
  features: FeatureDefinition[];
}

export const BulkUserPermissions = ({ roleType, features }: BulkUserPermissionsProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkPermissions, setBulkPermissions] = useState<
    Map<string, { is_enabled: boolean; settings: Record<string, boolean> }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleType]);

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
        const userIds = companies.map((c) => c.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        data = companies.map((c) => ({
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
        data = universities.map((u) => ({
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
        const userIds = coordinators.map((c) => c.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        data = coordinators.map((c) => ({
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

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedUserIds(new Set(filteredUsers.map((u) => u.user_id)));
  };

  const deselectAll = () => {
    setSelectedUserIds(new Set());
  };

  const updateBulkFeatureToggle = (featureKey: string, enabled: boolean) => {
    setBulkPermissions((prev) => {
      const next = new Map(prev);
      const existing = next.get(featureKey) || { is_enabled: true, settings: {} };
      next.set(featureKey, { ...existing, is_enabled: enabled });
      return next;
    });
  };

  const updateBulkSetting = (featureKey: string, settingKey: string, value: boolean) => {
    setBulkPermissions((prev) => {
      const next = new Map(prev);
      const existing = next.get(featureKey) || { is_enabled: true, settings: {} };
      next.set(featureKey, {
        ...existing,
        settings: { ...existing.settings, [settingKey]: value },
      });
      return next;
    });
  };

  const getBulkFeatureEnabled = (featureKey: string): boolean => {
    return bulkPermissions.get(featureKey)?.is_enabled ?? true;
  };

  const getBulkSettingValue = (featureKey: string, settingKey: string): boolean => {
    return bulkPermissions.get(featureKey)?.settings?.[settingKey] ?? false;
  };

  const handleBulkApply = async () => {
    if (selectedUserIds.size === 0) {
      toast({ title: 'No users selected', description: 'Please select at least one user', variant: 'destructive' });
      return;
    }
    if (bulkPermissions.size === 0) {
      toast({ title: 'No permissions configured', description: 'Please configure at least one permission override', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUserIds) {
      for (const [featureKey, perm] of bulkPermissions) {
        // Check if a record already exists
        const { data: existing } = await supabase
          .from('user_permissions')
          .select('id')
          .eq('user_id', userId)
          .eq('feature_key', featureKey)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('user_permissions')
            .update({
              is_enabled: perm.is_enabled,
              settings: perm.settings as unknown as Record<string, never>,
              updated_by: user?.id,
            })
            .eq('id', existing.id);

          if (error) errorCount++;
          else successCount++;
        } else {
          const { error } = await supabase.from('user_permissions').insert([
            {
              user_id: userId,
              feature_key: featureKey,
              is_enabled: perm.is_enabled,
              settings: perm.settings as unknown as Record<string, never>,
            },
          ]);

          if (error) errorCount++;
          else successCount++;
        }
      }
    }

    if (errorCount > 0) {
      toast({
        title: 'Partial Success',
        description: `${successCount} overrides applied, ${errorCount} failed`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Applied ${bulkPermissions.size} permission override(s) to ${selectedUserIds.size} user(s)`,
      });
    }

    setSelectedUserIds(new Set());
    setBulkPermissions(new Map());
    setSaving(false);
  };

  const hasSelections = selectedUserIds.size > 0;
  const hasPermissionChanges = bulkPermissions.size > 0;

  const getRoleLabel = () => {
    switch (roleType) {
      case 'company':
        return 'Companies';
      case 'university':
        return 'Universities';
      case 'college_coordinator':
        return 'Coordinators';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          <UsersRound className="h-5 w-5" />
          Bulk Permission Management - {getRoleLabel()}
        </CardTitle>
        <CardDescription>
          Select multiple users and apply permission overrides to all of them at once.
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Selection with multi-select */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Select Users</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7 px-2">
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7 px-2">
                    None
                  </Button>
                </div>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {hasSelections && (
                <div className="mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {selectedUserIds.size} selected
                  </Badge>
                </div>
              )}
              <ScrollArea className="h-[300px]">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No users found</div>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUserIds.has(user.user_id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleUser(user.user_id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleUser(user.user_id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Bulk Permissions Editor */}
            <div className="md:col-span-2 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Configure Permissions</p>
                  <p className="text-xs text-muted-foreground">
                    Toggle features below, then apply to all selected users.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUserIds(new Set());
                      setBulkPermissions(new Map());
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        disabled={!hasSelections || !hasPermissionChanges || saving}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {saving ? 'Applying...' : 'Apply to All'}
                        {hasSelections && hasPermissionChanges && (
                          <Badge variant="secondary" className="ml-1">
                            {selectedUserIds.size}
                          </Badge>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Apply Bulk Permissions?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will apply {bulkPermissions.size} permission override(s) to{' '}
                          <span className="font-semibold">{selectedUserIds.size} user(s)</span>. Existing
                          overrides for the same features will be updated. This action cannot be easily
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkApply}>
                          Apply Permissions
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <ScrollArea className="h-[320px]">
                <div className="space-y-3">
                  {features.map((feature) => {
                    const enabled = getBulkFeatureEnabled(feature.key);
                    const hasDataFields = feature.dataFields.length > 0;
                    const isModified = bulkPermissions.has(feature.key);

                    return (
                      <div
                        key={feature.key}
                        className={`border rounded-lg p-3 ${!enabled ? 'opacity-60' : ''} ${
                          isModified ? 'border-primary/50 bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-sm">{feature.label}</p>
                              <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </div>
                            {isModified && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                Modified
                              </Badge>
                            )}
                          </div>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(v) => updateBulkFeatureToggle(feature.key, v)}
                          />
                        </div>
                        {hasDataFields && enabled && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="grid grid-cols-2 gap-2">
                              {feature.dataFields.map((field) => (
                                <div key={field.key} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`bulk-${roleType}-${feature.key}-${field.key}`}
                                    checked={getBulkSettingValue(feature.key, field.key)}
                                    onCheckedChange={(v) =>
                                      updateBulkSetting(feature.key, field.key, v as boolean)
                                    }
                                  />
                                  <label
                                    htmlFor={`bulk-${roleType}-${feature.key}-${field.key}`}
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
          </div>
        </CardContent>
      )}
    </Card>
  );
};
