import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, User, Briefcase, BookOpen, Settings } from 'lucide-react';
import { StudentOverview } from '@/components/student/StudentOverview';
import { StudentProfileForm } from '@/components/student/StudentProfileForm';
import { AppliedInternships } from '@/components/student/AppliedInternships';
import { InternshipDiary } from '@/components/student/InternshipDiary';
import { ChangePassword } from '@/components/company/ChangePassword';
import { CareerChatbot } from '@/components/student/CareerChatbot';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

interface StudentInfo {
  id: string;
  user_id: string;
  university: string | null;
  degree: string | null;
  skills: string[] | null;
  interested_domains: string[] | null;
}

type ActiveSection = 'dashboard' | 'profile' | 'applied' | 'diary' | 'change-password';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as ActiveSection | null;
  const [activeSection, setActiveSection] = useState<ActiveSection>(sectionParam || 'dashboard');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    if (sectionParam && ['dashboard', 'profile', 'applied', 'diary', 'change-password'].includes(sectionParam)) {
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
      .select('full_name, avatar_url')
      .eq('user_id', user?.id)
      .maybeSingle();
    if (data?.full_name) setProfileName(data.full_name);
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
      case 'change-password':
        return <ChangePassword />;
      default:
        return null;
    }
  };

  const sidebarHeader = (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm">{profileName || 'Student'}</p>
        <p className="text-xs text-muted-foreground truncate">
          {student?.university || 'Complete your profile'}
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
          onNavigate={(id) => setActiveSection(id as ActiveSection)}
        />
      }
    >
      {renderContent()}
      <CareerChatbot />
    </DashboardLayout>
  );
};

export default StudentDashboard;
