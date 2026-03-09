import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, Users, Eye, CheckCircle,
  BarChart3, PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import { AnalyticsDateFilter, DateRange } from '@/components/analytics/AnalyticsDateFilter';
import { TrendBadge } from '@/components/analytics/TrendBadge';
import { Sparkline } from '@/components/analytics/Sparkline';
import { useSparklineData } from '@/components/analytics/useSparklineData';
import { AnalyticsExportButton } from '@/components/analytics/AnalyticsExportButton';
import { AnalyticsDrillDown, DrillDownQuery } from '@/components/analytics/AnalyticsDrillDown';
import { getPreviousPeriod } from '@/components/analytics/period-utils';

interface CompanyAnalyticsProps {
  companyId: string | null;
}

interface MetricValues {
  totalViews: number;
  totalApplications: number;
  offersAccepted: number;
  conversionRate: number;
}

interface AnalyticsData extends MetricValues {
  totalInternships: number;
  activeInternships: number;
  pendingReview: number;
  shortlisted: number;
  offersReleased: number;
  rejected: number;
  applicationsByInternship: { name: string; applications: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
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

const SPARK_COLORS = {
  views: '#3b82f6',
  applications: '#6366f1',
  accepted: '#10b981',
  conversion: '#f59e0b',
};

export const CompanyAnalytics = ({ companyId }: CompanyAnalyticsProps) => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [prevMetrics, setPrevMetrics] = useState<MetricValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [drillDown, setDrillDown] = useState<DrillDownQuery | null>(null);

  // Sparkline data
  const sparkData = useSparklineData(dateRange, [
    { table: 'applications', dateCol: 'applied_at', key: 'applications' },
  ], [companyId]);

  const fetchPeriodData = useCallback(async (from?: Date, to?: Date) => {
    if (!companyId) return null;

    const { data: companyInternships } = await supabase
      .from('internships')
      .select('id, title, is_active, views_count, created_at')
      .eq('company_id', companyId);

    let internships = companyInternships || [];
    if (from) {
      internships = internships.filter(i => {
        const created = new Date(i.created_at);
        return created >= from && (!to || created <= to);
      });
    }

    const internshipIds = internships.map(i => i.id);
    let applications: { id: string; status: string; internship_id: string; applied_at: string }[] = [];
    if (internshipIds.length > 0) {
      let query = supabase.from('applications').select('id, status, internship_id, applied_at').in('internship_id', internshipIds);
      if (from) query = query.gte('applied_at', from.toISOString());
      if (to) query = query.lte('applied_at', to.toISOString());
      const { data: appsData } = await query;
      applications = appsData || [];
    }

    const statusMap: Record<string, number> = {
      applied: 0, under_review: 0, shortlisted: 0,
      offer_released: 0, offer_accepted: 0, rejected: 0, withdrawn: 0,
    };
    applications.forEach(a => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });

    const totalApps = applications.length;
    const accepted = statusMap.offer_accepted;

    return {
      internships,
      applications,
      statusMap,
      metricValues: {
        totalViews: internships.reduce((sum, i) => sum + (i.views_count || 0), 0),
        totalApplications: totalApps,
        offersAccepted: accepted,
        conversionRate: totalApps > 0 ? Math.round((accepted / totalApps) * 100) : 0,
      } as MetricValues,
    };
  }, [companyId]);

