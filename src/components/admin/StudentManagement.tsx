import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Trash2, Search, GraduationCap, MapPin, Plus, School } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Student {
  id: string;
  user_id: string;
  college: string | null;
  college_id: string | null;
  department: string | null;
  city: string | null;
  state: string | null;
  graduation_year: number | null;
  skills: string[] | null;
  created_at: string;
  profile: {
    full_name: string | null;
    email: string;
  } | null;
  college_data?: {
    name: string;
    university?: { name: string } | null;
  } | null;
}

interface College {
  id: string;
  name: string;
  university?: { name: string } | null;
}

interface NewStudentForm {
  email: string;
  password: string;
  fullName: string;
  college: string;
  college_id: string;
  department: string;
  city: string;
  state: string;
  graduationYear: string;
}

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCollegeId, setFilterCollegeId] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudentForm>({
    email: '',
    password: '',
    fullName: '',
    college: '',
    college_id: '',
    department: '',
    city: '',
    state: '',
    graduationYear: '',
  });

  const fetchData = async () => {
    try {
      // Fetch students and colleges in parallel
      const [studentsResult, collegesResult] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('colleges')
          .select('id, name, university:universities(name)')
          .eq('is_active', true)
          .order('name', { ascending: true })
      ]);

      if (studentsResult.error) throw studentsResult.error;

      // Fetch profiles for all students
      const userIds = (studentsResult.data || []).map(s => s.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get college info for students
      const collegeIds = (studentsResult.data || [])
        .map(s => s.college_id)
        .filter((id): id is string => id !== null);
      
      let collegeMap = new Map<string, { name: string; university?: { name: string } | null }>();
      if (collegeIds.length > 0) {
        const { data: collegeData } = await supabase
          .from('colleges')
          .select('id, name, university:universities(name)')
          .in('id', collegeIds);
        
        collegeMap = new Map((collegeData || []).map(c => [c.id, c]));
      }

      // Map profiles to students
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      const studentsWithProfiles = (studentsResult.data || []).map(student => ({
        ...student,
        profile: profilesMap.get(student.user_id) || null,
        college_data: student.college_id ? collegeMap.get(student.college_id) || null : null,
      }));
      
      setStudents(studentsWithProfiles);
      setColleges(collegesResult.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch students');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (studentId: string, userId: string) => {
    try {
      // Delete from students table first
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (studentError) throw studentError;

      // Delete applications by this student
      await supabase
        .from('applications')
        .delete()
        .eq('student_id', studentId);

      // Delete user role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      toast.success('Student removed successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to remove student');
      console.error('Error deleting student:', error);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.email || !newStudent.password || !newStudent.fullName) {
      toast.error('Please fill in required fields (Email, Password, Full Name)');
      return;
    }

    setAdding(true);
    try {
      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function to create user without email verification
      const response = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newStudent.email,
          password: newStudent.password,
          fullName: newStudent.fullName,
          role: 'student',
          additionalData: {
            college: newStudent.college || null,
            college_id: newStudent.college_id || null,
            department: newStudent.department || null,
            city: newStudent.city || null,
            state: newStudent.state || null,
            graduationYear: newStudent.graduationYear || null,
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create student');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Student added successfully (no email verification required)');
      setAddDialogOpen(false);
      setNewStudent({
        email: '',
        password: '',
        fullName: '',
        college: '',
        college_id: '',
        department: '',
        city: '',
        state: '',
        graduationYear: '',
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add student');
      console.error('Error adding student:', error);
    } finally {
      setAdding(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.college_data?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCollege = filterCollegeId === 'all' || student.college_id === filterCollegeId;
    
    return matchesSearch && matchesCollege;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              All Students ({students.length})
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCollegeId} onValueChange={setFilterCollegeId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by college" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map(college => (
                    <SelectItem key={college.id} value={college.id}>
                      {college.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary border-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Create a new student account. They will receive login credentials.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@example.com"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newStudent.password}
                        onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={newStudent.fullName}
                        onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="college_select">College</Label>
                      <Select 
                        value={newStudent.college_id} 
                        onValueChange={(value) => {
                          const college = colleges.find(c => c.id === value);
                          setNewStudent({ 
                            ...newStudent, 
                            college_id: value,
                            college: college?.name || ''
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a college" />
                        </SelectTrigger>
                        <SelectContent>
                          {colleges.map(college => (
                            <SelectItem key={college.id} value={college.id}>
                              {college.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="Computer Science"
                        value={newStudent.department}
                        onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={newStudent.city}
                          onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="State"
                          value={newStudent.state}
                          onChange={(e) => setNewStudent({ ...newStudent, state: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Graduation Year</Label>
                      <Input
                        id="graduationYear"
                        type="number"
                        placeholder="2025"
                        value={newStudent.graduationYear}
                        onChange={(e) => setNewStudent({ ...newStudent, graduationYear: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddStudent} disabled={adding} className="gradient-primary border-0">
                      {adding ? 'Adding...' : 'Add Student'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchQuery ? 'No matching students found' : 'No students registered'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Graduation</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{student.profile?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.college_data ? (
                          <div className="flex items-center gap-1">
                            <School className="h-4 w-4 text-muted-foreground" />
                            <span>{student.college_data.name}</span>
                          </div>
                        ) : student.college || '-'}
                      </TableCell>
                      <TableCell>{student.department || '-'}</TableCell>
                      <TableCell>
                        {student.city || student.state ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {[student.city, student.state].filter(Boolean).join(', ')}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{student.graduation_year || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {student.skills?.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {(student.skills?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(student.skills?.length || 0) - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(student.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{student.profile?.full_name || 'this student'}"? 
                                This will delete their profile, applications, and all associated data. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(student.id, student.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
