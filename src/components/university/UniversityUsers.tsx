import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Trash2, Search, Pencil, Shield, Settings2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UniversityUsersProps {
  universityId: string;
}

interface UniversityUser {
  id: string;
  university_id: string;
  user_id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  role: string;
  permissions: Record<string, boolean>;
}

type UserRole = 'manager' | 'college' | 'scout';

interface PermissionDef {
  key: string;
  label: string;
  description: string;
}

const ROLE_TABS: { id: UserRole; label: string; description: string; color: string }[] = [
  { id: 'manager', label: 'Manager', description: 'Full access to manage colleges, students, and university settings.', color: 'bg-primary text-primary-foreground' },
  { id: 'college', label: 'College', description: 'Manage and oversee affiliated colleges, coordinators, and academic records.', color: 'bg-emerald-600 text-white' },
  { id: 'scout', label: 'Scout', description: 'Observe, discover, and report insights across internships and student activity.', color: 'bg-amber-600 text-white' },
];

const ROLE_PERMISSIONS: Record<UserRole, PermissionDef[]> = {
  manager: [
    { key: 'manage_colleges', label: 'Manage Colleges', description: 'Add, edit, and deactivate colleges' },
    { key: 'manage_students', label: 'Manage Students', description: 'View and manage student records' },
    { key: 'manage_users', label: 'Manage Team', description: 'Add and remove team members' },
    { key: 'view_analytics', label: 'View Analytics', description: 'Access university analytics dashboard' },
    { key: 'manage_settings', label: 'Manage Settings', description: 'Update university profile and settings' },
    { key: 'send_memos', label: 'Send Memos', description: 'Send institutional communications' },
  ],
  college: [
    { key: 'view_colleges', label: 'View Colleges', description: 'Browse affiliated college list' },
    { key: 'manage_coordinators', label: 'Manage Coordinators', description: 'Add and manage college coordinators' },
    { key: 'view_students', label: 'View Students', description: 'View student profiles under colleges' },
    { key: 'approve_diaries', label: 'Approve Diaries', description: 'Review and approve internship diaries' },
    { key: 'view_attendance', label: 'View Attendance', description: 'Monitor student attendance records' },
    { key: 'send_memos', label: 'Send Memos', description: 'Send memos to colleges' },
  ],
  scout: [
    { key: 'view_analytics', label: 'View Analytics', description: 'Access read-only analytics dashboard' },
    { key: 'view_students', label: 'View Students', description: 'Browse student directory' },
    { key: 'view_internships', label: 'View Internships', description: 'Browse available internships and applications' },
    { key: 'view_colleges', label: 'View Colleges', description: 'View college listings' },
    { key: 'view_attendance', label: 'View Attendance', description: 'View attendance reports' },
    { key: 'export_reports', label: 'Export Reports', description: 'Download data exports and reports' },
  ],
};

const getDefaultPermissions = (role: UserRole): Record<string, boolean> => {
  const perms: Record<string, boolean> = {};
  ROLE_PERMISSIONS[role]?.forEach(p => { perms[p.key] = true; });
  return perms;
};

const MAX_USERS = 3;

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-orange-500', 'bg-blue-600', 'bg-emerald-500', 'bg-purple-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-amber-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'manager':
      return <Badge className="bg-primary/10 text-primary border-primary/20">Manager</Badge>;
    case 'college':
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">College</Badge>;
    case 'scout':
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">Scout</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
};

