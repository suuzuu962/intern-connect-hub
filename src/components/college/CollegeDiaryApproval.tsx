import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, BookOpen, Search, Filter, CheckCircle, Eye, XCircle, CheckSquare, 
  Download, BarChart3, Clock, TrendingUp, Users, Building, Calendar,
  FileText, AlertCircle
} from 'lucide-react';

interface CollegeDiaryApprovalProps {
  collegeId: string;
  collegeName?: string;
  onPendingCountChange?: (count: number) => void;
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

interface DepartmentStats {
  department: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export const CollegeDiaryApproval = ({ collegeId, collegeName, onPendingCountChange }: CollegeDiaryApprovalProps) => {
  const { user } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntryWithDetails[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntryWithDetails | null>(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState<'approve' | 'reject' | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'entries' | 'analytics'>('entries');
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
      onPendingCountChange?.(0);
      return;
    }

    const studentIds = studentsData.map((s) => s.id);
    const studentUserIds = studentsData.map((s) => s.user_id);

    // Extract unique departments
    const uniqueDepts = [...new Set(studentsData.map(s => s.department).filter(Boolean))] as string[];
    setDepartments(uniqueDepts);

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
    
    // Calculate pending count
    const pendingCount = entriesWithDetails.filter(e => e.approved_at === null).length;
    onPendingCountChange?.(pendingCount);
    
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

    const matchesDepartment =
      departmentFilter === 'all' || entry.student?.department === departmentFilter;

    const status = getApprovalStatus(entry);
    const matchesStatus =
      statusFilter === 'all' || statusFilter === status;

    return matchesSearch && matchesCompany && matchesDepartment && matchesStatus;
  });

  const pendingFilteredEntries = filteredEntries.filter(e => getApprovalStatus(e) === 'pending');

  // Analytics calculations
  const stats = {
    total: diaryEntries.length,
    pending: diaryEntries.filter(e => getApprovalStatus(e) === 'pending').length,
    approved: diaryEntries.filter(e => getApprovalStatus(e) === 'approved').length,
    rejected: diaryEntries.filter(e => getApprovalStatus(e) === 'rejected').length,
    totalHours: diaryEntries.reduce((acc, e) => acc + (e.hours_worked || 0), 0),
    uniqueStudents: new Set(diaryEntries.map(e => e.student_id)).size,
    uniqueCompanies: new Set(diaryEntries.map(e => e.internship?.company?.id).filter(Boolean)).size,
  };

  const departmentStats: DepartmentStats[] = departments.map(dept => {
    const deptEntries = diaryEntries.filter(e => e.student?.department === dept);
    return {
      department: dept,
      total: deptEntries.length,
      pending: deptEntries.filter(e => getApprovalStatus(e) === 'pending').length,
      approved: deptEntries.filter(e => getApprovalStatus(e) === 'approved').length,
      rejected: deptEntries.filter(e => getApprovalStatus(e) === 'rejected').length,
    };
  });

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

  const handleExportCSV = () => {
    const headers = ['Date', 'Student', 'USN', 'Department', 'Company', 'Title', 'Hours', 'Status', 'Remarks'];
    const rows = filteredEntries.map(entry => [
      new Date(entry.entry_date).toLocaleDateString(),
      entry.profile?.full_name || '-',
      entry.student?.usn || '-',
      entry.student?.department || '-',
      entry.internship?.company?.name || '-',
      entry.title,
      entry.hours_worked || '-',
      getApprovalStatus(entry),
      entry.coordinator_remarks || '-',
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Success', description: 'CSV exported successfully' });
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
        No college assigned yet. Please wait for approval.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with College Branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Diary Approval Center</h2>
            {collegeName && (
              <p className="text-sm text-muted-foreground">{collegeName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{stats.uniqueStudents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'entries' | 'analytics')}>
        <TabsList>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Entries
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Diary Entries ({filteredEntries.length})
              </CardTitle>
              <CardDescription>
                Review and approve internship diary entries from students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name, USN, or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Depts</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="flex items-center gap-4 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
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
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No diary entries found.</p>
                </div>
              ) : (
                <div className="rounded-md border">
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
                        <TableHead>Department</TableHead>
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
                            <TableCell className="whitespace-nowrap">
                              {new Date(entry.entry_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{entry.profile?.full_name || '-'}</p>
                                <p className="text-xs text-muted-foreground">{entry.student?.usn || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{entry.student?.department || '-'}</Badge>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Department Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Department Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {departmentStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No department data available</p>
                ) : (
                  <div className="space-y-4">
                    {departmentStats.map((dept) => (
                      <div key={dept.department} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{dept.department}</span>
                          <span className="text-sm text-muted-foreground">{dept.total} entries</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          {dept.approved > 0 && (
                            <div 
                              className="bg-green-500 rounded-full" 
                              style={{ width: `${(dept.approved / dept.total) * 100}%` }}
                            />
                          )}
                          {dept.pending > 0 && (
                            <div 
                              className="bg-orange-500 rounded-full" 
                              style={{ width: `${(dept.pending / dept.total) * 100}%` }}
                            />
                          )}
                          {dept.rejected > 0 && (
                            <div 
                              className="bg-red-500 rounded-full" 
                              style={{ width: `${(dept.rejected / dept.total) * 100}%` }}
                            />
                          )}
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Approved: {dept.approved}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            Pending: {dept.pending}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            Rejected: {dept.rejected}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No company data available</p>
                ) : (
                  <div className="space-y-3">
                    {companies.map((company) => {
                      const companyEntries = diaryEntries.filter(e => e.internship?.company?.id === company.id);
                      const count = companyEntries.length;
                      const hours = companyEntries.reduce((acc, e) => acc + (e.hours_worked || 0), 0);
                      return (
                        <div key={company.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-xs text-muted-foreground">{count} entries</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{hours.toFixed(1)}h</p>
                            <p className="text-xs text-muted-foreground">Total hours</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diaryEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{entry.profile?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{entry.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={getApprovalStatus(entry) === 'approved' ? 'default' : getApprovalStatus(entry) === 'rejected' ? 'destructive' : 'secondary'}
                        >
                          {getApprovalStatus(entry)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* View/Approve Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => { setSelectedEntry(null); setRemarks(''); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Diary Entry Details</DialogTitle>
            <DialogDescription>
              Review the entry and approve or reject with remarks
            </DialogDescription>
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
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedEntry.student?.department || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">USN</p>
                  <p className="font-medium">{selectedEntry.student?.usn || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Title</p>
                <p className="font-medium">{selectedEntry.title}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Work Summary</p>
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
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

              {selectedEntry.coordinator_remarks && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Previous Remarks</p>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                    {selectedEntry.coordinator_remarks}
                  </div>
                </div>
              )}

              {getApprovalStatus(selectedEntry) === 'pending' && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Remarks (optional for approval, required for rejection)
                    </p>
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
                </>
              )}

              {getApprovalStatus(selectedEntry) !== 'pending' && (
                <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                  <Badge variant={getApprovalStatus(selectedEntry) === 'approved' ? 'default' : 'destructive'}>
                    {getApprovalStatus(selectedEntry) === 'approved' ? 'Approved' : 'Rejected'}
                  </Badge>
                </div>
              )}
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
            <DialogDescription>
              {showBulkDialog === 'approve' 
                ? 'You are about to approve the selected diary entries.'
                : 'You are about to reject the selected diary entries.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
    </div>
  );
};
