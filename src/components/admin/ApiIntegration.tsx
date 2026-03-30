import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Copy, Eye, EyeOff, Key, Plus, RefreshCw, Trash2, Webhook, Globe, Shield,
  Activity, Clock, Play, Download, Send, FileBarChart, FileText,
  Smartphone, Mail, CheckCircle2, XCircle, Loader2
} from 'lucide-react';

interface ApiEndpoint {
  name: string;
  function: string;
  method: string;
  description: string;
  category: string;
  params: { name: string; type: string; required: boolean; description: string }[];
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    name: 'Send Notification',
    function: 'send-notification',
    method: 'POST',
    description: 'Send in-app/SMS notifications to users by role or user IDs',
    category: 'notifications',
    params: [
      { name: 'title', type: 'string', required: true, description: 'Notification title' },
      { name: 'message', type: 'string', required: true, description: 'Notification message body' },
      { name: 'targetRole', type: 'string', required: false, description: 'Target role (student, company, university)' },
      { name: 'channel', type: 'string', required: false, description: 'Channel: in_app, sms, or all' },
      { name: 'type', type: 'string', required: false, description: 'Notification type' },
    ],
  },
  {
    name: 'Generate Report',
    function: 'generate-report',
    method: 'POST',
    description: 'Generate analytics reports in JSON or CSV format',
    category: 'reports',
    params: [
      { name: 'reportType', type: 'string', required: true, description: 'platform_overview, application_analytics, company_performance, student_engagement' },
      { name: 'format', type: 'string', required: false, description: 'json (default) or csv' },
      { name: 'dateFrom', type: 'string', required: false, description: 'Start date (YYYY-MM-DD)' },
      { name: 'dateTo', type: 'string', required: false, description: 'End date (YYYY-MM-DD)' },
    ],
  },
  {
    name: 'Bulk Export',
    function: 'bulk-export',
    method: 'POST',
    description: 'Export entity data as CSV or JSON',
    category: 'export',
    params: [
      { name: 'entity', type: 'string', required: true, description: 'students, companies, internships, applications, universities, colleges' },
      { name: 'format', type: 'string', required: false, description: 'csv (default) or json' },
    ],
  },
];

interface ApiKey {
  id: string;
  name: string;
  key: string;
  scope: 'read' | 'write' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastUsed: string | null;
  rateLimit: number;
  requestCount: number;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
  lastTriggered: string | null;
  failureCount: number;
}

const WEBHOOK_EVENTS = [
  'user.created', 'user.deleted', 'user.updated',
  'company.approved', 'company.rejected',
  'internship.created', 'internship.closed',
  'application.submitted', 'application.status_changed',
];

const MOCK_API_KEYS: ApiKey[] = [
  { id: '1', name: 'Production API', key: 'el_live_sk_...7f3a', scope: 'admin', isActive: true, createdAt: '2026-01-15', lastUsed: '2026-03-11', rateLimit: 1000, requestCount: 45230 },
  { id: '2', name: 'Analytics Read', key: 'el_live_sk_...9b2c', scope: 'read', isActive: true, createdAt: '2026-02-01', lastUsed: '2026-03-10', rateLimit: 500, requestCount: 12050 },
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
  { id: '1', name: 'CRM Sync', url: 'https://crm.example.com/webhook', events: ['user.created', 'company.approved'], isActive: true, secret: 'whsec_...x3f2', createdAt: '2026-01-10', lastTriggered: '2026-03-11', failureCount: 0 },
  { id: '2', name: 'Slack Notifications', url: 'https://hooks.slack.com/services/...', events: ['application.submitted', 'company.approved'], isActive: true, secret: 'whsec_...k9m1', createdAt: '2026-02-05', lastTriggered: '2026-03-10', failureCount: 2 },
];

