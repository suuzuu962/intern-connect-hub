import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Network, LayoutDashboard, Users, BookOpen, User, Settings, Mail, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CoordinatorProfile } from '@/components/coordinator/CoordinatorProfile';
import { CoordinatorStudents } from '@/components/coordinator/CoordinatorStudents';
import { CoordinatorDiaryApproval } from '@/components/coordinator/CoordinatorDiaryApproval';
import { CoordinatorOrgChart } from '@/components/coordinator/CoordinatorOrgChart';
import { InstitutionalMemos } from '@/components/institutional/InstitutionalMemos';
import { AttendanceTracker } from '@/components/institutional/AttendanceTracker';
import { CollegeCoordinator } from '@/types/database';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { cn } from '@/lib/utils';

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
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'org-chart' as const, label: 'Org Chart', icon: Network },
    { id: 'students' as const, label: 'All Students', icon: Users },
    { id: 'diary' as const, label: 'Diary Approvals', icon: BookOpen },
    { id: 'profile' as const, label: 'Profile', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <CoordinatorStudents coordinatorId={coordinator.id} collegeId={coordinator.college_id} viewMode="summary" />;
      case 'org-chart': return <CoordinatorOrgChart coordinatorId={coordinator.id} collegeId={coordinator.college_id} />;
      case 'students': return <PermissionGate permission="activity.view_college" showForbidden><CoordinatorStudents coordinatorId={coordinator.id} collegeId={coordinator.college_id} viewMode="detailed" /></PermissionGate>;
      case 'diary': return <PermissionGate permission="activity.review" showForbidden><CoordinatorDiaryApproval coordinatorId={coordinator.id} collegeId={coordinator.college_id} /></PermissionGate>;
      case 'profile': return <CoordinatorProfile coordinator={coordinator} onUpdate={setCoordinator} />;
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
                <User className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sidebar-foreground">{coordinator.name}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {coordinator.college?.name || 'Coordinator'}
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
                  'dashboard-sidebar-item',
                  activeSection === item.id && 'active'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
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

export default CoordinatorDashboard;
