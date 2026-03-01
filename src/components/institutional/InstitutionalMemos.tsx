import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Plus, Search, Eye, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface InstitutionalMemosProps {
  universityId: string;
  collegeId?: string;
  senderRole: 'university' | 'college' | 'coordinator';
  senderName: string;
}

interface Memo {
  id: string;
  sender_id: string;
  sender_role: string;
  sender_name: string;
  recipient_type: string;
  recipient_id: string | null;
  subject: string;
  body: string;
  priority: string;
  status: string;
  read_at: string | null;
  created_at: string;
  parent_memo_id: string | null;
}

export const InstitutionalMemos = ({ universityId, collegeId, senderRole, senderName }: InstitutionalMemosProps) => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  // Compose form
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientType, setRecipientType] = useState<string>('broadcast');
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMemos();
  }, [universityId]);

  const fetchMemos = async () => {
    const { data, error } = await supabase
      .from('institutional_memos')
      .select('*')
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memos:', error);
    } else {
      setMemos((data as Memo[]) || []);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || !user) return;
    setSending(true);

    const { error } = await supabase
      .from('institutional_memos')
      .insert({
        sender_id: user.id,
        sender_role: senderRole,
        sender_name: senderName,
        recipient_type: recipientType,
        subject: subject.trim(),
        body: body.trim(),
        priority,
        university_id: universityId,
        college_id: collegeId || null,
        status: 'sent',
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Memo sent successfully' });
      setSubject('');
      setBody('');
      setRecipientType('broadcast');
      setPriority('normal');
      setComposeOpen(false);
      fetchMemos();
    }
    setSending(false);
  };

  const markAsRead = async (memo: Memo) => {
    if (memo.sender_id === user?.id || memo.read_at) return;
    await supabase
      .from('institutional_memos')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', memo.id);
    fetchMemos();
  };

  const filteredMemos = memos.filter(memo => {
    const matchesSearch = memo.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.sender_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || memo.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (selectedMemo) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedMemo(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
          <CardTitle className="mt-2">{selectedMemo.subject}</CardTitle>
          <CardDescription className="flex items-center gap-3">
            <span>From: <strong>{selectedMemo.sender_name}</strong> ({selectedMemo.sender_role})</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(selectedMemo.created_at), 'PPp')}</span>
            <Badge variant={priorityColor(selectedMemo.priority) as any}>{selectedMemo.priority}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-lg bg-muted/50 p-4">
            {selectedMemo.body}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" /> Internal Memos
          </h2>
          <p className="text-sm text-muted-foreground">{filteredMemos.length} memo{filteredMemos.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Compose Memo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Compose Memo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broadcast">All (Broadcast)</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="college">Colleges</SelectItem>
                      <SelectItem value="coordinator">Coordinators</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Memo subject..." maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your memo..." rows={6} maxLength={5000} />
              </div>
              <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} className="w-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}
                Send Memo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search memos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredMemos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No memos yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemos.map(memo => (
                  <TableRow key={memo.id} className={!memo.read_at && memo.sender_id !== user?.id ? 'font-semibold' : ''}>
                    <TableCell>
                      {memo.priority === 'urgent' && <AlertCircle className="h-4 w-4 text-destructive" />}
                      {memo.priority === 'high' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                      {memo.priority === 'normal' && <span className="text-muted-foreground">—</span>}
                      {memo.priority === 'low' && <span className="text-muted-foreground">↓</span>}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{memo.subject}</TableCell>
                    <TableCell className="text-sm">{memo.sender_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{memo.recipient_type}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(memo.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell><Badge variant={memo.status === 'read' ? 'secondary' : 'default'} className="text-xs">{memo.status}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { markAsRead(memo); setSelectedMemo(memo); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
