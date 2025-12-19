import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Briefcase, CheckCircle, Clock, AlertCircle, UserCog } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StudentInfo {
  id: string;
  user_id: string;
  university: string | null;
  degree: string | null;
  skills: string[] | null;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  internship: {
    title: string;
    company: {
      name: string;
      logo_url: string | null;
    };
  };
}

interface StudentOverviewProps {
  student: StudentInfo | null;
  loading: boolean;
  onEditProfile: () => void;
}

export const StudentOverview = ({ student, loading, onEditProfile }: StudentOverviewProps) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loadingApplications, setLoadingApplications] = useState(true);

  useEffect(() => {
    if (student?.id) {
      fetchApplications();
      calculateProfileCompletion();
    }
  }, [student]);

  const fetchApplications = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          internship:internships(
            title,
            company:companies(name, logo_url)
          )
        `)
        .eq('student_id', student?.id)
        .order('applied_at', { ascending: false })
        .limit(5);

      if (data) {
        const formatted = data.map((app: any) => ({
          id: app.id,
          status: app.status,
          applied_at: app.applied_at,
          internship: {
            title: app.internship?.title || 'Unknown',
            company: {
              name: app.internship?.company?.name || 'Unknown',
              logo_url: app.internship?.company?.logo_url,
            },
          },
        }));
        setApplications(formatted);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const calculateProfileCompletion = async () => {
    if (!student?.id) return;

    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .single();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', student.user_id)
        .single();

      let completed = 0;
      const fields = [
        profileData?.full_name,
        profileData?.phone_number,
        studentData?.dob,
        studentData?.gender,
        studentData?.usn,
        studentData?.university,
        studentData?.department,
        studentData?.semester,
        studentData?.address,
        studentData?.country,
        studentData?.state,
        studentData?.city,
        studentData?.linkedin_url,
        studentData?.skills?.length,
        studentData?.interested_domains?.length,
        studentData?.resume_url,
      ];

      fields.forEach((field) => {
        if (field) completed++;
      });

      setProfileCompletion(Math.round((completed / fields.length) * 100));
    } catch (error) {
      console.error('Error calculating profile completion:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome Back!</h1>
                <p className="text-muted-foreground">
                  {student?.university || 'Complete your profile to apply for internships'}
                </p>
              </div>
            </div>
            <Button onClick={onEditProfile} variant="outline">
              <UserCog className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-muted-foreground">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            {profileCompletion < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                Complete your profile to increase your chances of getting selected.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <Briefcase className="h-5 w-5 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.total}</span>
              <span className="text-sm text-muted-foreground">Applied Internships</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <Clock className="h-5 w-5 text-yellow-500 mb-2" />
              <span className="text-2xl font-bold">{stats.pending}</span>
              <span className="text-sm text-muted-foreground">Pending Review</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
              <span className="text-2xl font-bold">{stats.approved}</span>
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingApplications ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No applications yet</p>
              <p className="text-sm">Browse internships and start applying!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {app.internship.company.logo_url ? (
                      <img
                        src={app.internship.company.logo_url}
                        alt={app.internship.company.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{app.internship.title}</p>
                      <p className="text-sm text-muted-foreground">{app.internship.company.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                    </span>
                    {getStatusBadge(app.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};