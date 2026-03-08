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
import { RBACRoles } from '@/components/admin/RBACRoles';
import { RBACUserRoles } from '@/components/admin/RBACUserRoles';
import { RBACAuditLog } from '@/components/admin/RBACAuditLog';
import {
  Shield, LayoutDashboard, Building2, Briefcase, Users, Bell,
  Download, GraduationCap, UserCheck, School, Network, Settings,
  CreditCard, FileText, Image, Key, Lock, Clock, ShieldCheck
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar, SidebarGroup } from '@/components/dashboard/DashboardSidebar';
import { SidebarProfileHeader } from '@/components/dashboard/SidebarProfileHeader';

type ActiveSection =
  | 'overview' | 'org-chart' | 'admins'
  | 'universities' | 'colleges' | 'coordinators' | 'students'
  | 'companies' | 'internships' | 'payments'
  | 'permissions' | 'rbac-roles' | 'rbac-users' | 'audit-log' | 'security'
  | 'banners' | 'settings' | 'notifications' | 'reports';

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
        { id: 'permissions', label: 'Permissions', icon: Key },
        { id: 'rbac-roles', label: 'RBAC Roles', icon: Shield },
        { id: 'rbac-users', label: 'User Roles', icon: Lock },
        { id: 'audit-log', label: 'Audit Log', icon: Clock },
        { id: 'security', label: 'Security Logs', icon: FileText },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'banners', label: 'Banners', icon: Image },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'reports', label: 'Reports', icon: Download },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverview onNavigate={handleNavigate} />;
      case 'org-chart': return <AdminOrgChart />;
      case 'admins': return <AdminManagement />;
      case 'universities': return <UniversityManagement />;
      case 'colleges': return <CollegeManagement />;
      case 'coordinators': return <CoordinatorManagement />;
      case 'students': return <StudentManagement />;
      case 'companies': return <CompanyApprovalManagement />;
      case 'internships': return <InternshipManagement />;
      case 'payments': return <PaymentsManagement />;
      case 'permissions': return <RolePermissions />;
      case 'rbac-roles': return <RBACRoles />;
      case 'rbac-users': return <RBACUserRoles />;
      case 'audit-log': return <RBACAuditLog />;
      case 'security': return <SecurityLogs />;
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
