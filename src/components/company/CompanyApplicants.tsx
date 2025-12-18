import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { User, Mail, Calendar, FileText, Check, X, Clock, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Application {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
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
    degree: string | null;
    skills: string[] | null;
    profile: {
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    };
  };
}

interface Props {
  companyId: string | null;
}

export const CompanyApplicants = ({ companyId }: Props) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState<string>('all');
  const [internships, setInternships] = useState<{ id: string; title: string }[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [updating, setUpdating] = useState(false);

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

    // First get all internship IDs for this company
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

    // Now fetch applications for these internships
    const { data } = await supabase
      .from('applications')
      .select(`
        id, status, applied_at, cover_letter, resume_url,
        internship_id
      `)
      .in('internship_id', internshipIds)
      .order('applied_at', { ascending: false });

    if (!data) {
      setApplications([]);
      setLoading(false);
      return;
    }

    // Fetch related data separately to avoid complex joins
    const studentIds = [...new Set(data.map((a: any) => a.student_id))];
    
    const { data: studentsData } = await supabase
      .from('students')
      .select('id, university, degree, skills, user_id')
      .in('id', studentIds);

    const userIds = studentsData?.map(s => s.user_id) || [];
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, avatar_url')
      .in('user_id', userIds);

    const { data: internshipsData } = await supabase
      .from('internships')
      .select('id, title')
      .in('id', internshipIds);

    // Map the data together
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
          degree: student?.degree,
          skills: student?.skills,
          profile: {
            full_name: profile?.full_name,
            email: profile?.email || '',
            avatar_url: profile?.avatar_url,
          },
        },
      };
    });

    setApplications(enrichedApplications);
    setLoading(false);
  };

  const updateStatus = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    setUpdating(true);
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Application ${newStatus}`);
      fetchApplications();
      setSelectedApplication(null);
    }
    setUpdating(false);
  };

  const filteredApplications = selectedInternship === 'all'
    ? applications
    : applications.filter(a => a.internship.id === selectedInternship);

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const statusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: typeof Clock }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: Check },
      rejected: { variant: 'destructive', icon: X },
      withdrawn: { variant: 'secondary', icon: X },
    };
    const { variant, icon: Icon } = variants[status] || variants.pending;
    return (
      <Badge variant={variant} className="capitalize">
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Applications ({applications.length})</h2>
          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
            <span>{pendingCount} pending</span>
            <span>{approvedCount} approved</span>
            <span>{rejectedCount} rejected</span>
          </div>
        </div>
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
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filteredApplications
              .filter(a => tab === 'all' || a.status === tab)
              .map((application) => (
                <Card key={application.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedApplication(application)}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{application.student.profile.full_name || 'Unknown'}</h3>
                          <p className="text-sm text-muted-foreground">{application.student.university || 'No university'}</p>
                          <p className="text-xs text-muted-foreground">Applied for: {application.internship.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {statusBadge(application.status)}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(application.applied_at), 'MMM d, yyyy')}
                        </span>
                        {application.status === 'pending' && (
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <Button size="sm" onClick={() => updateStatus(application.id, 'approved')} className="gradient-primary border-0">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(application.id, 'rejected')}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {filteredApplications.filter(a => tab === 'all' || a.status === tab).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No {tab === 'all' ? '' : tab} applications found.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedApplication.student.profile.full_name || 'Unknown'}</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedApplication.student.profile.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">University</p>
                  <p className="font-medium">{selectedApplication.student.university || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Degree</p>
                  <p className="font-medium">{selectedApplication.student.degree || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applied For</p>
                  <p className="font-medium">{selectedApplication.internship.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applied On</p>
                  <p className="font-medium">{format(new Date(selectedApplication.applied_at), 'MMMM d, yyyy')}</p>
                </div>
              </div>

              {selectedApplication.student.skills && selectedApplication.student.skills.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.student.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplication.cover_letter && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Cover Letter</p>
                  <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                </div>
              )}

              {selectedApplication.resume_url && (
                <Button variant="outline" asChild>
                  <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    View Resume
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              )}

              {selectedApplication.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t">
                  <Button onClick={() => updateStatus(selectedApplication.id, 'approved')} disabled={updating} className="flex-1 gradient-primary border-0">
                    <Check className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button variant="destructive" onClick={() => updateStatus(selectedApplication.id, 'rejected')} disabled={updating} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}

              {selectedApplication.status !== 'pending' && (
                <div className="pt-4 border-t">
                  <p className="text-center text-muted-foreground">
                    This application has been {selectedApplication.status}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
