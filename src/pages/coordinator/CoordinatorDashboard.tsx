import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CoordinatorProfile } from '@/components/coordinator/CoordinatorProfile';
import { CoordinatorStudents } from '@/components/coordinator/CoordinatorStudents';
import { CoordinatorDiaryApproval } from '@/components/coordinator/CoordinatorDiaryApproval';
import { CollegeCoordinator } from '@/types/database';

const CoordinatorDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [coordinator, setCoordinator] = useState<CollegeCoordinator | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchCoordinator = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('college_coordinators')
        .select('*, college:colleges(*), university:universities(*)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching coordinator:', error);
      } else {
        setCoordinator(data);
      }
      setLoading(false);
    };

    fetchCoordinator();
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

  if (!coordinator) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Coordinator Profile Not Found</h2>
            <p className="text-muted-foreground">Please complete your profile setup.</p>
          </div>
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
              In the meantime, you can update your profile.
            </AlertDescription>
          </Alert>
          <div className="mt-8 max-w-2xl mx-auto">
            <CoordinatorProfile coordinator={coordinator} onUpdate={setCoordinator} />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{coordinator.college?.name || 'College Coordinator'}</h1>
          <p className="text-muted-foreground">{coordinator.name}</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="students">All Students</TabsTrigger>
            <TabsTrigger value="diary">Diary Approvals</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CoordinatorStudents coordinatorId={coordinator.id} collegeId={coordinator.college_id} viewMode="summary" />
          </TabsContent>

          <TabsContent value="students">
            <CoordinatorStudents coordinatorId={coordinator.id} collegeId={coordinator.college_id} viewMode="detailed" />
          </TabsContent>

          <TabsContent value="diary">
            <CoordinatorDiaryApproval coordinatorId={coordinator.id} collegeId={coordinator.college_id} />
          </TabsContent>

          <TabsContent value="profile">
            <CoordinatorProfile coordinator={coordinator} onUpdate={setCoordinator} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CoordinatorDashboard;
