import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Users, BookOpen, GraduationCap, Building, Network, LayoutDashboard, UserCheck, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CollegeProfile } from '@/components/college/CollegeProfile';
import { CollegeStudents } from '@/components/college/CollegeStudents';
import { CollegeCoordinators } from '@/components/college/CollegeCoordinators';
import { CollegeDiaryApproval } from '@/components/college/CollegeDiaryApproval';
import { CollegeOrgChart } from '@/components/college/CollegeOrgChart';
import { College } from '@/types/database';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { cn } from '@/lib/utils';

interface CollegeWithStats extends College {
  studentCount?: number;
  coordinatorCount?: number;
}

type ActiveSection = 'dashboard' | 'org-chart' | 'students' | 'diary-approvals' | 'coordinators' | 'profile';

const CollegeDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>((searchParams.get('tab') as ActiveSection) || 'dashboard');
  const [college, setCollege] = useState<CollegeWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, coordinators: 0, diaryEntries: 0 });
  const [pendingDiaryCount, setPendingDiaryCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveSection;
    if (tab) setActiveSection(tab);
  }, [searchParams]);

  useEffect(() => {
    const fetchCollege = async () => {
      if (!user) return;
      const { data: coordinatorData, error: coordinatorError } = await supabase
        .from('college_coordinators')
        .select('*, college:colleges(*, university:universities(*))')
        .eq('user_id', user.id)
        .single();

      if (coordinatorError) {
        console.error('Error fetching coordinator:', coordinatorError);
        setLoading(false);
        return;
      }

      if (coordinatorData?.college) {
        setCollege(coordinatorData.college);
        const [studentsResult, coordinatorsResult, diaryResult] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('college_id', coordinatorData.college.id),
          supabase.from('college_coordinators').select('id', { count: 'exact', head: true }).eq('college_id', coordinatorData.college.id).eq('is_approved', true),
          supabase.from('internship_diary').select('id', { count: 'exact', head: true }).in('student_id',
            (await supabase.from('students').select('id').eq('college_id', coordinatorData.college.id)).data?.map(s => s.id) || []
          )
        ]);
        setStats({
          students: studentsResult.count || 0,
          coordinators: coordinatorsResult.count || 0,
          diaryEntries: diaryResult.count || 0,
        });
      }
      setLoading(false);
    };
    fetchCollege();
  }, [user]);

  const handleNavigate = (value: ActiveSection) => {
    setActiveSection(value);
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!college) {
    return (
      <Layout>
        <div className="container py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>College Not Assigned</AlertTitle>
            <AlertDescription>
              Your account is not yet associated with a college. Please contact your university administrator.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  const sidebarItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'org-chart' as const, label: 'Org Chart', icon: Network },
    { id: 'students' as const, label: 'Students', icon: Users },
    { id: 'diary-approvals' as const, label: 'Diary Approvals', icon: BookOpen, badge: pendingDiaryCount > 0 ? pendingDiaryCount : undefined },
    { id: 'coordinators' as const, label: 'Coordinators', icon: UserCheck },
    { id: 'profile' as const, label: 'Profile', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.students}</div>
                  <p className="text-xs text-muted-foreground">Enrolled students</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Coordinators</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.coordinators}</div>
                  <p className="text-xs text-muted-foreground">Active coordinators</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Diary Entries</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.diaryEntries}</div>
                  <p className="text-xs text-muted-foreground">Total submissions</p>
                </CardContent>
              </Card>
            </div>
            <CollegeStudents collegeId={college.id} viewMode="summary" />
          </div>
        );
      case 'org-chart': return <CollegeOrgChart collegeId={college.id} />;
      case 'students': return <PermissionGate permission="activity.view_college" showForbidden><CollegeStudents collegeId={college.id} viewMode="detailed" /></PermissionGate>;
      case 'diary-approvals': return <PermissionGate permission="activity.review" showForbidden><CollegeDiaryApproval collegeId={college.id} collegeName={college.name} onPendingCountChange={setPendingDiaryCount} /></PermissionGate>;
      case 'coordinators': return <PermissionGate permission="user.edit" showForbidden><CollegeCoordinators collegeId={college.id} /></PermissionGate>;
      case 'profile': return <CollegeProfile college={college} onUpdate={setCollege} />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="w-64 dashboard-sidebar shrink-0 flex flex-col">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sidebar-foreground">{college.name}</p>
                <p className="text-xs text-sidebar-foreground/60 flex items-center gap-1">
                  <Badge variant={college.is_active ? 'default' : 'secondary'} className="text-[10px] h-4">
                    {college.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          <nav className="p-2 space-y-1 flex-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  'dashboard-sidebar-item relative',
                  activeSection === item.id && 'active'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-auto bg-background page-transition">
          {renderContent()}
        </main>
      </div>
    </Layout>
  );
};

export default CollegeDashboard;
