import { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Download, Users, Building2, Briefcase, FileText, Loader2, CalendarIcon, X, GraduationCap, School, UserCheck, Shield, Bell, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

type ExportType = 'students' | 'companies' | 'internships' | 'applications' | 'universities' | 'colleges' | 'login_logs' | 'notifications' | 'payments';

export const DataExport = () => {
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const getDateRangeLabel = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    if (startDate) {
      return `From ${format(startDate, 'MMM d, yyyy')}`;
    }
    if (endDate) {
      return `Until ${format(endDate, 'MMM d, yyyy')}`;
    }
    return 'All time';
  };

  const clearDateRange = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const convertToCSV = (data: any[], headers: string[]): string => {
    const headerRow = headers.join(',');
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return `"${value.join('; ')}"`;
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    return [headerRow, ...rows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilenameWithDateRange = (prefix: string) => {
    const datePart = new Date().toISOString().split('T')[0];
    if (startDate && endDate) {
      return `${prefix}_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`;
    }
    return `${prefix}_export_${datePart}.csv`;
  };

  const applyDateFilter = (query: any, dateField: string) => {
    if (startDate) {
      query = query.gte(dateField, startDate.toISOString());
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte(dateField, endOfDay.toISOString());
    }
    return query;
  };

  const exportStudents = async () => {
    setExporting('students');
    try {
      let query = supabase.from('students').select('*').order('created_at', { ascending: false });
      query = applyDateFilter(query, 'created_at');

      const { data: students, error: studentsError } = await query;
      if (studentsError) throw studentsError;

      const userIds = students?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone_number')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const exportData = students?.map(s => ({
        full_name: profileMap.get(s.user_id)?.full_name || '',
        email: profileMap.get(s.user_id)?.email || '',
        phone: profileMap.get(s.user_id)?.phone_number || '',
        college: s.college || '',
        university: s.university || '',
        department: s.department || '',
        degree: s.degree || '',
        graduation_year: s.graduation_year || '',
        city: s.city || '',
        state: s.state || '',
        skills: s.skills || [],
        linkedin_url: s.linkedin_url || '',
        github_url: s.github_url || '',
        created_at: s.created_at,
      })) || [];

      const headers = ['full_name', 'email', 'phone', 'college', 'university', 'department', 'degree', 'graduation_year', 'city', 'state', 'skills', 'linkedin_url', 'github_url', 'created_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('students'));
      toast.success(`Exported ${exportData.length} students`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export students');
    } finally {
      setExporting(null);
    }
  };

  const exportCompanies = async () => {
    setExporting('companies');
    try {
      let query = supabase.from('companies').select('*').order('created_at', { ascending: false });
      query = applyDateFilter(query, 'created_at');

      const { data: companies, error } = await query;
      if (error) throw error;

      const exportData = companies?.map(c => ({
        name: c.name,
        industry: c.industry || '',
        location: c.location || '',
        city: c.city || '',
        state: c.state || '',
        country: c.country || '',
        website: c.website || '',
        employee_count: c.employee_count || '',
        founded_year: c.founded_year || '',
        is_verified: c.is_verified ? 'Yes' : 'No',
        contact_person_name: c.contact_person_name || '',
        contact_person_email: c.contact_person_email || '',
        contact_person_phone: c.contact_person_phone || '',
        linkedin_url: c.linkedin_url || '',
        created_at: c.created_at,
      })) || [];

      const headers = ['name', 'industry', 'location', 'city', 'state', 'country', 'website', 'employee_count', 'founded_year', 'is_verified', 'contact_person_name', 'contact_person_email', 'contact_person_phone', 'linkedin_url', 'created_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('companies'));
      toast.success(`Exported ${exportData.length} companies`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export companies');
    } finally {
      setExporting(null);
    }
  };

  const exportInternships = async () => {
    setExporting('internships');
    try {
      let query = supabase.from('internships').select('*, company:companies(name)').order('created_at', { ascending: false });
      query = applyDateFilter(query, 'created_at');

      const { data: internships, error } = await query;
      if (error) throw error;

      const exportData = internships?.map(i => ({
        title: i.title,
        company_name: (i.company as any)?.name || '',
        domain: i.domain || '',
        location: i.location || '',
        internship_type: i.internship_type,
        work_mode: i.work_mode,
        duration: i.duration || '',
        stipend: i.stipend || '',
        is_paid: i.is_paid ? 'Yes' : 'No',
        positions_available: i.positions_available,
        is_active: i.is_active ? 'Yes' : 'No',
        skills: i.skills || [],
        application_deadline: i.application_deadline || '',
        start_date: i.start_date || '',
        views_count: i.views_count,
        created_at: i.created_at,
      })) || [];

      const headers = ['title', 'company_name', 'domain', 'location', 'internship_type', 'work_mode', 'duration', 'stipend', 'is_paid', 'positions_available', 'is_active', 'skills', 'application_deadline', 'start_date', 'views_count', 'created_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('internships'));
      toast.success(`Exported ${exportData.length} internships`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export internships');
    } finally {
      setExporting(null);
    }
  };

  const exportApplications = async () => {
    setExporting('applications');
    try {
      let query = supabase.from('applications').select('*').order('applied_at', { ascending: false });
      query = applyDateFilter(query, 'applied_at');

      const { data: applications, error } = await query;
      if (error) throw error;

      const studentIds = [...new Set(applications?.map(a => a.student_id) || [])];
      const internshipIds = [...new Set(applications?.map(a => a.internship_id) || [])];

      const [studentsRes, internshipsRes] = await Promise.all([
        supabase.from('students').select('id, user_id').in('id', studentIds),
        supabase.from('internships').select('id, title, company_id').in('id', internshipIds),
      ]);

      const userIds = studentsRes.data?.map(s => s.user_id) || [];
      const companyIds = [...new Set(internshipsRes.data?.map(i => i.company_id) || [])];

      const [profilesRes, companiesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds),
        supabase.from('companies').select('id, name').in('id', companyIds),
      ]);

      const studentMap = new Map(studentsRes.data?.map(s => [s.id, s]));
      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]));
      const internshipMap = new Map(internshipsRes.data?.map(i => [i.id, i]));
      const companyMap = new Map(companiesRes.data?.map(c => [c.id, c]));

      const exportData = applications?.map(a => {
        const student = studentMap.get(a.student_id);
        const profile = student ? profileMap.get(student.user_id) : null;
        const internship = internshipMap.get(a.internship_id);
        const company = internship ? companyMap.get(internship.company_id) : null;

        return {
          student_name: profile?.full_name || '',
          student_email: profile?.email || '',
          internship_title: internship?.title || '',
          company_name: company?.name || '',
          status: a.status,
          cover_letter: a.cover_letter || '',
          resume_url: a.resume_url || '',
          applied_at: a.applied_at,
          updated_at: a.updated_at,
        };
      }) || [];

      const headers = ['student_name', 'student_email', 'internship_title', 'company_name', 'status', 'cover_letter', 'resume_url', 'applied_at', 'updated_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('applications'));
      toast.success(`Exported ${exportData.length} applications`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export applications');
    } finally {
      setExporting(null);
    }
  };

  const exportUniversities = async () => {
    setExporting('universities');
    try {
      let query = supabase.from('universities').select('*').order('created_at', { ascending: false });
      query = applyDateFilter(query, 'created_at');

      const { data: universities, error } = await query;
      if (error) throw error;

      const exportData = universities?.map(u => ({
        name: u.name,
        email: u.email,
        address: u.address || '',
        contact_person_name: u.contact_person_name || '',
        contact_person_email: u.contact_person_email || '',
        contact_person_phone: u.contact_person_phone || '',
        contact_person_designation: u.contact_person_designation || '',
        is_verified: u.is_verified ? 'Yes' : 'No',
        is_active: u.is_active ? 'Yes' : 'No',
        created_at: u.created_at,
      })) || [];

      const headers = ['name', 'email', 'address', 'contact_person_name', 'contact_person_email', 'contact_person_phone', 'contact_person_designation', 'is_verified', 'is_active', 'created_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('universities'));
      toast.success(`Exported ${exportData.length} universities`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export universities');
    } finally {
      setExporting(null);
    }
  };

  const exportColleges = async () => {
    setExporting('colleges');
    try {
      let query = supabase.from('colleges').select('*, university:universities(name)').order('created_at', { ascending: false });
      query = applyDateFilter(query, 'created_at');

      const { data: colleges, error } = await query;
      if (error) throw error;

      const exportData = colleges?.map(c => ({
        name: c.name,
        university_name: (c.university as any)?.name || '',
        email: c.email || '',
        address: c.address || '',
        contact_person_name: c.contact_person_name || '',
        contact_person_email: c.contact_person_email || '',
        contact_person_phone: c.contact_person_phone || '',
        contact_person_designation: c.contact_person_designation || '',
        is_active: c.is_active ? 'Yes' : 'No',
        created_at: c.created_at,
      })) || [];

      const headers = ['name', 'university_name', 'email', 'address', 'contact_person_name', 'contact_person_email', 'contact_person_phone', 'contact_person_designation', 'is_active', 'created_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('colleges'));
      toast.success(`Exported ${exportData.length} colleges`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export colleges');
    } finally {
      setExporting(null);
    }
  };


  const exportLoginLogs = async () => {
    setExporting('login_logs');
    try {
      let query = supabase.from('login_logs').select('*').order('login_at', { ascending: false });
      query = applyDateFilter(query, 'login_at');

      const { data: logs, error } = await query;
      if (error) throw error;

      const exportData = logs?.map(l => ({
        user_email: l.user_email,
        role: l.role,
        ip_address: l.ip_address || '',
        user_agent: l.user_agent || '',
        login_at: l.login_at,
      })) || [];

      const headers = ['user_email', 'role', 'ip_address', 'user_agent', 'login_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('login_logs'));
      toast.success(`Exported ${exportData.length} login logs`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export login logs');
    } finally {
      setExporting(null);
    }
  };

  const exportNotifications = async () => {
    setExporting('notifications');
    try {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      query = applyDateFilter(query, 'created_at');

      const { data: notifications, error } = await query;
      if (error) throw error;

      const exportData = notifications?.map(n => ({
        title: n.title,
        message: n.message,
        type: n.type,
        target_role: n.target_role || '',
        is_read: n.is_read ? 'Yes' : 'No',
        link: n.link || '',
        created_at: n.created_at,
      })) || [];

      const headers = ['title', 'message', 'type', 'target_role', 'is_read', 'link', 'created_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('notifications'));
      toast.success(`Exported ${exportData.length} notifications`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export notifications');
    } finally {
      setExporting(null);
    }
  };

  const exportPayments = async () => {
    setExporting('payments');
    try {
      let query = supabase.from('payment_transactions').select('*, company:companies(name), student:students(user_id)').order('created_at', { ascending: false });
      query = applyDateFilter(query, 'created_at');

      const { data: payments, error } = await query;
      if (error) throw error;

      const studentUserIds = payments?.map(p => (p.student as any)?.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', studentUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const exportData = payments?.map(p => {
        const studentUserId = (p.student as any)?.user_id;
        const profile = studentUserId ? profileMap.get(studentUserId) : null;
        return {
          transaction_type: p.transaction_type,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          payment_method: p.payment_method || '',
          company_name: (p.company as any)?.name || '',
          student_name: profile?.full_name || '',
          student_email: profile?.email || '',
          reference_id: p.reference_id || '',
          notes: p.notes || '',
          created_at: p.created_at,
        };
      }) || [];

      const headers = ['transaction_type', 'amount', 'currency', 'status', 'payment_method', 'company_name', 'student_name', 'student_email', 'reference_id', 'notes', 'created_at'];
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, getFilenameWithDateRange('payment_transactions'));
      toast.success(`Exported ${exportData.length} payment transactions`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export payments');
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      type: 'students' as ExportType,
      title: 'Students',
      description: 'Export registered students with profile, education details, and skills.',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      onClick: exportStudents,
    },
    {
      type: 'companies' as ExportType,
      title: 'Companies',
      description: 'Export companies with profile, contact info, and verification status.',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      onClick: exportCompanies,
    },
    {
      type: 'internships' as ExportType,
      title: 'Internships',
      description: 'Export internship listings with duration, stipend, and requirements.',
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      onClick: exportInternships,
    },
    {
      type: 'applications' as ExportType,
      title: 'Applications',
      description: 'Export student applications with status and internship details.',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      onClick: exportApplications,
    },
    {
      type: 'universities' as ExportType,
      title: 'Universities',
      description: 'Export universities with contact info and verification status.',
      icon: GraduationCap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      onClick: exportUniversities,
    },
    {
      type: 'colleges' as ExportType,
      title: 'Colleges',
      description: 'Export colleges with university mapping and contact details.',
      icon: School,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      onClick: exportColleges,
    },
    {
      type: 'login_logs' as ExportType,
      title: 'Login Logs',
      description: 'Export security audit trail with user logins and IP addresses.',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      onClick: exportLoginLogs,
    },
    {
      type: 'notifications' as ExportType,
      title: 'Notifications',
      description: 'Export all platform notifications with read status and targets.',
      icon: Bell,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      onClick: exportNotifications,
    },
    {
      type: 'payments' as ExportType,
      title: 'Payments',
      description: 'Export payment transactions with amounts and status.',
      icon: CreditCard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      onClick: exportPayments,
    },
  ];

  return (
    <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
    <div className="space-y-6 pr-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          Data Export
        </h2>
        <p className="text-muted-foreground mt-1">
          Download CSV reports of platform data for analysis and record-keeping.
        </p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Date Range Filter
          </CardTitle>
          <CardDescription>
            Select a date range to export data from a specific time period. Leave empty to export all data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => (endDate ? date > endDate : false) || date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false) || date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={clearDateRange} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            <Badge variant="secondary" className="ml-auto">
              {getDateRangeLabel()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exportOptions.map((option) => (
          <Card key={option.type} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${option.bgColor}`}>
                    <option.icon className={`h-5 w-5 ${option.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">CSV</Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="mt-2 text-sm">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={option.onClick} 
                disabled={exporting !== null}
                className="w-full"
                size="sm"
              >
                {exporting === option.type ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Export Information</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• All exports are in CSV format compatible with Excel, Google Sheets, and other spreadsheet applications.</li>
            <li>• When a date range is selected, only records created within that period are exported.</li>
            <li>• The filename includes the selected date range for easy tracking.</li>
            <li>• Arrays (like skills) are exported as semicolon-separated values within quotes.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
    <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};