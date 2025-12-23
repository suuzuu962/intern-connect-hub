import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { LayoutDashboard, User, Briefcase, BookOpen, Settings } from 'lucide-react';
import { StudentOverview } from '@/components/student/StudentOverview';
import { StudentProfileForm } from '@/components/student/StudentProfileForm';
import { AppliedInternships } from '@/components/student/AppliedInternships';
import { InternshipDiary } from '@/components/student/InternshipDiary';
import { ChangePassword } from '@/components/company/ChangePassword';
import { cn } from '@/lib/utils';

interface StudentInfo {
  id: string;
  user_id: string;
  university: string | null;
  degree: string | null;
  skills: string[] | null;
}

type ActiveSection = 'dashboard' | 'profile' | 'applied' | 'diary' | 'change-password';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as ActiveSection | null;
  const [activeSection, setActiveSection] = useState<ActiveSection>(sectionParam || 'dashboard');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sectionParam && ['dashboard', 'profile', 'applied', 'diary', 'change-password'].includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

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
            onNavigateToApplied={() => setActiveSection('applied')}
          />
        );
      case 'profile':
        return <StudentProfileForm onSuccess={fetchStudentData} />;
      case 'applied':
        return <AppliedInternships studentId={student?.id || null} />;
      case 'diary':
        return <InternshipDiary studentId={student?.id || null} />;
      case 'change-password':
        return <ChangePassword />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">Student Dashboard</p>
                <p className="text-xs text-muted-foreground">
                  {student?.university || 'Complete your profile'}
                </p>
              </div>
            </div>
          </div>

          <nav className="p-2 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeSection === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-background">
          {renderContent()}
        </main>
      </div>
    </Layout>
  );
};

export default StudentDashboard;