import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Users, BookOpen, GraduationCap, Network, LayoutDashboard, UserCheck, Settings, Mail, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CollegeProfile } from '@/components/college/CollegeProfile';
import { CollegeStudents } from '@/components/college/CollegeStudents';
import { CollegeCoordinators } from '@/components/college/CollegeCoordinators';
import { CollegeDiaryApproval } from '@/components/college/CollegeDiaryApproval';
import { CollegeOrgChart } from '@/components/college/CollegeOrgChart';
import { InstitutionalMemos } from '@/components/institutional/InstitutionalMemos';
import { AttendanceTracker } from '@/components/institutional/AttendanceTracker';
import { College } from '@/types/database';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardWelcomeHeader } from '@/components/dashboard/DashboardWelcomeHeader';
import { SidebarProfileHeader } from '@/components/dashboard/SidebarProfileHeader';

interface CollegeWithStats extends College {
  studentCount?: number;
  coordinatorCount?: number;
}

type ActiveSection = 'dashboard' | 'org-chart' | 'students' | 'diary-approvals' | 'attendance' | 'coordinators' | 'memos' | 'profile';

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

  const handleNavigate = (value: string) => {
    setActiveSection(value as ActiveSection);
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'org-chart', label: 'Org Chart', icon: Network },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'diary-approvals', label: 'Diary Approvals', icon: BookOpen, badge: pendingDiaryCount > 0 ? pendingDiaryCount : undefined },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'coordinators', label: 'Coordinators', icon: UserCheck },
    { id: 'memos', label: 'Memos', icon: Mail },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardWelcomeHeader
              userName={college.name}
              title="Welcome to Your Dashboard"
              subtitle="Manage your college internship activities"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.students}</div>
                  <p className="text-xs text-muted-foreground">Enrolled students</p>
                </CardContent>
              </Card>
              <Card className="border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Coordinators</CardTitle>
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <GraduationCap className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.coordinators}</div>
                  <p className="text-xs text-muted-foreground">Active coordinators</p>
                </CardContent>
              </Card>
              <Card className="border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Diary Entries</CardTitle>
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </div>
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
      case 'attendance': return <AttendanceTracker collegeId={college.id} role="college" />;
      case 'coordinators': return <PermissionGate permission="user.edit" showForbidden><CollegeCoordinators collegeId={college.id} /></PermissionGate>;
      case 'memos': return <InstitutionalMemos universityId={(college as any).university_id} collegeId={college.id} senderRole="college" senderName={college.name} />;
      case 'profile': return <CollegeProfile college={college} onUpdate={setCollege} />;
      default: return null;
    }
  };

  const sidebarHeader = (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
        <GraduationCap className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm">{college.name}</p>
        <p className="text-xs text-muted-foreground">
          {college.is_active ? '✓ Active' : 'Inactive'}
        </p>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      sidebar={
        <DashboardSidebar
          header={sidebarHeader}
          items={sidebarItems}
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />
      }
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default CollegeDashboard;
