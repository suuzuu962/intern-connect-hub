import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { InstitutionalWorkflowDiagram } from './InstitutionalWorkflowDiagram';
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
  FileText
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
  usn: string | null;
  department: string | null;
  course: string | null;
  college_id: string | null;
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

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      // Fetch all data in parallel
      const [universitiesRes, collegesRes, studentsRes, profilesRes] = await Promise.all([
        supabase.from('universities').select('*').order('name'),
        supabase.from('colleges').select('*').order('name'),
        supabase.from('students').select('id, user_id, usn, department, course, college_id'),
        supabase.from('profiles').select('user_id, full_name'),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.full_name]));
      const studentsWithNames = (studentsRes.data || []).map(s => ({
        ...s,
        name: profileMap.get(s.user_id) || 'Unknown',
      }));

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
    setSelectedItem({ type, data: item });
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

  const renderDetailDialog = () => {
    if (!selectedItem) return null;

    const { type, data: itemData } = selectedItem;

    return (
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {type === 'university' && <Building2 className="h-5 w-5" />}
              {type === 'college' && <School className="h-5 w-5" />}
              {type === 'student' && <GraduationCap className="h-5 w-5" />}
              {type.charAt(0).toUpperCase() + type.slice(1)} Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {type === 'university' && renderUniversityDetails(itemData as University)}
            {type === 'college' && renderCollegeDetails(itemData as College)}
            {type === 'student' && renderStudentDetails(itemData as Student)}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{student.name}</h3>
          {student.usn && <Badge variant="outline">{student.usn}</Badge>}
        </div>
        
        <Separator />
        
        <div className="grid gap-3">
          {student.department && (
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span>Department: {student.department}</span>
            </div>
          )}
          {student.course && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Course: {student.course}</span>
            </div>
          )}
        </div>

        <Separator />
        
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
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
                placeholder="Search universities, colleges, coordinators, or students..."
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
                                  <span className="font-semibold">{highlightMatch(university.name)}</span>
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
                                                  <span className="font-medium">{highlightMatch(college.name)}</span>
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
                                            <div>
                                                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                                  <GraduationCap className="h-4 w-4" />
                                                  Students ({collegeStudents.length})
                                                </h5>
                                                {collegeStudents.length === 0 ? (
                                                  <p className="text-xs text-muted-foreground italic">No students</p>
                                                ) : (
                                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                                    {collegeStudents.slice(0, 5).map((student) => (
                                                      <div
                                                        key={student.id}
                                                        className="flex items-center justify-between p-2 rounded bg-background border cursor-pointer hover:bg-muted/50"
                                                        onClick={() => handleItemClick('student', student)}
                                                      >
                                                        <span className="text-sm">{highlightMatch(student.name)}</span>
                                                        {student.department && (
                                                          <Badge variant="outline" className="text-xs">
                                                            {student.department}
                                                          </Badge>
                                                        )}
                                                      </div>
                                                    ))}
                                                    {collegeStudents.length > 5 && (
                                                      <p className="text-xs text-muted-foreground text-center py-1">
                                                        +{collegeStudents.length - 5} more students
                                                      </p>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
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
