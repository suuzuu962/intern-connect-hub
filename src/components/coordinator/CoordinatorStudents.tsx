import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, Search, Filter, Users, Briefcase, Building } from 'lucide-react';
import { Student, Company } from '@/types/database';

interface CoordinatorStudentsProps {
  coordinatorId: string;
  collegeId: string | null;
  viewMode: 'summary' | 'detailed';
}

interface StudentWithDetails extends Omit<Student, 'college'> {
  profile?: {
    full_name: string;
    email: string;
  };
  applications?: {
    id: string;
    status: string;
    internship?: {
      title: string;
      company?: Company;
    };
  }[];
}

export const CoordinatorStudents = ({ coordinatorId, collegeId, viewMode }: CoordinatorStudentsProps) => {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
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
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('*')
      .eq('college_id', collegeId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch profiles
    const studentUserIds = (studentsData || []).map((s) => s.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', studentUserIds);

    // Fetch applications with internships and companies
    const studentIds = (studentsData || []).map((s) => s.id);
    const { data: applicationsData } = await supabase
      .from('applications')
      .select('*, internship:internships(*, company:companies(*))')
      .in('student_id', studentIds);

    // Extract unique companies
    const uniqueCompanies = new Map<string, Company>();
    (applicationsData || []).forEach((app: any) => {
      if (app.internship?.company) {
        uniqueCompanies.set(app.internship.company.id, app.internship.company);
      }
    });
    setCompanies(Array.from(uniqueCompanies.values()));

    // Map data together
    const studentsWithDetails = (studentsData || []).map((student) => {
      const profile = (profilesData || []).find((p) => p.user_id === student.user_id);
      const applications = (applicationsData || [])
        .filter((a: any) => a.student_id === student.id)
        .map((a: any) => ({
          id: a.id,
          status: a.status,
          internship: a.internship,
        }));

      return {
        ...student,
        profile,
        applications,
      };
    });

    setStudents(studentsWithDetails);
    setLoading(false);
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.usn?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany =
      companyFilter === 'all' ||
      student.applications?.some((app) => app.internship?.company?.id === companyFilter);

    return matchesSearch && matchesCompany;
  });

  // Summary stats
  const totalStudents = students.length;
  const studentsWithApplications = students.filter((s) => (s.applications?.length || 0) > 0).length;

  // Company-wise breakdown
  const companyWiseData = companies.map((company) => {
    const studentCount = students.filter((s) =>
      s.applications?.some((app) => app.internship?.company?.id === company.id)
    ).length;
    return { company, studentCount };
  });

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

  if (viewMode === 'summary') {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applied to Internships</p>
                  <p className="text-2xl font-bold">{studentsWithApplications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <p className="text-2xl font-bold">{companies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company-wise breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Company-wise Student Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {companyWiseData.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No applications yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Students Applied</TableHead>
                    <TableHead>Industry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyWiseData.map((item) => (
                    <TableRow key={item.company.id}>
                      <TableCell className="font-medium">{item.company.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.studentCount}</Badge>
                      </TableCell>
                      <TableCell>{item.company.industry || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Students ({filteredStudents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or USN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by company" />
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
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No students found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>USN</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Applications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.profile?.full_name || '-'}
                  </TableCell>
                  <TableCell>{student.profile?.email || '-'}</TableCell>
                  <TableCell>{student.usn || '-'}</TableCell>
                  <TableCell>{student.department || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={student.applications?.length ? 'default' : 'secondary'}>
                      {student.applications?.length || 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
