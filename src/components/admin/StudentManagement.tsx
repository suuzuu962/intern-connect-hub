import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, Trash2, Search, GraduationCap, MapPin, Plus, School, ChevronDown, ChevronUp,
  Mail, Phone, Calendar, Briefcase, Globe, Github, Linkedin, BookOpen, User, FileText, Shield
} from 'lucide-react';
import { SignedLink } from '@/components/ui/signed-link';
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
  country: string | null;
  graduation_year: number | null;
  skills: string[] | null;
  created_at: string;
  // Extended fields
  usn: string | null;
  gender: string | null;
  dob: string | null;
  semester: number | null;
  year_of_study: number | null;
  degree: string | null;
  course: string | null;
  specialization: string | null;
  domain: string | null;
  university: string | null;
  address: string | null;
  permanent_address: string | null;
  permanent_city: string | null;
  permanent_state: string | null;
  permanent_country: string | null;
  about_me: string | null;
  bio: string | null;
  interested_domains: string[] | null;
  resume_url: string | null;
  college_id_url: string | null;
  cover_image_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    phone_number: string | null;
    platform_user_id: string | null;
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

interface StudentFilters {
  college: string;
  department: string;
  location: string;
  graduationYear: string;
  skill: string;
}

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCollegeId, setFilterCollegeId] = useState<string>('all');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [studentRoles, setStudentRoles] = useState<Record<string, { roleId: string; roleName: string }>>({});
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<StudentFilters>({
    college: 'all',
    department: 'all',
    location: 'all',
    graduationYear: 'all',
    skill: 'all',
  });
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

  // Extract unique values for filters
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))].sort();
  const locations = [...new Set(students.map(s => s.city || s.state).filter(Boolean))].sort();
  const graduationYears = [...new Set(students.map(s => s.graduation_year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
  const allSkills = [...new Set(students.flatMap(s => s.skills || []))].sort();

  const clearFilters = () => {
    setFilters({
      college: 'all',
      department: 'all',
      location: 'all',
      graduationYear: 'all',
      skill: 'all',
    });
    setFilterCollegeId('all');
  };

  const hasActiveFilters = filters.college !== 'all' || filters.department !== 'all' || 
    filters.location !== 'all' || filters.graduationYear !== 'all' || filters.skill !== 'all';

  const fetchData = async () => {
    try {
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

      const userIds = (studentsResult.data || []).map(s => s.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, phone_number, platform_user_id')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

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

      // Fetch student roles
      if (userIds.length > 0) {
        const { data: roleData } = await supabase
          .from('user_custom_roles')
          .select('user_id, role_id, custom_roles(id, name)')
          .in('user_id', userIds);

        if (roleData) {
          const roleMap: Record<string, { roleId: string; roleName: string }> = {};
          for (const item of roleData as any[]) {
            if (item.custom_roles) {
              const student = studentsWithProfiles.find(s => s.user_id === item.user_id);
              if (student) {
                roleMap[student.id] = { roleId: item.custom_roles.id, roleName: item.custom_roles.name };
              }
            }
          }
          setStudentRoles(roleMap);
        }
      }

      // Fetch available student-scoped roles
      const { data: rolesData } = await supabase
        .from('custom_roles')
        .select('id, name')
        .eq('scope', 'student')
        .order('name');
      setAvailableRoles(rolesData || []);
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

  const toggleExpanded = (studentId: string) => {
    setExpandedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleChangeStudentRole = async (studentId: string, userId: string, newRoleId: string) => {
    try {
      // Remove existing roles
      await supabase.from('user_custom_roles').delete().eq('user_id', userId);
      
      // Assign new role
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('user_custom_roles').insert({
        user_id: userId,
        role_id: newRoleId,
        assigned_by: user?.id,
      });

      if (error) throw error;
      
      const roleName = availableRoles.find(r => r.id === newRoleId)?.name || '';
      toast.success(`Role updated to "${roleName}"`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to change role: ' + error.message);
    }
  };

  const handleDeleteStudent = async (studentId: string, userId: string) => {
    try {
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (studentError) throw studentError;

      await supabase.from('applications').delete().eq('student_id', studentId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('user_id', userId);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

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

      if (response.error) throw new Error(response.error.message || 'Failed to create student');
      if (response.data?.error) throw new Error(response.data.error);

      toast.success('Student added successfully (no email verification required)');
      setAddDialogOpen(false);
      setNewStudent({
        email: '', password: '', fullName: '', college: '', college_id: '',
        department: '', city: '', state: '', graduationYear: '',
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.college_data?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.usn?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCollege = filters.college === 'all' || student.college_id === filters.college;
    const matchesDepartment = filters.department === 'all' || student.department === filters.department;
    const matchesLocation = filters.location === 'all' || student.city === filters.location || student.state === filters.location;
    const matchesGradYear = filters.graduationYear === 'all' || student.graduation_year?.toString() === filters.graduationYear;
    const matchesSkill = filters.skill === 'all' || student.skills?.includes(filters.skill);
    
    return matchesSearch && matchesCollege && matchesDepartment && matchesLocation && matchesGradYear && matchesSkill;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const StudentDetailRow = ({ student }: { student: Student }) => {
    const isExpanded = expandedStudents.has(student.id);
    
    return (
      <>
        <TableRow 
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => toggleExpanded(student.id)}
        >
          <TableCell>
            <div className="flex items-center gap-3">
              {student.profile?.avatar_url ? (
                <img 
                  src={student.profile.avatar_url} 
                  alt={student.profile.full_name || ''} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{student.profile?.full_name || 'Unknown'}</p>
                  {studentRoles[student.id] && (
                    <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                      <Shield className="h-2.5 w-2.5" />
                      {studentRoles[student.id].roleName}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
                {student.profile?.platform_user_id && (
                  <Badge variant="secondary" className="text-[9px] font-mono mt-0.5 w-fit">{student.profile.platform_user_id}</Badge>
                )}
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
                <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
              {(student.skills?.length || 0) > 3 && (
                <Badge variant="outline" className="text-xs">+{(student.skills?.length || 0) - 3}</Badge>
              )}
            </div>
          </TableCell>
          <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleExpanded(student.id); }}>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" onClick={(e) => e.stopPropagation()}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Student</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove "{student.profile?.full_name || 'this student'}"? 
                      This will delete their profile, applications, and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteStudent(student.id, student.user_id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <TableRow>
            <TableCell colSpan={8} className="bg-muted/30 p-0">
              <ScrollArea className="max-h-[500px]">
                <div className="p-6 space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-primary" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <InfoItem label="Full Name" value={student.profile?.full_name} />
                      <InfoItem label="Email" value={student.profile?.email} icon={<Mail className="h-3 w-3" />} />
                      <InfoItem label="Phone" value={student.profile?.phone_number} icon={<Phone className="h-3 w-3" />} />
                      <InfoItem label="Gender" value={student.gender} />
                      <InfoItem label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString() : null} icon={<Calendar className="h-3 w-3" />} />
                      <InfoItem label="USN/Roll No" value={student.usn} />
                    </div>
                  </div>
                  <Separator />
                  {/* Academic Information */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Academic Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <InfoItem label="University" value={student.university || student.college_data?.university?.name} />
                      <InfoItem label="College" value={student.college_data?.name || student.college} />
                      <InfoItem label="Degree" value={student.degree} />
                      <InfoItem label="Course" value={student.course} />
                      <InfoItem label="Specialization" value={student.specialization} />
                      <InfoItem label="Department" value={student.department} />
                      <InfoItem label="Year of Study" value={student.year_of_study?.toString()} />
                      <InfoItem label="Semester" value={student.semester?.toString()} />
                      <InfoItem label="Graduation Year" value={student.graduation_year?.toString()} />
                      <InfoItem label="Domain" value={student.domain} />
                    </div>
                  </div>
                  <Separator />
                  {/* Address Information */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      Address Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Address</p>
                        <p className="text-sm">{[student.address, student.city, student.state, student.country].filter(Boolean).join(', ') || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Permanent Address</p>
                        <p className="text-sm">{[student.permanent_address, student.permanent_city, student.permanent_state, student.permanent_country].filter(Boolean).join(', ') || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  {/* Skills & Interests */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Skills & Interests
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {student.skills?.length ? student.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                          )) : <span className="text-sm text-muted-foreground">No skills listed</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Interested Domains</p>
                        <div className="flex flex-wrap gap-1">
                          {student.interested_domains?.length ? student.interested_domains.map((domain, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{domain}</Badge>
                          )) : <span className="text-sm text-muted-foreground">No interests listed</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  {/* About & Bio */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-primary" />
                      About
                    </h4>
                    <div className="space-y-2">
                      {student.about_me && <p className="text-sm">{student.about_me}</p>}
                      {student.bio && <p className="text-sm text-muted-foreground">{student.bio}</p>}
                      {!student.about_me && !student.bio && <p className="text-sm text-muted-foreground">No bio provided</p>}
                    </div>
                  </div>
                  <Separator />
                  {/* Social Links */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-primary" />
                      Social & Documents
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {student.linkedin_url && (
                        <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full text-sm text-blue-700 dark:text-blue-300">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </a>
                      )}
                      {student.github_url && (
                        <a href={student.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/30 dark:hover:bg-gray-900/50 rounded-full text-sm">
                          <Github className="h-4 w-4" /> GitHub
                        </a>
                      )}
                      {student.resume_url && (
                        <SignedLink href={student.resume_url} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-full text-sm text-green-700 dark:text-green-300">
                          <FileText className="h-4 w-4" /> Resume
                        </SignedLink>
                      )}
                      {student.college_id_url && (
                        <SignedLink href={student.college_id_url} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-full text-sm text-purple-700 dark:text-purple-300">
                          <BookOpen className="h-4 w-4" /> College ID
                        </SignedLink>
                      )}
                      {!student.linkedin_url && !student.github_url && !student.resume_url && !student.college_id_url && (
                        <p className="text-sm text-muted-foreground">No links available</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  {/* Role & Permissions */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-primary" />
                      Role & Permissions
                    </h4>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {studentRoles[student.id]?.roleName || 'Student Standard Access'}
                      </Badge>
                      <Select
                        value={studentRoles[student.id]?.roleId || '00000000-0000-0000-0000-000000000001'}
                        onValueChange={(val) => handleChangeStudentRole(student.id, student.user_id, val)}
                      >
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                          <SelectValue placeholder="Change role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map(role => (
                            <SelectItem key={role.id} value={role.id} className="text-xs">
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      All students get standard access automatically. Super Admin can change roles to customize permissions.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  const InfoItem = ({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) => (
    <div className="bg-background rounded-lg p-2.5 border">
      <p className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <p className="font-medium text-sm truncate">{value || '-'}</p>
    </div>
  );

  return (
    <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
    <div className="space-y-6 pr-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
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
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">Active</Badge>}
                </Button>
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
                    <DialogDescription>Create a new student account.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" placeholder="student@example.com" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input id="password" type="password" placeholder="Minimum 6 characters" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" placeholder="John Doe" value={newStudent.fullName} onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="college_select">College</Label>
                      <Select value={newStudent.college_id} onValueChange={(value) => {
                        const college = colleges.find(c => c.id === value);
                        setNewStudent({ ...newStudent, college_id: value, college: college?.name || '' });
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select a college" /></SelectTrigger>
                        <SelectContent>
                          {colleges.map(college => (<SelectItem key={college.id} value={college.id}>{college.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" placeholder="Computer Science" value={newStudent.department} onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="City" value={newStudent.city} onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" placeholder="State" value={newStudent.state} onChange={(e) => setNewStudent({ ...newStudent, state: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Graduation Year</Label>
                      <Input id="graduationYear" type="number" placeholder="2025" value={newStudent.graduationYear} onChange={(e) => setNewStudent({ ...newStudent, graduationYear: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddStudent} disabled={adding} className="gradient-primary border-0">{adding ? 'Adding...' : 'Add Student'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">College</Label>
                <Select value={filters.college} onValueChange={(v) => setFilters({ ...filters, college: v })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Colleges" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colleges</SelectItem>
                    {colleges.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Department</Label>
                <Select value={filters.department} onValueChange={(v) => setFilters({ ...filters, department: v })}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Depts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d} value={d!}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Location</Label>
                <Select value={filters.location} onValueChange={(v) => setFilters({ ...filters, location: v })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(l => (
                      <SelectItem key={l} value={l!}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Graduation Year</Label>
                <Select value={filters.graduationYear} onValueChange={(v) => setFilters({ ...filters, graduationYear: v })}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {graduationYears.map(y => (
                      <SelectItem key={y} value={y!.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Skill</Label>
                <Select value={filters.skill} onValueChange={(v) => setFilters({ ...filters, skill: v })}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    {allSkills.slice(0, 50).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  Clear Filters
                </Button>
              )}
            </div>
          )}
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
                    <StudentDetailRow key={student.id} student={student} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
