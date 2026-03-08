import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, Users, Eye, Briefcase, CheckCircle, Clock,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

interface CompanyAnalyticsProps {
  companyId: string | null;
}

interface AnalyticsData {
  totalInternships: number;
  activeInternships: number;
  totalApplications: number;
  pendingReview: number;
  shortlisted: number;
  offersReleased: number;
  offersAccepted: number;
  rejected: number;
  totalViews: number;
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

export const CompanyAnalytics = ({ companyId }: CompanyAnalyticsProps) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetchAnalytics = async () => {
      try {
        const [internshipsRes, applicationsRes] = await Promise.all([
          supabase.from('internships').select('id, title, is_active, views_count').eq('company_id', companyId),
          supabase.from('applications').select('id, status, internship_id').in(
            'internship_id',
            (await supabase.from('internships').select('id').eq('company_id', companyId)).data?.map(i => i.id) || []
          ),
        ]);

        const internships = internshipsRes.data || [];
        const applications = applicationsRes.data || [];

        const statusMap: Record<string, number> = {
          applied: 0, under_review: 0, shortlisted: 0,
          offer_released: 0, offer_accepted: 0, rejected: 0, withdrawn: 0,
        };
        applications.forEach(a => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });

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
          totalInternships: internships.length,
          activeInternships: internships.filter(i => i.is_active).length,
          totalApplications: applications.length,
          pendingReview: statusMap.applied + statusMap.under_review,
          shortlisted: statusMap.shortlisted,
          offersReleased: statusMap.offer_released,
          offersAccepted: statusMap.offer_accepted,
          rejected: statusMap.rejected,
          totalViews: internships.reduce((sum, i) => sum + (i.views_count || 0), 0),
          applicationsByInternship: appsByInternship,
          statusBreakdown,
        });
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [companyId]);

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

  const conversionRate = data.totalApplications > 0
    ? Math.round((data.offersAccepted / data.totalApplications) * 100)
    : 0;

  const metrics = [
    { label: 'Total Views', value: data.totalViews, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Applications', value: data.totalApplications, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Offers Accepted', value: data.offersAccepted, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Conversion', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  // Funnel stages
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
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Analytics Overview</h2>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(m => (
          <Card key={m.label} className="border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', m.bg)}>
                  <m.icon className={cn('h-4 w-4', m.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                    <div
                      className={cn('h-full rounded transition-all duration-700', s.color)}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Applications by Internship Bar Chart */}
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
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status Pie Chart */}
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
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
