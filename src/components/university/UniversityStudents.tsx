import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, Search, Filter, Users, School, Briefcase } from 'lucide-react';
import { College, Student } from '@/types/database';

interface UniversityStudentsProps {
  universityId: string;
  viewMode: 'summary' | 'detailed';
}

interface StudentWithDetails extends Omit<Student, 'college'> {
  collegeData?: College;
  profile?: {
    full_name: string;
    email: string;
  };
  applications_count?: number;
}

export const UniversityStudents = ({ universityId, viewMode }: UniversityStudentsProps) => {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [universityId]);

  const fetchData = async () => {
    // Fetch colleges under this university
    const { data: collegesData } = await supabase
      .from('colleges')
      .select('*')
      .eq('university_id', universityId);

    setColleges(collegesData || []);

    const collegeIds = (collegesData || []).map((c) => c.id);

    if (collegeIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    // Fetch students from these colleges
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('*, college:colleges(*)')
      .in('college_id', collegeIds);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch profiles for students
    const studentUserIds = (studentsData || []).map((s) => s.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', studentUserIds);

    // Fetch applications count
    const studentIds = (studentsData || []).map((s) => s.id);
    const { data: applicationsData } = await supabase
      .from('applications')
      .select('student_id')
      .in('student_id', studentIds);

    // Map data together
    const studentsWithDetails = (studentsData || []).map((student: any) => {
      const profile = (profilesData || []).find((p) => p.user_id === student.user_id);
      const applicationsCount = (applicationsData || []).filter(
        (a) => a.student_id === student.id
      ).length;

      return {
        ...student,
        collegeData: student.college,
        profile,
        applications_count: applicationsCount,
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
    const matchesCollege = collegeFilter === 'all' || student.college_id === collegeFilter;
    return matchesSearch && matchesCollege;
  });

  // Summary stats
  const totalStudents = students.length;
  const studentsWithApplications = students.filter((s) => (s.applications_count || 0) > 0).length;
  const collegeWiseCount = colleges.map((college) => ({
    ...college,
    studentCount: students.filter((s) => s.college_id === college.id).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
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
                  <School className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Colleges</p>
                  <p className="text-2xl font-bold">{colleges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* College-wise breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>College-wise Student Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {collegeWiseCount.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No colleges added yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>College Name</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Contact Person</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collegeWiseCount.map((college) => (
                    <TableRow key={college.id}>
                      <TableCell className="font-medium">{college.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{college.studentCount}</Badge>
                      </TableCell>
                      <TableCell>{college.contact_person_name || '-'}</TableCell>
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
            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by college" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {colleges.map((college) => (
                  <SelectItem key={college.id} value={college.id}>
                    {college.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No students found. Students need to select their college in their profile.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>USN</TableHead>
                <TableHead>College</TableHead>
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
                  <TableCell>{student.collegeData?.name || '-'}</TableCell>
                  <TableCell>{student.department || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={student.applications_count ? 'default' : 'secondary'}>
                      {student.applications_count || 0}
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
