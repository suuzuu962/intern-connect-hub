import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, LayoutDashboard, Network, School, Users, UserCheck, User, Settings } from 'lucide-react';
import { UniversityProfile } from '@/components/university/UniversityProfile';
import { UniversityColleges } from '@/components/university/UniversityColleges';
import { UniversityUsers } from '@/components/university/UniversityUsers';
import { UniversityCoordinators } from '@/components/university/UniversityCoordinators';
import { UniversityLoginLogs } from '@/components/university/UniversityLoginLogs';
import { UniversityStudents } from '@/components/university/UniversityStudents';
import { UniversityOrgChart } from '@/components/university/UniversityOrgChart';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

type ActiveSection = 'dashboard' | 'org-chart' | 'colleges' | 'students' | 'coordinators' | 'users' | 'profile';

const UniversityDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>((searchParams.get('tab') as ActiveSection) || 'dashboard');
  const [university, setUniversity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { hasPermission, loading: permLoading } = usePermissions();

  const isTabVisible = (tabKey: string) => {
    switch (tabKey) {
      case 'colleges': return hasPermission('college.manage') || hasPermission('feature:manage_colleges');
      case 'students': return hasPermission('student.view') || hasPermission('feature:view_students');
      case 'coordinators': return hasPermission('coordinator.view') || hasPermission('feature:view_coordinators');
      default: return true;
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveSection;
    if (tab) setActiveSection(tab);
  }, [searchParams]);

  useEffect(() => {
    const fetchUniversity = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) console.error('Error fetching university:', error);
      else setUniversity(data);
      setLoading(false);
    };
    fetchUniversity();
  }, [user]);

  const handleNavigate = (value: ActiveSection) => {
    setActiveSection(value);
    setSearchParams({ tab: value });
  };

  if (loading || permLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!university) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">University Profile Not Found</h2>
          <p className="text-muted-foreground">Please complete your profile setup.</p>
        </div>
      </Layout>
    );
  }

  const sidebarItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'org-chart' as const, label: 'Org Chart', icon: Network, visible: true },
    { id: 'colleges' as const, label: 'Colleges', icon: School, visible: isTabVisible('colleges') },
    { id: 'students' as const, label: 'Students', icon: Users, visible: isTabVisible('students') },
    { id: 'coordinators' as const, label: 'Coordinators', icon: UserCheck, visible: isTabVisible('coordinators') },
    { id: 'users' as const, label: 'Users', icon: User, visible: true },
    { id: 'profile' as const, label: 'Profile', icon: Settings, visible: true },
  ].filter(i => i.visible);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <UniversityStudents universityId={university.id} viewMode="summary" />;
      case 'org-chart': return <UniversityOrgChart universityId={university.id} />;
      case 'colleges': return <PermissionGate permission="college.manage" showForbidden><UniversityColleges universityId={university.id} /></PermissionGate>;
      case 'students': return <PermissionGate permission="student.view" showForbidden><UniversityStudents universityId={university.id} viewMode="detailed" /></PermissionGate>;
      case 'coordinators': return <PermissionGate permission="coordinator.view" showForbidden><UniversityCoordinators universityId={university.id} /></PermissionGate>;
      case 'users': return <PermissionGate permission="user.create" showForbidden><div className="space-y-6"><UniversityUsers universityId={university.id} /><UniversityLoginLogs universityId={university.id} /></div></PermissionGate>;
      case 'profile': return <UniversityProfile university={university} onUpdate={setUniversity} />;
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
                <p className="font-semibold truncate text-sidebar-foreground">{university.name}</p>
                <p className="text-xs text-sidebar-foreground/60">
                  {university.is_verified ? '✓ Verified' : 'Pending Verification'}
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

export default UniversityDashboard;
