import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  School, 
  Users, 
  GraduationCap, 
  ChevronDown, 
  ChevronRight,
  Network,
  Building2
} from 'lucide-react';
import { CollegeCoordinator } from '@/types/database';

interface CollegeOrgChartProps {
  collegeId: string;
}

interface StudentGroup {
  department: string | null;
  count: number;
  students: Array<{
    id: string;
    name: string;
    usn: string | null;
    course: string | null;
  }>;
}

interface CollegeWithUniversity {
  id: string;
  name: string;
  university?: { name: string };
}

interface OrgChartData {
  college: CollegeWithUniversity | null;
  coordinators: CollegeCoordinator[];
  studentGroups: StudentGroup[];
  totalStudents: number;
}

export const CollegeOrgChart = ({ collegeId }: CollegeOrgChartProps) => {
  const [data, setData] = useState<OrgChartData>({
    college: null,
    coordinators: [],
    studentGroups: [],
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['coordinators', 'students']));

  useEffect(() => {
    fetchOrgData();
  }, [collegeId]);

  const fetchOrgData = async () => {
    try {
      // Fetch college details with university
      const { data: collegeData } = await supabase
        .from('colleges')
        .select('*, university:universities(name)')
        .eq('id', collegeId)
        .single();

      // Fetch coordinators
      const { data: coordinatorsData } = await supabase
        .from('college_coordinators')
        .select('*')
        .eq('college_id', collegeId)
        .eq('is_approved', true);

      // Fetch students with profile info
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, department, course, usn, user_id')
        .eq('college_id', collegeId);

      // Get profile names for students
      const studentIds = (studentsData || []).map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds.length > 0 ? studentIds : ['none']);

      // Map profiles to students
      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p.full_name]));

      // Group students by department
      const departmentMap = new Map<string, StudentGroup>();
      (studentsData || []).forEach(student => {
        const dept = student.department || 'Unassigned';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, { department: dept, count: 0, students: [] });
        }
        const group = departmentMap.get(dept)!;
        group.count++;
        group.students.push({
          id: student.id,
          name: profileMap.get(student.user_id) || 'Unknown',
          usn: student.usn,
          course: student.course,
        });
      });

      setData({
        college: collegeData,
        coordinators: coordinatorsData || [],
        studentGroups: Array.from(departmentMap.values()).sort((a, b) => 
          (a.department || '').localeCompare(b.department || '')
        ),
        totalStudents: studentsData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching org data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allSections = ['coordinators', 'students', ...data.studentGroups.map(g => `dept-${g.department}`)];
    setExpandedSections(new Set(allSections));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

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
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Organization Chart
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* College Node */}
          <div className="flex flex-col items-center">
            <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-lg min-w-[280px]">
              <div className="flex items-center gap-3">
                <School className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">{data.college?.name}</h3>
                  {data.college?.university && (
                    <p className="text-sm opacity-90 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {data.college.university.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{data.coordinators.length} Coordinators</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>{data.totalStudents} Students</span>
                </div>
              </div>
            </div>

            {/* Connection Line */}
            <div className="w-0.5 h-8 bg-border" />
          </div>

          {/* Two Column Layout for Coordinators and Students */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coordinators Section */}
            <Collapsible
              open={expandedSections.has('coordinators')}
              onOpenChange={() => toggleSection('coordinators')}
            >
              <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Coordinators</h4>
                        <Badge variant="secondary">{data.coordinators.length}</Badge>
                      </div>
                      {expandedSections.has('coordinators') ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-4 space-y-2">
                    {data.coordinators.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No coordinators assigned</p>
                    ) : (
                      data.coordinators.map((coord) => (
                        <div
                          key={coord.id}
                          className="flex items-center justify-between bg-background rounded p-3 border"
                        >
                          <div>
                            <p className="font-medium">{coord.name}</p>
                            <p className="text-sm text-muted-foreground">{coord.email}</p>
                            {coord.designation && (
                              <p className="text-xs text-muted-foreground">{coord.designation}</p>
                            )}
                          </div>
                          <Badge variant={coord.is_active ? 'default' : 'secondary'}>
                            {coord.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Students Section */}
            <Collapsible
              open={expandedSections.has('students')}
              onOpenChange={() => toggleSection('students')}
            >
              <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Students by Department</h4>
                        <Badge variant="secondary">{data.totalStudents}</Badge>
                      </div>
                      {expandedSections.has('students') ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-4 space-y-3">
                    {data.studentGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No students enrolled</p>
                    ) : (
                      data.studentGroups.map((group) => (
                        <Collapsible
                          key={group.department}
                          open={expandedSections.has(`dept-${group.department}`)}
                          onOpenChange={() => toggleSection(`dept-${group.department}`)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                              <div className="flex items-center gap-2">
                                {expandedSections.has(`dept-${group.department}`) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium">{group.department}</span>
                              </div>
                              <Badge variant="outline">{group.count} students</Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-6 mt-2 space-y-1 max-h-48 overflow-y-auto">
                              {group.students.slice(0, 10).map((student) => (
                                <div
                                  key={student.id}
                                  className="text-sm p-2 bg-background rounded border"
                                >
                                  <span className="font-medium">{student.name}</span>
                                  {student.usn && (
                                    <span className="text-muted-foreground ml-2">({student.usn})</span>
                                  )}
                                </div>
                              ))}
                              {group.students.length > 10 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  +{group.students.length - 10} more students
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
