import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { CompanyApprovalManagement } from '@/components/admin/CompanyApprovalManagement';
import { InternshipManagement } from '@/components/admin/InternshipManagement';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { UniversityManagement } from '@/components/admin/UniversityManagement';
import { CoordinatorManagement } from '@/components/admin/CoordinatorManagement';
import { CollegeManagement } from '@/components/admin/CollegeManagement';
import NotificationManagement from '@/components/admin/NotificationManagement';
import { DataExport } from '@/components/admin/DataExport';
import { AdminManagement } from '@/components/admin/AdminManagement';
import { AdminOrgChart } from '@/components/admin/AdminOrgChart';
import { PlatformSettings } from '@/components/admin/PlatformSettings';
import { PaymentsManagement } from '@/components/admin/PaymentsManagement';
import { SecurityLogs } from '@/components/admin/SecurityLogs';


import { PlatformAnalytics } from '@/components/admin/PlatformAnalytics';

import { ApiIntegration } from '@/components/admin/ApiIntegration';
import { Benchmarking } from '@/components/admin/Benchmarking';
import { CustomReports } from '@/components/admin/CustomReports';
import { PlatformFeatureMap } from '@/components/admin/PlatformFeatureMap';
import { PlatformSitemap } from '@/components/admin/PlatformSitemap';
import {
  Shield, LayoutDashboard, Building2, Briefcase, Users, Bell,
  Download, GraduationCap, UserCheck, School, Network, Settings,
  CreditCard, FileText, Image, BarChart3, ShieldCheck,
  Plug, Target, FileBarChart, Map, MapPin
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar, SidebarGroup } from '@/components/dashboard/DashboardSidebar';
import { SidebarProfileHeader } from '@/components/dashboard/SidebarProfileHeader';

type ActiveSection =
  | 'overview' | 'org-chart' | 'admins' | 'analytics'
  | 'universities' | 'colleges' | 'coordinators' | 'students'
  | 'companies' | 'internships' | 'payments'
  | 'security'
  | 'api-integration' | 'benchmarking' | 'custom-reports'
  | 'banners' | 'settings' | 'notifications' | 'reports' | 'feature-map' | 'sitemap';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>(
    (searchParams.get('section') as ActiveSection) || 'overview'
  );

  useEffect(() => {
    const section = searchParams.get('section') as ActiveSection;
    if (section) setActiveSection(section);
  }, [searchParams]);

  const handleNavigate = (value: string) => {
    setActiveSection(value as ActiveSection);
    setSearchParams({ section: value });
  };

  const sidebarGroups: SidebarGroup[] = [
    {
      label: '',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'benchmarking', label: 'Benchmarking', icon: Target },
        { id: 'org-chart', label: 'Org Chart', icon: Network },
        { id: 'admins', label: 'Admins', icon: ShieldCheck },
      ],
    },
    {
      label: 'Governance',
      items: [
        { id: 'universities', label: 'Universities', icon: GraduationCap },
        { id: 'colleges', label: 'Colleges', icon: School },
        { id: 'coordinators', label: 'Coordinators', icon: UserCheck },
        { id: 'students', label: 'Students', icon: Users },
      ],
    },
    {
      label: 'Marketplace',
      items: [
        { id: 'companies', label: 'Companies', icon: Building2 },
        { id: 'internships', label: 'Internships', icon: Briefcase },
        { id: 'payments', label: 'Payments', icon: CreditCard },
      ],
    },
    {
      label: 'Security',
      items: [
        { id: 'security', label: 'Security Logs', icon: FileText },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'api-integration', label: 'API Integration', icon: Plug },
        { id: 'custom-reports', label: 'Custom Reports', icon: FileBarChart },
        { id: 'feature-map', label: 'Feature Map', icon: Map },
        { id: 'sitemap', label: 'Sitemap', icon: MapPin },
        { id: 'banners', label: 'Banners', icon: Image },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'reports', label: 'Data Export', icon: Download },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverview onNavigate={handleNavigate} />;
      case 'analytics': return <PlatformAnalytics />;
      case 'benchmarking': return <Benchmarking />;
      case 'org-chart': return <AdminOrgChart />;
      case 'admins': return <AdminManagement />;
      case 'universities': return <UniversityManagement />;
      case 'colleges': return <CollegeManagement />;
      case 'coordinators': return <CoordinatorManagement />;
      case 'students': return <StudentManagement />;
      case 'companies': return <CompanyApprovalManagement />;
      case 'internships': return <InternshipManagement />;
      case 'payments': return <PaymentsManagement />;
      
      case 'security': return <SecurityLogs />;
      case 'api-integration': return <ApiIntegration />;
      case 'custom-reports': return <CustomReports />;
      case 'feature-map': return <PlatformFeatureMap />;
      case 'sitemap': return <PlatformSitemap />;
      case 'banners': return <BannerManagement />;
      case 'notifications': return <NotificationManagement />;
      case 'reports': return <DataExport />;
      case 'settings': return <PlatformSettings />;
      default: return null;
    }
  };

  const sidebarHeader = (
    <SidebarProfileHeader
      name="Super Admin"
      subtitle="Platform Management"
      avatarFallback={<Shield className="h-5 w-5 text-primary" />}
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

export default AdminDashboard;
