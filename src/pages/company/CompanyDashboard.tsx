import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Briefcase, Users, LayoutDashboard, Plus, Settings, UserCog, FolderOpen } from 'lucide-react';
import { CompanyProfileForm } from '@/components/company/CompanyProfileForm';
import { CreateInternshipForm } from '@/components/company/CreateInternshipForm';
import { CompanyApplicants } from '@/components/company/CompanyApplicants';
import { CompanyInternships } from '@/components/company/CompanyInternships';
import { ChangePassword } from '@/components/company/ChangePassword';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyProfileCompletion } from '@/components/company/CompanyProfileCompletion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardWelcomeHeader } from '@/components/dashboard/DashboardWelcomeHeader';
import { DashboardStatusBanner } from '@/components/dashboard/DashboardStatusBanner';
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

type ActiveSection = 'dashboard' | 'internships' | 'applicants' | 'create-internship' | 'profile' | 'change-password';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as ActiveSection | null;
  const [activeSection, setActiveSection] = useState<ActiveSection>(sectionParam || 'dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalInternships: 0, activeInternships: 0, totalApplications: 0, pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    if (sectionParam && ['dashboard', 'internships', 'applicants', 'create-internship', 'profile', 'change-password'].includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  useEffect(() => {
    if (user) fetchCompanyData();
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      let { data: companyData, error } = await supabase
        .from('companies')
        .select('id, name, logo_url, is_verified')
        .eq('user_id', user?.id)
        .single();

      if (error?.code === 'PGRST116' || !companyData) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user?.id).single();
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({ user_id: user?.id, name: profile?.full_name || 'My Company' })
          .select('id, name, logo_url, is_verified')
          .single();
        if (!createError) companyData = newCompany;
      }

      const { data: roleData } = await supabase.from('user_roles').select('id').eq('user_id', user?.id).single();
      if (!roleData) await supabase.from('user_roles').insert({ user_id: user?.id, role: 'company' });

      if (companyData) {
        setCompany(companyData);
        const { data: internships } = await supabase.from('internships').select('id, is_active').eq('company_id', companyData.id);
        const internshipIds = internships?.map(i => i.id) || [];
        let applicationStats = { total: 0, pending: 0 };
        if (internshipIds.length > 0) {
          const { data: applications } = await supabase.from('applications').select('status').in('internship_id', internshipIds);
          applicationStats = {
            total: applications?.length || 0,
            pending: applications?.filter(a => a.status === 'applied' || a.status === 'under_review').length || 0,
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

  const allSidebarItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, requiresVerification: false },
    { id: 'internships' as const, label: 'Internships', icon: FolderOpen, requiresVerification: true },
    { id: 'applicants' as const, label: 'Applicants', icon: Users, requiresVerification: true },
    { id: 'create-internship' as const, label: 'Create Internship', icon: Plus, requiresVerification: true },
    { id: 'profile' as const, label: 'Company Profile', icon: Building2, requiresVerification: false },
    { id: 'change-password' as const, label: 'Change Password', icon: Settings, requiresVerification: false },
  ];

  const sidebarItems = allSidebarItems
    .filter(item => !item.requiresVerification || company?.is_verified)
    .map(({ requiresVerification, ...rest }) => rest);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardContent company={company} stats={stats} loading={loading}
            onEditProfile={() => setActiveSection('profile')}
            onCreateInternship={() => setActiveSection('create-internship')}
            onNavigate={setActiveSection}
          />
        );
      case 'internships': return <CompanyInternships companyId={company?.id || null} onUpdate={fetchCompanyData} />;
      case 'applicants': return <CompanyApplicants companyId={company?.id || null} />;
      case 'create-internship': return <CreateInternshipForm companyId={company?.id || null} onSuccess={() => { fetchCompanyData(); setActiveSection('internships'); }} />;
      case 'profile': return <CompanyProfileForm />;
      case 'change-password': return <ChangePassword />;
      default: return null;
    }
  };

  const sidebarHeader = (
    <div className="flex items-center gap-3">
      {company?.logo_url ? (
        <img src={company.logo_url} alt={company.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20" />
      ) : (
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm">{company?.name || 'Company'}</p>
        <p className="text-xs text-muted-foreground">
          {company?.is_verified ? '✓ Verified' : 'Pending Verification'}
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
    </DashboardLayout>
  );
};

interface DashboardContentProps {
  company: CompanyInfo | null;
  stats: DashboardStats;
  loading: boolean;
  onEditProfile: () => void;
  onCreateInternship: () => void;
  onNavigate: (section: ActiveSection) => void;
}

const DashboardContent = ({ company, stats, loading, onEditProfile, onCreateInternship, onNavigate }: DashboardContentProps) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const allStatCards = [
    { label: 'Total Internships', value: stats.totalInternships, icon: Briefcase, color: 'text-primary', onClick: () => onNavigate('internships'), requiresVerification: true },
    { label: 'Active Listings', value: stats.activeInternships, icon: Briefcase, color: 'text-green-500', onClick: () => onNavigate('internships'), requiresVerification: true },
    { label: 'Total Applicants', value: stats.totalApplications, icon: Users, color: 'text-blue-500', onClick: () => onNavigate('applicants'), requiresVerification: true },
    { label: 'Pending Review', value: stats.pendingApplications, icon: Users, color: 'text-orange-500', onClick: () => onNavigate('applicants'), requiresVerification: true },
  ];

  const statCards = allStatCards.filter(card => !card.requiresVerification || company?.is_verified);

  return (
    <div className="space-y-6">
      <DashboardWelcomeHeader
        userName={company?.name}
        title="Welcome to Your Dashboard"
        subtitle="Manage your internships and track applicants"
      />

      {!company?.is_verified && (
        <DashboardStatusBanner
          variant="warning"
          message="Your profile is under moderation. Our admin team will take an action within 48 hours. However, your profile is not complete. Please complete your profile so that moderation process can be executed at the earliest."
        />
      )}

      {/* Profile Completion Card */}
      <CompanyProfileCompletion
        companyId={company?.id || null}
        companyName={company?.name || 'Your Company'}
        logoUrl={company?.logo_url || null}
        isVerified={company?.is_verified || null}
        onEditProfile={onEditProfile}
      />

      {/* Stats Grid */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border" onClick={stat.onClick}>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <stat.icon className={cn("h-5 w-5 mb-2", stat.color)} />
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            {company?.is_verified ? (
              <>
                <Button onClick={onCreateInternship} className="gradient-primary border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Internship
                </Button>
                <Button onClick={() => onNavigate('internships')} variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Internships
                </Button>
                <Button onClick={() => onNavigate('applicants')} variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View Applicants
                </Button>
              </>
            ) : (
              <Button onClick={onEditProfile} variant="outline">
                <UserCog className="h-4 w-4 mr-2" />
                Complete Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;
