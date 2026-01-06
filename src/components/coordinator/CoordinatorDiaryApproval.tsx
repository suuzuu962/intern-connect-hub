import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, BookOpen, Search, Filter, CheckCircle, Eye, XCircle, CheckSquare } from 'lucide-react';

interface CoordinatorDiaryApprovalProps {
  coordinatorId: string;
  collegeId: string | null;
}

interface DiaryEntryWithDetails {
  id: string;
  student_id: string;
  application_id: string;
  title: string;
  content: string;
  entry_date: string;
  hours_worked: number | null;
  skills_learned: string[] | null;
  created_at: string;
  updated_at: string;
  is_approved: boolean | null;
  approved_by: string | null;
  approved_at: string | null;
  coordinator_remarks: string | null;
  student?: {
    id: string;
    usn: string | null;
    department: string | null;
  };
  profile?: {
    full_name: string;
    email: string;
  };
  internship?: {
    title: string;
    company?: {
      id: string;
      name: string;
    };
  };
}

interface CompanyOption {
  id: string;
  name: string;
}

export const CoordinatorDiaryApproval = ({ coordinatorId, collegeId }: CoordinatorDiaryApprovalProps) => {
  const { user } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntryWithDetails[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntryWithDetails | null>(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState<'approve' | 'reject' | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (collegeId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [collegeId]);

  const fetchData = async () => {
    // Fetch students from this college
    const { data: studentsData } = await supabase
      .from('students')
      .select('id, user_id, usn, department')
      .eq('college_id', collegeId);

    if (!studentsData || studentsData.length === 0) {
      setDiaryEntries([]);
      setLoading(false);
      return;
    }

    const studentIds = studentsData.map((s) => s.id);
    const studentUserIds = studentsData.map((s) => s.user_id);

    // Fetch diary entries
    const { data: diaryData, error } = await supabase
      .from('internship_diary')
      .select('*')
      .in('student_id', studentIds)
      .order('entry_date', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', studentUserIds);

    // Fetch applications with internships
    const applicationIds = [...new Set((diaryData || []).map((d) => d.application_id))];
    const { data: applicationsData } = await supabase
      .from('applications')
      .select('id, internship:internships(*, company:companies(*))')
      .in('id', applicationIds);

    // Extract unique companies
    const uniqueCompanies = new Map<string, CompanyOption>();
    (applicationsData || []).forEach((app: any) => {
      if (app.internship?.company) {
        uniqueCompanies.set(app.internship.company.id, {
          id: app.internship.company.id,
          name: app.internship.company.name,
        });
      }
    });
    setCompanies(Array.from(uniqueCompanies.values()));

    // Map data together
    const entriesWithDetails = (diaryData || []).map((entry) => {
      const student = studentsData.find((s) => s.id === entry.student_id);
      const profile = student
        ? (profilesData || []).find((p) => p.user_id === student.user_id)
        : null;
      const application = (applicationsData || []).find((a: any) => a.id === entry.application_id);

      return {
        ...entry,
        student,
        profile,
        internship: application?.internship ? {
          title: application.internship.title,
          company: application.internship.company ? {
            id: application.internship.company.id,
            name: application.internship.company.name,
          } : undefined,
        } : undefined,
      };
    });

    setDiaryEntries(entriesWithDetails);
    setLoading(false);
  };

  const handleApprove = async (entryId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('internship_diary')
        .update({
          is_approved: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          coordinator_remarks: remarks || null,
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Diary entry approved successfully' });
      setSelectedEntry(null);
      setRemarks('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (entryId: string) => {
    if (!remarks.trim()) {
      toast({ title: 'Error', description: 'Please provide remarks for rejection', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('internship_diary')
        .update({
          is_approved: false,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          coordinator_remarks: remarks,
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Diary entry rejected with remarks' });
      setSelectedEntry(null);
      setRemarks('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getApprovalStatus = (entry: DiaryEntryWithDetails) => {
    if (entry.approved_at === null) return 'pending';
    return entry.is_approved ? 'approved' : 'rejected';
  };

  const filteredEntries = diaryEntries.filter((entry) => {
    const matchesSearch =
      entry.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.student?.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany =
      companyFilter === 'all' || entry.internship?.company?.id === companyFilter;

    const status = getApprovalStatus(entry);
    const matchesStatus =
      statusFilter === 'all' || statusFilter === status;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  const pendingFilteredEntries = filteredEntries.filter(e => getApprovalStatus(e) === 'pending');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(pendingFilteredEntries.map(e => e.id));
    } else {
      setSelectedEntries([]);
    }
  };

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries(prev => [...prev, entryId]);
    } else {
      setSelectedEntries(prev => prev.filter(id => id !== entryId));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedEntries.length === 0) return;
    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('internship_diary')
        .update({
          is_approved: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          coordinator_remarks: bulkRemarks || null,
        })
        .in('id', selectedEntries);

      if (error) throw error;

      toast({ title: 'Success', description: `${selectedEntries.length} entries approved successfully` });
      setSelectedEntries([]);
      setBulkRemarks('');
      setShowBulkDialog(null);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedEntries.length === 0) return;
    if (!bulkRemarks.trim()) {
      toast({ title: 'Error', description: 'Please provide remarks for rejection', variant: 'destructive' });
      return;
    }
    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('internship_diary')
        .update({
          is_approved: false,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          coordinator_remarks: bulkRemarks,
        })
        .in('id', selectedEntries);

      if (error) throw error;

      toast({ title: 'Success', description: `${selectedEntries.length} entries rejected` });
      setSelectedEntries([]);
      setBulkRemarks('');
      setShowBulkDialog(null);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setBulkProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!collegeId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No college assigned yet. Please wait for university approval.
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Internship Diary Entries ({filteredEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, USN, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: 'all' | 'pending' | 'approved' | 'rejected') => setStatusFilter(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedEntries.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-medium">{selectedEntries.length} entries selected</span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBulkDialog('reject')}
                >
                  <XCircle className="h-4 w-4 mr-2 text-destructive" />
                  Reject Selected
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowBulkDialog('approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
              </div>
            </div>
          )}

          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No diary entries found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={pendingFilteredEntries.length > 0 && selectedEntries.length === pendingFilteredEntries.length}
                      onCheckedChange={handleSelectAll}
                      disabled={pendingFilteredEntries.length === 0}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => {
                  const status = getApprovalStatus(entry);
                  const isPending = status === 'pending';
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEntries.includes(entry.id)}
                          onCheckedChange={(checked) => handleSelectEntry(entry.id, checked as boolean)}
                          disabled={!isPending}
                        />
                      </TableCell>
                      <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.profile?.full_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{entry.student?.usn || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{entry.internship?.company?.name || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.title}</TableCell>
                      <TableCell>{entry.hours_worked || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}
                        >
                          {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedEntry(entry)}
                          title="View & Approve"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View/Approve Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => { setSelectedEntry(null); setRemarks(''); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Diary Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">{selectedEntry.profile?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedEntry.entry_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedEntry.internship?.company?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Worked</p>
                  <p className="font-medium">{selectedEntry.hours_worked || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Title</p>
                <p className="font-medium">{selectedEntry.title}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Work Summary</p>
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {selectedEntry.content}
                </div>
              </div>

              {selectedEntry.skills_learned && selectedEntry.skills_learned.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Skills Learned</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedEntry.skills_learned.map((skill, i) => (
                      <Badge key={i} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Remarks (optional for approval, required for rejection)</p>
                <Textarea
                  placeholder="Add your remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleReject(selectedEntry.id)}
                  disabled={saving}
                >
                  <XCircle className="h-4 w-4 mr-2 text-destructive" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedEntry.id)}
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={!!showBulkDialog} onOpenChange={() => { setShowBulkDialog(null); setBulkRemarks(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showBulkDialog === 'approve' ? 'Approve' : 'Reject'} {selectedEntries.length} Entries
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {showBulkDialog === 'approve' 
                ? 'You are about to approve the selected diary entries. Add optional remarks below.'
                : 'You are about to reject the selected diary entries. Please provide remarks (required).'}
            </p>
            <Textarea
              placeholder={showBulkDialog === 'approve' ? 'Optional remarks...' : 'Remarks (required)...'}
              value={bulkRemarks}
              onChange={(e) => setBulkRemarks(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowBulkDialog(null); setBulkRemarks(''); }}>
                Cancel
              </Button>
              <Button
                variant={showBulkDialog === 'reject' ? 'destructive' : 'default'}
                onClick={showBulkDialog === 'approve' ? handleBulkApprove : handleBulkReject}
                disabled={bulkProcessing}
              >
                {bulkProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {showBulkDialog === 'approve' ? 'Approve All' : 'Reject All'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
