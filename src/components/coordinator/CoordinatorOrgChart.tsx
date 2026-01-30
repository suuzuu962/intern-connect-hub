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
  Building2,
  User
} from 'lucide-react';
import { CollegeCoordinator } from '@/types/database';

interface CoordinatorOrgChartProps {
  coordinatorId: string;
  collegeId: string | null;
}

interface StudentInfo {
  id: string;
  name: string;
  usn: string | null;
  course: string | null;
  department: string | null;
}

interface CollegeWithUniversity {
  id: string;
  name: string;
  university?: { name: string };
}

interface OrgChartData {
  college: CollegeWithUniversity | null;
  coordinator: CollegeCoordinator | null;
  fellowCoordinators: CollegeCoordinator[];
  students: StudentInfo[];
  studentsByDepartment: Map<string, StudentInfo[]>;
}

export const CoordinatorOrgChart = ({ coordinatorId, collegeId }: CoordinatorOrgChartProps) => {
  const [data, setData] = useState<OrgChartData>({
    college: null,
    coordinator: null,
    fellowCoordinators: [],
    students: [],
    studentsByDepartment: new Map(),
  });
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['hierarchy', 'students']));

  useEffect(() => {
    if (collegeId) {
      fetchOrgData();
    } else {
      setLoading(false);
    }
  }, [coordinatorId, collegeId]);

  const fetchOrgData = async () => {
    if (!collegeId) return;

    try {
      // Fetch college details with university
      const { data: collegeData } = await supabase
        .from('colleges')
        .select('*, university:universities(name)')
        .eq('id', collegeId)
        .single();

      // Fetch current coordinator
      const { data: coordinatorData } = await supabase
        .from('college_coordinators')
        .select('*')
        .eq('id', coordinatorId)
        .single();

      // Fetch fellow coordinators
      const { data: coordinatorsData } = await supabase
        .from('college_coordinators')
        .select('*')
        .eq('college_id', collegeId)
        .eq('is_approved', true)
        .neq('id', coordinatorId);

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, department, course, usn, user_id')
        .eq('college_id', collegeId);

      // Get profile names
      const studentIds = (studentsData || []).map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds.length > 0 ? studentIds : ['none']);

      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p.full_name]));

      // Map students with names
      const students: StudentInfo[] = (studentsData || []).map(s => ({
        id: s.id,
        name: profileMap.get(s.user_id) || 'Unknown',
        usn: s.usn,
        course: s.course,
        department: s.department,
      }));

      // Group by department
      const studentsByDepartment = new Map<string, StudentInfo[]>();
      students.forEach(student => {
        const dept = student.department || 'Unassigned';
        if (!studentsByDepartment.has(dept)) {
          studentsByDepartment.set(dept, []);
        }
        studentsByDepartment.get(dept)!.push(student);
      });

      setData({
        college: collegeData,
        coordinator: coordinatorData,
        fellowCoordinators: coordinatorsData || [],
        students,
        studentsByDepartment,
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
    const allSections = ['hierarchy', 'students', ...Array.from(data.studentsByDepartment.keys()).map(d => `dept-${d}`)];
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

  if (!collegeId) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No college assigned to view organization chart.</p>
          </div>
        </CardContent>
      </Card>
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
          {/* Hierarchy Section */}
          <Collapsible
            open={expandedSections.has('hierarchy')}
            onOpenChange={() => toggleSection('hierarchy')}
          >
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
              <CollapsibleTrigger asChild>
                <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Institutional Hierarchy</h4>
                    </div>
                    {expandedSections.has('hierarchy') ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t p-4">
                  <div className="flex flex-col items-center space-y-4">
                    {/* University */}
                    {data.college?.university && (
                      <>
                        <div className="bg-secondary text-secondary-foreground rounded-lg p-3 shadow min-w-[200px] text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Building2 className="h-5 w-5" />
                            <span className="font-semibold">{data.college.university.name}</span>
                          </div>
                          <p className="text-xs opacity-80 mt-1">University</p>
                        </div>
                        <div className="w-0.5 h-6 bg-border" />
                      </>
                    )}

                    {/* College */}
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow min-w-[200px] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <School className="h-5 w-5" />
                        <span className="font-semibold">{data.college?.name}</span>
                      </div>
                      <p className="text-xs opacity-80 mt-1">College</p>
                    </div>
                    <div className="w-0.5 h-6 bg-border" />

                    {/* Coordinator (You) */}
                    <div className="bg-accent text-accent-foreground rounded-lg p-3 shadow min-w-[200px] text-center border-2 border-primary">
                      <div className="flex items-center justify-center gap-2">
                        <User className="h-5 w-5" />
                        <span className="font-semibold">{data.coordinator?.name}</span>
                      </div>
                      <p className="text-xs opacity-80 mt-1">You (Coordinator)</p>
                    </div>

                    {/* Fellow Coordinators */}
                    {data.fellowCoordinators.length > 0 && (
                      <div className="mt-4 w-full">
                        <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
                          Fellow Coordinators
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {data.fellowCoordinators.map((coord) => (
                            <div
                              key={coord.id}
                              className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                            >
                              <Users className="h-4 w-4" />
                              {coord.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                      <h4 className="font-semibold">Students Under Your College</h4>
                      <Badge variant="secondary">{data.students.length}</Badge>
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
                  {data.studentsByDepartment.size === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center">No students enrolled</p>
                  ) : (
                    Array.from(data.studentsByDepartment.entries())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([department, students]) => (
                        <Collapsible
                          key={department}
                          open={expandedSections.has(`dept-${department}`)}
                          onOpenChange={() => toggleSection(`dept-${department}`)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                              <div className="flex items-center gap-2">
                                {expandedSections.has(`dept-${department}`) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium">{department}</span>
                              </div>
                              <Badge variant="outline">{students.length} students</Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-6 mt-2 space-y-1 max-h-48 overflow-y-auto">
                              {students.slice(0, 10).map((student) => (
                                <div
                                  key={student.id}
                                  className="text-sm p-2 bg-background rounded border flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-medium">{student.name}</span>
                                    {student.usn && (
                                      <span className="text-muted-foreground ml-2">({student.usn})</span>
                                    )}
                                  </div>
                                  {student.course && (
                                    <Badge variant="outline" className="text-xs">
                                      {student.course}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                              {students.length > 10 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  +{students.length - 10} more students
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
      </CardContent>
    </Card>
  );
};