export const ApiIntegration = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(MOCK_WEBHOOKS);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'read' | 'write' | 'admin'>('read');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(500);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);

  // API Tester state
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ status: number; data: any; time: number } | null>(null);
  const [activeTab, setActiveTab] = useState('endpoints');

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateKey = () => {
    if (!newKeyName) return;
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName,
      key: `el_live_sk_${crypto.randomUUID().slice(0, 8)}`,
      scope: newKeyScope,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: null,
      rateLimit: newKeyRateLimit,
      requestCount: 0,
    };
    setApiKeys(prev => [...prev, newKey]);
    setNewKeyName('');
    setShowCreateKey(false);
    toast.success('API key created successfully');
  };

  const handleCreateWebhook = () => {
    if (!newWebhookName || !newWebhookUrl || newWebhookEvents.length === 0) return;
    const wh: WebhookConfig = {
      id: crypto.randomUUID(),
      name: newWebhookName,
      url: newWebhookUrl,
      events: newWebhookEvents,
      isActive: true,
      secret: `whsec_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastTriggered: null,
      failureCount: 0,
    };
    setWebhooks(prev => [...prev, wh]);
    setNewWebhookName('');
    setNewWebhookUrl('');
    setNewWebhookEvents([]);
    setShowCreateWebhook(false);
    toast.success('Webhook created successfully');
  };

  const toggleWebhookEvent = (event: string) => {
    setNewWebhookEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const scopeColor = (scope: string) => {
    switch (scope) {
      case 'admin': return 'destructive';
      case 'write': return 'default';
      default: return 'secondary';
    }
  };

  const testEndpoint = async (endpoint: ApiEndpoint) => {
    setTestLoading(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const body: Record<string, any> = {};
      for (const param of endpoint.params) {
        if (testParams[param.name]) {
          body[param.name] = testParams[param.name];
        }
      }

      const { data, error } = await supabase.functions.invoke(endpoint.function, { body });
      const elapsed = Date.now() - start;

      if (error) {
        setTestResult({ status: 500, data: { error: error.message }, time: elapsed });
        toast.error(`API call failed: ${error.message}`);
      } else {
        setTestResult({ status: 200, data, time: elapsed });
        toast.success(`API call successful (${elapsed}ms)`);
      }
    } catch (err: any) {
      const elapsed = Date.now() - start;
      setTestResult({ status: 500, data: { error: err.message }, time: elapsed });
      toast.error('API call failed');
    }
    setTestLoading(false);
  };

  const downloadReport = async (reportType: string, format: string) => {
    try {
      toast.info('Generating report...');
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { reportType, format },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report downloaded');
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report downloaded');
      }
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  const bulkExport = async (entity: string, format: string = 'csv') => {
    try {
      toast.info(`Exporting ${entity}...`);
      const { data, error } = await supabase.functions.invoke('bulk-export', {
        body: { entity, format },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(`${entity} exported successfully`);
    } catch (err) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">API Integration</h2>
        <p className="text-muted-foreground">Manage API endpoints, keys, webhooks, and test live functions</p>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Live Endpoints', value: API_ENDPOINTS.length, icon: Globe, color: 'text-primary' },
          { label: 'Active Keys', value: apiKeys.filter(k => k.isActive).length, icon: Key, color: 'text-emerald-600' },
          { label: 'Active Webhooks', value: webhooks.filter(w => w.isActive).length, icon: Webhook, color: 'text-blue-600' },
          { label: 'Webhook Failures', value: webhooks.reduce((s, w) => s + w.failureCount, 0), icon: Shield, color: 'text-destructive' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="tester">API Tester</TabsTrigger>
          <TabsTrigger value="quickactions">Quick Actions</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Live API Endpoints */}
        <TabsContent value="endpoints" className="space-y-4">
          {API_ENDPOINTS.map(ep => (
            <Card key={ep.function}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="font-mono text-xs">{ep.method}</Badge>
                    <CardTitle className="text-base">{ep.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Live
                  </Badge>
                </div>
                <CardDescription>{ep.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-3 py-1.5 rounded-md flex-1 font-mono">
                      POST /functions/v1/{ep.function}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedEndpoint(ep);
                      setTestParams({});
                      setTestResult(null);
                      setActiveTab('tester');
                    }}>
                      <Play className="h-3 w-3 mr-1" /> Test
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Parameters:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ep.params.map(p => (
                        <div key={p.name} className="flex items-center gap-2 text-xs">
                          <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{p.name}</code>
                          <span className="text-muted-foreground">{p.type}</span>
                          {p.required && <Badge variant="destructive" className="text-[9px] px-1 py-0">required</Badge>}
                          <span className="text-muted-foreground truncate">{p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* API Tester */}
        <TabsContent value="tester" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" /> API Tester
              </CardTitle>
              <CardDescription>Test your API endpoints with live data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Endpoint</Label>
                <Select
                  value={selectedEndpoint?.function || ''}
                  onValueChange={v => {
                    const ep = API_ENDPOINTS.find(e => e.function === v);
                    setSelectedEndpoint(ep || null);
                    setTestParams({});
                    setTestResult(null);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Choose an endpoint..." /></SelectTrigger>
                  <SelectContent>
                    {API_ENDPOINTS.map(ep => (
                      <SelectItem key={ep.function} value={ep.function}>{ep.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEndpoint && (
                <>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm font-mono">POST /functions/v1/{selectedEndpoint.function}</code>
                  </div>

                  <div className="space-y-3">
                    <Label>Parameters</Label>
                    {selectedEndpoint.params.map(param => (
                      <div key={param.name} className="flex items-center gap-3">
                        <div className="w-32 shrink-0">
                          <Label className="text-xs flex items-center gap-1">
                            {param.name}
                            {param.required && <span className="text-destructive">*</span>}
                          </Label>
                        </div>
                        <Input
                          placeholder={param.description}
                          value={testParams[param.name] || ''}
                          onChange={e => setTestParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={() => testEndpoint(selectedEndpoint)} disabled={testLoading} className="w-full">
                    {testLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    {testLoading ? 'Sending...' : 'Send Request'}
                  </Button>

                  {testResult && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={testResult.status === 200 ? 'default' : 'destructive'}>
                          {testResult.status === 200 ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {testResult.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{testResult.time}ms</span>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64 font-mono">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions */}
        <TabsContent value="quickactions" className="space-y-4">
          {/* Report Downloads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-primary" /> Generate Reports
              </CardTitle>
              <CardDescription>Download platform reports instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { type: 'platform_overview', label: 'Platform Overview', icon: Activity },
                  { type: 'application_analytics', label: 'Application Analytics', icon: FileBarChart },
                  { type: 'company_performance', label: 'Company Performance', icon: Globe },
                  { type: 'student_engagement', label: 'Student Engagement', icon: Mail },
                ].map(r => (
                  <div key={r.type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <r.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{r.label}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => downloadReport(r.type, 'json')}>
                        JSON
                      </Button>
                      <Button size="sm" onClick={() => downloadReport(r.type, 'csv')}>
                        <Download className="h-3 w-3 mr-1" /> CSV
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bulk Exports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Bulk Data Export
              </CardTitle>
              <CardDescription>Export entity data as CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['students', 'companies', 'internships', 'applications', 'universities', 'colleges'].map(entity => (
                  <Button
                    key={entity}
                    variant="outline"
                    className="justify-start capitalize"
                    onClick={() => bulkExport(entity)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {entity}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API Keys</CardTitle>
                <CardDescription>Create and manage API keys for programmatic access</CardDescription>
              </div>
              <Dialog open={showCreateKey} onOpenChange={setShowCreateKey}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create Key</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>Generate a new API key with specific permissions</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Production API" />
                    </div>
                    <div className="space-y-2">
                      <Label>Scope</Label>
                      <Select value={newKeyScope} onValueChange={v => setNewKeyScope(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read Only</SelectItem>
                          <SelectItem value="write">Read & Write</SelectItem>
                          <SelectItem value="admin">Full Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Rate Limit (requests/min)</Label>
                      <Input type="number" value={newKeyRateLimit} onChange={e => setNewKeyRateLimit(Number(e.target.value))} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateKey(false)}>Cancel</Button>
                    <Button onClick={handleCreateKey} disabled={!newKeyName}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map(key => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {visibleKeys.has(key.id) ? key.key : '••••••••••••'}
                          </code>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleKeyVisibility(key.id)}>
                            {visibleKeys.has(key.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(key.key); toast.success('Copied'); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={scopeColor(key.scope) as any}>{key.scope}</Badge></TableCell>
                      <TableCell>{key.rateLimit}/min</TableCell>
                      <TableCell>{key.requestCount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{key.lastUsed || 'Never'}</TableCell>
                      <TableCell>
                        <Switch checked={key.isActive} onCheckedChange={checked => setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, isActive: checked } : k))} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info('Key rotated')}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setApiKeys(prev => prev.filter(k => k.id !== key.id))}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" /> Webhooks</CardTitle>
                <CardDescription>Configure webhook endpoints for real-time event notifications</CardDescription>
              </div>
              <Dialog open={showCreateWebhook} onOpenChange={setShowCreateWebhook}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Webhook</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Webhook</DialogTitle>
                    <DialogDescription>Set up a new webhook endpoint</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={newWebhookName} onChange={e => setNewWebhookName(e.target.value)} placeholder="e.g. CRM Sync" />
                    </div>
                    <div className="space-y-2">
                      <Label>Endpoint URL</Label>
                      <Input value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Events</Label>
                      <div className="flex flex-wrap gap-2">
                        {WEBHOOK_EVENTS.map(event => (
                          <Badge
                            key={event}
                            variant={newWebhookEvents.includes(event) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleWebhookEvent(event)}
                          >
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateWebhook(false)}>Cancel</Button>
                    <Button onClick={handleCreateWebhook} disabled={!newWebhookName || !newWebhookUrl || newWebhookEvents.length === 0}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Failures</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map(wh => (
                    <TableRow key={wh.id}>
                      <TableCell className="font-medium">{wh.name}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px] block">{wh.url}</code></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {wh.events.slice(0, 2).map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                          {wh.events.length > 2 && <Badge variant="secondary" className="text-xs">+{wh.events.length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{wh.lastTriggered || 'Never'}</TableCell>
                      <TableCell>
                        <Badge variant={wh.failureCount > 0 ? 'destructive' : 'secondary'}>{wh.failureCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={wh.isActive} onCheckedChange={checked => setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, isActive: checked } : w))} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setWebhooks(prev => prev.filter(w => w.id !== wh.id))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
