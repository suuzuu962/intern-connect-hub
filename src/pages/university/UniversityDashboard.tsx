import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, LayoutDashboard, Network, School, Users, User, Settings, Mail, BarChart3, BookOpen, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UniversityProfile } from '@/components/university/UniversityProfile';
import { UniversityColleges } from '@/components/university/UniversityColleges';
import { UniversityUsers } from '@/components/university/UniversityUsers';

import { UniversityLoginLogs } from '@/components/university/UniversityLoginLogs';
import { UniversityStudents } from '@/components/university/UniversityStudents';
import { UniversityOrgChart } from '@/components/university/UniversityOrgChart';
import { UniversityAnalytics } from '@/components/university/UniversityAnalytics';
import { InstitutionalMemos } from '@/components/institutional/InstitutionalMemos';
import { CollegeDiaryApproval } from '@/components/college/CollegeDiaryApproval';
import { AttendanceTracker } from '@/components/institutional/AttendanceTracker';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar, SidebarGroup } from '@/components/dashboard/DashboardSidebar';
import { SidebarProfileHeader } from '@/components/dashboard/SidebarProfileHeader';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradeGate } from '@/components/upgrade/UpgradeGate';

type ActiveSection = 'dashboard' | 'org-chart' | 'analytics' | 'colleges' | 'students' | 'users' | 'diary-approvals' | 'attendance' | 'memos' | 'profile';

const UniversityDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>((searchParams.get('tab') as ActiveSection) || 'dashboard');
  const [university, setUniversity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collegeIds, setCollegeIds] = useState<string[]>([]);
  const [pendingDiaryCount, setPendingDiaryCount] = useState(0);
  const { user } = useAuth();
  const { isLocked, getMessage } = useFeatureAccess('university');

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveSection;
    if (tab) setActiveSection(tab);
  }, [searchParams]);

  useEffect(() => {
    const fetchUniversity = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('universities').select('*').eq('user_id', user.id).single();
      if (error) console.error('Error fetching university:', error);
      else {
        setUniversity(data);
        // Fetch college IDs for this university
        const { data: colleges } = await supabase.from('colleges').select('id').eq('university_id', data.id);
        setCollegeIds(colleges?.map(c => c.id) || []);
      }
      setLoading(false);
    };
    fetchUniversity();
  }, [user]);

  const handleNavigate = (value: string) => {
    setActiveSection(value as ActiveSection);
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
        <div className="container py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">University Profile Not Found</h2>
          <p className="text-muted-foreground">Please complete your profile setup.</p>
        </div>
      </Layout>
    );
  }

  const sidebarGroups: SidebarGroup[] = [
    {
      label: '',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'org-chart', label: 'Org Chart', icon: Network },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Institution',
      items: [
        { id: 'colleges', label: 'Colleges', icon: School },
        { id: 'students', label: 'Students', icon: Users },
        
        { id: 'users', label: 'Users', icon: User },
      ],
    },
    {
      label: 'Academic',
      items: [
        { id: 'diary-approvals', label: 'Diary Approvals', icon: BookOpen, badge: pendingDiaryCount > 0 ? pendingDiaryCount : undefined },
        { id: 'attendance', label: 'Attendance', icon: Calendar },
        { id: 'memos', label: 'Memos', icon: Mail },
      ],
    },
    {
      label: '',
      items: [
        { id: 'profile', label: 'Profile', icon: Settings },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <UniversityStudents universityId={university.id} viewMode="summary" />;
      case 'org-chart': return <UniversityOrgChart universityId={university.id} />;
      case 'analytics': return <UpgradeGate featureLabel="Analytics Dashboard" featureKey="analytics" message={getMessage('analytics')} isLocked={isLocked('analytics')}><UniversityAnalytics universityId={university.id} /></UpgradeGate>;
      case 'colleges': return <UniversityColleges universityId={university.id} />;
      case 'students': return <UniversityStudents universityId={university.id} viewMode="detailed" />;
      
      case 'users': return (
        <div className="space-y-6">
          <UniversityUsers universityId={university.id} />
          <UniversityLoginLogs universityId={university.id} />
        </div>
      );
      case 'diary-approvals': 
        return collegeIds.length > 0 
          ? <CollegeDiaryApproval collegeId={collegeIds[0]} collegeName={university.name} onPendingCountChange={setPendingDiaryCount} />
          : <div className="text-muted-foreground p-4">No colleges found. Add a college first to manage diary approvals.</div>;
      case 'attendance':
        return collegeIds.length > 0
          ? <UpgradeGate featureLabel="Attendance Tracker" featureKey="attendance" message={getMessage('attendance')} isLocked={isLocked('attendance')}><AttendanceTracker collegeId={collegeIds[0]} role="college" /></UpgradeGate>
          : <div className="text-muted-foreground p-4">No colleges found. Add a college first to track attendance.</div>;
      case 'memos': return <InstitutionalMemos universityId={university.id} senderRole="university" senderName={university.name} />;
      case 'profile': return <UniversityProfile university={university} onUpdate={setUniversity} />;
      default: return null;
    }
  };

  const sidebarHeader = (
    <SidebarProfileHeader
      name={university.name}
      subtitle={university.email || 'University'}
      avatarUrl={university.logo_url}
      avatarFallback={<GraduationCap className="h-5 w-5 text-primary" />}
      verified={university.is_verified}
      role="university"
    />
  );

  return (
    <DashboardLayout
      sidebar={
        <DashboardSidebar
          header={sidebarHeader}
          groups={sidebarGroups}
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />
      }
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default UniversityDashboard;