  const fetchAnalytics = useCallback(async (showLoader = true) => {
    if (!companyId) return;
    if (showLoader) setLoading(true);
    try {
      const current = await fetchPeriodData(dateRange.from, dateRange.to);
      if (!current) return;

      const { internships, applications, statusMap, metricValues } = current;

      const prev = getPreviousPeriod(dateRange);
      const previous = await fetchPeriodData(prev.from, prev.to);
      setPrevMetrics(previous?.metricValues || null);

      const appsByInternship = internships
        .map(i => ({
          name: i.title.length > 20 ? i.title.substring(0, 20) + '…' : i.title,
          applications: applications.filter(a => a.internship_id === i.id).length,
        }))
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 8);

      const statusBreakdown = [
        { name: 'Applied', value: statusMap.applied, color: STATUS_COLORS['Applied'] },
        { name: 'Under Review', value: statusMap.under_review, color: STATUS_COLORS['Under Review'] },
        { name: 'Shortlisted', value: statusMap.shortlisted, color: STATUS_COLORS['Shortlisted'] },
        { name: 'Offer Released', value: statusMap.offer_released, color: STATUS_COLORS['Offer Released'] },
        { name: 'Offer Accepted', value: statusMap.offer_accepted, color: STATUS_COLORS['Offer Accepted'] },
        { name: 'Rejected', value: statusMap.rejected, color: STATUS_COLORS['Rejected'] },
        { name: 'Withdrawn', value: statusMap.withdrawn, color: STATUS_COLORS['Withdrawn'] },
      ].filter(s => s.value > 0);

      setData({
        ...metricValues,
        totalInternships: internships.length,
        activeInternships: internships.filter(i => i.is_active).length,
        pendingReview: statusMap.applied + statusMap.under_review,
        shortlisted: statusMap.shortlisted,
        offersReleased: statusMap.offer_released,
        rejected: statusMap.rejected,
        applicationsByInternship: appsByInternship,
        statusBreakdown,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, dateRange, fetchPeriodData]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel('company-analytics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => fetchAnalytics(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internships' }, () => fetchAnalytics(false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    { label: 'Total Views', value: data.totalViews, prev: prevMetrics?.totalViews, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10', sparkColor: SPARK_COLORS.views, sparkKey: null as string | null },
    { label: 'Applications', value: data.totalApplications, prev: prevMetrics?.totalApplications, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', sparkColor: SPARK_COLORS.applications, sparkKey: 'applications' },
    { label: 'Offers Accepted', value: data.offersAccepted, prev: prevMetrics?.offersAccepted, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sparkColor: SPARK_COLORS.accepted, sparkKey: null as string | null },
    { label: 'Conversion', value: data.conversionRate, prev: prevMetrics?.conversionRate, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', suffix: '%', sparkColor: SPARK_COLORS.conversion, sparkKey: null as string | null },
  ];

  // Export data
  const exportData = data.statusBreakdown.map(s => ({ status: s.name, count: s.value }));
  const exportColumns = [
    { header: 'Status', accessor: 'status' },
    { header: 'Count', accessor: 'count', format: (v: any) => String(v) },
  ];

  const funnel = [
    { label: 'Applications', value: data.totalApplications, color: 'bg-primary' },
    { label: 'Under Review', value: data.pendingReview, color: 'bg-amber-500' },
    { label: 'Shortlisted', value: data.shortlisted, color: 'bg-blue-500' },
    { label: 'Offers Released', value: data.offersReleased, color: 'bg-purple-500' },
    { label: 'Offers Accepted', value: data.offersAccepted, color: 'bg-emerald-500' },
  ];
  const maxFunnel = Math.max(data.totalApplications, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Analytics Overview</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => navigate('/analytics')}>
            <Maximize2 className="h-3 w-3" />
            Full View
          </Button>
          <AnalyticsExportButton
            title="Company Analytics Report"
            data={exportData}
            columns={exportColumns}
            filename="company-analytics"
          />
          <AnalyticsDateFilter dateRange={dateRange} onDateRangeChange={setDateRange} lastUpdated={lastUpdated} />
        </div>
      </div>

      {/* Metric Cards with Trend Badges & Sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(m => {
          const spark = m.sparkKey ? sparkData[m.sparkKey] : undefined;
          return (
            <Card key={m.label} className="border overflow-hidden">
              <CardContent className="p-4 pb-1">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', m.bg)}>
                    <m.icon className={cn('h-4 w-4', m.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-2xl font-bold">{m.value}{m.suffix || ''}</p>
                      {m.prev !== undefined && (
                        <TrendBadge current={m.value} previous={m.prev} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                </div>
              </CardContent>
              {spark && spark.length >= 2 && (
                <div className="px-2 pb-1">
                  <Sparkline data={spark} color={m.sparkColor} height={28} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Hiring Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Hiring Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnel.map((s, i) => {
              const pct = Math.round((s.value / maxFunnel) * 100);
              const prev = i > 0 ? funnel[i - 1].value : null;
              const convFromPrev = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{s.value}</span>
                      {convFromPrev !== null && (
                        <Badge variant="secondary" className="text-xs">{convFromPrev}%</Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-5 rounded bg-muted overflow-hidden">
                    <div className={cn('h-full rounded transition-all duration-700', s.color)} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {data.applicationsByInternship.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Applications by Internship
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.applicationsByInternship} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Bar
                    dataKey="applications"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    className="cursor-pointer"
                    onClick={(entry: any) => setDrillDown({
                      title: `Applications for "${entry.name}"`,
                      description: `Showing all applications for this internship`,
                      type: 'applications_by_internship',
                      filterValue: entry.name,
                      companyId: companyId || undefined,
                    })}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.statusBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                Application Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={data.statusBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                    className="cursor-pointer"
                    onClick={(entry: any) => setDrillDown({
                      title: `"${entry.name}" Applications`,
                      description: `Showing all applications with status: ${entry.name}`,
                      type: 'applications_by_status',
                      filterValue: entry.name,
                      companyId: companyId || undefined,
                    })}
                  >
                    {data.statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <AnalyticsDrillDown query={drillDown} onClose={() => setDrillDown(null)} />
    </div>
  );
};
