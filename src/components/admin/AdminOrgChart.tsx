import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { InstitutionalWorkflowDiagram } from './InstitutionalWorkflowDiagram';
import { exportToCSV } from '@/lib/export-utils';
import { toast } from 'sonner';
import { 
  Loader2, 
  Building2, 
  School, 
  Users, 
  GraduationCap, 
  ChevronDown, 
  ChevronRight,
  Network,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  X,
  Filter,
  FileText,
  Download,
  Pencil,
  Save
} from 'lucide-react';

interface University {
  id: string;
  name: string;
  email: string;
  address: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  contact_person_designation: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

interface College {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  is_active: boolean | null;
  university_id: string;
}

interface Student {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  usn: string | null;
  department: string | null;
  course: string | null;
  college_id: string | null;
  degree: string | null;
  specialization: string | null;
  semester: number | null;
  year_of_study: number | null;
  graduation_year: number | null;
  gender: string | null;
  dob: string | null;
  bio: string | null;
  about_me: string | null;
  skills: string[] | null;
  interested_domains: string[] | null;
  domain: string | null;
  university: string | null;
  college: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  resume_url: string | null;
  created_at: string;
}

interface OrgData {
  universities: University[];
  colleges: College[];
  students: Student[];
}

type DetailType = 'university' | 'college' | 'student';

type FilterType = 'all' | 'university' | 'college' | 'student';

export const AdminOrgChart = () => {
  const [data, setData] = useState<OrgData>({
    universities: [],
    colleges: [],
    students: [],
  });
  const [loading, setLoading] = useState(true);
  const [expandedUniversities, setExpandedUniversities] = useState<Set<string>>(new Set());
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{
    type: DetailType;
    data: University | College | Student;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showWorkflowDiagram, setShowWorkflowDiagram] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [collegeStudentSearch, setCollegeStudentSearch] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      // Fetch all data in parallel
      const [universitiesRes, collegesRes, studentsRes, profilesRes] = await Promise.all([
        supabase.from('universities').select('*').order('name'),
        supabase.from('colleges').select('*').order('name'),
        supabase.from('students').select('*'),
        supabase.from('profiles').select('user_id, full_name, email, phone_number, avatar_url'),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const studentsWithNames = (studentsRes.data || []).map(s => {
        const profile = profileMap.get(s.user_id);
        return {
          ...s,
          name: profile?.full_name || 'Unknown',
          email: profile?.email || null,
          phone: profile?.phone_number || null,
          avatar_url: profile?.avatar_url || null,
        };
      });

      setData({
        universities: universitiesRes.data || [],
        colleges: collegesRes.data || [],
        students: studentsWithNames,
      });
    } catch (error) {
      console.error('Error fetching org data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUniversity = (id: string) => {
    setExpandedUniversities(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCollege = (id: string) => {
    setExpandedColleges(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedUniversities(new Set(data.universities.map(u => u.id)));
    setExpandedColleges(new Set(data.colleges.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedUniversities(new Set());
    setExpandedColleges(new Set());
  };

  const getCollegesForUniversity = (universityId: string) => {
    return data.colleges.filter(c => c.university_id === universityId);
  };


  const getStudentsForCollege = (collegeId: string) => {
    return data.students.filter(s => s.college_id === collegeId);
  };

  const handleItemClick = (type: DetailType, item: any) => {
    setEditMode(false);
    setEditData({});
    setSelectedItem({ type, data: item });
  };

  const startEditing = () => {
    if (!selectedItem) return;
    setEditData({ ...selectedItem.data });
    setEditMode(true);
  };

  const cancelEditing = () => {
    setEditMode(false);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      const { type } = selectedItem;
      if (type === 'university') {
        const { error } = await supabase.from('universities').update({
          name: editData.name,
          email: editData.email,
          address: editData.address,
          contact_person_name: editData.contact_person_name,
          contact_person_email: editData.contact_person_email,
          contact_person_phone: editData.contact_person_phone,
          contact_person_designation: editData.contact_person_designation,
        }).eq('id', editData.id);
        if (error) throw error;
      } else if (type === 'college') {
        const { error } = await supabase.from('colleges').update({
          name: editData.name,
          email: editData.email,
          address: editData.address,
          contact_person_name: editData.contact_person_name,
          contact_person_email: editData.contact_person_email,
          contact_person_phone: editData.contact_person_phone,
        }).eq('id', editData.id);
        if (error) throw error;
      } else if (type === 'student') {
        // Update student table
        const { error } = await supabase.from('students').update({
          department: editData.department,
          course: editData.course,
          specialization: editData.specialization,
          domain: editData.domain,
          semester: editData.semester ? Number(editData.semester) : null,
          year_of_study: editData.year_of_study ? Number(editData.year_of_study) : null,
          graduation_year: editData.graduation_year ? Number(editData.graduation_year) : null,
          bio: editData.bio,
          about_me: editData.about_me,
          address: editData.address,
          city: editData.city,
          state: editData.state,
          country: editData.country,
          usn: editData.usn,
        }).eq('id', editData.id);
        if (error) throw error;

        // Update profile name/phone
        const { error: profileError } = await supabase.from('profiles').update({
          full_name: editData.name,
          phone_number: editData.phone,
        }).eq('user_id', editData.user_id);
        if (profileError) throw profileError;
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
      setEditMode(false);
      setSelectedItem({ ...selectedItem, data: { ...editData } as any });
      fetchOrgData();
    } catch (error: any) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // CSV Export functions
  const exportUniversities = () => {
    const rows = filteredData.universities.map(u => ({
      name: u.name,
      email: u.email,
      address: u.address || '',
      contact_person_name: u.contact_person_name || '',
      contact_person_email: u.contact_person_email || '',
      contact_person_phone: u.contact_person_phone || '',
      is_verified: u.is_verified ? 'Yes' : 'No',
      is_active: u.is_active ? 'Yes' : 'No',
      colleges: getCollegesForUniversity(u.id).length.toString(),
      students: getCollegesForUniversity(u.id).reduce((sum, c) => sum + getStudentsForCollege(c.id).length, 0).toString(),
      created_at: new Date(u.created_at).toLocaleDateString(),
    }));
    exportToCSV(rows, 'universities', ['Name', 'Email', 'Address', 'Contact_Person_Name', 'Contact_Person_Email', 'Contact_Person_Phone', 'Is_Verified', 'Is_Active', 'Colleges', 'Students', 'Created_At']);
    toast.success('Universities exported');
  };

  const exportColleges = () => {
    const rows = filteredData.colleges.map(c => {
      const uni = data.universities.find(u => u.id === c.university_id);
      return {
        name: c.name,
        email: c.email || '',
        university: uni?.name || '',
        address: c.address || '',
        contact_person_name: c.contact_person_name || '',
        contact_person_email: c.contact_person_email || '',
        contact_person_phone: c.contact_person_phone || '',
        is_active: c.is_active ? 'Yes' : 'No',
        students: getStudentsForCollege(c.id).length.toString(),
      };
    });
    exportToCSV(rows, 'colleges', ['Name', 'Email', 'University', 'Address', 'Contact_Person_Name', 'Contact_Person_Email', 'Contact_Person_Phone', 'Is_Active', 'Students']);
    toast.success('Colleges exported');
  };

  const exportStudents = () => {
    const rows = filteredData.students.map(s => {
      const college = data.colleges.find(c => c.id === s.college_id);
      const uni = college ? data.universities.find(u => u.id === college.university_id) : null;
      return {
        name: s.name,
        email: s.email || '',
        phone: s.phone || '',
        usn: s.usn || '',
        department: s.department || '',
        course: s.course || '',
        specialization: s.specialization || '',
        domain: s.domain || '',
        degree: s.degree || '',
        semester: s.semester?.toString() || '',
        year_of_study: s.year_of_study?.toString() || '',
        graduation_year: s.graduation_year?.toString() || '',
        college: college?.name || '',
        university: uni?.name || '',
        city: s.city || '',
        state: s.state || '',
        country: s.country || '',
        skills: s.skills?.join('; ') || '',
      };
    });
    exportToCSV(rows, 'students', ['Name', 'Email', 'Phone', 'Usn', 'Department', 'Course', 'Specialization', 'Domain', 'Degree', 'Semester', 'Year_Of_Study', 'Graduation_Year', 'College', 'University', 'City', 'State', 'Country', 'Skills']);
    toast.success('Students exported');
  };

  const exportAll = () => {
    exportUniversities();
    setTimeout(() => exportColleges(), 300);
    setTimeout(() => exportStudents(), 600);
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query && filterType === 'all') {
      return data;
    }

    let filteredUniversities = data.universities;
    let filteredColleges = data.colleges;
    let filteredStudents = data.students;

    if (query) {
      filteredUniversities = data.universities.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.contact_person_name?.toLowerCase().includes(query)
      );
      
      filteredColleges = data.colleges.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.contact_person_name?.toLowerCase().includes(query)
      );
      
      filteredStudents = data.students.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.usn?.toLowerCase().includes(query) ||
        s.department?.toLowerCase().includes(query) ||
        s.course?.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      if (filterType !== 'university') filteredUniversities = [];
      if (filterType !== 'college') filteredColleges = [];
      if (filterType !== 'student') filteredStudents = [];
    }

    if (query && filterType === 'all') {
      const collegesWithMatchingChildren = new Set<string>();
      filteredStudents.forEach(s => s.college_id && collegesWithMatchingChildren.add(s.college_id));
      
      const additionalColleges = data.colleges.filter(c => 
        collegesWithMatchingChildren.has(c.id) && !filteredColleges.find(fc => fc.id === c.id)
      );
      filteredColleges = [...filteredColleges, ...additionalColleges];

      const universitiesWithMatchingColleges = new Set<string>();
      filteredColleges.forEach(c => universitiesWithMatchingColleges.add(c.university_id));
      
      const additionalUniversities = data.universities.filter(u => 
        universitiesWithMatchingColleges.has(u.id) && !filteredUniversities.find(fu => fu.id === u.id)
      );
      filteredUniversities = [...filteredUniversities, ...additionalUniversities];
    }

    return {
      universities: filteredUniversities,
      colleges: filteredColleges,
      students: filteredStudents,
    };
  }, [data, searchQuery, filterType]);

  // Auto-expand when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedUniversities(new Set(filteredData.universities.map(u => u.id)));
      setExpandedColleges(new Set(filteredData.colleges.map(c => c.id)));
    }
  }, [searchQuery, filteredData.universities, filteredData.colleges]);

  const clearSearch = () => {
    setSearchQuery('');
    setFilterType('all');
  };

  const getFilteredCollegesForUniversity = (universityId: string) => {
    return filteredData.colleges.filter(c => c.university_id === universityId);
  };


  const getFilteredStudentsForCollege = (collegeId: string) => {
    return filteredData.students.filter(s => s.college_id === collegeId);
  };

  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const query = searchQuery.toLowerCase();
    const index = text.toLowerCase().indexOf(query);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {text.substring(index, index + searchQuery.length)}
        </span>
        {text.substring(index + searchQuery.length)}
      </>
    );
  };

