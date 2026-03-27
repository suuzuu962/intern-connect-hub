import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface UserRequest {
  id: string;
  university_id: string;
  requested_by: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  status: string;
  admin_notes: string | null;
  created_at: string;
  university_name?: string;
}

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case 'approved':
      return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 gap-1"><CheckCircle2 className="h-3 w-3" />Approved</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const UniversityUserRequests = () => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [password, setPassword] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const { toast } = useToast();

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    // Fetch requests
    const { data, error } = await supabase
      .from('university_user_requests' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch university names
    const universityIds = [...new Set((data || []).map((r: any) => r.university_id))];
    let uniMap: Record<string, string> = {};
    if (universityIds.length > 0) {
      const { data: unis } = await supabase
        .from('universities')
        .select('id, name')
        .in('id', universityIds);
      if (unis) {
        unis.forEach(u => { uniMap[u.id] = u.name; });
      }
    }

    setRequests((data || []).map((r: any) => ({
      ...r,
      permissions: typeof r.permissions === 'object' && r.permissions ? r.permissions : {},
      university_name: uniMap[r.university_id] || 'Unknown',
    })));
    setLoading(false);
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleApprove = async () => {
    if (!selectedRequest || !password.trim()) {
      toast({ title: 'Error', description: 'Password is required', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    const { data, error } = await supabase.functions.invoke('create-university-user', {
      body: {
        action: 'approve_request',
        requestId: selectedRequest.id,
        password,
      },
    });

    if (error || data?.error) {
      toast({ title: 'Error', description: data?.error || error?.message || 'Approval failed', variant: 'destructive' });
    } else {
      toast({ title: 'Request Approved', description: `${selectedRequest.name} has been created as ${selectedRequest.role}.` });
      fetchRequests();
      setApproveDialogOpen(false);
      setPassword('');
      setSelectedRequest(null);
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    const { data, error } = await supabase.functions.invoke('create-university-user', {
      body: {
        action: 'reject_request',
        requestId: selectedRequest.id,
        notes: rejectNotes,
      },
    });

    if (error || data?.error) {
      toast({ title: 'Error', description: data?.error || error?.message || 'Rejection failed', variant: 'destructive' });
    } else {
      toast({ title: 'Request Rejected' });
      fetchRequests();
      setRejectDialogOpen(false);
      setRejectNotes('');
      setSelectedRequest(null);
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">University User Requests</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve requests from universities to add team members.
          {pendingCount > 0 && <span className="text-yellow-600 font-medium ml-1">({pendingCount} pending)</span>}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:bg-accent'
            }`}
          >
            {f}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-yellow-500 text-white text-xs">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/50">
              <TableHead className="font-semibold text-foreground">User</TableHead>
              <TableHead className="font-semibold text-foreground">University</TableHead>
              <TableHead className="font-semibold text-foreground">Role</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Date</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No {filter !== 'all' ? filter : ''} requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map(req => (
                <TableRow key={req.id} className="hover:bg-accent/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {getInitials(req.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">{req.name}</p>
                        <p className="text-muted-foreground text-xs">{req.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{req.university_name}</TableCell>
                  <TableCell>{getRoleBadge(req.role)}</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(req.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details"
                        onClick={() => { setSelectedRequest(req); setDetailDialogOpen(true); }}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {req.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => { setSelectedRequest(req); setApproveDialogOpen(true); }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 gap-1"
                            onClick={() => { setSelectedRequest(req); setRejectDialogOpen(true); }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={open => { setApproveDialogOpen(open); if (!open) { setPassword(''); setSelectedRequest(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-accent/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{selectedRequest.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{selectedRequest.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  {getRoleBadge(selectedRequest.role)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">University</span>
                  <span className="text-sm font-medium">{selectedRequest.university_name}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="approve-password">Set User Password *</Label>
                <Input
                  id="approve-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">This password will be set for the new user's account.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setApproveDialogOpen(false); setPassword(''); }}>Cancel</Button>
                <Button onClick={handleApprove} disabled={processing || password.length < 6}>
                  {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Approve & Create User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={open => { setRejectDialogOpen(open); if (!open) { setRejectNotes(''); setSelectedRequest(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Rejecting <span className="font-medium text-foreground">{selectedRequest.name}</span> ({selectedRequest.email}) as {selectedRequest.role} for {selectedRequest.university_name}.
              </p>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectNotes(''); }}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject} disabled={processing}>
                  {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Reject Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={open => { setDetailDialogOpen(open); if (!open) setSelectedRequest(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  ['Name', selectedRequest.name],
                  ['Email', selectedRequest.email],
                  ['University', selectedRequest.university_name],
                  ['Date', format(new Date(selectedRequest.created_at), 'dd MMM yyyy, hh:mm a')],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Role</span>
                  {getRoleBadge(selectedRequest.role)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Requested Permissions</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedRequest.permissions)
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <Badge key={k} variant="secondary" className="text-xs">{k.replace(/_/g, ' ')}</Badge>
                    ))}
                </div>
              </div>
              {selectedRequest.admin_notes && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Admin Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
