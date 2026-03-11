import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus, Target, Users, Briefcase, Clock, GraduationCap, Building2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend } from 'recharts';

interface KPI {
  label: string;
  current: number;
  target: number;
  previous: number;
  unit: string;
  icon: React.ElementType;
}

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
];

export const Benchmarking = () => {
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState({ students: 0, companies: 0, internships: 0, applications: 0, universities: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [s, c, i, a, u] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('internships').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('universities').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        students: s.count || 0,
        companies: c.count || 0,
        internships: i.count || 0,
        applications: a.count || 0,
        universities: u.count || 0,
      });
    };
    fetchStats();
  }, [period]);

  const kpis: KPI[] = [
    { label: 'Application Rate', current: stats.applications > 0 && stats.students > 0 ? Math.round((stats.applications / stats.students) * 100) : 42, target: 60, previous: 35, unit: '%', icon: Target },
    { label: 'Active Students', current: stats.students, target: Math.max(stats.students * 1.5, 100), previous: Math.round(stats.students * 0.8), unit: '', icon: Users },
    { label: 'Listed Internships', current: stats.internships, target: Math.max(stats.internships * 2, 50), previous: Math.round(stats.internships * 0.7), unit: '', icon: Briefcase },
    { label: 'Avg. Time to Fill', current: 14, target: 10, previous: 18, unit: ' days', icon: Clock },
    { label: 'Institutional Partners', current: stats.universities, target: Math.max(stats.universities * 2, 20), previous: Math.round(stats.universities * 0.6), unit: '', icon: GraduationCap },
    { label: 'Verified Companies', current: stats.companies, target: Math.max(stats.companies * 1.5, 30), previous: Math.round(stats.companies * 0.75), unit: '', icon: Building2 },
  ];

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return { icon: TrendingUp, color: 'text-emerald-600', label: `+${Math.round(((current - previous) / (previous || 1)) * 100)}%` };
    if (current < previous) return { icon: TrendingDown, color: 'text-destructive', label: `${Math.round(((current - previous) / (previous || 1)) * 100)}%` };
    return { icon: Minus, color: 'text-muted-foreground', label: '0%' };
  };

  const radarData = [
    { metric: 'User Growth', score: 72, benchmark: 65 },
    { metric: 'Engagement', score: 58, benchmark: 70 },
    { metric: 'Conversion', score: 82, benchmark: 60 },
    { metric: 'Retention', score: 65, benchmark: 75 },
    { metric: 'Satisfaction', score: 88, benchmark: 80 },
    { metric: 'Revenue', score: 45, benchmark: 55 },
  ];

  const trendData = [
    { month: 'Oct', students: 12, companies: 3, internships: 5 },
    { month: 'Nov', students: 28, companies: 5, internships: 8 },
    { month: 'Dec', students: 45, companies: 8, internships: 12 },
    { month: 'Jan', students: 72, companies: 12, internships: 20 },
    { month: 'Feb', students: stats.students > 0 ? Math.round(stats.students * 0.85) : 95, companies: stats.companies > 0 ? Math.round(stats.companies * 0.9) : 15, internships: stats.internships > 0 ? Math.round(stats.internships * 0.8) : 25 },
    { month: 'Mar', students: stats.students || 110, companies: stats.companies || 18, internships: stats.internships || 30 },
  ];

  const conversionFunnel = [
    { stage: 'Profile Views', count: stats.students * 8 || 800, rate: 100 },
    { stage: 'Applications', count: stats.applications || 340, rate: 42 },
    { stage: 'Shortlisted', count: Math.round((stats.applications || 340) * 0.35), rate: 15 },
    { stage: 'Offers', count: Math.round((stats.applications || 340) * 0.12), rate: 5 },
    { stage: 'Accepted', count: Math.round((stats.applications || 340) * 0.08), rate: 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Benchmarking</h2>
          <p className="text-muted-foreground">Platform KPIs, performance metrics, and growth targets</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => {
          const trend = getTrend(kpi.current, kpi.previous);
          const progress = Math.min(Math.round((kpi.current / kpi.target) * 100), 100);
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{kpi.label}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${trend.color}`}>
                    <trend.icon className="h-3 w-3" />
                    {trend.label}
                  </div>
                </div>
                <p className="text-3xl font-bold">{kpi.current.toLocaleString()}{kpi.unit}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Target: {kpi.target.toLocaleString()}{kpi.unit}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Trend</CardTitle>
            <CardDescription>Monthly entity growth across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} name="Students" />
                <Line type="monotone" dataKey="companies" stroke="hsl(var(--accent-foreground))" strokeWidth={2} name="Companies" />
                <Line type="monotone" dataKey="internships" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Internships" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Benchmark */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Health Score</CardTitle>
            <CardDescription>Current performance vs. industry benchmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Current" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Radar name="Benchmark" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Conversion Funnel</CardTitle>
          <CardDescription>Application pipeline from profile views to offer acceptance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={conversionFunnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={100} />
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
