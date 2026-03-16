import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CalendarCheck, Clock, Search, Bell, Settings2, Loader2, Eye, MessageSquare, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface UpgradeRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_role: string;
  feature_requested: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  phone: string | null;
  message: string | null;
  whatsapp_contact: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface FeatureConfig {
  id: string;
  role: string;
  feature_key: string;
  feature_label: string;
  is_locked: boolean;
  upgrade_message: string | null;
}

export const UpgradeRequestsManagement = () => {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [featureConfigs, setFeatureConfigs] = useState<FeatureConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [reqRes, configRes] = await Promise.all([
      supabase.from('upgrade_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('feature_access_config').select('*').order('role').order('feature_key'),
    ]);
    if (reqRes.data) setRequests(reqRes.data as any);
    if (configRes.data) setFeatureConfigs(configRes.data as any);
    setLoading(false);
  };

  const updateRequestStatus = async (id: string, status: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('upgrade_requests')
      .update({ status, admin_notes: adminNotes } as any)
      .eq('id', id);

    if (!error) {
      toast({ title: 'Status updated' });
      fetchData();
      setSelectedRequest(null);
    } else {
      toast({ title: 'Error updating', variant: 'destructive' });
    }
    setUpdating(false);
  };

  const toggleFeatureLock = async (config: FeatureConfig) => {
    const { error } = await supabase
      .from('feature_access_config')
      .update({ is_locked: !config.is_locked } as any)
      .eq('id', config.id);
    if (!error) {
      toast({ title: `${config.feature_label} ${config.is_locked ? 'unlocked' : 'locked'}` });
      fetchData();
    }
  };

  const sendUpgradeNotification = async (request: UpgradeRequest) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: request.user_id,
      title: 'Upgrade Available',
      message: `Great news! Your upgrade request for "${request.feature_requested}" has been reviewed. Contact us to complete the upgrade.`,
      type: 'upgrade',
      target_role: request.user_role,
    });
    if (!error) {
      toast({ title: 'Notification sent to user' });
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.user_name.toLowerCase().includes(search.toLowerCase()) ||
      r.user_email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'contacted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return '';
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upgrade Requests</h2>
        <p className="text-muted-foreground">Manage meeting requests and feature access</p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Meeting Requests</TabsTrigger>
          <TabsTrigger value="config">Feature Access Config</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Requests', value: stats.total, icon: CalendarCheck, color: 'text-primary' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500' },
              { label: 'Contacted', value: stats.contacted, icon: MessageSquare, color: 'text-blue-500' },
              { label: 'Completed', value: stats.completed, icon: CalendarCheck, color: 'text-green-500' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No upgrade requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map(req => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{req.user_name}</p>
                          <p className="text-xs text-muted-foreground">{req.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{req.user_role}</Badge></TableCell>
                      <TableCell className="text-sm">{req.feature_requested || '—'}</TableCell>
                      <TableCell className="text-sm">{format(new Date(req.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell><Badge className={statusColor(req.status)}>{req.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setSelectedRequest(req); setAdminNotes(req.admin_notes || ''); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => sendUpgradeNotification(req)}>
                            <Bell className="h-4 w-4" />
                          </Button>
                          {req.phone && (
                            <Button size="icon" variant="ghost" onClick={() => window.open(`https://wa.me/${req.phone?.replace(/\D/g, '')}`, '_blank')}>
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="h-5 w-5" />
                Feature Access Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Locked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureConfigs.map(config => (
                    <TableRow key={config.id}>
                      <TableCell><Badge variant="outline" className="capitalize">{config.role}</Badge></TableCell>
                      <TableCell className="font-medium">{config.feature_label}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={config.is_locked}
                            onCheckedChange={() => toggleFeatureLock(config)}
                          />
                          <Label className="text-xs text-muted-foreground">
                            {config.is_locked ? 'Locked' : 'Unlocked'}
                          </Label>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedRequest.user_name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedRequest.user_email}</span></div>
                <div><span className="text-muted-foreground">Role:</span> <Badge variant="outline" className="capitalize">{selectedRequest.user_role}</Badge></div>
                <div><span className="text-muted-foreground">Feature:</span> <span className="font-medium">{selectedRequest.feature_requested}</span></div>
                {selectedRequest.preferred_date && <div><span className="text-muted-foreground">Preferred Date:</span> <span className="font-medium">{selectedRequest.preferred_date}</span></div>}
                {selectedRequest.preferred_time && <div><span className="text-muted-foreground">Preferred Time:</span> <span className="font-medium">{selectedRequest.preferred_time}</span></div>}
                {selectedRequest.phone && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedRequest.phone}</span></div>}
              </div>
              {selectedRequest.message && (
                <div>
                  <Label className="text-muted-foreground">User Message</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedRequest.message}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Admin Notes</Label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add internal notes..." rows={3} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateRequestStatus(selectedRequest.id, 'contacted')} disabled={updating}>
                  Mark Contacted
                </Button>
                <Button size="sm" onClick={() => updateRequestStatus(selectedRequest.id, 'completed')} disabled={updating}>
                  Mark Completed
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')} disabled={updating}>
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
