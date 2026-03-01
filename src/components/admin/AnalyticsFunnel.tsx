import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, FileText, Eye, Handshake, CheckCircle } from 'lucide-react';

interface FunnelData {
  registered: number;
  profileComplete: number;
  applied: number;
  shortlisted: number;
  offerReleased: number;
  offerAccepted: number;
}

export const AnalyticsFunnel = () => {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunnelData = async () => {
      try {
        const [studentsRes, appsRes] = await Promise.all([
          supabase.from('students').select('id, resume_url, skills, college, domain'),
          supabase.from('applications').select('id, status'),
        ]);

        const students = studentsRes.data || [];
        const apps = appsRes.data || [];

        const profileComplete = students.filter(s => s.resume_url && s.skills && s.college).length;

        setData({
          registered: students.length,
          profileComplete,
          applied: apps.length,
          shortlisted: apps.filter(a => a.status === 'shortlisted' || a.status === 'under_review' || a.status === 'offer_released' || a.status === 'offer_accepted').length,
          offerReleased: apps.filter(a => a.status === 'offer_released' || a.status === 'offer_accepted').length,
          offerAccepted: apps.filter(a => a.status === 'offer_accepted').length,
        });
      } catch (err) {
        console.error('Funnel data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFunnelData();
  }, []);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!data) return null;

  const stages = [
    { label: 'Registered Students', value: data.registered, icon: Users, color: 'bg-blue-500' },
    { label: 'Profile Complete', value: data.profileComplete, icon: FileText, color: 'bg-indigo-500' },
    { label: 'Applications Submitted', value: data.applied, icon: Eye, color: 'bg-purple-500' },
    { label: 'Shortlisted / Under Review', value: data.shortlisted, icon: CheckCircle, color: 'bg-orange-500' },
    { label: 'Offers Released', value: data.offerReleased, icon: Handshake, color: 'bg-pink-500' },
    { label: 'Offers Accepted', value: data.offerAccepted, icon: TrendingUp, color: 'bg-emerald-500' },
  ];

  const maxVal = Math.max(data.registered, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Student Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((s, i) => {
            const pct = Math.round((s.value / maxVal) * 100);
            const conversionFromPrev = i > 0 && stages[i - 1].value > 0
              ? Math.round((s.value / stages[i - 1].value) * 100)
              : null;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{s.value}</span>
                    {conversionFromPrev !== null && (
                      <span className="text-xs text-muted-foreground">({conversionFromPrev}%)</span>
                    )}
                  </div>
                </div>
                <div className="h-6 rounded bg-muted overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded transition-all duration-700 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  >
                    {pct > 10 && <span className="text-xs text-white font-medium">{pct}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
