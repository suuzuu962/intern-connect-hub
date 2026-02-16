import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { UniversityProfile } from '@/components/university/UniversityProfile';
import { UniversityColleges } from '@/components/university/UniversityColleges';
import { UniversityUsers } from '@/components/university/UniversityUsers';
import { UniversityCoordinators } from '@/components/university/UniversityCoordinators';
import { UniversityLoginLogs } from '@/components/university/UniversityLoginLogs';
import { UniversityStudents } from '@/components/university/UniversityStudents';
import { UniversityOrgChart } from '@/components/university/UniversityOrgChart';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const UniversityDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [university, setUniversity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFeatureEnabled, loading: permLoading } = useRolePermissions();

  // Map feature keys to tab keys
  const TAB_FEATURE_MAP: Record<string, string> = {
    colleges: 'manage_colleges',
    students: 'view_students',
    coordinators: 'view_coordinators',
  };

  const isTabEnabled = (tabKey: string) => {
    const featureKey = TAB_FEATURE_MAP[tabKey];
    if (!featureKey) return true; // tabs without a feature mapping are always visible
    return isFeatureEnabled(featureKey);
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUniversity = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching university:', error);
      } else {
        setUniversity(data);
      }
      setLoading(false);
    };

    fetchUniversity();
  }, [user]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
        <div className="container py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">University Profile Not Found</h2>
            <p className="text-muted-foreground">Please complete your profile setup.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{university.name}</h1>
          <p className="text-muted-foreground">
            {university.is_verified ? 'Verified University' : 'Pending Verification'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className={`grid w-full mb-8`} style={{ gridTemplateColumns: `repeat(${2 + (isTabEnabled('colleges') ? 1 : 0) + (isTabEnabled('students') ? 1 : 0) + (isTabEnabled('coordinators') ? 1 : 0) + 2}, minmax(0, 1fr))` }}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="org-chart">Org Chart</TabsTrigger>
            {isTabEnabled('colleges') && (
              <TabsTrigger value="colleges">Colleges</TabsTrigger>
            )}
            {isTabEnabled('students') && (
              <TabsTrigger value="students">Students</TabsTrigger>
            )}
            {isTabEnabled('coordinators') && (
              <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
            )}
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <UniversityStudents universityId={university.id} viewMode="summary" />
          </TabsContent>

          <TabsContent value="org-chart">
            <UniversityOrgChart universityId={university.id} />
          </TabsContent>

          {isTabEnabled('colleges') && (
            <TabsContent value="colleges">
              <PermissionGate permission="user.edit" showForbidden>
                <UniversityColleges universityId={university.id} />
              </PermissionGate>
            </TabsContent>
          )}

          {isTabEnabled('students') && (
            <TabsContent value="students">
              <PermissionGate permission="internship.view_all" showForbidden>
                <UniversityStudents universityId={university.id} viewMode="detailed" />
              </PermissionGate>
            </TabsContent>
          )}

          {isTabEnabled('coordinators') && (
            <TabsContent value="coordinators">
              <PermissionGate permission="user.edit" showForbidden>
                <UniversityCoordinators universityId={university.id} />
              </PermissionGate>
            </TabsContent>
          )}

          <TabsContent value="users">
            <PermissionGate permission="user.create" showForbidden>
              <div className="space-y-6">
                <UniversityUsers universityId={university.id} />
                <UniversityLoginLogs universityId={university.id} />
              </div>
            </PermissionGate>
          </TabsContent>

          <TabsContent value="profile">
            <UniversityProfile university={university} onUpdate={setUniversity} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UniversityDashboard;
