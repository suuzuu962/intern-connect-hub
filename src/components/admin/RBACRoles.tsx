import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Shield, Loader2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logRBACAction } from '@/lib/rbac-audit';

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  is_system: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  key: string;
  label: string;
  group_name: string;
  group_order: number;
  permission_order: number;
}

interface RolePermission {
  permission_id: string;
}

export const RBACRoles = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomRole | null>(null);
  const [editRole, setEditRole] = useState<CustomRole | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formScope, setFormScope] = useState('university');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rolesRes, permsRes] = await Promise.all([
      supabase.from('custom_roles').select('*').order('created_at'),
      supabase.from('permissions').select('*').order('group_order').order('permission_order'),
    ]);

    if (rolesRes.data) setRoles(rolesRes.data as unknown as CustomRole[]);
    if (permsRes.data) setPermissions(permsRes.data as unknown as Permission[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchRolePermissions = useCallback(async (roleId: string) => {
    const { data } = await supabase
      .from('custom_role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);

    if (data) {
      setRolePermissions(new Set((data as unknown as RolePermission[]).map(rp => rp.permission_id)));
    }
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    } else {
      setRolePermissions(new Set());
    }
  }, [selectedRole, fetchRolePermissions]);

  const handleSelectRole = (role: CustomRole) => {
    setSelectedRole(role);
  };

  const openAddDialog = () => {
    setEditRole(null);
    setFormName('');
    setFormDescription('');
    setFormScope('university');
    setShowDialog(true);
  };

  const openEditDialog = (role: CustomRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditRole(role);
    setFormName(role.name);
    setFormDescription(role.description || '');
    setFormScope(role.scope);
    setShowDialog(true);
  };

  const handleSaveRole = async () => {
    if (!formName.trim()) {
      toast({ title: 'Error', description: 'Role name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (editRole) {
      const { error } = await supabase
        .from('custom_roles')
        .update({ name: formName, description: formDescription || null, scope: formScope })
        .eq('id', editRole.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Role updated' });
        logRBACAction({ action: 'role_updated', entityType: 'custom_role', entityId: editRole.id, entityName: formName, details: { scope: formScope } });
        if (selectedRole?.id === editRole.id) {
          setSelectedRole({ ...editRole, name: formName, description: formDescription, scope: formScope });
        }
      }
    } else {
      const { error } = await supabase
        .from('custom_roles')
        .insert({ name: formName, description: formDescription || null, scope: formScope, created_by: user?.id });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Role created' });
        logRBACAction({ action: 'role_created', entityType: 'custom_role', entityName: formName, details: { scope: formScope } });
      }
    }

    setShowDialog(false);
    setSaving(false);
    fetchData();
  };

  const confirmDelete = (role: CustomRole, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role.is_system) {
      toast({ title: 'Error', description: 'System roles cannot be deleted', variant: 'destructive' });
      return;
    }
    setDeleteTarget(role);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('custom_roles').delete().eq('id', deleteTarget.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Role deleted' });
      logRBACAction({ action: 'role_deleted', entityType: 'custom_role', entityId: deleteTarget.id, entityName: deleteTarget.name });
      if (selectedRole?.id === deleteTarget.id) setSelectedRole(null);
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
    fetchData();
  };

  const togglePermission = async (permissionId: string) => {
    if (!selectedRole) return;

    const hasPermission = rolePermissions.has(permissionId);
    const newSet = new Set(rolePermissions);
    const perm = permissions.find(p => p.id === permissionId);

    if (hasPermission) {
      const { error } = await supabase
        .from('custom_role_permissions')
        .delete()
        .eq('role_id', selectedRole.id)
        .eq('permission_id', permissionId);
      if (!error) {
        newSet.delete(permissionId);
        logRBACAction({ action: 'permission_revoked', entityType: 'custom_role_permission', entityId: selectedRole.id, entityName: selectedRole.name, details: { permission: perm?.key } });
      }
    } else {
      const { error } = await supabase
        .from('custom_role_permissions')
        .insert({ role_id: selectedRole.id, permission_id: permissionId });
      if (!error) {
        newSet.add(permissionId);
        logRBACAction({ action: 'permission_granted', entityType: 'custom_role_permission', entityId: selectedRole.id, entityName: selectedRole.name, details: { permission: perm?.key } });
      }
    }

    setRolePermissions(newSet);
  };

  const toggleGroupPermissions = async (groupPermissions: Permission[]) => {
    if (!selectedRole) return;

    const allChecked = groupPermissions.every(p => rolePermissions.has(p.id));
    const newSet = new Set(rolePermissions);

    if (allChecked) {
      for (const p of groupPermissions) {
        await supabase
          .from('custom_role_permissions')
          .delete()
          .eq('role_id', selectedRole.id)
          .eq('permission_id', p.id);
        newSet.delete(p.id);
      }
      logRBACAction({ action: 'permissions_bulk_revoked', entityType: 'custom_role_permission', entityId: selectedRole.id, entityName: selectedRole.name, details: { group: groupPermissions[0]?.group_name, count: groupPermissions.length } });
    } else {
      const toAdd = groupPermissions.filter(p => !rolePermissions.has(p.id));
      for (const p of toAdd) {
        await supabase
          .from('custom_role_permissions')
          .insert({ role_id: selectedRole.id, permission_id: p.id });
        newSet.add(p.id);
      }
      logRBACAction({ action: 'permissions_bulk_granted', entityType: 'custom_role_permission', entityId: selectedRole.id, entityName: selectedRole.name, details: { group: groupPermissions[0]?.group_name, count: toAdd.length } });
    }

    setRolePermissions(newSet);
  };

  const duplicateRole = async (role: CustomRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Create the new role
    const { data: newRole, error } = await supabase
      .from('custom_roles')
      .insert({ name: `${role.name} (Copy)`, description: role.description, scope: role.scope, created_by: user?.id })
      .select('id')
      .single();

    if (error || !newRole) {
      toast({ title: 'Error', description: error?.message || 'Failed to duplicate', variant: 'destructive' });
      setSaving(false);
      return;
    }

    // Copy permissions
    const { data: perms } = await supabase
      .from('custom_role_permissions')
      .select('permission_id')
      .eq('role_id', role.id);

    if (perms && perms.length > 0) {
      const inserts = (perms as unknown as RolePermission[]).map(p => ({
        role_id: (newRole as any).id,
        permission_id: p.permission_id,
      }));
      await supabase.from('custom_role_permissions').insert(inserts);
    }

    logRBACAction({ action: 'role_duplicated', entityType: 'custom_role', entityId: (newRole as any).id, entityName: `${role.name} (Copy)`, details: { source_role: role.name, permissions_copied: perms?.length || 0 } });
    toast({ title: 'Success', description: `Role "${role.name}" duplicated` });
    setSaving(false);
    fetchData();
  };

  // Group permissions by group_name
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.group_name]) acc[p.group_name] = [];
    acc[p.group_name].push(p);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedPermissions).sort(
    ([, a], [, b]) => (a[0]?.group_order || 0) - (b[0]?.group_order || 0)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Center Panel - Role List */}
      <div className="w-72 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Roles</h3>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" /> Add Role
          </Button>
        </div>

        <div className="space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors',
                selectedRole?.id === role.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:bg-muted'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{role.name}</p>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{role.scope}</Badge>
                    {role.is_system && <Badge variant="secondary" className="text-xs">System</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Duplicate role"
                  disabled={saving}
                  onClick={(e) => duplicateRole(role, e)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => openEditDialog(role, e)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {!role.is_system && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => confirmDelete(role, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No roles created yet</p>
          )}
        </div>
      </div>

      {/* Right Panel - Permissions */}
      <div className="flex-1 min-w-0">
        {selectedRole ? (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Permissions — {selectedRole.name}
              </CardTitle>
              {selectedRole.description && (
                <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedGroups.map(([groupName, groupPerms]) => {
                  const allChecked = groupPerms.every(p => rolePermissions.has(p.id));
                  const someChecked = groupPerms.some(p => rolePermissions.has(p.id));

                  return (
                    <div key={groupName} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          checked={allChecked}
                          // @ts-ignore
                          indeterminate={someChecked && !allChecked}
                          onCheckedChange={() => toggleGroupPermissions(groupPerms)}
                        />
                        <h4 className="font-semibold text-sm">{groupName}</h4>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {groupPerms.filter(p => rolePermissions.has(p.id)).length}/{groupPerms.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 ml-6">
                        {groupPerms.map((perm) => (
                          <div key={perm.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`perm-${perm.id}`}
                              checked={rolePermissions.has(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <label
                              htmlFor={`perm-${perm.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {perm.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select a role to view and manage its permissions</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. College Admin"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe this role..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Scope</label>
              <Select value={formScope} onValueChange={setFormScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editRole ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This will also remove all permission assignments and user role assignments associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
