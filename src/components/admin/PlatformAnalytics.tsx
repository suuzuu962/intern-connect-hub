import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, Users, Building2, Briefcase, TrendingUp, GraduationCap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { AnalyticsFunnel } from './AnalyticsFunnel';
import { AnalyticsDateFilter, DateRange } from '@/components/analytics/AnalyticsDateFilter';
import { TrendBadge } from '@/components/analytics/TrendBadge';
import { getPreviousPeriod } from '@/components/analytics/period-utils';

interface MetricValues {
  totalStudents: number;
  totalCompanies: number;
  totalInternships: number;
  totalApplications: number;
  totalUniversities: number;
  totalColleges: number;
}

interface PlatformStats extends MetricValues {
  verifiedCompanies: number;
  activeInternships: number;
  applicationsByStatus: { name: string; value: number; color: string }[];
  internshipsByType: { name: string; value: number; color: string }[];
  internshipsByMode: { name: string; value: number; color: string }[];
  topCompanies: { name: string; internships: number; applications: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  'Applied': 'hsl(var(--primary))',
  'Under Review': 'hsl(45 93% 47%)',
  'Shortlisted': 'hsl(221 83% 53%)',
  'Offer Released': 'hsl(280 67% 55%)',
  'Offer Accepted': 'hsl(142 71% 45%)',
  'Rejected': 'hsl(0 84% 60%)',
  'Withdrawn': 'hsl(var(--muted-foreground))',
};

export const PlatformAnalytics = () => {
  const [data, setData] = useState<PlatformStats | null>(null);
  const [prevMetrics, setPrevMetrics] = useState<MetricValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrevCounts = useCallback(async (from: Date, to: Date): Promise<MetricValues> => {
    const [students, companies, internships, applications, universities, colleges] = await Promise.all([
      countInRange('students', 'created_at', from, to),
      countInRange('companies', 'created_at', from, to),
      countInRange('internships', 'created_at', from, to),
      countInRange('applications', 'applied_at', from, to),
      countInRange('universities', 'created_at', from, to),
      countInRange('colleges', 'created_at', from, to),
    ]);
    return { totalStudents: students, totalCompanies: companies, totalInternships: internships, totalApplications: applications, totalUniversities: universities, totalColleges: colleges };
  }, []);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      let studentsQuery = supabase.from('students').select('id, created_at');
      let companiesQuery = supabase.from('companies').select('id, name, is_verified, created_at');
      let internshipsQuery = supabase.from('internships').select('id, company_id, is_active, internship_type, work_mode, title, created_at');
      let appsQuery = supabase.from('applications').select('id, status, internship_id, applied_at');
      let uniQuery = supabase.from('universities').select('id, created_at');
      let collegesQuery = supabase.from('colleges').select('id, created_at');

      if (dateRange.from) {
        const f = dateRange.from.toISOString();
        studentsQuery = studentsQuery.gte('created_at', f);
        companiesQuery = companiesQuery.gte('created_at', f);
        internshipsQuery = internshipsQuery.gte('created_at', f);
        appsQuery = appsQuery.gte('applied_at', f);
        uniQuery = uniQuery.gte('created_at', f);
        collegesQuery = collegesQuery.gte('created_at', f);
      }
      if (dateRange.to) {
        const t = dateRange.to.toISOString();
        studentsQuery = studentsQuery.lte('created_at', t);
        companiesQuery = companiesQuery.lte('created_at', t);
        internshipsQuery = internshipsQuery.lte('created_at', t);
        appsQuery = appsQuery.lte('applied_at', t);
        uniQuery = uniQuery.lte('created_at', t);
        collegesQuery = collegesQuery.lte('created_at', t);
      }

      const [studentsRes, companiesRes, internshipsRes, appsRes, uniRes, collegesRes] = await Promise.all([
        studentsQuery, companiesQuery, internshipsQuery, appsQuery, uniQuery, collegesQuery,
      ]);

      // Previous period
      const prev = getPreviousPeriod(dateRange);
      const prevCounts = await fetchPrevCounts(prev.from, prev.to);
      setPrevMetrics(prevCounts);

      const companies = companiesRes.data || [];
      const internships = internshipsRes.data || [];
      const apps = appsRes.data || [];

      const statusMap: Record<string, number> = {};
      apps.forEach(a => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
      const statusLabels: Record<string, string> = {
        applied: 'Applied', under_review: 'Under Review', shortlisted: 'Shortlisted',
        offer_released: 'Offer Released', offer_accepted: 'Offer Accepted',
        rejected: 'Rejected', withdrawn: 'Withdrawn',
      };
      const applicationsByStatus = Object.entries(statusMap)
        .map(([k, v]) => ({ name: statusLabels[k] || k, value: v, color: STATUS_COLORS[statusLabels[k]] || 'hsl(var(--muted))' }))
        .filter(s => s.value > 0);

      const typeMap: Record<string, number> = {};
      internships.forEach(i => { typeMap[i.internship_type] = (typeMap[i.internship_type] || 0) + 1; });
      const internshipsByType = Object.entries(typeMap).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1), value: v,
        color: k === 'free' ? 'hsl(142 71% 45%)' : k === 'paid' ? 'hsl(221 83% 53%)' : 'hsl(45 93% 47%)',
      }));

      const modeMap: Record<string, number> = {};
      internships.forEach(i => { modeMap[i.work_mode] = (modeMap[i.work_mode] || 0) + 1; });
      const internshipsByMode = Object.entries(modeMap).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1), value: v,
        color: k === 'remote' ? 'hsl(142 71% 45%)' : k === 'onsite' ? 'hsl(221 83% 53%)' : 'hsl(280 67% 55%)',
      }));

      const companyAppCount: Record<string, { name: string; internships: number; applications: number }> = {};
      companies.forEach(c => { companyAppCount[c.id] = { name: c.name, internships: 0, applications: 0 }; });
      internships.forEach(i => { if (companyAppCount[i.company_id]) companyAppCount[i.company_id].internships++; });
      apps.forEach(a => {
        const intern = internships.find(i => i.id === a.internship_id);
        if (intern && companyAppCount[intern.company_id]) companyAppCount[intern.company_id].applications++;
      });
      const topCompanies = Object.values(companyAppCount)
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 8)
        .map(c => ({ ...c, name: c.name.length > 18 ? c.name.substring(0, 18) + '…' : c.name }));

      setData({
        totalStudents: studentsRes.data?.length || 0,
        totalCompanies: companies.length,
        verifiedCompanies: companies.filter(c => c.is_verified).length,
        totalInternships: internships.length,
        activeInternships: internships.filter(i => i.is_active).length,
        totalApplications: apps.length,
        totalUniversities: uniRes.data?.length || 0,
        totalColleges: collegesRes.data?.length || 0,
        applicationsByStatus, internshipsByType, internshipsByMode, topCompanies,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Platform analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, fetchPrevCounts]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('platform-analytics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => fetchData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internships' }, () => fetchData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => fetchData(false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    { label: 'Students', value: data.totalStudents, prev: prevMetrics?.totalStudents, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Companies', value: data.totalCompanies, prev: prevMetrics?.totalCompanies, icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', display: `${data.verifiedCompanies}/${data.totalCompanies}` },
    { label: 'Internships', value: data.totalInternships, prev: prevMetrics?.totalInternships, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10', display: `${data.activeInternships}/${data.totalInternships}` },
    { label: 'Applications', value: data.totalApplications, prev: prevMetrics?.totalApplications, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Universities', value: data.totalUniversities, prev: prevMetrics?.totalUniversities, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Colleges', value: data.totalColleges, prev: prevMetrics?.totalColleges, icon: Building2, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ];

  const tooltipStyle = {
    contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 },
    labelStyle: { color: 'hsl(var(--foreground))' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Platform Analytics</h2>
        </div>
        <AnalyticsDateFilter dateRange={dateRange} onDateRangeChange={setDateRange} lastUpdated={lastUpdated} />
      </div>

      {/* Metrics with Trend Badges */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map(m => (
          <Card key={m.label} className="border">
            <CardContent className="p-4">
              <div className={cn('p-2 rounded-lg w-fit mb-2', m.bg)}>
                <m.icon className={cn('h-4 w-4', m.color)} />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xl font-bold">{m.display || m.value}</p>
                {m.prev !== undefined && (
                  <TrendBadge current={m.value} previous={m.prev} />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnalyticsFunnel />

      <Tabs defaultValue="status" className="w-full">
        <TabsList>
          <TabsTrigger value="status">Application Status</TabsTrigger>
          <TabsTrigger value="companies">Top Companies</TabsTrigger>
          <TabsTrigger value="types">Internship Types</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <div className="grid md:grid-cols-2 gap-6">
            {data.applicationsByStatus.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={data.applicationsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={3} dataKey="value">
                        {data.applicationsByStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status Counts</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.applicationsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.applicationsByStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies">
          {data.topCompanies.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top Companies by Applications</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.topCompanies} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    <Bar dataKey="internships" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Internships" />
                    <Bar dataKey="applications" fill="hsl(142 71% 45%)" radius={[0, 4, 4, 0]} name="Applications" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="types">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">By Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={data.internshipsByType} cx="50%" cy="50%" outerRadius={85} paddingAngle={4} dataKey="value" label>
                      {data.internshipsByType.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">By Work Mode</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={data.internshipsByMode} cx="50%" cy="50%" outerRadius={85} paddingAngle={4} dataKey="value" label>
                      {data.internshipsByMode.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
