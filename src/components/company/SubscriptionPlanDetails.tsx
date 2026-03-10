import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Crown, Check, X, Briefcase, Users, Eye, FileText, Star, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SubscriptionPlanDetailsProps {
  companyId: string | null;
}

interface Limits {
  max_internships: number;
  max_active_internships: number;
  max_applications_per_internship: number;
  can_post_paid_internships: boolean;
  can_post_free_internships: boolean;
  can_view_student_contact: boolean;
  can_view_resumes: boolean;
  can_feature_listings: boolean;
  notes: string | null;
}

interface UsageStats {
  totalInternships: number;
  activeInternships: number;
}

export const SubscriptionPlanDetails = ({ companyId }: SubscriptionPlanDetailsProps) => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<Limits | null>(null);
  const [usage, setUsage] = useState<UsageStats>({ totalInternships: 0, activeInternships: 0 });
  const [subscription, setSubscription] = useState<{ type: string; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId && user) fetchData();
  }, [companyId, user]);

  const fetchData = async () => {
    try {
      const [limitsRes, internshipsRes, subRes] = await Promise.all([
        supabase.from('company_limits').select('*').eq('company_id', companyId!).single(),
        supabase.from('internships').select('id, is_active').eq('company_id', companyId!),
        supabase.from('subscriptions').select('type, created_at').eq('user_id', user!.id).maybeSingle(),
      ]);

      if (limitsRes.data) setLimits(limitsRes.data);
      setSubscription(subRes.data);

      const internships = internshipsRes.data || [];
      setUsage({
        totalInternships: internships.length,
        activeInternships: internships.filter(i => i.is_active).length,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const planName = subscription?.type || 'Standard';

  const features = [
    { label: 'Post Free Internships', enabled: limits?.can_post_free_internships ?? true, icon: Briefcase },
    { label: 'Post Paid Internships', enabled: limits?.can_post_paid_internships ?? true, icon: Briefcase },
    { label: 'View Student Contact Info', enabled: limits?.can_view_student_contact ?? true, icon: Users },
    { label: 'View Resumes', enabled: limits?.can_view_resumes ?? true, icon: FileText },
    { label: 'Feature Listings', enabled: limits?.can_feature_listings ?? false, icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription & Plan Details</h2>
        <p className="text-muted-foreground">View your current plan, usage limits, and features</p>
      </div>

      {/* Plan Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {planName} Plan
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-0 capitalize">{planName}</Badge>
          </div>
          {subscription && (
            <CardDescription>
              Member since {format(new Date(subscription.created_at), 'MMM dd, yyyy')}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageCard
              label="Total Internships"
              used={usage.totalInternships}
              max={limits?.max_internships ?? 5}
              icon={Briefcase}
            />
            <UsageCard
              label="Active Listings"
              used={usage.activeInternships}
              max={limits?.max_active_internships ?? 3}
              icon={Eye}
            />
            <UsageCard
              label="Max Apps / Internship"
              used={null}
              max={limits?.max_applications_per_internship ?? 100}
              icon={Users}
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Plan Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {features.map(feature => (
              <div key={feature.label} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <feature.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
                {feature.enabled ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Check className="h-3 w-3 mr-1" /> Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground">
                    <X className="h-3 w-3 mr-1" /> Not Available
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {limits?.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{limits.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const UsageCard = ({ label, used, max, icon: Icon }: { label: string; used: number | null; max: number; icon: any }) => {
  const percentage = used !== null ? Math.min((used / max) * 100, 100) : null;
  const isNearLimit = percentage !== null && percentage >= 80;

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        {used !== null ? (
          <>
            <p className={cn("text-2xl font-bold", isNearLimit ? "text-amber-600" : "text-foreground")}>
              {used}<span className="text-sm font-normal text-muted-foreground">/{max}</span>
            </p>
            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", isNearLimit ? "bg-amber-500" : "bg-primary")}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-2xl font-bold">{max}</p>
        )}
      </CardContent>
    </Card>
  );
};
