import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { User, Mail, Calendar, FileText, Check, X, Clock, ExternalLink, MapPin, GraduationCap, Briefcase, Link as LinkIcon, FileSearch, ThumbsUp, Send, CheckSquare, Loader2, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'offer_released' | 'rejected' | 'withdrawn';

interface Application {
  id: string;
  status: ApplicationStatus;
  applied_at: string;
  cover_letter: string | null;
  resume_url: string | null;
  internship: {
    id: string;
    title: string;
  };
  student: {
    id: string;
    university: string | null;
    college: string | null;
    degree: string | null;
    department: string | null;
    semester: number | null;
    graduation_year: number | null;
    skills: string[] | null;
    interested_domains: string[] | null;
    bio: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    resume_url: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    usn: string | null;
    profile: {
      full_name: string | null;
      email: string;
      phone_number: string | null;
      avatar_url: string | null;
    };
  };
}

interface Props {
  companyId: string | null;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-500' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-500' },
  { value: 'offer_released', label: 'Offer Released', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export const CompanyApplicants = ({ companyId }: Props) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState<string>('all');
  const [internships, setInternships] = useState<{ id: string; title: string }[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchInternships();
      fetchApplications();
    }
  }, [companyId]);

  const fetchInternships = async () => {
    const { data } = await supabase
      .from('internships')
      .select('id, title')
      .eq('company_id', companyId);
    setInternships(data || []);
  };

  const fetchApplications = async () => {
    setLoading(true);

    const { data: internshipData } = await supabase
      .from('internships')
      .select('id')
      .eq('company_id', companyId);

    if (!internshipData?.length) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const internshipIds = internshipData.map(i => i.id);

    const { data } = await supabase
      .from('applications')
      .select(`
        id, status, applied_at, cover_letter, resume_url,
        internship_id, student_id
      `)
      .in('internship_id', internshipIds)
      .order('applied_at', { ascending: false });

    if (!data) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const studentIds = [...new Set(data.map((a: any) => a.student_id))];
    
    const { data: studentsData } = await supabase
      .from('students')
      .select('id, university, college, degree, department, semester, graduation_year, skills, interested_domains, bio, linkedin_url, github_url, resume_url, city, state, country, usn, user_id')
      .in('id', studentIds);

    const userIds = studentsData?.map(s => s.user_id) || [];
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone_number, avatar_url')
      .in('user_id', userIds);

    const { data: internshipsData } = await supabase
      .from('internships')
      .select('id, title')
      .in('id', internshipIds);

    const enrichedApplications: Application[] = data.map((app: any) => {
      const student = studentsData?.find(s => s.id === app.student_id);
      const profile = profilesData?.find(p => p.user_id === student?.user_id);
      const internship = internshipsData?.find(i => i.id === app.internship_id);

      return {
        ...app,
        internship: internship || { id: app.internship_id, title: 'Unknown' },
        student: {
          id: student?.id || '',
          university: student?.university,
          college: student?.college,
          degree: student?.degree,
          department: student?.department,
          semester: student?.semester,
          graduation_year: student?.graduation_year,
          skills: student?.skills,
          interested_domains: student?.interested_domains,
          bio: student?.bio,
          linkedin_url: student?.linkedin_url,
          github_url: student?.github_url,
          resume_url: student?.resume_url,
          city: student?.city,
          state: student?.state,
          country: student?.country,
          usn: student?.usn,
          profile: {
            full_name: profile?.full_name,
            email: profile?.email || '',
            phone_number: profile?.phone_number,
            avatar_url: profile?.avatar_url,
          },
        },
      };
    });

    setApplications(enrichedApplications);
    setLoading(false);
  };

  const updateStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    const app = applications.find(a => a.id === applicationId);
    
    // Prevent status change if already rejected
    if (app?.status === 'rejected') {
      toast.error('Cannot change status of rejected applications');
      return;
    }

    setUpdating(true);
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchApplications();
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
    setUpdating(false);
  };

  // Bulk update function
  const bulkUpdateStatus = async (newStatus: ApplicationStatus) => {
    const eligibleIds = Array.from(selectedIds).filter(id => {
      const app = applications.find(a => a.id === id);
      return app && app.status !== 'rejected' && app.status !== 'withdrawn';
    });

    if (eligibleIds.length === 0) {
      toast.error('No eligible applications to update');
      return;
    }

    setBulkUpdating(true);
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .in('id', eligibleIds);

    if (error) {
      toast.error('Failed to update applications');
    } else {
      toast.success(`${eligibleIds.length} application(s) updated to ${newStatus.replace('_', ' ')}`);
      setSelectedIds(new Set());
      fetchApplications();
    }
    setBulkUpdating(false);
  };

  // Selection helpers
  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = (tabApplications: Application[]) => {
    const eligibleIds = tabApplications
      .filter(a => a.status !== 'rejected' && a.status !== 'withdrawn')
      .map(a => a.id);
    setSelectedIds(new Set(eligibleIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredApplications.length === 0) {
      toast.error('No applications to export');
      return;
    }

    const headers = [
      'Applicant Name',
      'Email',
      'Phone',
      'University',
      'College',
      'Degree',
      'Department',
      'Semester',
      'Graduation Year',
      'USN',
      'City',
      'State',
      'Country',
      'Skills',
      'Interested Domains',
      'LinkedIn',
      'GitHub',
      'Resume URL',
      'Internship Title',
      'Status',
      'Applied Date',
      'Cover Letter'
    ];

    const rows = filteredApplications.map(app => [
      app.student.profile.full_name || '',
      app.student.profile.email || '',
      app.student.profile.phone_number || '',
      app.student.university || '',
      app.student.college || '',
      app.student.degree || '',
      app.student.department || '',
      app.student.semester?.toString() || '',
      app.student.graduation_year?.toString() || '',
      app.student.usn || '',
      app.student.city || '',
      app.student.state || '',
      app.student.country || '',
      app.student.skills?.join('; ') || '',
      app.student.interested_domains?.join('; ') || '',
      app.student.linkedin_url || '',
      app.student.github_url || '',
      app.student.resume_url || app.resume_url || '',
      app.internship.title || '',
      app.status.replace('_', ' '),
      format(new Date(app.applied_at), 'yyyy-MM-dd'),
      (app.cover_letter || '').replace(/[\n\r,]/g, ' ')
    ]);

    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applications_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredApplications.length} application(s) to CSV`);
  };

  const filteredApplications = selectedInternship === 'all'
    ? applications
    : applications.filter(a => a.internship.id === selectedInternship);

  const appliedCount = applications.filter(a => a.status === 'applied').length;
  const underReviewCount = applications.filter(a => a.status === 'under_review').length;
  const shortlistedCount = applications.filter(a => a.status === 'shortlisted').length;
  const offerReleasedCount = applications.filter(a => a.status === 'offer_released').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const statusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: typeof Clock; label: string }> = {
      applied: { className: 'bg-blue-500/10 text-blue-500', icon: Send, label: 'Applied' },
      under_review: { className: 'bg-yellow-500/10 text-yellow-500', icon: FileSearch, label: 'Under Review' },
      shortlisted: { className: 'bg-purple-500/10 text-purple-500', icon: ThumbsUp, label: 'Shortlisted' },
      offer_released: { className: 'bg-green-500/10 text-green-500', icon: Check, label: 'Offer Released' },
      rejected: { className: 'bg-red-500/10 text-red-500', icon: X, label: 'Rejected' },
      withdrawn: { className: 'bg-gray-500/10 text-gray-500', icon: X, label: 'Withdrawn' },
    };
    const { className, icon: Icon, label } = variants[status] || variants.applied;
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getAvailableStatusOptions = (currentStatus: ApplicationStatus) => {
    if (currentStatus === 'rejected') return [];
    if (currentStatus === 'withdrawn') return [];
    return STATUS_OPTIONS.filter(opt => opt.value !== currentStatus);
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Applications ({applications.length})</h2>
          <div className="flex gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
            <span>{appliedCount} applied</span>
            <span>{underReviewCount} under review</span>
            <span>{shortlistedCount} shortlisted</span>
            <span>{offerReleasedCount} offers</span>
            <span>{rejectedCount} rejected</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedInternship} onValueChange={setSelectedInternship}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by internship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Internships</SelectItem>
              {internships.map(i => (
                <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV} disabled={filteredApplications.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedIds.size} application(s) selected</span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground self-center mr-2">Change status to:</span>
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={option.value === 'rejected' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => bulkUpdateStatus(option.value)}
                    disabled={bulkUpdating}
                  >
                    {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="applied" onValueChange={() => clearSelection()}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="applied">Applied ({appliedCount})</TabsTrigger>
          <TabsTrigger value="under_review">Under Review ({underReviewCount})</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted ({shortlistedCount})</TabsTrigger>
          <TabsTrigger value="offer_released">Offers ({offerReleasedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {['applied', 'under_review', 'shortlisted', 'offer_released', 'rejected', 'all'].map((tab) => {
          const tabApplications = filteredApplications.filter(a => tab === 'all' || a.status === tab);
          const selectableApplications = tabApplications.filter(a => a.status !== 'rejected' && a.status !== 'withdrawn');
          const allSelected = selectableApplications.length > 0 && selectableApplications.every(a => selectedIds.has(a.id));

          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {/* Select All for Tab */}
              {tabApplications.length > 0 && tab !== 'rejected' && (
                <div className="flex items-center gap-3 px-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAll(tabApplications);
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all {selectableApplications.length} application(s)
                  </span>
                </div>
              )}

              {tabApplications.map((application) => {
                const isSelectable = application.status !== 'rejected' && application.status !== 'withdrawn';
                const isSelected = selectedIds.has(application.id);

                return (
                  <Card 
                    key={application.id} 
                    className={`hover:border-primary/50 transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setSelectedApplication(application)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {isSelectable && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {}}
                              onClick={(e) => toggleSelection(application.id, e)}
                            />
                          )}
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{application.student.profile.full_name || 'Unknown'}</h3>
                            <p className="text-sm text-muted-foreground">{application.student.college || application.student.university || 'No college'}</p>
                            <p className="text-xs text-muted-foreground">Applied for: {application.internship.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {statusBadge(application.status)}
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(application.applied_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {tabApplications.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No {tab === 'all' ? '' : tab.replace('_', ' ')} applications found.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Applicant Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedApplication.student.profile.full_name || 'Unknown'}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {selectedApplication.student.profile.email}
                      </span>
                      {selectedApplication.student.profile.phone_number && (
                        <span>{selectedApplication.student.profile.phone_number}</span>
                      )}
                    </div>
                  </div>
                  {statusBadge(selectedApplication.status)}
                </div>

                <Separator />

                {/* Academic Details */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Academic Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">College/University</p>
                      <p className="font-medium">{selectedApplication.student.college || selectedApplication.student.university || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Degree</p>
                      <p className="font-medium">{selectedApplication.student.degree || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedApplication.student.department || 'Not specified'}</p>
                    </div>
                    {selectedApplication.student.usn && (
                      <div>
                        <p className="text-muted-foreground">USN/Roll No</p>
                        <p className="font-medium">{selectedApplication.student.usn}</p>
                      </div>
                    )}
                    {selectedApplication.student.semester && (
                      <div>
                        <p className="text-muted-foreground">Semester</p>
                        <p className="font-medium">{selectedApplication.student.semester}</p>
                      </div>
                    )}
                    {selectedApplication.student.graduation_year && (
                      <div>
                        <p className="text-muted-foreground">Graduation Year</p>
                        <p className="font-medium">{selectedApplication.student.graduation_year}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Location Details */}
                {(selectedApplication.student.city || selectedApplication.student.state || selectedApplication.student.country) && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h4>
                      <p className="text-sm">
                        {[selectedApplication.student.city, selectedApplication.student.state, selectedApplication.student.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Skills */}
                {selectedApplication.student.skills && selectedApplication.student.skills.length > 0 && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.student.skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Interested Domains */}
                {selectedApplication.student.interested_domains && selectedApplication.student.interested_domains.length > 0 && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3">Interested Domains</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.student.interested_domains.map((domain: string) => (
                          <Badge key={domain} variant="outline">{domain}</Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Links */}
                {(selectedApplication.student.linkedin_url || selectedApplication.student.github_url) && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Links
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {selectedApplication.student.linkedin_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedApplication.student.linkedin_url} target="_blank" rel="noopener noreferrer">
                              LinkedIn <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        )}
                        {selectedApplication.student.github_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedApplication.student.github_url} target="_blank" rel="noopener noreferrer">
                              GitHub <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Resume */}
                {(selectedApplication.resume_url || selectedApplication.student.resume_url) && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Resume
                      </h4>
                      <Button variant="outline" asChild>
                        <a href={selectedApplication.resume_url || selectedApplication.student.resume_url || ''} target="_blank" rel="noopener noreferrer">
                          View Resume <ExternalLink className="h-3 w-3 ml-2" />
                        </a>
                      </Button>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Cover Letter */}
                {selectedApplication.cover_letter && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3">Cover Letter</h4>
                      <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Application Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Applied For</p>
                    <p className="font-medium">{selectedApplication.internship.title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Applied On</p>
                    <p className="font-medium">{format(new Date(selectedApplication.applied_at), 'MMMM d, yyyy')}</p>
                  </div>
                </div>

                <Separator />

                {/* Status Update */}
                <div>
                  <h4 className="font-semibold mb-3">Update Status</h4>
                  {selectedApplication.status === 'rejected' ? (
                    <p className="text-sm text-muted-foreground italic">
                      This application has been rejected. Status cannot be changed.
                    </p>
                  ) : selectedApplication.status === 'withdrawn' ? (
                    <p className="text-sm text-muted-foreground italic">
                      This application has been withdrawn by the student.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getAvailableStatusOptions(selectedApplication.status).map((option) => (
                        <Button
                          key={option.value}
                          variant={option.value === 'rejected' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => updateStatus(selectedApplication.id, option.value)}
                          disabled={updating}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};