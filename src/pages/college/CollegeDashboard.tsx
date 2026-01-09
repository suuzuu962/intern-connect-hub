import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Users, BookOpen, GraduationCap, Building } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CollegeProfile } from '@/components/college/CollegeProfile';
import { CollegeStudents } from '@/components/college/CollegeStudents';
import { CollegeCoordinators } from '@/components/college/CollegeCoordinators';
import { CollegeDiaryApproval } from '@/components/college/CollegeDiaryApproval';
import { College } from '@/types/database';

interface CollegeWithStats extends College {
  studentCount?: number;
  coordinatorCount?: number;
}

const CollegeDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [college, setCollege] = useState<CollegeWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, coordinators: 0, diaryEntries: 0 });
  const [pendingDiaryCount, setPendingDiaryCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchCollege = async () => {
      if (!user) return;

      // First, check if user is a college coordinator with a college
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

        // Fetch stats
        const [studentsResult, coordinatorsResult, diaryResult] = await Promise.all([
          supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('college_id', coordinatorData.college.id),
          supabase
            .from('college_coordinators')
            .select('id', { count: 'exact', head: true })
            .eq('college_id', coordinatorData.college.id)
            .eq('is_approved', true),
          supabase
            .from('internship_diary')
            .select('id', { count: 'exact', head: true })
            .in('student_id', 
              (await supabase
                .from('students')
                .select('id')
                .eq('college_id', coordinatorData.college.id)
              ).data?.map(s => s.id) || []
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

  if (!college) {
    return (
      <Layout>
        <div className="container py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>College Not Assigned</AlertTitle>
            <AlertDescription>
              Your account is not yet associated with a college. Please contact your university administrator to assign you to a college.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">{college.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={college.is_active ? 'default' : 'secondary'}>
                {college.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {college.university && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {college.university.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="diary-approvals" className="relative">
              Diary Approvals
              {pendingDiaryCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
                >
                  {pendingDiaryCount > 99 ? '99+' : pendingDiaryCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-3 mb-8">
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
          </TabsContent>

          <TabsContent value="students">
            <CollegeStudents collegeId={college.id} viewMode="detailed" />
          </TabsContent>

          <TabsContent value="diary-approvals">
            <CollegeDiaryApproval 
              collegeId={college.id} 
              collegeName={college.name}
              onPendingCountChange={setPendingDiaryCount}
            />
          </TabsContent>

          <TabsContent value="coordinators">
            <CollegeCoordinators collegeId={college.id} />
          </TabsContent>

          <TabsContent value="profile">
            <CollegeProfile college={college} onUpdate={setCollege} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CollegeDashboard;
