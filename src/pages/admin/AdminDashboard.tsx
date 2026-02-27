import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
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
import { cn } from '@/lib/utils';

type ActiveSection = 'overview' | 'org-chart' | 'admins' | 'companies' | 'internships' | 'students' | 'universities' | 'colleges' | 'coordinators' | 'banners' | 'permissions' | 'access-control' | 'settings' | 'payments' | 'security' | 'notifications' | 'reports';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>((searchParams.get('section') as ActiveSection) || 'overview');

  useEffect(() => {
    const section = searchParams.get('section') as ActiveSection;
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleNavigate = (value: ActiveSection) => {
    setActiveSection(value);
    setSearchParams({ section: value });
  };

  const mainItems = [
    { id: 'overview' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'org-chart' as const, label: 'Org Chart', icon: Network },
    { id: 'admins' as const, label: 'Admins', icon: ShieldCheck },
    { id: 'companies' as const, label: 'Companies', icon: Building2 },
    { id: 'internships' as const, label: 'Internships', icon: Briefcase },
    { id: 'students' as const, label: 'Students', icon: Users },
    { id: 'universities' as const, label: 'Universities', icon: GraduationCap },
    { id: 'colleges' as const, label: 'Colleges', icon: School },
    { id: 'coordinators' as const, label: 'Coordinators', icon: UserCheck },
    { id: 'banners' as const, label: 'Banners', icon: Image },
  ];

  const bottomItems = [
    { id: 'permissions' as const, label: 'Permissions', icon: Key },
    { id: 'access-control' as const, label: 'Access Control', icon: Lock },
    { id: 'payments' as const, label: 'Payments', icon: CreditCard },
    { id: 'security' as const, label: 'Security Logs', icon: FileText },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'reports' as const, label: 'Reports', icon: Download },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverview onNavigate={(s) => handleNavigate(s as ActiveSection)} />;
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

  return (
    <Layout hideFooter>
      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="w-64 dashboard-sidebar shrink-0 flex flex-col">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sidebar-foreground">Super Admin</p>
                <p className="text-xs text-sidebar-foreground/60">Platform Management</p>
              </div>
            </div>
          </div>

          <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
            {mainItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  'dashboard-sidebar-item',
                  activeSection === item.id && 'active'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-2 space-y-1 border-t border-sidebar-border">
            {bottomItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  'dashboard-sidebar-item',
                  activeSection === item.id && 'active'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto bg-background page-transition min-h-0">
          {renderContent()}
        </main>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
