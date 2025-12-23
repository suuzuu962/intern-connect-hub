import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { CompanyApprovalManagement } from '@/components/admin/CompanyApprovalManagement';
import { InternshipManagement } from '@/components/admin/InternshipManagement';
import { StudentManagement } from '@/components/admin/StudentManagement';
import NotificationManagement from '@/components/admin/NotificationManagement';
import { DataExport } from '@/components/admin/DataExport';
import { Shield, LayoutDashboard, Building2, Briefcase, Users, Bell, Download, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type ActiveSection = 'overview' | 'companies' | 'internships' | 'students' | 'notifications' | 'reports';

const menuItems = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'companies' as const, label: 'Companies', icon: Building2 },
  { id: 'internships' as const, label: 'Internships', icon: Briefcase },
  { id: 'students' as const, label: 'Students', icon: Users },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'reports' as const, label: 'Reports', icon: Download },
];

const AdminDashboard = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>(
    (searchParams.get('section') as ActiveSection) || 'overview'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/auth?mode=login');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    const section = searchParams.get('section') as ActiveSection;
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSectionChange = (section: ActiveSection) => {
    setActiveSection(section);
    setSearchParams({ section });
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview onNavigate={handleSectionChange} />;
      case 'companies':
        return <CompanyApprovalManagement />;
      case 'internships':
        return <InternshipManagement />;
      case 'students':
        return <StudentManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'reports':
        return <DataExport />;
      default:
        return <AdminOverview onNavigate={handleSectionChange} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Internship Portal Admin
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-border bg-card">
          <SidebarContent />
        </aside>

        {/* Mobile Menu */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground capitalize">{activeSection}</p>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block p-6 border-b border-border bg-card">
            <h1 className="text-2xl font-bold capitalize">{activeSection}</h1>
            <p className="text-muted-foreground">
              {activeSection === 'overview' && 'Platform overview and statistics'}
              {activeSection === 'companies' && 'Manage company approvals and profiles'}
              {activeSection === 'internships' && 'Manage all internship listings'}
              {activeSection === 'students' && 'Manage student profiles and applications'}
              {activeSection === 'notifications' && 'Send notifications to users'}
              {activeSection === 'reports' && 'Export data and generate reports'}
            </p>
          </div>

          {/* Page Content */}
          <div className="p-4 lg:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
