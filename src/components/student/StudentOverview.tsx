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
import { InternshipRecommendations } from './InternshipRecommendations';
import { DashboardWelcomeHeader } from '@/components/dashboard/DashboardWelcomeHeader';
import { ResumeAnalysis } from './ResumeAnalysis';
import { NextStepsCards } from '@/components/dashboard/NextStepsCards';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { FileText, GraduationCap, Search } from 'lucide-react';

interface StudentInfo {
  id: string;
  user_id: string;
  university: string | null;
  degree: string | null;
  skills: string[] | null;
  interested_domains: string[] | null;
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

interface StudentFullData extends StudentInfo {
  skills: string[] | null;
  interested_domains: string[] | null;
}

export const StudentOverview = ({ student, loading, onEditProfile }: StudentOverviewProps) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [studentFullData, setStudentFullData] = useState<StudentFullData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (student?.id) {
      fetchApplications();
      calculateProfileCompletion();
      fetchStudentFullData();
      fetchAvatarUrl();
    }
  }, [student]);

  const fetchAvatarUrl = async () => {
    if (!student?.user_id) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', student.user_id)
        .maybeSingle();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const fetchStudentFullData = async () => {
    if (!student?.id) return;
    try {
      const { data } = await supabase
        .from('students')
        .select('id, user_id, university, degree, skills, interested_domains')
        .eq('id', student.id)
        .maybeSingle();
      
      if (data) {
        setStudentFullData(data as StudentFullData);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

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

  const [completedFields, setCompletedFields] = useState(0);
  const [totalFields, setTotalFields] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

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

      const fieldChecks = [
        { name: 'Full Name', value: profileData?.full_name },
        { name: 'Phone Number', value: profileData?.phone_number },
        { name: 'Date of Birth', value: studentData?.dob },
        { name: 'Gender', value: studentData?.gender },
        { name: 'USN', value: studentData?.usn },
        { name: 'University', value: studentData?.university },
        { name: 'Department', value: studentData?.department },
        { name: 'Semester', value: studentData?.semester },
        { name: 'Domain', value: studentData?.domain },
        { name: 'Course', value: studentData?.course },
        { name: 'Year of Study', value: studentData?.year_of_study },
        { name: 'Graduation Year', value: studentData?.graduation_year },
        { name: 'Current Address', value: studentData?.address },
        { name: 'Current Country', value: studentData?.country },
        { name: 'Current State', value: studentData?.state },
        { name: 'Current City', value: studentData?.city },
        { name: 'Permanent Address', value: studentData?.permanent_address },
        { name: 'Permanent Country', value: studentData?.permanent_country },
        { name: 'Permanent State', value: studentData?.permanent_state },
        { name: 'Permanent City', value: studentData?.permanent_city },
        { name: 'LinkedIn', value: studentData?.linkedin_url },
        { name: 'Skills', value: studentData?.skills?.length },
        { name: 'Interested Domains', value: studentData?.interested_domains?.length },
        { name: 'Resume', value: studentData?.resume_url },
        { name: 'About Me', value: studentData?.about_me },
        { name: 'College', value: studentData?.college || studentData?.college_id },
        { name: 'Degree', value: studentData?.degree },
        { name: 'Specialization', value: studentData?.specialization },
        { name: 'College ID', value: studentData?.college_id_url },
      ];

      let completed = 0;
      const missing: string[] = [];

      fieldChecks.forEach((field) => {
        if (field.value) {
          completed++;
        } else {
          missing.push(field.name);
        }
      });

      setCompletedFields(completed);
      setTotalFields(fieldChecks.length);
      setMissingFields(missing);
      setProfileCompletion(Math.round((completed / fieldChecks.length) * 100));
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

  const getProgressColor = () => {
    if (profileCompletion === 100) return 'bg-green-500';
    return 'bg-amber-500';
  };

  const displayedMissingFields = missingFields.slice(0, 5);
  const remainingCount = missingFields.length - 5;

  return (
    <div className="space-y-6 page-transition">
      <DashboardWelcomeHeader
        title="Welcome to Your Dashboard"
        subtitle="Track your applications and manage your profile"
      />

      {/* Next Steps */}
      <NextStepsCards
        steps={[
          {
            id: 'profile',
            title: 'Complete Your Profile',
            description: 'Fill in all required fields to stand out to employers',
            icon: User,
            completed: profileCompletion === 100,
            action: onEditProfile,
            actionLabel: 'Edit Profile',
            color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
          },
          {
            id: 'resume',
            title: 'Upload Your Resume',
            description: 'Add your resume to get AI-powered analysis and recommendations',
            icon: FileText,
            completed: !!(studentFullData as any)?.resume_url,
            action: onEditProfile,
            actionLabel: 'Upload Resume',
            color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
          },
          {
            id: 'apply',
            title: 'Apply for Internships',
            description: 'Browse available internships and start applying today',
            icon: Search,
            completed: applications.length > 0,
            actionLabel: 'Browse Internships',
            color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
          },
        ]}
      />
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">Profile Completion</h2>
                <p className="text-sm text-muted-foreground">
                  {completedFields} of {totalFields} fields completed
                </p>
              </div>
            </div>
            <span className={`text-3xl font-bold ${profileCompletion === 100 ? 'text-green-500' : 'text-amber-500'}`}>
              {profileCompletion}%
            </span>
          </div>

          <Progress 
            value={profileCompletion} 
            className={`h-2 mt-4 ${profileCompletion === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'}`} 
          />

          {profileCompletion < 100 && missingFields.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
                Required fields missing:
              </p>
              <div className="flex flex-wrap gap-2">
                {displayedMissingFields.map((field) => (
                  <Badge 
                    key={field} 
                    variant="outline" 
                    className="bg-white dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                  >
                    {field}
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge 
                    variant="outline" 
                    className="bg-white dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                  >
                    +{remainingCount} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={onEditProfile} variant="outline" size="sm">
              <UserCog className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <Card className="stat-card stat-card-blue hover-glow">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <Briefcase className="h-5 w-5 text-info mb-2" />
              <span className="text-2xl font-bold animate-count-up">{stats.total}</span>
              <span className="text-sm text-muted-foreground">Applied Internships</span>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card stat-card-amber hover-glow">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <Clock className="h-5 w-5 text-warning mb-2" />
              <span className="text-2xl font-bold animate-count-up">{stats.pending}</span>
              <span className="text-sm text-muted-foreground">Pending Review</span>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card stat-card-green hover-glow">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <CheckCircle className="h-5 w-5 text-success mb-2" />
              <span className="text-2xl font-bold animate-count-up">{stats.approved}</span>
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Profile Analysis - controlled by plugin toggle */}
      {resumeAnalysisEnabled && (
        <ResumeAnalysis
          studentSkills={studentFullData?.skills || student?.skills || null}
          interestedDomains={studentFullData?.interested_domains || student?.interested_domains || null}
          resumeUrl={null}
        />
      )}

      {/* Internship Recommendations */}
      <InternshipRecommendations 
        studentSkills={studentFullData?.skills || student?.skills || null}
        interestedDomains={studentFullData?.interested_domains || student?.interested_domains || null}
      />

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