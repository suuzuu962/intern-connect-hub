import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Briefcase, Users, FileCheck, Clock, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalCompanies: number;
  verifiedCompanies: number;
  pendingCompanies: number;
  totalInternships: number;
  activeInternships: number;
  totalStudents: number;
  totalApplications: number;
}

export const AdminOverview = () => {
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
    },
    {
      title: 'Total Internships',
      value: stats.totalInternships,
      icon: Briefcase,
      description: `${stats.activeInternships} active`,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      description: 'Registered students',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: FileCheck,
      description: 'Submitted applications',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
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
              <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                <span className="text-sm">Companies awaiting approval</span>
                <span className="font-bold text-amber-600">{stats.pendingCompanies}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Inactive internships</span>
                <span className="font-bold">{stats.totalInternships - stats.activeInternships}</span>
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
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <span className="text-sm">Verified companies</span>
                <span className="font-bold text-green-600">{stats.verifiedCompanies}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Active internship listings</span>
                <span className="font-bold">{stats.activeInternships}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
