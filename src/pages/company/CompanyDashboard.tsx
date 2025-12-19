import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { Building2, Briefcase, Users, LayoutDashboard, Plus, Settings, UserCog, Loader2 } from 'lucide-react';
import { CompanyProfileForm } from '@/components/company/CompanyProfileForm';
import { CreateInternshipForm } from '@/components/company/CreateInternshipForm';
import { CompanyApplicants } from '@/components/company/CompanyApplicants';
import { ChangePassword } from '@/components/company/ChangePassword';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalInternships: number;
  activeInternships: number;
  totalApplications: number;
  pendingApplications: number;
}

interface CompanyInfo {
  id: string;
  name: string;
  logo_url: string | null;
  is_verified: boolean | null;
}

type ActiveSection = 'dashboard' | 'applicants' | 'create-internship' | 'profile' | 'change-password';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as ActiveSection | null;
  const [activeSection, setActiveSection] = useState<ActiveSection>(sectionParam || 'dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalInternships: 0,
    activeInternships: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    if (sectionParam && ['dashboard', 'applicants', 'create-internship', 'profile', 'change-password'].includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, logo_url, is_verified')
        .eq('user_id', user?.id)
        .single();

      if (companyData) {
        setCompany(companyData);

        const { data: internships } = await supabase
          .from('internships')
          .select('id, is_active')
          .eq('company_id', companyData.id);

        const internshipIds = internships?.map(i => i.id) || [];

        let applicationStats = { total: 0, pending: 0 };
        if (internshipIds.length > 0) {
          const { data: applications } = await supabase
            .from('applications')
            .select('status')
            .in('internship_id', internshipIds);

          applicationStats = {
            total: applications?.length || 0,
            pending: applications?.filter(a => a.status === 'pending').length || 0,
          };
        }

        setStats({
          totalInternships: internships?.length || 0,
          activeInternships: internships?.filter(i => i.is_active).length || 0,
          totalApplications: applicationStats.total,
          pendingApplications: applicationStats.pending,
        });
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applicants' as const, label: 'Applicants', icon: Users },
    { id: 'create-internship' as const, label: 'Create Internship', icon: Plus },
    { id: 'profile' as const, label: 'Company Profile', icon: Building2 },
    { id: 'change-password' as const, label: 'Change Password', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardContent
            company={company}
            stats={stats}
            loading={loading}
            onEditProfile={() => setActiveSection('profile')}
            onCreateInternship={() => setActiveSection('create-internship')}
          />
        );
      case 'applicants':
        return <CompanyApplicants companyId={company?.id || null} />;
      case 'create-internship':
        return (
          <CreateInternshipForm
            companyId={company?.id || null}
            onSuccess={() => {
              fetchCompanyData();
              setActiveSection('dashboard');
            }}
          />
        );
      case 'profile':
        return <CompanyProfileForm />;
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
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{company?.name || 'Company'}</p>
                <p className="text-xs text-muted-foreground">
                  {company?.is_verified ? '✓ Verified' : 'Pending Verification'}
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

interface DashboardContentProps {
  company: CompanyInfo | null;
  stats: DashboardStats;
  loading: boolean;
  onEditProfile: () => void;
  onCreateInternship: () => void;
}

const DashboardContent = ({ company, stats, loading, onEditProfile, onCreateInternship }: DashboardContentProps) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{company?.name || 'Your Company'}</h1>
                <p className="text-muted-foreground">
                  {company?.is_verified ? '✓ Verified Company' : '⏳ Pending Verification'}
                </p>
              </div>
            </div>
            <Button onClick={onEditProfile} variant="outline">
              <UserCog className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <Briefcase className="h-5 w-5 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.totalInternships}</span>
              <span className="text-sm text-muted-foreground">Total Internships</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <Briefcase className="h-5 w-5 text-success mb-2" />
              <span className="text-2xl font-bold">{stats.activeInternships}</span>
              <span className="text-sm text-muted-foreground">Active Listings</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <Users className="h-5 w-5 text-secondary mb-2" />
              <span className="text-2xl font-bold">{stats.totalApplications}</span>
              <span className="text-sm text-muted-foreground">Total Applicants</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <Users className="h-5 w-5 text-warning mb-2" />
              <span className="text-2xl font-bold">{stats.pendingApplications}</span>
              <span className="text-sm text-muted-foreground">Pending Review</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={onCreateInternship} className="gradient-primary border-0">
              <Plus className="h-4 w-4 mr-2" />
              Create New Internship
            </Button>
          </div>
        </CardContent>
      </Card>

      {!company?.is_verified && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-warning mb-2">⏳ Verification Pending</h3>
            <p className="text-sm text-muted-foreground">
              Your company profile is under review. Once verified, your internships will be visible to students.
              Please ensure your profile is complete with all required information.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyDashboard;
