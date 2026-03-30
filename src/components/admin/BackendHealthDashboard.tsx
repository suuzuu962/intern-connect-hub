import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  RefreshCw, Activity, Database, Server, HardDrive,
  Puzzle, Shield, Clock, Users, Bell, FileText, CheckCircle2,
  AlertTriangle, Loader2, Zap, BarChart3
} from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  responseTimeMs: number;
  database: {
    status: string;
    tableCounts: Record<string, number>;
    totalRecords: number;
  };
  edgeFunctions: {
    total: number;
    deployed: number;
    functions: { name: string; status: string; url: string }[];
  };
  activity: {
    loginsLast24h: number;
    applicationsLast24h: number;
    unreadNotifications: number;
  };
  storage: {
    buckets: { name: string; isPublic: boolean }[];
    totalBuckets: number;
  };
  plugins: {
    total: number;
    enabled: number;
    disabled: number;
    list: { name: string; slug: string; is_enabled: boolean; category: string }[];
  };
  auth: {
    rolesConfigured: string[];
  };
}

export const BackendHealthDashboard = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      if (error) throw error;
      setHealth(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      toast.error('Failed to fetch health data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-3" />
          <p className="text-muted-foreground">Unable to reach backend. Please try again.</p>
          <Button onClick={fetchHealth} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isHealthy = health.status === 'healthy';
  const topTables = Object.entries(health.database.tableCounts)
    .sort(([, a], [, b]) => b - a);
  const maxCount = Math.max(...Object.values(health.database.tableCounts), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Backend Health</h2>
          <p className="text-sm text-muted-foreground">
            Real-time status of all backend services
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchHealth} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={isHealthy ? 'border-green-500/30 bg-green-50/30 dark:bg-green-950/10' : 'border-destructive/30 bg-destructive/5'}>
        <CardContent className="flex items-center gap-4 py-4">
          {isHealthy ? (
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-destructive shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-lg">
              {isHealthy ? 'All Systems Operational' : 'Issues Detected'}
            </p>
            <p className="text-sm text-muted-foreground">
              Response time: {health.responseTimeMs}ms · Checked at {new Date(health.timestamp).toLocaleString()}
            </p>
          </div>
          <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-sm">
            {health.status.toUpperCase()}
          </Badge>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{health.database.totalRecords.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{health.edgeFunctions.deployed}</p>
                <p className="text-xs text-muted-foreground">Edge Functions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{health.activity.loginsLast24h}</p>
                <p className="text-xs text-muted-foreground">Logins (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Puzzle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{health.plugins.enabled}/{health.plugins.total}</p>
                <p className="text-xs text-muted-foreground">Plugins Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Tables */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" /> Database Tables
            </CardTitle>
            <CardDescription>{Object.keys(health.database.tableCounts).length} tables tracked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTables.map(([table, count]) => (
              <div key={table} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">{table}</span>
                  <span className="text-muted-foreground font-medium">{count.toLocaleString()}</span>
                </div>
                <Progress value={(count / maxCount) * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Edge Functions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" /> Edge Functions
            </CardTitle>
            <CardDescription>{health.edgeFunctions.deployed} deployed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.edgeFunctions.functions.map((fn) => (
                <div key={fn.name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-mono text-xs">{fn.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {fn.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent Activity (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">User Logins</span>
              </div>
              <span className="font-bold">{health.activity.loginsLast24h}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">New Applications</span>
              </div>
              <span className="font-bold">{health.activity.applicationsLast24h}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Unread Notifications</span>
              </div>
              <span className="font-bold">{health.activity.unreadNotifications}</span>
            </div>
          </CardContent>
        </Card>

        {/* Storage & Auth */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-4 w-4" /> Storage & Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Storage Buckets</p>
              <div className="grid grid-cols-2 gap-2">
                {health.storage.buckets.map((bucket) => (
                  <div key={bucket.name} className="flex items-center justify-between border rounded-md px-3 py-2">
                    <span className="text-xs font-mono">{bucket.name}</span>
                    <Badge variant={bucket.isPublic ? 'secondary' : 'outline'} className="text-[10px]">
                      {bucket.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Auth Roles</p>
              <div className="flex flex-wrap gap-1.5">
                {health.auth.rolesConfigured.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
