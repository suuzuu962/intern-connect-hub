import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Building2, 
  School, 
  Users, 
  GraduationCap, 
  ChevronDown, 
  ChevronRight,
  Network
} from 'lucide-react';
import { University, College, CollegeCoordinator } from '@/types/database';

interface UniversityOrgChartProps {
  universityId: string;
}

interface CollegeWithDetails extends College {
  coordinators: CollegeCoordinator[];
  studentCount: number;
}

interface OrgChartData {
  university: University | null;
  colleges: CollegeWithDetails[];
  totalStudents: number;
  totalCoordinators: number;
}

export const UniversityOrgChart = ({ universityId }: UniversityOrgChartProps) => {
  const [data, setData] = useState<OrgChartData>({
    university: null,
    colleges: [],
    totalStudents: 0,
    totalCoordinators: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrgData();
  }, [universityId]);

  const fetchOrgData = async () => {
    try {
      // Fetch university details
      const { data: universityData } = await supabase
        .from('universities')
        .select('*')
        .eq('id', universityId)
        .single();

      // Fetch colleges
      const { data: collegesData } = await supabase
        .from('colleges')
        .select('*')
        .eq('university_id', universityId)
        .order('name');

      // Fetch coordinators
      const { data: coordinatorsData } = await supabase
        .from('college_coordinators')
        .select('*')
        .eq('university_id', universityId);

      // Fetch student counts per college
      const collegeIds = (collegesData || []).map(c => c.id);
      const { data: studentsData } = await supabase
        .from('students')
        .select('college_id')
        .in('college_id', collegeIds.length > 0 ? collegeIds : ['none']);

      // Build college details with coordinators and student counts
      const collegesWithDetails: CollegeWithDetails[] = (collegesData || []).map(college => {
        const collegeCoordinators = (coordinatorsData || []).filter(
          coord => coord.college_id === college.id
        );
        const studentCount = (studentsData || []).filter(
          student => student.college_id === college.id
        ).length;

        return {
          ...college,
          coordinators: collegeCoordinators,
          studentCount,
        };
      });

      setData({
        university: universityData,
        colleges: collegesWithDetails,
        totalStudents: studentsData?.length || 0,
        totalCoordinators: coordinatorsData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching org data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollege = (collegeId: string) => {
    setExpandedColleges(prev => {
      const next = new Set(prev);
      if (next.has(collegeId)) {
        next.delete(collegeId);
      } else {
        next.add(collegeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedColleges(new Set(data.colleges.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedColleges(new Set());
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
          {/* University Node */}
          <div className="flex flex-col items-center">
            <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-lg min-w-[280px]">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">{data.university?.name}</h3>
                  <p className="text-sm opacity-90">{data.university?.email}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <School className="h-4 w-4" />
                  <span>{data.colleges.length} Colleges</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{data.totalCoordinators} Coordinators</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>{data.totalStudents} Students</span>
                </div>
              </div>
            </div>

            {/* Connection Line */}
            {data.colleges.length > 0 && (
              <div className="w-0.5 h-8 bg-border" />
            )}
          </div>

          {/* Colleges Grid */}
          {data.colleges.length > 0 && (
            <div className="relative">
              {/* Horizontal connector line */}
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-border" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {data.colleges.map((college) => (
                  <Collapsible
                    key={college.id}
                    open={expandedColleges.has(college.id)}
                    onOpenChange={() => toggleCollege(college.id)}
                  >
                    <div className="border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                      {/* College Header */}
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <School className="h-5 w-5 text-primary" />
                              <h4 className="font-semibold">{college.name}</h4>
                            </div>
                            {expandedColleges.has(college.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {college.coordinators.length} Coordinators
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {college.studentCount} Students
                            </Badge>
                            <Badge 
                              variant={college.is_active ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {college.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* College Details */}
                      <CollapsibleContent>
                        <div className="border-t p-4 bg-muted/30 space-y-3">
                          {/* Contact Info */}
                          {college.contact_person_name && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Contact:</span>{' '}
                              {college.contact_person_name}
                              {college.contact_person_designation && (
                                <span className="text-muted-foreground">
                                  {' '}({college.contact_person_designation})
                                </span>
                              )}
                            </div>
                          )}
                          
                          {college.email && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Email:</span>{' '}
                              {college.email}
                            </div>
                          )}

                          {/* Coordinators List */}
                          {college.coordinators.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-muted-foreground">
                                Coordinators:
                              </h5>
                              <div className="space-y-1">
                                {college.coordinators.map((coord) => (
                                  <div
                                    key={coord.id}
                                    className="flex items-center justify-between bg-background rounded p-2 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <span>{coord.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Badge 
                                        variant={coord.is_approved ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {coord.is_approved ? 'Approved' : 'Pending'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {college.coordinators.length === 0 && (
                            <div className="text-sm text-muted-foreground italic">
                              No coordinators assigned
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}

          {data.colleges.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <School className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No colleges added yet.</p>
              <p className="text-sm">Add colleges to see the organization chart.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
