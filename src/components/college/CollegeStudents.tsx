import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Users } from 'lucide-react';
import { Student } from '@/types/database';

interface CollegeStudentsProps {
  collegeId: string;
  viewMode: 'summary' | 'detailed';
}

export const CollegeStudents = ({ collegeId, viewMode }: CollegeStudentsProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*, profile:profiles!students_user_id_fkey(*)')
        .eq('college_id', collegeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
      }
      setLoading(false);
    };

    fetchStudents();
  }, [collegeId]);

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.usn?.toLowerCase().includes(searchLower) ||
      student.department?.toLowerCase().includes(searchLower) ||
      student.degree?.toLowerCase().includes(searchLower)
    );
  });

  const displayStudents = viewMode === 'summary' ? filteredStudents.slice(0, 5) : filteredStudents;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {viewMode === 'summary' ? 'Recent Students' : 'All Students'}
            </CardTitle>
            <CardDescription>
              {students.length} student{students.length !== 1 ? 's' : ''} enrolled
            </CardDescription>
          </div>
          {viewMode === 'detailed' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No students found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>USN</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Degree</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Graduation Year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.usn || '-'}</TableCell>
                  <TableCell>{student.department || '-'}</TableCell>
                  <TableCell>{student.degree || '-'}</TableCell>
                  <TableCell>
                    {student.semester ? (
                      <Badge variant="outline">Sem {student.semester}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{student.graduation_year || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
