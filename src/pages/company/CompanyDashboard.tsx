import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { Building2, Briefcase, Users, Eye, TrendingUp, Clock } from 'lucide-react';
import { CompanyProfile } from '@/components/company/CompanyProfile';
import { CompanyInternships } from '@/components/company/CompanyInternships';
import { CompanyApplicants } from '@/components/company/CompanyApplicants';
import { CompanySettings } from '@/components/company/CompanySettings';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalInternships: number;
  activeInternships: number;
  totalApplications: number;
  pendingApplications: number;
  totalViews: number;
}

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInternships: 0,
    activeInternships: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      // Get company ID
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (company) {
        setCompanyId(company.id);

        // Fetch stats
        const { data: internships } = await supabase
          .from('internships')
          .select('id, is_active, views_count')
          .eq('company_id', company.id);

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
          totalViews: internships?.reduce((acc, i) => acc + (i.views_count || 0), 0) || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Internships', value: stats.totalInternships, icon: Briefcase, color: 'text-primary' },
    { title: 'Active Listings', value: stats.activeInternships, icon: TrendingUp, color: 'text-success' },
    { title: 'Total Applications', value: stats.totalApplications, icon: Users, color: 'text-secondary' },
    { title: 'Pending Review', value: stats.pendingApplications, icon: Clock, color: 'text-warning' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-accent' },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Company Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage your internships, applicants, and company profile</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-4">
                {loading ? (
                  <Skeleton className="h-16" />
                ) : (
                  <div className="flex flex-col">
                    <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className="text-xs text-muted-foreground">{stat.title}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="internships" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="internships">Internships</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="internships">
            <CompanyInternships companyId={companyId} onUpdate={fetchCompanyData} />
          </TabsContent>

          <TabsContent value="applicants">
            <CompanyApplicants companyId={companyId} />
          </TabsContent>

          <TabsContent value="profile">
            <CompanyProfile />
          </TabsContent>

          <TabsContent value="settings">
            <CompanySettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CompanyDashboard;
