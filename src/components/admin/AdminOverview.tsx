import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase, FileCheck, Clock, CheckCircle, XCircle } from 'lucide-react';

const AdminOverview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [companiesRes, studentsRes, internshipsRes, applicationsRes] = await Promise.all([
        supabase.from('companies').select('id, is_verified', { count: 'exact' }),
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('internships').select('id, is_active', { count: 'exact' }),
        supabase.from('applications').select('id, status', { count: 'exact' }),
      ]);

      const pendingCompanies = companiesRes.data?.filter(c => !c.is_verified).length || 0;
      const verifiedCompanies = companiesRes.data?.filter(c => c.is_verified).length || 0;
      const activeInternships = internshipsRes.data?.filter(i => i.is_active).length || 0;
      const pendingApplications = applicationsRes.data?.filter(a => a.status === 'pending').length || 0;

      return {
        totalCompanies: companiesRes.count || 0,
        pendingCompanies,
        verifiedCompanies,
        totalStudents: studentsRes.count || 0,
        totalInternships: internshipsRes.count || 0,
        activeInternships,
        totalApplications: applicationsRes.count || 0,
        pendingApplications,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    { title: 'Total Companies', value: stats?.totalCompanies, icon: Building2, color: 'text-blue-500' },
    { title: 'Pending Approval', value: stats?.pendingCompanies, icon: Clock, color: 'text-yellow-500' },
    { title: 'Verified Companies', value: stats?.verifiedCompanies, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Total Students', value: stats?.totalStudents, icon: Users, color: 'text-purple-500' },
    { title: 'Total Internships', value: stats?.totalInternships, icon: Briefcase, color: 'text-indigo-500' },
    { title: 'Active Internships', value: stats?.activeInternships, icon: FileCheck, color: 'text-emerald-500' },
    { title: 'Total Applications', value: stats?.totalApplications, icon: FileCheck, color: 'text-orange-500' },
    { title: 'Pending Applications', value: stats?.pendingApplications, icon: Clock, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
