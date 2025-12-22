import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Download, Users, Building2, Briefcase, FileText, Loader2, CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ExportType = 'students' | 'companies' | 'internships' | 'applications';

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

  const exportStudents = async () => {
    setExporting('students');
    try {
      let query = supabase.from('students').select('*').order('created_at', { ascending: false });
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

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
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

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
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

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
      
      if (startDate) {
        query = query.gte('applied_at', startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('applied_at', endOfDay.toISOString());
      }

      const { data: applications, error } = await query;
      if (error) throw error;

      // Fetch related data
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

  const exportOptions = [
    {
      type: 'students' as ExportType,
      title: 'Students',
      description: 'Export registered students with their profile information, education details, and skills.',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      onClick: exportStudents,
    },
    {
      type: 'companies' as ExportType,
      title: 'Companies',
      description: 'Export companies with their profile, contact information, and verification status.',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      onClick: exportCompanies,
    },
    {
      type: 'internships' as ExportType,
      title: 'Internships',
      description: 'Export internship listings with details like duration, stipend, and requirements.',
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      onClick: exportInternships,
    },
    {
      type: 'applications' as ExportType,
      title: 'Applications',
      description: 'Export student applications with status, student details, and internship information.',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      onClick: exportApplications,
    },
  ];

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2">
        {exportOptions.map((option) => (
          <Card key={option.type} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${option.bgColor}`}>
                    <option.icon className={`h-6 w-6 ${option.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1">CSV</Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="mt-3">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={option.onClick} 
                disabled={exporting !== null}
                className="w-full gradient-primary border-0"
              >
                {exporting === option.type ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export {option.title}
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
  );
};