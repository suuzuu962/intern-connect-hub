import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Network, LayoutDashboard, Users, BookOpen, User, Settings, Mail, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CoordinatorProfile } from '@/components/coordinator/CoordinatorProfile';
import { CoordinatorStudents } from '@/components/coordinator/CoordinatorStudents';
import { CoordinatorDiaryApproval } from '@/components/coordinator/CoordinatorDiaryApproval';
import { CoordinatorOrgChart } from '@/components/coordinator/CoordinatorOrgChart';
import { InstitutionalMemos } from '@/components/institutional/InstitutionalMemos';
import { AttendanceTracker } from '@/components/institutional/AttendanceTracker';
import { CollegeCoordinator } from '@/types/database';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

type ActiveSection = 'dashboard' | 'org-chart' | 'students' | 'diary' | 'attendance' | 'memos' | 'profile';

const CoordinatorDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>((searchParams.get('tab') as ActiveSection) || 'dashboard');
  const [coordinator, setCoordinator] = useState<CollegeCoordinator | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveSection;
    if (tab) setActiveSection(tab);
  }, [searchParams]);

  useEffect(() => {
    const fetchCoordinator = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('college_coordinators')
        .select('*, college:colleges(*), university:universities(*)')
        .eq('user_id', user.id)
        .single();
      if (error) console.error('Error fetching coordinator:', error);
      else setCoordinator(data);
      setLoading(false);
    };
    fetchCoordinator();
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

  if (!coordinator) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Coordinator Profile Not Found</h2>
          <p className="text-muted-foreground">Please complete your profile setup.</p>
        </div>
      </Layout>
    );
  }

  if (!coordinator.is_approved) {
    return (
      <Layout>
        <div className="container py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pending Approval</AlertTitle>
            <AlertDescription>
              Your account is pending approval from the university. You'll be able to access the dashboard once approved.
            </AlertDescription>
          </Alert>
          <div className="mt-8 max-w-2xl mx-auto">
            <CoordinatorProfile coordinator={coordinator} onUpdate={setCoordinator} />
          </div>
        </div>
      </Layout>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'org-chart', label: 'Org Chart', icon: Network },
    { id: 'students', label: 'All Students', icon: Users },
    { id: 'diary', label: 'Diary Approvals', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'memos', label: 'Memos', icon: Mail },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <CoordinatorStudents coordinatorId={coordinator.id} collegeId={coordinator.college_id} viewMode="summary" />;
      case 'org-chart': return <CoordinatorOrgChart coordinatorId={coordinator.id} collegeId={coordinator.college_id} />;
      case 'students': return <PermissionGate permission="activity.view_college" showForbidden><CoordinatorStudents coordinatorId={coordinator.id} collegeId={coordinator.college_id} viewMode="detailed" /></PermissionGate>;
      case 'diary': return <PermissionGate permission="activity.review" showForbidden><CoordinatorDiaryApproval coordinatorId={coordinator.id} collegeId={coordinator.college_id} /></PermissionGate>;
      case 'attendance': return coordinator.college_id ? <AttendanceTracker collegeId={coordinator.college_id} role="coordinator" /> : <div className="text-muted-foreground">No college assigned</div>;
      case 'memos': return coordinator.university_id ? <InstitutionalMemos universityId={coordinator.university_id} collegeId={coordinator.college_id || undefined} senderRole="coordinator" senderName={coordinator.name} /> : <div className="text-muted-foreground">No university assigned</div>;
      case 'profile': return <CoordinatorProfile coordinator={coordinator} onUpdate={setCoordinator} />;
      default: return null;
    }
  };

  const sidebarHeader = (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm">{coordinator.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {coordinator.college?.name || 'Coordinator'}
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

export default CoordinatorDashboard;
