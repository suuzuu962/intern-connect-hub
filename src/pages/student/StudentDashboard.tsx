import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, User, Briefcase, BookOpen, Settings, Mail } from 'lucide-react';
import { StudentOverview } from '@/components/student/StudentOverview';
import { StudentProfileForm } from '@/components/student/StudentProfileForm';
import { AppliedInternships } from '@/components/student/AppliedInternships';
import { InternshipDiary } from '@/components/student/InternshipDiary';
import { ChangePassword } from '@/components/company/ChangePassword';
import { StudentMessages } from '@/components/student/StudentMessages';
import { CareerChatbot } from '@/components/student/CareerChatbot';
import { ResumeAnalysis } from '@/components/student/ResumeAnalysis';
import { InternshipRecommendations } from '@/components/student/InternshipRecommendations';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradeGate } from '@/components/upgrade/UpgradeGate';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { SidebarProfileHeader } from '@/components/dashboard/SidebarProfileHeader';
import { FileSearch, Sparkles } from 'lucide-react';

interface StudentInfo {
  id: string;
  user_id: string;
  university: string | null;
  degree: string | null;
  skills: string[] | null;
  interested_domains: string[] | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
}

type ActiveSection = 'dashboard' | 'profile' | 'applied' | 'diary' | 'messages' | 'change-password' | 'resume-analysis' | 'internship-recommendations';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as ActiveSection | null;
  const [activeSection, setActiveSection] = useState<ActiveSection>(sectionParam || 'dashboard');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [platformUserId, setPlatformUserId] = useState<string | null>(null);
  const { enabled: chatbotEnabled } = usePluginEnabled('career-chatbot');
  const { isLocked, getMessage } = useFeatureAccess('student');

  useEffect(() => {
    if (sectionParam && ['dashboard', 'profile', 'applied', 'diary', 'messages', 'change-password'].includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  useEffect(() => {
    if (user) {
      fetchStudentData();
      fetchProfileName();
    }
  }, [user]);

  const fetchProfileName = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, platform_user_id')
      .eq('user_id', user?.id)
      .maybeSingle();
    if (data?.full_name) setProfileName(data.full_name);
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    if (data?.platform_user_id) setPlatformUserId(data.platform_user_id);
  };

  const fetchStudentData = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (studentData) {
        setStudent(studentData);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'applied' as const, label: 'Applied Internships', icon: Briefcase },
    { id: 'diary' as const, label: 'Internship Diary', icon: BookOpen },
    { id: 'resume-analysis' as const, label: 'Resume Analysis', icon: FileSearch },
    { id: 'internship-recommendations' as const, label: 'Recommendations', icon: Sparkles },
    { id: 'messages' as const, label: 'Messages', icon: Mail },
    { id: 'change-password' as const, label: 'Change Password', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <StudentOverview
            student={student}
            loading={loading}
            onEditProfile={() => setActiveSection('profile')}
          />
        );
      case 'profile':
        return <StudentProfileForm onSuccess={fetchStudentData} />;
      case 'applied':
        return <AppliedInternships studentId={student?.id || null} onNavigateToDiary={() => setActiveSection('diary')} />;
      case 'diary':
        return <InternshipDiary studentId={student?.id || null} />;
      case 'resume-analysis':
        return (
          <UpgradeGate featureLabel="Resume Analysis" featureKey="resume-analysis" message={getMessage('resume-analysis')} isLocked={isLocked('resume-analysis')}>
            <ResumeAnalysis studentSkills={student?.skills || null} interestedDomains={student?.interested_domains || null} resumeUrl={null} />
          </UpgradeGate>
        );
      case 'internship-recommendations':
        return (
          <UpgradeGate featureLabel="Internship Recommendations" featureKey="internship-recommendations" message={getMessage('internship-recommendations')} isLocked={isLocked('internship-recommendations')}>
            <InternshipRecommendations studentSkills={student?.skills || null} interestedDomains={student?.interested_domains || null} />
          </UpgradeGate>
        );
      case 'messages':
        return <StudentMessages />;
      case 'change-password':
        return <ChangePassword />;
      default:
        return null;
    }
  };

  const sidebarHeader = (
    <SidebarProfileHeader
      name={profileName || 'Student'}
      subtitle={student?.university || 'Complete your profile'}
      avatarUrl={avatarUrl}
      avatarFallback={<User className="h-5 w-5 text-primary" />}
      linkedinUrl={student?.linkedin_url}
      twitterUrl={student?.twitter_url}
      role="student"
      platformUserId={platformUserId}
    />
  );

  const activeLabel = sidebarItems.find(i => i.id === activeSection)?.label || 'Dashboard';

  return (
    <DashboardLayout
      sidebar={
        <DashboardSidebar
          header={sidebarHeader}
          items={sidebarItems}
          activeSection={activeSection}
          onNavigate={(id) => setActiveSection(id as ActiveSection)}
        />
      }
      dashboardLabel="Student"
      activeLabel={activeLabel}
      onDashboardClick={() => setActiveSection('dashboard')}
    >
      {renderContent()}
      {chatbotEnabled && <CareerChatbot />}
    </DashboardLayout>
  );
};

export default StudentDashboard;
