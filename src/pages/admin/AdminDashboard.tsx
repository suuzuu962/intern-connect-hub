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
import { BannerManagement } from '@/components/admin/BannerManagement';
import { RolePermissions } from '@/components/admin/RolePermissions';
import { AccessControlManager } from '@/components/admin/AccessControlManager';
import { Shield, LayoutDashboard, Building2, Briefcase, Users, Bell, Download, GraduationCap, UserCheck, School, ShieldCheck, Network, Settings, CreditCard, FileText, Image, Key, Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

type ActiveSection = 'overview' | 'org-chart' | 'admins' | 'companies' | 'internships' | 'students' | 'universities' | 'colleges' | 'coordinators' | 'banners' | 'permissions' | 'access-control' | 'settings' | 'payments' | 'security' | 'notifications' | 'reports';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>((searchParams.get('section') as ActiveSection) || 'overview');

  useEffect(() => {
    const section = searchParams.get('section') as ActiveSection;
    if (section) setActiveSection(section);
  }, [searchParams]);

  const handleNavigate = (value: string) => {
    setActiveSection(value as ActiveSection);
    setSearchParams({ section: value });
  };

  const mainItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'org-chart', label: 'Org Chart', icon: Network },
    { id: 'admins', label: 'Admins', icon: ShieldCheck },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'internships', label: 'Internships', icon: Briefcase },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'universities', label: 'Universities', icon: GraduationCap },
    { id: 'colleges', label: 'Colleges', icon: School },
    { id: 'coordinators', label: 'Coordinators', icon: UserCheck },
    { id: 'banners', label: 'Banners', icon: Image },
  ];

  const bottomItems = [
    { id: 'permissions', label: 'Permissions', icon: Key },
    { id: 'access-control', label: 'Access Control', icon: Lock },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'security', label: 'Security Logs', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'reports', label: 'Reports', icon: Download },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverview onNavigate={(s) => handleNavigate(s)} />;
      case 'org-chart': return <AdminOrgChart />;
      case 'admins': return <AdminManagement />;
      case 'companies': return <CompanyApprovalManagement />;
      case 'internships': return <InternshipManagement />;
      case 'students': return <StudentManagement />;
      case 'universities': return <UniversityManagement />;
      case 'colleges': return <CollegeManagement />;
      case 'coordinators': return <CoordinatorManagement />;
      case 'banners': return <BannerManagement />;
      case 'permissions': return <RolePermissions />;
      case 'access-control': return <AccessControlManager />;
      case 'settings': return <PlatformSettings />;
      case 'payments': return <PaymentsManagement />;
      case 'security': return <SecurityLogs />;
      case 'notifications': return <NotificationManagement />;
      case 'reports': return <DataExport />;
      default: return null;
    }
  };

  const sidebarHeader = (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
        <Shield className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm">Super Admin</p>
        <p className="text-xs text-muted-foreground">Platform Management</p>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="space-y-0.5">
      {bottomItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavigate(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeSection === item.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout
      sidebar={
        <DashboardSidebar
          header={sidebarHeader}
          items={mainItems}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          footer={sidebarFooter}
        />
      }
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
