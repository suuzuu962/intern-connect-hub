import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, BarChart3, TrendingUp, Users, Eye, CheckCircle,
  PieChart, Activity, Layers, GitCompareArrows
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from 'recharts';
import { AnalyticsDateFilter, DateRange } from '@/components/analytics/AnalyticsDateFilter';
import { TrendBadge } from '@/components/analytics/TrendBadge';
import { Sparkline } from '@/components/analytics/Sparkline';
import { AnalyticsExportButton } from '@/components/analytics/AnalyticsExportButton';
import { AnalyticsDrillDown, DrillDownQuery } from '@/components/analytics/AnalyticsDrillDown';
import { getPreviousPeriod } from '@/components/analytics/period-utils';
import { format, subDays, startOfDay } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  'Applied': 'hsl(var(--primary))',
  'Under Review': 'hsl(45 93% 47%)',
  'Shortlisted': 'hsl(221 83% 53%)',
  'Offer Released': 'hsl(280 67% 55%)',
  'Offer Accepted': 'hsl(142 71% 45%)',
  'Rejected': 'hsl(0 84% 60%)',
  'Withdrawn': 'hsl(var(--muted-foreground))',
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(221 83% 53%)',
  'hsl(142 71% 45%)',
  'hsl(280 67% 55%)',
  'hsl(45 93% 47%)',
  'hsl(0 84% 60%)',
  'hsl(200 70% 50%)',
  'hsl(330 70% 55%)',
];

interface TimeSeriesPoint {
  date: string;
  applications: number;
  views: number;
}

