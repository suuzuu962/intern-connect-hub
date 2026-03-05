import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/lib/super-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Briefcase, Users, FileCheck, Clock, CheckCircle, ChevronRight, GitBranch, FileText, TrendingUp } from 'lucide-react';
import { AnalyticsFunnel } from '@/components/admin/AnalyticsFunnel';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DashboardWelcomeHeader } from '@/components/dashboard/DashboardWelcomeHeader';

interface Stats {
  totalCompanies: number;
  verifiedCompanies: number;
  pendingCompanies: number;
  totalInternships: number;
  activeInternships: number;
  totalStudents: number;
  totalApplications: number;
}

interface AdminOverviewProps {
  onNavigate?: (section: string) => void;
}

export const AdminOverview = ({ onNavigate }: AdminOverviewProps) => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const showDocs = isSuperAdmin(user?.email);
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    verifiedCompanies: 0,
    pendingCompanies: 0,
    totalInternships: 0,
    activeInternships: 0,
    totalStudents: 0,
    totalApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel
        const [companiesRes, internshipsRes, studentsRes, applicationsRes] = await Promise.all([
          supabase.from('companies').select('id, is_verified'),
          supabase.from('internships').select('id, is_active'),
          supabase.from('students').select('id'),
          supabase.from('applications').select('id'),
        ]);

        const companies = companiesRes.data || [];
        const internships = internshipsRes.data || [];
        const students = studentsRes.data || [];
        const applications = applicationsRes.data || [];

        setStats({
          totalCompanies: companies.length,
          verifiedCompanies: companies.filter(c => c.is_verified === true).length,
          pendingCompanies: companies.filter(c => c.is_verified !== true).length,
          totalInternships: internships.length,
          activeInternships: internships.filter(i => i.is_active === true).length,
          totalStudents: students.length,
          totalApplications: applications.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleNavigate = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    } else {
      setSearchParams({ section });
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies,
      icon: Building2,
      description: `${stats.verifiedCompanies} verified, ${stats.pendingCompanies} pending`,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      section: 'companies',
    },
    {
      title: 'Total Internships',
      value: stats.totalInternships,
      icon: Briefcase,
      description: `${stats.activeInternships} active`,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      section: 'internships',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      description: 'Registered students',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      section: 'students',
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: FileCheck,
      description: 'Submitted applications',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      section: 'internships',
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardWelcomeHeader
        title="Admin Dashboard"
        subtitle="Monitor and manage the entire platform"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group",
              "hover:scale-[1.02]"
            )}
            onClick={() => handleNavigate(stat.section)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-amber-600" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div 
                className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group"
                onClick={() => handleNavigate('companies')}
              >
                <span className="text-sm">Companies awaiting approval</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-600">{stats.pendingCompanies}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div 
                className="flex justify-between items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors group"
                onClick={() => handleNavigate('internships')}
              >
                <span className="text-sm">Inactive internships</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats.totalInternships - stats.activeInternships}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div 
                className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors group"
                onClick={() => handleNavigate('companies')}
              >
                <span className="text-sm">Verified companies</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600">{stats.verifiedCompanies}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div 
                className="flex justify-between items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors group"
                onClick={() => handleNavigate('internships')}
              >
                <span className="text-sm">Active internship listings</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats.activeInternships}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Funnel */}
      <AnalyticsFunnel />

      {/* Quick Links — Super Admin Only */}
      {showDocs && (
        <>
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
            onClick={() => navigate('/admin/architecture-doc')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                Architecture Documentation
              </CardTitle>
              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete platform architecture reference — schema, roles, RBAC, edge functions, and RLS patterns.
              </p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
            onClick={() => navigate('/admin/flowchart-documentation')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                Flowchart Documentation
              </CardTitle>
              <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and scan platform flowcharts — registration flows, application lifecycles, RBAC resolution, and more.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