  const EditField = ({ label, field, type = 'text', multiline = false }: { label: string; field: string; type?: string; multiline?: boolean }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {multiline ? (
        <Textarea value={editData[field] || ''} onChange={e => setEditData({ ...editData, [field]: e.target.value })} rows={2} />
      ) : (
        <Input type={type} value={editData[field] || ''} onChange={e => setEditData({ ...editData, [field]: e.target.value })} />
      )}
    </div>
  );

  const renderDetailDialog = () => {
    if (!selectedItem) return null;

    const { type, data: itemData } = selectedItem;

    return (
      <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); setEditMode(false); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {type === 'university' && <Building2 className="h-5 w-5" />}
                {type === 'college' && <School className="h-5 w-5" />}
                {type === 'student' && <GraduationCap className="h-5 w-5" />}
                {editMode ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}` : `${type.charAt(0).toUpperCase() + type.slice(1)} Details`}
              </DialogTitle>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {editMode ? (
              <>
                {type === 'university' && renderUniversityEdit()}
                {type === 'college' && renderCollegeEdit()}
                {type === 'student' && renderStudentEdit()}
              </>
            ) : (
              <>
                {type === 'university' && renderUniversityDetails(itemData as University)}
                {type === 'college' && renderCollegeDetails(itemData as College)}
                {type === 'student' && renderStudentDetails(itemData as Student)}
              </>
            )}
          </div>

          {editMode && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={cancelEditing} disabled={saving}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const renderUniversityEdit = () => (
    <div className="space-y-3">
      <EditField label="University Name" field="name" />
      <EditField label="Email" field="email" type="email" />
      <EditField label="Address" field="address" multiline />
      <Separator />
      <h4 className="text-sm font-medium">Contact Person</h4>
      <div className="grid grid-cols-2 gap-3">
        <EditField label="Name" field="contact_person_name" />
        <EditField label="Designation" field="contact_person_designation" />
        <EditField label="Email" field="contact_person_email" type="email" />
        <EditField label="Phone" field="contact_person_phone" />
      </div>
    </div>
  );

  const renderCollegeEdit = () => (
    <div className="space-y-3">
      <EditField label="College Name" field="name" />
      <EditField label="Email" field="email" type="email" />
      <EditField label="Address" field="address" multiline />
      <Separator />
      <h4 className="text-sm font-medium">Contact Person</h4>
      <div className="grid grid-cols-2 gap-3">
        <EditField label="Name" field="contact_person_name" />
        <EditField label="Email" field="contact_person_email" type="email" />
        <EditField label="Phone" field="contact_person_phone" />
      </div>
    </div>
  );

  const renderStudentEdit = () => (
    <div className="space-y-3">
      <EditField label="Full Name" field="name" />
      <div className="grid grid-cols-2 gap-3">
        <EditField label="Email" field="email" type="email" />
        <EditField label="Phone" field="phone" />
        <EditField label="USN" field="usn" />
        <EditField label="Gender" field="gender" />
      </div>
      <Separator />
      <h4 className="text-sm font-medium">Academics</h4>
      <div className="grid grid-cols-2 gap-3">
        <EditField label="Department" field="department" />
        <EditField label="Course" field="course" />
        <EditField label="Specialization" field="specialization" />
        <EditField label="Domain" field="domain" />
        <EditField label="Degree" field="degree" />
        <EditField label="Semester" field="semester" type="number" />
        <EditField label="Year of Study" field="year_of_study" type="number" />
        <EditField label="Graduation Year" field="graduation_year" type="number" />
      </div>
      <Separator />
      <h4 className="text-sm font-medium">Location</h4>
      <div className="grid grid-cols-2 gap-3">
        <EditField label="Address" field="address" />
        <EditField label="City" field="city" />
        <EditField label="State" field="state" />
        <EditField label="Country" field="country" />
      </div>
      <Separator />
      <EditField label="Bio" field="bio" multiline />
      <EditField label="About Me" field="about_me" multiline />
    </div>
  );

  const renderUniversityDetails = (uni: University) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{uni.name}</h3>
        <div className="flex gap-2">
          <Badge variant={uni.is_verified ? 'default' : 'secondary'}>
            {uni.is_verified ? 'Verified' : 'Pending'}
          </Badge>
          <Badge variant={uni.is_active ? 'default' : 'destructive'}>
            {uni.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      
      <Separator />
      
      <div className="grid gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{uni.email}</span>
        </div>
        {uni.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{uni.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Registered: {new Date(uni.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {(uni.contact_person_name || uni.contact_person_email || uni.contact_person_phone) && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Contact Person</h4>
            <div className="grid gap-2 text-sm">
              {uni.contact_person_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{uni.contact_person_name}</span>
                  {uni.contact_person_designation && (
                    <Badge variant="outline" className="text-xs">{uni.contact_person_designation}</Badge>
                  )}
                </div>
              )}
              {uni.contact_person_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{uni.contact_person_email}</span>
                </div>
              )}
              {uni.contact_person_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{uni.contact_person_phone}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Separator />
      
      <div>
        <h4 className="font-medium mb-2">Statistics</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{getCollegesForUniversity(uni.id).length}</div>
            <div className="text-xs text-muted-foreground">Colleges</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {getCollegesForUniversity(uni.id).reduce((sum, c) => sum + getStudentsForCollege(c.id).length, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Students</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollegeDetails = (college: College) => {
    const university = data.universities.find(u => u.id === college.university_id);
    const students = getStudentsForCollege(college.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{college.name}</h3>
          <Badge variant={college.is_active ? 'default' : 'destructive'}>
            {college.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        {university && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Under: {university.name}
          </div>
        )}
        
        <Separator />
        
        <div className="grid gap-3">
          {college.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{college.email}</span>
            </div>
          )}
          {college.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{college.address}</span>
            </div>
          )}
        </div>

        {(college.contact_person_name || college.contact_person_email || college.contact_person_phone) && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Contact Person</h4>
              <div className="grid gap-2 text-sm">
                {college.contact_person_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{college.contact_person_name}</span>
                  </div>
                )}
                {college.contact_person_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{college.contact_person_email}</span>
                  </div>
                )}
                {college.contact_person_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{college.contact_person_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />
        
        <div>
          <h4 className="font-medium mb-2">Statistics</h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{students.length}</div>
              <div className="text-xs text-muted-foreground">Students</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentDetails = (student: Student) => {
    const college = data.colleges.find(c => c.id === student.college_id);
    const university = college ? data.universities.find(u => u.id === college.university_id) : null;
    const fullAddress = [student.address, student.city, student.state, student.country].filter(Boolean).join(', ');

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          {student.avatar_url ? (
            <img src={student.avatar_url} alt={student.name} className="h-16 w-16 rounded-full object-cover border" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{student.name}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {student.usn && <Badge variant="outline">{student.usn}</Badge>}
              {student.gender && <Badge variant="secondary">{student.gender}</Badge>}
              {student.degree && <Badge variant="secondary">{student.degree}</Badge>}
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact */}
        <div>
          <h4 className="font-medium mb-2">Contact</h4>
          <div className="grid gap-2 text-sm">
            {student.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="select-all">{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="select-all">{student.phone}</span>
              </div>
            )}
            {fullAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{fullAddress}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Academic Info */}
        <div>
          <h4 className="font-medium mb-2">Academics</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {student.department && (
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium">{student.department}</p>
              </div>
            )}
            {student.course && (
              <div>
                <p className="text-xs text-muted-foreground">Course</p>
                <p className="font-medium">{student.course}</p>
              </div>
            )}
            {student.specialization && (
              <div>
                <p className="text-xs text-muted-foreground">Specialization</p>
                <p className="font-medium">{student.specialization}</p>
              </div>
            )}
            {student.domain && (
              <div>
                <p className="text-xs text-muted-foreground">Domain</p>
                <p className="font-medium">{student.domain}</p>
              </div>
            )}
            {student.semester && (
              <div>
                <p className="text-xs text-muted-foreground">Semester</p>
                <p className="font-medium">{student.semester}</p>
              </div>
            )}
            {student.year_of_study && (
              <div>
                <p className="text-xs text-muted-foreground">Year of Study</p>
                <p className="font-medium">{student.year_of_study}</p>
              </div>
            )}
            {student.graduation_year && (
              <div>
                <p className="text-xs text-muted-foreground">Graduation Year</p>
                <p className="font-medium">{student.graduation_year}</p>
              </div>
            )}
            {student.dob && (
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{new Date(student.dob).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills & Interests */}
        {((student.skills && student.skills.length > 0) || (student.interested_domains && student.interested_domains.length > 0)) && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Skills & Interests</h4>
              {student.skills && student.skills.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {student.skills.map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {student.interested_domains && student.interested_domains.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Interested Domains</p>
                  <div className="flex flex-wrap gap-1">
                    {student.interested_domains.map((d, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Bio / About */}
        {(student.bio || student.about_me) && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">About</h4>
              <p className="text-sm text-muted-foreground">{student.about_me || student.bio}</p>
            </div>
          </>
        )}

        {/* Links */}
        {(student.linkedin_url || student.github_url || student.resume_url) && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Links</h4>
              <div className="grid gap-2 text-sm">
                {student.linkedin_url && (
                  <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                    <User className="h-4 w-4" /> LinkedIn
                  </a>
                )}
                {student.github_url && (
                  <a href={student.github_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                    <User className="h-4 w-4" /> GitHub
                  </a>
                )}
                {student.resume_url && (
                  <a href={student.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Resume
                  </a>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Institution */}
        <div>
          <h4 className="font-medium mb-2">Institution</h4>
          <div className="grid gap-2 text-sm">
            {college && (
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-muted-foreground" />
                <span>College: {college.name}</span>
              </div>
            )}
            {university && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>University: {university.name}</span>
              </div>
            )}
          </div>
        </div>

        {student.created_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Registered: {new Date(student.created_at).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Workflow Diagram Toggle */}
      <div className="flex justify-end mb-4">
        <Button 
          variant={showWorkflowDiagram ? "default" : "outline"}
          onClick={() => setShowWorkflowDiagram(!showWorkflowDiagram)}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {showWorkflowDiagram ? 'Hide Workflow Diagram' : 'Show Workflow Diagram'}
        </Button>
      </div>

      {/* Workflow Diagram */}
      {showWorkflowDiagram && <InstitutionalWorkflowDiagram />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Platform Organization Chart
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Select onValueChange={(v) => {
                if (v === 'all') exportAll();
                else if (v === 'universities') exportUniversities();
                else if (v === 'colleges') exportColleges();
                else if (v === 'students') exportStudents();
              }}>
                <SelectTrigger className="w-[160px] h-8">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <span className="text-sm">Export CSV</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Export All</SelectItem>
                  <SelectItem value="universities">Universities</SelectItem>
                  <SelectItem value="colleges">Colleges</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Click on any item to view detailed information
          </p>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search universities, colleges, or students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="university">Universities</SelectItem>
                <SelectItem value="college">Colleges</SelectItem>
                
                <SelectItem value="student">Students</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Results Summary */}
          {(searchQuery || filterType !== 'all') && (
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">
                  {filteredData.universities.length} universities, {filteredData.colleges.length} colleges, {filteredData.students.length} students
                </span>
                <span className="text-muted-foreground"> found</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Clear filters
              </Button>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{data.universities.length}</div>
              <div className="text-sm text-muted-foreground">Universities</div>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <School className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{data.colleges.length}</div>
              <div className="text-sm text-muted-foreground">Colleges</div>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <GraduationCap className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{data.students.length}</div>
              <div className="text-sm text-muted-foreground">Students</div>
            </div>
          </div>

          {/* Organization Tree */}
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredData.universities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{searchQuery ? 'No matching results found.' : 'No universities registered yet.'}</p>
                </div>
              ) : (
                filteredData.universities.map((university) => {
                  const uniColleges = getFilteredCollegesForUniversity(university.id);
                  
                  return (
                    <Collapsible
                      key={university.id}
                      open={expandedUniversities.has(university.id)}
                      onOpenChange={() => toggleUniversity(university.id)}
                    >
                      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                        {/* University Header */}
                        <div className="flex items-center">
                          <CollapsibleTrigger asChild>
                            <div className="flex-1 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {expandedUniversities.has(university.id) ? (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  <Building2 className="h-5 w-5 text-primary" />
                                  <span 
                                    className="font-semibold hover:text-primary hover:underline cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); handleItemClick('university', university); }}
                                  >
                                    {highlightMatch(university.name)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    <School className="h-3 w-3 mr-1" />
                                    {uniColleges.length} Colleges
                                  </Badge>
                                  {university.is_verified ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-yellow-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleItemClick('university', university)}
                          >
                            View Details
                          </Button>
                        </div>

                        {/* Colleges */}
                        <CollapsibleContent>
                          <div className="border-t bg-muted/20">
                            {uniColleges.length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground text-sm">
                                No colleges under this university
                              </div>
                            ) : (
                              <div className="p-2 space-y-2">
                                {uniColleges.map((college) => {
                                  const collegeStudents = getFilteredStudentsForCollege(college.id);

                                  return (
                                    <Collapsible
                                      key={college.id}
                                      open={expandedColleges.has(college.id)}
                                      onOpenChange={() => toggleCollege(college.id)}
                                    >
                                      <div className="ml-6 border rounded-lg overflow-hidden bg-background">
                                        <div className="flex items-center">
                                          <CollapsibleTrigger asChild>
                                            <div className="flex-1 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  {expandedColleges.has(college.id) ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                  )}
                                                  <School className="h-4 w-4 text-primary" />
                                                  <span 
                                                    className="font-medium hover:text-primary hover:underline cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); handleItemClick('college', college); }}
                                                  >
                                                    {highlightMatch(college.name)}
                                                  </span>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                  <GraduationCap className="h-3 w-3 mr-1" />
                                                  {collegeStudents.length} Students
                                                </Badge>
                                              </div>
                                            </div>
                                          </CollapsibleTrigger>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mr-2 text-xs"
                                            onClick={() => handleItemClick('college', college)}
                                          >
                                            Details
                                          </Button>
                                        </div>

                                        <CollapsibleContent>
                                          <div className="border-t p-3 bg-muted/10">
                                            {/* Department Summary */}
                                            {(() => {
                                              const deptCounts = collegeStudents.reduce<Record<string, number>>((acc, s) => {
                                                const dept = s.department || 'Unassigned';
                                                acc[dept] = (acc[dept] || 0) + 1;
                                                return acc;
                                              }, {});
                                              const localSearch = (collegeStudentSearch[college.id] || '').toLowerCase();
                                              const filteredStudentsList = localSearch
                                                ? collegeStudents.filter(s =>
                                                    s.name.toLowerCase().includes(localSearch) ||
                                                    s.usn?.toLowerCase().includes(localSearch) ||
                                                    s.department?.toLowerCase().includes(localSearch) ||
                                                    s.course?.toLowerCase().includes(localSearch) ||
                                                    s.email?.toLowerCase().includes(localSearch)
                                                  )
                                                : collegeStudents;

                                              return (
                                                <>
                                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                                    <GraduationCap className="h-4 w-4" />
                                                    Students ({collegeStudents.length})
                                                  </h5>

                                                  {/* Department breakdown badges */}
                                                  {Object.keys(deptCounts).length > 0 && collegeStudents.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                      {Object.entries(deptCounts)
                                                        .sort((a, b) => b[1] - a[1])
                                                        .map(([dept, count]) => (
                                                          <Badge key={dept} variant="secondary" className="text-xs">
                                                            {dept}: {count}
                                                          </Badge>
                                                        ))}
                                                    </div>
                                                  )}

                                                  {/* Search filter */}
                                                  {collegeStudents.length > 3 && (
                                                    <div className="relative mb-2">
                                                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                      <Input
                                                        placeholder="Search students by name, USN, dept..."
                                                        className="h-8 pl-7 pr-7 text-xs"
                                                        value={collegeStudentSearch[college.id] || ''}
                                                        onChange={(e) => setCollegeStudentSearch(prev => ({ ...prev, [college.id]: e.target.value }))}
                                                      />
                                                      {collegeStudentSearch[college.id] && (
                                                        <button
                                                          className="absolute right-2 top-1/2 -translate-y-1/2"
                                                          onClick={() => setCollegeStudentSearch(prev => ({ ...prev, [college.id]: '' }))}
                                                        >
                                                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  )}

                                                  {collegeStudents.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground italic">No students</p>
                                                  ) : filteredStudentsList.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground italic">No students match "{collegeStudentSearch[college.id]}"</p>
                                                  ) : (
                                                    <>
                                                      {localSearch && (
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                          Showing {filteredStudentsList.length} of {collegeStudents.length} students
                                                        </p>
                                                      )}
                                                      <div className="space-y-1 max-h-64 overflow-y-auto">
                                                        {filteredStudentsList.map((student) => (
                                                          <div
                                                            key={student.id}
                                                            className="flex items-center justify-between p-2 rounded bg-background border cursor-pointer hover:bg-muted/50"
                                                            onClick={() => handleItemClick('student', student)}
                                                          >
                                                            <div className="flex flex-col">
                                                              <span className="text-sm">{highlightMatch(student.name)}</span>
                                                              {student.usn && (
                                                                <span className="text-xs text-muted-foreground">{student.usn}</span>
                                                              )}
                                                            </div>
                                                            {student.department && (
                                                              <Badge variant="outline" className="text-xs">
                                                                {student.department}
                                                              </Badge>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </>
                                                  )}
                                                </>
                                              );
                                            })()}
                                          </div>
                                        </CollapsibleContent>
                                      </div>
                                    </Collapsible>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {renderDetailDialog()}
    </>
  );
};
