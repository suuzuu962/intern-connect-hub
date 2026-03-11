import { useState } from 'react';
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
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, Key, Plus, RefreshCw, Trash2, Webhook, Globe, Shield, Activity, Clock } from 'lucide-react';

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
  { id: '3', name: 'Webhook Service', key: 'el_live_sk_...4d1e', scope: 'write', isActive: false, createdAt: '2025-12-20', lastUsed: '2026-02-15', rateLimit: 200, requestCount: 3400 },
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">API Integration</h2>
        <p className="text-muted-foreground">Manage API keys, webhooks, and third-party integrations</p>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Keys', value: apiKeys.filter(k => k.isActive).length, icon: Key, color: 'text-primary' },
          { label: 'Total Requests (30d)', value: apiKeys.reduce((s, k) => s + k.requestCount, 0).toLocaleString(), icon: Activity, color: 'text-emerald-600' },
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

      {/* API Keys */}
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

      {/* Webhooks */}
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
    </div>
  );
};
