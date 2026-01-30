import { useState, useEffect } from 'react';
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

const UniversityDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [university, setUniversity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  if (loading) {
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
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="org-chart">Org Chart</TabsTrigger>
            <TabsTrigger value="colleges">Colleges</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <UniversityStudents universityId={university.id} viewMode="summary" />
          </TabsContent>

          <TabsContent value="org-chart">
            <UniversityOrgChart universityId={university.id} />
          </TabsContent>

          <TabsContent value="colleges">
            <UniversityColleges universityId={university.id} />
          </TabsContent>

          <TabsContent value="students">
            <UniversityStudents universityId={university.id} viewMode="detailed" />
          </TabsContent>

          <TabsContent value="coordinators">
            <UniversityCoordinators universityId={university.id} />
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              <UniversityUsers universityId={university.id} />
              <UniversityLoginLogs universityId={university.id} />
            </div>
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
