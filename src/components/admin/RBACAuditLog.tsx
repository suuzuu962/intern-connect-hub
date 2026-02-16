import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Clock, Shield, Users, Key } from 'lucide-react';

interface AuditLog {
  id: string;
  performed_by: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
}

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  role_created: { label: 'Role Created', variant: 'default' },
  role_updated: { label: 'Role Updated', variant: 'secondary' },
  role_deleted: { label: 'Role Deleted', variant: 'destructive' },
  role_duplicated: { label: 'Role Duplicated', variant: 'default' },
  permission_granted: { label: 'Permission Granted', variant: 'default' },
  permission_revoked: { label: 'Permission Revoked', variant: 'destructive' },
  permissions_bulk_granted: { label: 'Bulk Permissions Granted', variant: 'default' },
  permissions_bulk_revoked: { label: 'Bulk Permissions Revoked', variant: 'destructive' },
  user_role_assigned: { label: 'User Role Assigned', variant: 'default' },
  user_role_removed: { label: 'User Role Removed', variant: 'destructive' },
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  custom_role: <Shield className="h-3.5 w-3.5" />,
  custom_role_permission: <Key className="h-3.5 w-3.5" />,
  user_custom_role: <Users className="h-3.5 w-3.5" />,
};

export const RBACAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('rbac_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    const auditLogs = (data || []) as unknown as AuditLog[];
    setLogs(auditLogs);

    const userIds = [...new Set(auditLogs.map(l => l.performed_by))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      if (profileData) {
        const map: Record<string, Profile> = {};
        (profileData as unknown as Profile[]).forEach(p => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    const profile = profiles[log.performed_by];
    return (
      log.action.toLowerCase().includes(s) ||
      log.entity_name?.toLowerCase().includes(s) ||
      profile?.email?.toLowerCase().includes(s) ||
      profile?.full_name?.toLowerCase().includes(s)
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
          <Clock className="h-5 w-5" /> RBAC Audit Log
        </h3>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by action, entity, or user..."
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
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => {
                const profile = profiles[log.performed_by];
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, variant: 'outline' as const };
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {ENTITY_ICONS[log.entity_type]}
                        <span className="text-sm">{log.entity_name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {profile?.full_name || profile?.email || log.performed_by.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {Object.keys(log.details || {}).length > 0
                        ? JSON.stringify(log.details)
                        : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No audit log entries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