const FullScreenAnalytics = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: subDays(new Date(), 30), to: new Date() });
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [drillDown, setDrillDown] = useState<DrillDownQuery | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Current period data
  const [metrics, setMetrics] = useState({
    totalViews: 0, totalApplications: 0, offersAccepted: 0,
    conversionRate: 0, totalInternships: 0, activeInternships: 0,
  });
  const [prevMetrics, setPrevMetrics] = useState<typeof metrics | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
  const [appsByInternship, setAppsByInternship] = useState<{ name: string; applications: number }[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [prevTimeSeries, setPrevTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [domainData, setDomainData] = useState<{ domain: string; count: number }[]>([]);
  const [modeData, setModeData] = useState<{ name: string; value: number; color: string }[]>([]);

  // Fetch company ID for company role
  useEffect(() => {
    if (role === 'company' && user) {
      supabase.from('companies').select('id').eq('user_id', user.id).single()
        .then(({ data }) => setCompanyId(data?.id || null));
    }
  }, [user, role]);

  const buildTimeSeries = useCallback((applications: any[], internships: any[], from: Date, to: Date) => {
    const days: string[] = [];
    let d = startOfDay(from);
    while (d <= to) {
      days.push(format(d, 'yyyy-MM-dd'));
      d = new Date(d.getTime() + 86400000);
    }
    // Downsample if too many days
    const buckets = days.length > 60 ? days.filter((_, i) => i % Math.ceil(days.length / 60) === 0) : days;

    return buckets.map(day => {
      const apps = applications.filter(a => format(new Date(a.applied_at), 'yyyy-MM-dd') === day).length;
      const views = internships.reduce((s: number, i: any) => {
        if (format(new Date(i.created_at), 'yyyy-MM-dd') <= day) return s + (i.views_count || 0);
        return s;
      }, 0);
      return { date: day, applications: apps, views: 0 }; // views are cumulative, simplify to apps
    });
  }, []);

  const fetchPeriodData = useCallback(async (from: Date, to: Date) => {
    const isCompany = role === 'company' && companyId;

    let internshipsQuery = supabase
      .from('internships')
      .select('id, title, is_active, views_count, created_at, domain, work_mode, internship_type');
    if (isCompany) internshipsQuery = internshipsQuery.eq('company_id', companyId!);

    const { data: allInternships } = await internshipsQuery;
    let internships = (allInternships || []).filter(i => {
      const created = new Date(i.created_at);
      return created >= from && created <= to;
    });

    const internshipIds = (allInternships || []).map(i => i.id);
    let applications: any[] = [];
    if (internshipIds.length > 0) {
      const { data } = await supabase
        .from('applications')
        .select('id, status, internship_id, applied_at')
        .in('internship_id', internshipIds)
        .gte('applied_at', from.toISOString())
        .lte('applied_at', to.toISOString());
      applications = data || [];
    }

    const statusMap: Record<string, number> = {
      applied: 0, under_review: 0, shortlisted: 0,
      offer_released: 0, offer_accepted: 0, rejected: 0, withdrawn: 0,
    };
    applications.forEach(a => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });

    const totalApps = applications.length;
    const accepted = statusMap.offer_accepted;

    // Domain breakdown
    const domainCounts: Record<string, number> = {};
    (allInternships || []).forEach(i => {
      const d = i.domain || 'Unspecified';
      domainCounts[d] = (domainCounts[d] || 0) + 1;
    });

    // Work mode breakdown
    const modeCounts: Record<string, number> = {};
    (allInternships || []).forEach(i => {
      modeCounts[i.work_mode] = (modeCounts[i.work_mode] || 0) + 1;
    });

    return {
      metrics: {
        totalViews: (allInternships || []).reduce((s, i) => s + (i.views_count || 0), 0),
        totalApplications: totalApps,
        offersAccepted: accepted,
        conversionRate: totalApps > 0 ? Math.round((accepted / totalApps) * 100) : 0,
        totalInternships: (allInternships || []).length,
        activeInternships: (allInternships || []).filter(i => i.is_active).length,
      },
      statusBreakdown: [
        { name: 'Applied', value: statusMap.applied, color: STATUS_COLORS['Applied'] },
        { name: 'Under Review', value: statusMap.under_review, color: STATUS_COLORS['Under Review'] },
        { name: 'Shortlisted', value: statusMap.shortlisted, color: STATUS_COLORS['Shortlisted'] },
        { name: 'Offer Released', value: statusMap.offer_released, color: STATUS_COLORS['Offer Released'] },
        { name: 'Offer Accepted', value: statusMap.offer_accepted, color: STATUS_COLORS['Offer Accepted'] },
        { name: 'Rejected', value: statusMap.rejected, color: STATUS_COLORS['Rejected'] },
        { name: 'Withdrawn', value: statusMap.withdrawn, color: STATUS_COLORS['Withdrawn'] },
      ].filter(s => s.value > 0),
      appsByInternship: (allInternships || [])
        .map(i => ({
          name: i.title.length > 25 ? i.title.substring(0, 25) + '…' : i.title,
          applications: applications.filter(a => a.internship_id === i.id).length,
        }))
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 12),
      timeSeries: buildTimeSeries(applications, allInternships || [], from, to),
      domainData: Object.entries(domainCounts)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      modeData: Object.entries(modeCounts).map(([name, value], i) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    };
  }, [role, companyId, buildTimeSeries]);

  const fetchAll = useCallback(async () => {
    if (role === 'company' && !companyId) return;
    setLoading(true);
    try {
      const from = dateRange.from || subDays(new Date(), 30);
      const to = dateRange.to || new Date();

      const current = await fetchPeriodData(from, to);
      setMetrics(current.metrics);
      setStatusBreakdown(current.statusBreakdown);
      setAppsByInternship(current.appsByInternship);
      setTimeSeries(current.timeSeries);
      setDomainData(current.domainData);
      setModeData(current.modeData);

      if (comparisonEnabled) {
        const prev = getPreviousPeriod(dateRange);
        const prevData = await fetchPeriodData(prev.from, prev.to);
        setPrevMetrics(prevData.metrics);
        setPrevTimeSeries(prevData.timeSeries);
      } else {
        setPrevMetrics(null);
        setPrevTimeSeries([]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Full analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, comparisonEnabled, fetchPeriodData, role, companyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const metricCards = [
    { label: 'Total Views', value: metrics.totalViews, prev: prevMetrics?.totalViews, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Applications', value: metrics.totalApplications, prev: prevMetrics?.totalApplications, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Offers Accepted', value: metrics.offersAccepted, prev: prevMetrics?.offersAccepted, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Conversion Rate', value: metrics.conversionRate, prev: prevMetrics?.conversionRate, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', suffix: '%' },
    { label: 'Total Internships', value: metrics.totalInternships, prev: prevMetrics?.totalInternships, icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active Internships', value: metrics.activeInternships, prev: prevMetrics?.activeInternships, icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  const exportData = statusBreakdown.map(s => ({ status: s.name, count: s.value }));
  const exportColumns = [
    { header: 'Status', accessor: 'status' },
    { header: 'Count', accessor: 'count', format: (v: any) => String(v) },
  ];

  // Merged time series for comparison overlay
  const mergedTimeSeries = useMemo(() => {
    if (!comparisonEnabled || prevTimeSeries.length === 0) return timeSeries.map(t => ({ ...t, prevApplications: 0 }));
    return timeSeries.map((t, i) => ({
      ...t,
      prevApplications: prevTimeSeries[i]?.applications || 0,
    }));
  }, [timeSeries, prevTimeSeries, comparisonEnabled]);

  const backPath = role === 'admin' ? '/admin/dashboard' : '/company/dashboard';

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Analytics Studio</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
              <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="comparison" className="text-xs font-medium cursor-pointer">Compare</Label>
              <Switch
                id="comparison"
                checked={comparisonEnabled}
                onCheckedChange={setComparisonEnabled}
              />
            </div>
            <AnalyticsExportButton
              title="Full Analytics Report"
              data={exportData}
              columns={exportColumns}
              filename="full-analytics"
            />
            <AnalyticsDateFilter dateRange={dateRange} onDateRangeChange={setDateRange} lastUpdated={lastUpdated} />
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metricCards.map(m => (
              <Card key={m.label} className="border overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('p-1.5 rounded-lg', m.bg)}>
                      <m.icon className={cn('h-4 w-4', m.color)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-2xl font-bold">{m.value}{m.suffix || ''}</p>
                    {comparisonEnabled && m.prev !== undefined && (
                      <TrendBadge current={m.value} previous={m.prev} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs for different chart views */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Applications over time */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Applications Over Time
                      {comparisonEnabled && <Badge variant="secondary" className="text-xs">vs Previous</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={mergedTimeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => format(new Date(v), 'MMM d')} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                          labelFormatter={v => format(new Date(v), 'MMM d, yyyy')}
                        />
                        <Area type="monotone" dataKey="applications" stroke="hsl(var(--primary))" fill="url(#colorApps)" strokeWidth={2} name="Current" />
                        {comparisonEnabled && (
                          <Area type="monotone" dataKey="prevApplications" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="Previous" />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status Breakdown Pie */}
                {statusBreakdown.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-primary" />
                        Application Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                          <Pie
                            data={statusBreakdown}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={100}
                            paddingAngle={3} dataKey="value"
                            className="cursor-pointer"
                            onClick={(entry: any) => setDrillDown({
                              title: `"${entry.name}" Applications`,
                              description: `All applications with status: ${entry.name}`,
                              type: 'applications_by_status',
                              filterValue: entry.name,
                              companyId: companyId || undefined,
                            })}
                          >
                            {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Applications by Internship - Full Width */}
              {appsByInternship.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Applications by Internship
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={appsByInternship} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        <Bar
                          dataKey="applications"
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                          className="cursor-pointer"
                          onClick={(entry: any) => setDrillDown({
                            title: `Applications for "${entry.name}"`,
                            description: `All applications for this internship`,
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
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Application Trend Line
                    {comparisonEnabled && <Badge variant="secondary" className="text-xs">Comparison Mode</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={mergedTimeSeries} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => format(new Date(v), 'MMM d')} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                        labelFormatter={v => format(new Date(v), 'MMM d, yyyy')}
                      />
                      <Line type="monotone" dataKey="applications" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name="Current Period" />
                      {comparisonEnabled && (
                        <Line type="monotone" dataKey="prevApplications" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Previous Period" />
                      )}
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Hiring Funnel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Hiring Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HiringFunnel statusBreakdown={statusBreakdown} totalApplications={metrics.totalApplications} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Breakdown Tab */}
            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Domain Distribution */}
                {domainData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Internships by Domain</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={domainData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="domain" tick={{ fontSize: 10, angle: -35 }} height={60} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                          <Bar dataKey="count" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Work Mode Distribution */}
                {modeData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Work Mode Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                          <Pie
                            data={modeData}
                            cx="50%" cy="50%"
                            outerRadius={100}
                            paddingAngle={4} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {modeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Status Funnel Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Status Distribution (Bar)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                {statusBreakdown.length >= 3 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Status Radar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={statusBreakdown}>
                          <PolarGrid className="stroke-muted" />
                          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis tick={{ fontSize: 9 }} />
                          <Radar name="Applications" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Summary Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Summary Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Metric</th>
                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Current</th>
                            {comparisonEnabled && prevMetrics && (
                              <>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Previous</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Change</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {metricCards.map(m => {
                            const change = comparisonEnabled && m.prev !== undefined && m.prev > 0
                              ? Math.round(((m.value - m.prev) / m.prev) * 100) : null;
                            return (
                              <tr key={m.label} className="border-b last:border-0">
                                <td className="py-2 px-3 font-medium">{m.label}</td>
                                <td className="py-2 px-3 text-right font-bold">{m.value}{m.suffix || ''}</td>
                                {comparisonEnabled && prevMetrics && (
                                  <>
                                    <td className="py-2 px-3 text-right text-muted-foreground">{m.prev ?? '—'}{m.suffix || ''}</td>
                                    <td className="py-2 px-3 text-right">
                                      {change !== null ? (
                                        <Badge variant={change > 0 ? 'default' : change < 0 ? 'destructive' : 'secondary'} className="text-xs">
                                          {change > 0 ? '+' : ''}{change}%
                                        </Badge>
                                      ) : '—'}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <AnalyticsDrillDown query={drillDown} onClose={() => setDrillDown(null)} />
    </div>
  );
};

// Hiring Funnel sub-component
const HiringFunnel = ({ statusBreakdown, totalApplications }: { statusBreakdown: { name: string; value: number }[]; totalApplications: number }) => {
  const getVal = (name: string) => statusBreakdown.find(s => s.name === name)?.value || 0;
  const underReview = getVal('Applied') + getVal('Under Review');
  const funnel = [
    { label: 'Applications', value: totalApplications, color: 'bg-primary' },
    { label: 'Under Review', value: underReview, color: 'bg-amber-500' },
    { label: 'Shortlisted', value: getVal('Shortlisted'), color: 'bg-blue-500' },
    { label: 'Offers Released', value: getVal('Offer Released'), color: 'bg-purple-500' },
    { label: 'Offers Accepted', value: getVal('Offer Accepted'), color: 'bg-emerald-500' },
  ];
  const max = Math.max(totalApplications, 1);

  return (
    <div className="space-y-3">
      {funnel.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const prev = i > 0 ? funnel[i - 1].value : null;
        const conv = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{s.value}</span>
                {conv !== null && <Badge variant="secondary" className="text-xs">{conv}%</Badge>}
              </div>
            </div>
            <div className="h-6 rounded bg-muted overflow-hidden">
              <div className={cn('h-full rounded transition-all duration-700', s.color)} style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FullScreenAnalytics;
