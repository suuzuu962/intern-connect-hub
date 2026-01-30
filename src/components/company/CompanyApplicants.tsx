import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { User, Mail, Calendar, FileText, Check, X, Clock, ExternalLink, MapPin, GraduationCap, Briefcase, Link as LinkIcon, FileSearch, ThumbsUp, Send, CheckSquare, Loader2, Download, Search, Filter, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileSkeleton } from '@/components/ui/dialog-skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'offer_released' | 'offer_accepted' | 'rejected' | 'withdrawn';

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

interface ApplicantFilters {
  search: string;
  colleges: string[];
  skills: string[];
  domains: string[];
  departments: string[];
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-500' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-500' },
  { value: 'offer_released', label: 'Offer Released', color: 'bg-green-500' },
  { value: 'offer_accepted', label: 'Offer Accepted', color: 'bg-emerald-600' },
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
  const [filters, setFilters] = useState<ApplicantFilters>({
    search: '',
    colleges: [],
    skills: [],
    domains: [],
    departments: [],
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Extract unique values for filter options from applications
  const filterOptions = useMemo(() => {
    const colleges = new Set<string>();
    const skills = new Set<string>();
    const domains = new Set<string>();
    const departments = new Set<string>();

    applications.forEach(app => {
      if (app.student.college) colleges.add(app.student.college);
      if (app.student.university) colleges.add(app.student.university);
      if (app.student.department) departments.add(app.student.department);
      app.student.skills?.forEach(skill => skills.add(skill));
      app.student.interested_domains?.forEach(domain => domains.add(domain));
    });

    return {
      colleges: Array.from(colleges).sort(),
      skills: Array.from(skills).sort(),
      domains: Array.from(domains).sort(),
      departments: Array.from(departments).sort(),
    };
  }, [applications]);

  const activeFilterCount = 
    filters.colleges.length + 
    filters.skills.length + 
    filters.domains.length + 
    filters.departments.length +
    (filters.search ? 1 : 0);

  const clearFilters = () => {
    setFilters({
      search: '',
      colleges: [],
      skills: [],
      domains: [],
      departments: [],
    });
  };

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

  // Apply all filters
  const filteredApplications = useMemo(() => {
    let result = selectedInternship === 'all'
      ? applications
      : applications.filter(a => a.internship.id === selectedInternship);

    // Search filter (name, email, USN)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(a => 
        a.student.profile.full_name?.toLowerCase().includes(searchLower) ||
        a.student.profile.email.toLowerCase().includes(searchLower) ||
        a.student.usn?.toLowerCase().includes(searchLower)
      );
    }

    // College filter
    if (filters.colleges.length > 0) {
      result = result.filter(a => 
        (a.student.college && filters.colleges.includes(a.student.college)) ||
        (a.student.university && filters.colleges.includes(a.student.university))
      );
    }

    // Department filter
    if (filters.departments.length > 0) {
      result = result.filter(a => 
        a.student.department && filters.departments.includes(a.student.department)
      );
    }

    // Skills filter (match any)
    if (filters.skills.length > 0) {
      result = result.filter(a => 
        a.student.skills?.some(skill => filters.skills.includes(skill))
      );
    }

    // Domains filter (match any)
    if (filters.domains.length > 0) {
      result = result.filter(a => 
        a.student.interested_domains?.some(domain => filters.domains.includes(domain))
      );
    }

    return result;
  }, [applications, selectedInternship, filters]);

  const appliedCount = filteredApplications.filter(a => a.status === 'applied').length;
  const underReviewCount = filteredApplications.filter(a => a.status === 'under_review').length;
  const shortlistedCount = filteredApplications.filter(a => a.status === 'shortlisted').length;
  const offerReleasedCount = filteredApplications.filter(a => a.status === 'offer_released').length;
  const offerAcceptedCount = filteredApplications.filter(a => a.status === 'offer_accepted').length;
  const rejectedCount = filteredApplications.filter(a => a.status === 'rejected').length;

  const statusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: typeof Clock; label: string }> = {
      applied: { className: 'bg-blue-500/10 text-blue-500', icon: Send, label: 'Applied' },
      under_review: { className: 'bg-yellow-500/10 text-yellow-500', icon: FileSearch, label: 'Under Review' },
      shortlisted: { className: 'bg-purple-500/10 text-purple-500', icon: ThumbsUp, label: 'Shortlisted' },
      offer_released: { className: 'bg-green-500/10 text-green-500', icon: Check, label: 'Offer Released' },
      offer_accepted: { className: 'bg-emerald-600/10 text-emerald-600', icon: Check, label: 'Offer Accepted' },
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
    if (currentStatus === 'offer_accepted') return []; // Cannot change status after student accepts
    return STATUS_OPTIONS.filter(opt => opt.value !== currentStatus && opt.value !== 'offer_accepted');
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Applications ({filteredApplications.length}
            {activeFilterCount > 0 && ` of ${applications.length}`})
          </h2>
          <div className="flex gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
            <span>{appliedCount} applied</span>
            <span>{underReviewCount} under review</span>
            <span>{shortlistedCount} shortlisted</span>
            <span>{offerReleasedCount} offers</span>
            <span className="text-emerald-600 font-medium">{offerAcceptedCount} accepted</span>
            <span>{rejectedCount} rejected</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedInternship} onValueChange={setSelectedInternship}>
            <SelectTrigger className="w-48">
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

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or USN..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          {/* Filter Popover */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter Applicants</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>

                {/* College/University Filter */}
                {filterOptions.colleges.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium">
                      College/University
                      {filters.colleges.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5">{filters.colleges.length}</Badge>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ScrollArea className="h-32 mt-2">
                        <div className="space-y-2">
                          {filterOptions.colleges.map(college => (
                            <label key={college} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={filters.colleges.includes(college)}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    colleges: checked 
                                      ? [...prev.colleges, college]
                                      : prev.colleges.filter(c => c !== college)
                                  }));
                                }}
                              />
                              <span className="truncate">{college}</span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Department Filter */}
                {filterOptions.departments.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium">
                      Department
                      {filters.departments.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5">{filters.departments.length}</Badge>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ScrollArea className="h-32 mt-2">
                        <div className="space-y-2">
                          {filterOptions.departments.map(dept => (
                            <label key={dept} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={filters.departments.includes(dept)}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    departments: checked 
                                      ? [...prev.departments, dept]
                                      : prev.departments.filter(d => d !== dept)
                                  }));
                                }}
                              />
                              <span className="truncate">{dept}</span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Skills Filter */}
                {filterOptions.skills.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium">
                      Skills
                      {filters.skills.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5">{filters.skills.length}</Badge>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ScrollArea className="h-32 mt-2">
                        <div className="space-y-2">
                          {filterOptions.skills.map(skill => (
                            <label key={skill} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={filters.skills.includes(skill)}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    skills: checked 
                                      ? [...prev.skills, skill]
                                      : prev.skills.filter(s => s !== skill)
                                  }));
                                }}
                              />
                              <span className="truncate">{skill}</span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Domains Filter */}
                {filterOptions.domains.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium">
                      Domains
                      {filters.domains.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5">{filters.domains.length}</Badge>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ScrollArea className="h-32 mt-2">
                        <div className="space-y-2">
                          {filterOptions.domains.map(domain => (
                            <label key={domain} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={filters.domains.includes(domain)}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    domains: checked 
                                      ? [...prev.domains, domain]
                                      : prev.domains.filter(d => d !== domain)
                                  }));
                                }}
                              />
                              <span className="truncate">{domain}</span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: "{filters.search}"
                <XCircle 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))} 
                />
              </Badge>
            )}
            {filters.colleges.map(college => (
              <Badge key={college} variant="secondary" className="gap-1">
                {college}
                <XCircle 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    colleges: prev.colleges.filter(c => c !== college) 
                  }))} 
                />
              </Badge>
            ))}
            {filters.departments.map(dept => (
              <Badge key={dept} variant="secondary" className="gap-1">
                {dept}
                <XCircle 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    departments: prev.departments.filter(d => d !== dept) 
                  }))} 
                />
              </Badge>
            ))}
            {filters.skills.map(skill => (
              <Badge key={skill} variant="secondary" className="gap-1">
                {skill}
                <XCircle 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    skills: prev.skills.filter(s => s !== skill) 
                  }))} 
                />
              </Badge>
            ))}
            {filters.domains.map(domain => (
              <Badge key={domain} variant="secondary" className="gap-1">
                {domain}
                <XCircle 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    domains: prev.domains.filter(d => d !== domain) 
                  }))} 
                />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
              Clear all
            </Button>
          </div>
        )}
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
          <TabsTrigger value="offer_accepted">Accepted ({offerAcceptedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {['applied', 'under_review', 'shortlisted', 'offer_released', 'offer_accepted', 'rejected', 'all'].map((tab) => {
          const tabApplications = filteredApplications.filter(a => tab === 'all' || a.status === tab);
          const selectableApplications = tabApplications.filter(a => a.status !== 'rejected' && a.status !== 'withdrawn' && a.status !== 'offer_accepted');
          const allSelected = selectableApplications.length > 0 && selectableApplications.every(a => selectedIds.has(a.id));

          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {/* Select All for Tab */}
              {tabApplications.length > 0 && tab !== 'rejected' && tab !== 'offer_accepted' && (
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