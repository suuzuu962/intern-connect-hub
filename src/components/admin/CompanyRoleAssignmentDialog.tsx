import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus, Loader2, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { logRBACAction } from '@/lib/rbac-audit';

interface CompanyRoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    user_id: string;
  };
  onComplete: () => void;
}

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  is_system: boolean;
  permission_count?: number;
}

export const CompanyRoleAssignmentDialog = ({
  open,
  onOpenChange,
  company,
  onComplete,
}: CompanyRoleAssignmentDialogProps) => {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRoles();
      setMode('existing');
      setSelectedRoleId('');
      setNewRoleName('');
      setNewRoleDescription('');
    }
  }, [open]);

  const fetchRoles = async () => {
    setLoading(true);
    // Fetch roles with company scope or global, and their permission counts
    const { data: rolesData } = await supabase
      .from('custom_roles')
      .select('*')
      .order('name');

    if (rolesData) {
      // Fetch permission counts for each role
      const { data: permCounts } = await supabase
        .from('custom_role_permissions')
        .select('role_id');

      const countMap: Record<string, number> = {};
      if (permCounts) {
        for (const p of permCounts) {
          countMap[(p as any).role_id] = (countMap[(p as any).role_id] || 0) + 1;
        }
      }

      setRoles(
        (rolesData as unknown as CustomRole[]).map(r => ({
          ...r,
          permission_count: countMap[r.id] || 0,
        }))
      );
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let roleId = selectedRoleId;
      let roleName = '';

      if (mode === 'new') {
        if (!newRoleName.trim()) {
          toast.error('Role name is required');
          setAssigning(false);
          return;
        }

        // Create new role
        const { data: newRole, error: createError } = await supabase
          .from('custom_roles')
          .insert({
            name: newRoleName.trim(),
            description: newRoleDescription || null,
            scope: 'company',
            created_by: user?.id,
          })
          .select('id')
          .single();

        if (createError || !newRole) {
          toast.error('Failed to create role: ' + (createError?.message || 'Unknown error'));
          setAssigning(false);
          return;
        }

        roleId = (newRole as any).id;
        roleName = newRoleName.trim();

        logRBACAction({
          action: 'role_created',
          entityType: 'custom_role',
          entityId: roleId,
          entityName: roleName,
          details: { scope: 'company', created_during: 'company_approval', company: company.name },
        });

        toast.success(`Role "${roleName}" created`);
      } else {
        if (!roleId) {
          toast.error('Please select a role');
          setAssigning(false);
          return;
        }
        roleName = roles.find(r => r.id === roleId)?.name || '';
      }

      // Check if user already has this role
      const { data: existing } = await supabase
        .from('user_custom_roles')
        .select('id')
        .eq('user_id', company.user_id)
        .eq('role_id', roleId)
        .maybeSingle();

      if (existing) {
        toast.info(`${company.name} already has the "${roleName}" role`);
      } else {
        // Assign role to company user
        const { error: assignError } = await supabase
          .from('user_custom_roles')
          .insert({
            user_id: company.user_id,
            role_id: roleId,
            assigned_by: user?.id,
          });

        if (assignError) {
          toast.error('Failed to assign role: ' + assignError.message);
          setAssigning(false);
          return;
        }

        logRBACAction({
          action: 'user_role_assigned',
          entityType: 'user_custom_role',
          entityId: roleId,
          entityName: roleName,
          details: { user_id: company.user_id, company: company.name, assigned_during: 'company_approval' },
        });

        toast.success(`Role "${roleName}" assigned to ${company.name}`);
      }

      onOpenChange(false);
      onComplete();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assign Role: {company.name}
          </DialogTitle>
          <DialogDescription>
            Assign a custom role to define granular permissions for this company, or skip to use default permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Mode Selection */}
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as 'existing' | 'new')}
            className="grid grid-cols-2 gap-3"
          >
            <label
              htmlFor="mode-existing"
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                mode === 'existing' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="existing" id="mode-existing" />
              <div>
                <p className="font-medium text-sm flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Existing Role
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Pick from configured roles</p>
              </div>
            </label>

            <label
              htmlFor="mode-new"
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                mode === 'new' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="new" id="mode-new" />
              <div>
                <p className="font-medium text-sm flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  New Role
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Create a custom role</p>
              </div>
            </label>
          </RadioGroup>

          {/* Existing Role Selection */}
          {mode === 'existing' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No roles available. Create a new one instead.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRoleId === role.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedRoleId === role.id ? (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{role.name}</p>
                          {role.description && (
                            <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{role.scope}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          {role.permission_count} perms
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New Role Form */}
          {mode === 'new' && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-2">
                <Label htmlFor="new-role-name">Role Name *</Label>
                <Input
                  id="new-role-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Company Premium, Company Basic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role-desc">Description</Label>
                <Textarea
                  id="new-role-desc"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Describe what this role allows..."
                  rows={2}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Scope will be set to <Badge variant="outline" className="text-xs">company</Badge>. You can configure permissions later in Access Control → Roles.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip} disabled={assigning}>
            Skip
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assigning || (mode === 'existing' && !selectedRoleId) || (mode === 'new' && !newRoleName.trim())}
            className="gap-1.5"
          >
            {assigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                {mode === 'new' ? 'Create & Assign' : 'Assign Role'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
