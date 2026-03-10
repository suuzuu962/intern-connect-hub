import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowDown, TrendingUp } from 'lucide-react';

interface ApplicationFunnelProps {
  companyId: string | null;
}

interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

export const ApplicationFunnel = ({ companyId }: ApplicationFunnelProps) => {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) fetchFunnelData();
  }, [companyId]);

  const fetchFunnelData = async () => {
    try {
      const { data: internships } = await supabase
        .from('internships')
        .select('id')
        .eq('company_id', companyId!);

      const internshipIds = internships?.map(i => i.id) || [];
      if (internshipIds.length === 0) {
        setStages([]);
        setLoading(false);
        return;
      }

      const { data: applications } = await supabase
        .from('applications')
        .select('status')
        .in('internship_id', internshipIds);

      const counts: Record<string, number> = {
        applied: 0, under_review: 0, shortlisted: 0,
        offer_released: 0, offer_accepted: 0, rejected: 0, withdrawn: 0,
      };
      applications?.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

      const total = applications?.length || 0;

      setStages([
        { label: 'Total Applications', count: total, color: 'bg-primary' },
        { label: 'Under Review', count: counts.under_review, color: 'bg-amber-500' },
        { label: 'Shortlisted', count: counts.shortlisted, color: 'bg-blue-500' },
        { label: 'Offer Released', count: counts.offer_released, color: 'bg-violet-500' },
        { label: 'Offer Accepted', count: counts.offer_accepted, color: 'bg-emerald-500' },
        { label: 'Rejected', count: counts.rejected, color: 'bg-destructive' },
        { label: 'Withdrawn', count: counts.withdrawn, color: 'bg-muted-foreground' },
      ]);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Application Funnel</h2>
        <p className="text-muted-foreground">Track how applicants move through your hiring pipeline</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Hiring Pipeline
          </CardTitle>
          <CardDescription>Conversion through each stage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stages.map((stage, index) => {
            const widthPercent = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 8) : 8;
            const conversionRate = index > 0 && stages[0].count > 0
              ? ((stage.count / stages[0].count) * 100).toFixed(1)
              : null;

            return (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stage.count}</span>
                    {conversionRate && (
                      <span className="text-xs text-muted-foreground">({conversionRate}%)</span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className={cn("h-full rounded-md transition-all duration-500", stage.color)}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                {index < stages.length - 1 && index < 4 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Conversion Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Review Rate', value: stages[0]?.count ? ((stages[1]?.count / stages[0].count) * 100).toFixed(1) + '%' : '0%' },
          { label: 'Shortlist Rate', value: stages[0]?.count ? ((stages[2]?.count / stages[0].count) * 100).toFixed(1) + '%' : '0%' },
          { label: 'Offer Rate', value: stages[0]?.count ? ((stages[3]?.count / stages[0].count) * 100).toFixed(1) + '%' : '0%' },
          { label: 'Acceptance Rate', value: stages[3]?.count ? ((stages[4]?.count / stages[3].count) * 100).toFixed(1) + '%' : '0%' },
        ].map(metric => (
          <Card key={metric.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