export const UniversityUsers = ({ universityId }: UniversityUsersProps) => {
  const [users, setUsers] = useState<UniversityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UniversityUser | null>(null);
  const [permUser, setPermUser] = useState<UniversityUser | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('manager');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'scout' as UserRole });
  const [tempPermissions, setTempPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchUsers(); }, [universityId]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('university_users')
      .select('*')
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setUsers((data || []).map((u: any) => ({
        ...u,
        role: u.role || 'scout',
        permissions: typeof u.permissions === 'object' && u.permissions ? u.permissions : {},
      })));
    }
    setLoading(false);
  };

  const [ownerData, setOwnerData] = useState<{ name: string; email: string; phone?: string } | null>(null);

  useEffect(() => {
    const fetchOwner = async () => {
      const { data } = await supabase
        .from('universities')
        .select('name, email, contact_person_phone, contact_person_name')
        .eq('id', universityId)
        .single();
      if (data) {
        setOwnerData({
          name: data.contact_person_name || data.name,
          email: data.email,
          phone: data.contact_person_phone || undefined,
        });
      }
    };
    fetchOwner();
  }, [universityId]);

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(u => u.role === activeRole);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return filtered;
  }, [users, searchQuery, activeRole]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { manager: 0, college: 0, scout: 0 };
    users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++; });
    return counts;
  }, [users]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: activeRole });
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (users.length >= MAX_USERS && !editingUser) {
      toast({ title: 'Limit Reached', description: `You can only add up to ${MAX_USERS} additional users.`, variant: 'destructive' });
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || (!editingUser && !formData.password.trim())) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }

    if (!editingUser && formData.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setSaving(true);

    if (editingUser) {
      const { error } = await supabase
        .from('university_users')
        .update({ name: formData.name, email: formData.email, role: formData.role } as any)
        .eq('id', editingUser.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'User updated successfully' });
        fetchUsers();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: formData.name },
        },
      });

      if (authError) {
        toast({ title: 'Error', description: authError.message, variant: 'destructive' });
        setSaving(false);
        return;
      }

      if (authData.user) {
        const defaultPerms = getDefaultPermissions(formData.role);
        const { error: userError } = await supabase.from('university_users').insert({
          university_id: universityId,
          user_id: authData.user.id,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          permissions: defaultPerms,
        } as any);

        if (userError) {
          toast({ title: 'Error', description: userError.message, variant: 'destructive' });
        } else {
          await supabase.from('user_roles').insert({ user_id: authData.user.id, role: 'university' });
          toast({ title: 'User added successfully', description: 'They will receive a verification email.' });
          fetchUsers();
          setDialogOpen(false);
          resetForm();
        }
      }
    }

    setSaving(false);
  };

  const handleEdit = (user: UniversityUser) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role as UserRole });
    setDialogOpen(true);
  };

  const handleOpenPermissions = (user: UniversityUser) => {
    setPermUser(user);
    const role = user.role as UserRole;
    const defaults = getDefaultPermissions(role);
    const merged = { ...defaults };
    Object.keys(user.permissions || {}).forEach(k => {
      if (k in merged) merged[k] = !!user.permissions[k];
    });
    setTempPermissions(merged);
    setPermDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!permUser) return;
    setSaving(true);
    const { error } = await supabase
      .from('university_users')
      .update({ permissions: tempPermissions } as any)
      .eq('id', permUser.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Permissions updated' });
      fetchUsers();
      setPermDialogOpen(false);
      setPermUser(null);
    }
    setSaving(false);
  };

  const handleDelete = async (userId: string, userRecordId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    const { error } = await supabase.from('university_users').delete().eq('id', userRecordId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User removed successfully' });
      fetchUsers();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeTab = ROLE_TABS.find(t => t.id === activeRole)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your Team</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage user roles, set permissions, and control access for a secure system.
        </p>
      </div>

      <hr className="border-border" />

      {/* Account Owner Card */}
      {ownerData && (
        <div className="border border-border rounded-xl p-5 flex items-center justify-between bg-accent/30">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={`${getAvatarColor(ownerData.name)} text-white font-bold text-sm`}>
                {getInitials(ownerData.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground text-base">{ownerData.name}</p>
              <p className="text-muted-foreground text-sm">
                {ownerData.email}
                {ownerData.phone && <span className="ml-2">| {ownerData.phone}</span>}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 font-medium">
            Account Owner
          </Badge>
        </div>
      )}

      {/* Role Tabs */}
      <div className="flex gap-2">
        {ROLE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveRole(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2 ${
              activeRole === tab.id
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-foreground border-border hover:bg-accent'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeRole === tab.id ? 'bg-white/20' : 'bg-muted'
            }`}>
              {roleCounts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Role Description + Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{activeTab.label}</h3>
          <p className="text-muted-foreground text-sm">{activeTab.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
          <Button
            onClick={() => { resetForm(); setDialogOpen(true); }}
            disabled={users.length >= MAX_USERS}
            className="rounded-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab.label}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="max-w-md">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Users Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/50">
              <TableHead className="font-semibold text-foreground">Name</TableHead>
              <TableHead className="font-semibold text-foreground">Role</TableHead>
              <TableHead className="font-semibold text-foreground">Added By</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No {activeTab.label.toLowerCase()} users added yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id} className="hover:bg-accent/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${getAvatarColor(user.name)} text-white font-bold text-xs`}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">{user.name}</p>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-xs font-medium">
                      Account Owner
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenPermissions(user)} className="h-8 w-8" title="Permissions">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8" title="Edit">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user.user_id, user.id)} className="h-8 w-8" title="Remove">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-accent/20">
            <span className="text-sm text-muted-foreground">
              1 - {filteredUsers.length} / {filteredUsers.length}
            </span>
            <div className="flex items-center gap-1">
              <button className="h-8 w-8 rounded border border-border text-xs text-muted-foreground hover:bg-accent" disabled>«</button>
              <button className="h-8 w-8 rounded border border-border text-xs text-muted-foreground hover:bg-accent" disabled>‹</button>
              <button className="h-8 w-8 rounded border border-primary bg-primary text-primary-foreground text-xs font-bold">1</button>
              <button className="h-8 w-8 rounded border border-border text-xs text-muted-foreground hover:bg-accent" disabled>›</button>
              <button className="h-8 w-8 rounded border border-border text-xs text-muted-foreground hover:bg-accent" disabled>»</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Jump To
              <Input className="w-14 h-8 text-center text-xs" defaultValue="1" />
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : `Add New ${activeTab.label}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} required disabled={!!editingUser} />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} required minLength={6} />
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2">
                {ROLE_TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: tab.id }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      formData.role === tab.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {ROLE_TABS.find(t => t.id === formData.role)?.description}
              </p>
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                {editingUser
                  ? 'User details will be updated. Permissions can be configured separately.'
                  : 'The user will receive an email to verify their account. Default permissions for this role will be applied.'}
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingUser ? 'Update User' : 'Add User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permDialogOpen} onOpenChange={open => { setPermDialogOpen(open); if (!open) setPermUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Permissions — {permUser?.name}
            </DialogTitle>
          </DialogHeader>
          {permUser && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-4">
                {getRoleBadge(permUser.role)}
                <span className="text-xs text-muted-foreground">Toggle permissions on/off for this user</span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {ROLE_PERMISSIONS[permUser.role as UserRole]?.map(perm => (
                  <div
                    key={perm.key}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium text-foreground">{perm.label}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                    <Switch
                      checked={!!tempPermissions[perm.key]}
                      onCheckedChange={checked =>
                        setTempPermissions(prev => ({ ...prev, [perm.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <Button variant="outline" onClick={() => setPermDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSavePermissions} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Permissions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
