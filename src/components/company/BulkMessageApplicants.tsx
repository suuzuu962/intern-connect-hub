import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Send, Filter, Users, CheckSquare, Loader2, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkMessageApplicantsProps {
  companyId: string | null;
}

interface Recipient {
  applicationId: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  internshipTitle: string;
}

export const BulkMessageApplicants = ({ companyId }: BulkMessageApplicantsProps) => {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterInternship, setFilterInternship] = useState<string>('all');
  const [internships, setInternships] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (companyId) fetchRecipients();
  }, [companyId]);

  const fetchRecipients = async () => {
    try {
      const { data: companyInternships } = await supabase
        .from('internships')
        .select('id, title')
        .eq('company_id', companyId!);

      setInternships(companyInternships || []);
      const internshipIds = companyInternships?.map(i => i.id) || [];
      if (internshipIds.length === 0) { setLoading(false); return; }

      const { data: applications } = await supabase
        .from('applications')
        .select(`
          id, status, internship_id,
          students:student_id (user_id)
        `)
        .in('internship_id', internshipIds);

      if (!applications) { setLoading(false); return; }

      const userIds = applications.map((a: any) => a.students?.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const internshipMap = new Map(companyInternships?.map(i => [i.id, i.title]) || []);

      const mapped: Recipient[] = applications.map((a: any) => {
        const profile = profileMap.get(a.students?.user_id);
        return {
          applicationId: a.id,
          userId: a.students?.user_id || '',
          name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          status: a.status,
          internshipTitle: internshipMap.get(a.internship_id) || 'Unknown',
        };
      });

      setRecipients(mapped);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipients = recipients.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterInternship !== 'all' && r.internshipTitle !== filterInternship) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredRecipients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecipients.map(r => r.applicationId)));
    }
  };

  const handleSend = async () => {
    if (!messageTitle.trim() || !messageBody.trim()) {
      toast.error('Please enter both title and message');
      return;
    }
    if (selectedIds.size === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setSending(true);
    try {
      const selectedRecipients = recipients.filter(r => selectedIds.has(r.applicationId));
      const notifications = selectedRecipients.map(r => ({
        user_id: r.userId,
        title: messageTitle,
        message: messageBody,
        type: 'company_message',
        target_role: 'student',
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;

      toast.success(`Message sent to ${selectedIds.size} applicant(s)`);
      setMessageTitle('');
      setMessageBody('');
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const statusOptions = ['all', 'applied', 'under_review', 'shortlisted', 'offer_released', 'offer_accepted', 'rejected'];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bulk Message Applicants</h2>
        <p className="text-muted-foreground">Send in-app notifications to multiple applicants at once</p>
      </div>

      {/* Compose Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Message title (e.g., Interview Update)"
            value={messageTitle}
            onChange={e => setMessageTitle(e.target.value)}
          />
          <Textarea
            placeholder="Type your message here..."
            value={messageBody}
            onChange={e => setMessageBody(e.target.value)}
            rows={4}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} recipient(s) selected
            </p>
            <Button onClick={handleSend} disabled={sending || selectedIds.size === 0}>
              {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Send to Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Selection */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterInternship} onValueChange={setFilterInternship}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Internship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Internships</SelectItem>
            {internships.map(i => (
              <SelectItem key={i.id} value={i.title}>{i.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={selectAll}>
          <CheckSquare className="h-4 w-4 mr-1" />
          {selectedIds.size === filteredRecipients.length && filteredRecipients.length > 0 ? 'Deselect All' : 'Select All'}
        </Button>

        <Badge variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {filteredRecipients.length} applicant(s)
        </Badge>
      </div>

      {/* Recipient List */}
      {filteredRecipients.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No applicants match your filters.
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {filteredRecipients.map(r => (
              <Card
                key={r.applicationId}
                className={`cursor-pointer transition-all ${selectedIds.has(r.applicationId) ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-sm'}`}
                onClick={() => toggleSelect(r.applicationId)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.has(r.applicationId)}
                    onCheckedChange={() => toggleSelect(r.applicationId)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{r.name}</span>
                      <Badge variant="outline" className="text-xs">{r.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.email} • {r.internshipTitle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
