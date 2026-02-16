import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Search, Loader2, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomRole {
  id: string;
  name: string;
  scope: string;
}

interface UserCustomRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  custom_roles?: CustomRole;
}

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

export const RBACUserRoles = () => {
  const [userCustomRoles, setUserCustomRoles] = useState<UserCustomRole[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserCustomRole | null>(null);

  // Assignment form
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<(UserProfile & { role?: string })[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Profile cache
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ucRolesRes, rolesRes] = await Promise.all([
      supabase.from('user_custom_roles').select('*, custom_roles(id, name, scope)').order('created_at', { ascending: false }),
      supabase.from('custom_roles').select('id, name, scope').order('name'),
    ]);

    if (rolesRes.data) setRoles(rolesRes.data as unknown as CustomRole[]);
    
    const ucRoles = (ucRolesRes.data || []) as unknown as UserCustomRole[];
    setUserCustomRoles(ucRoles);

    // Fetch profiles for all user_ids
    const userIds = [...new Set(ucRoles.map(r => r.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);
      
      if (profileData) {
        const map: Record<string, UserProfile> = {};
        (profileData as unknown as UserProfile[]).forEach(p => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    // Search profiles for university, college_coordinator roles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(20);

    if (profileData) {
      // Get roles for these users
      const userIds = (profileData as unknown as UserProfile[]).map(p => p.user_id);
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap: Record<string, string> = {};
      (roleData as unknown as UserRole[] || []).forEach(r => { roleMap[r.user_id] = r.role; });

      // Filter to only university/college_coordinator roles
      const results = (profileData as unknown as UserProfile[])
        .filter(p => {
          const role = roleMap[p.user_id];
          return role === 'university' || role === 'college_coordinator';
        })
        .map(p => ({ ...p, role: roleMap[p.user_id] }));

      setSearchResults(results);
    }
    setSearching(false);
  };

  const handleAssign = async () => {
    if (!assignUserId || !assignRoleId) {
      toast({ title: 'Error', description: 'Select a user and role', variant: 'destructive' });
      return;
    }

    setAssigning(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('user_custom_roles')
      .insert({ user_id: assignUserId, role_id: assignRoleId, assigned_by: user?.id });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'This user already has this role', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Success', description: 'Role assigned to user' });
      setShowAssignDialog(false);
      setAssignUserId('');
      setAssignRoleId('');
      setUserSearch('');
      setSearchResults([]);
      fetchData();
    }
    setAssigning(false);
  };

  const handleRemove = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('user_custom_roles').delete().eq('id', deleteTarget.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Role assignment removed' });
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
    fetchData();
  };

  const filtered = userCustomRoles.filter(ucr => {
    if (!search) return true;
    const profile = profiles[ucr.user_id];
    const roleName = ucr.custom_roles?.name || '';
    const searchLower = search.toLowerCase();
    return (
      profile?.email?.toLowerCase().includes(searchLower) ||
      profile?.full_name?.toLowerCase().includes(searchLower) ||
      roleName.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> User Role Assignments
        </h3>
        <Button size="sm" onClick={() => setShowAssignDialog(true)}>
          <Plus className="h-4 w-4 mr-1" /> Assign Role
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Assigned On</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ucr) => {
                const profile = profiles[ucr.user_id];
                return (
                  <TableRow key={ucr.id}>
                    <TableCell className="font-medium">
                      {profile?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {profile?.email || ucr.user_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {ucr.custom_roles?.name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ucr.custom_roles?.scope || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(ucr.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => { setDeleteTarget(ucr); setShowDeleteDialog(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No role assignments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Search User</label>
              <Input
                placeholder="Type name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
              {searching && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button
                      key={u.user_id}
                      onClick={() => {
                        setAssignUserId(u.user_id);
                        setUserSearch(`${u.full_name || ''} (${u.email})`);
                        setSearchResults([]);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors',
                        assignUserId === u.user_id && 'bg-primary/10'
                      )}
                    >
                      <p className="font-medium">{u.full_name || 'No name'}</p>
                      <p className="text-xs text-muted-foreground">{u.email} · {u.role}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={assignRoleId} onValueChange={setAssignRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} ({role.scope})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assigning || !assignUserId || !assignRoleId}>
              {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this role assignment? The user will lose all permissions associated with this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
