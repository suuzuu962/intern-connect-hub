import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plug, BarChart3, CreditCard, Mail, Smartphone, BookOpen, Bot, FileSearch,
  CalendarCheck, MailPlus, TrendingUp, FileBarChart, FileText, Webhook,
  Settings, Shield, ToggleLeft, Package, Activity, Eye, Pencil, Trash2,
  Plus, Search, RefreshCw, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Plugin = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  icon: string;
  is_enabled: boolean;
  is_installed: boolean;
  version: string | null;
  config: Record<string, any>;
  allowed_roles: string[];
  webhook_url: string | null;
  webhook_events: string[];
  api_key_name: string | null;
  created_at: string;
  updated_at: string;
};

type UsageLog = {
  id: string;
  plugin_id: string;
  action: string;
  user_id: string | null;
  details: Record<string, any>;
  created_at: string;
};

type WebhookDeliveryLog = {
  id: string;
  plugin_id: string;
  event_type: string;
  webhook_url: string;
  request_payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
};

const iconMap: Record<string, React.ReactNode> = {
  'bar-chart': <BarChart3 className="h-5 w-5" />,
  'credit-card': <CreditCard className="h-5 w-5" />,
  'mail': <Mail className="h-5 w-5" />,
  'smartphone': <Smartphone className="h-5 w-5" />,
  'book-open': <BookOpen className="h-5 w-5" />,
  'bot': <Bot className="h-5 w-5" />,
  'file-search': <FileSearch className="h-5 w-5" />,
  'calendar-check': <CalendarCheck className="h-5 w-5" />,
  'mail-plus': <MailPlus className="h-5 w-5" />,
  'trending-up': <TrendingUp className="h-5 w-5" />,
  'file-bar-chart': <FileBarChart className="h-5 w-5" />,
  'file-text': <FileText className="h-5 w-5" />,
  'webhook': <Webhook className="h-5 w-5" />,
  'plug': <Plug className="h-5 w-5" />,
};

const categoryConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  integration: { label: 'Integration', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Plug className="h-4 w-4" /> },
  feature_toggle: { label: 'Feature Toggle', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <ToggleLeft className="h-4 w-4" /> },
  addon: { label: 'Add-on', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <Package className="h-4 w-4" /> },
  webhook: { label: 'Webhook', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Webhook className="h-4 w-4" /> },
};

const ALL_ROLES = ['admin', 'student', 'company', 'university', 'college_coordinator'];

export const PluginManagement = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [configDialog, setConfigDialog] = useState(false);
  const [editConfig, setEditConfig] = useState<Record<string, any>>({});
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editWebhookUrl, setEditWebhookUrl] = useState('');
  const [addDialog, setAddDialog] = useState(false);
  const [newPlugin, setNewPlugin] = useState({ name: '', slug: '', description: '', category: 'integration', webhook_url: '' });
  const [saving, setSaving] = useState(false);

  const fetchPlugins = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plugins')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (error) {
      toast({ title: 'Error loading plugins', description: error.message, variant: 'destructive' });
    } else {
      setPlugins((data || []) as unknown as Plugin[]);
    }
    setLoading(false);
  };

  const fetchUsageLogs = async () => {
    const { data } = await supabase
      .from('plugin_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setUsageLogs((data || []) as unknown as UsageLog[]);
  };

  useEffect(() => { fetchPlugins(); fetchUsageLogs(); }, []);

  const togglePlugin = async (plugin: Plugin) => {
    const newState = !plugin.is_enabled;
    const { error } = await supabase.from('plugins').update({ is_enabled: newState }).eq('id', plugin.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    // Log the action
    await supabase.from('plugin_usage_logs').insert({
      plugin_id: plugin.id,
      action: newState ? 'enabled' : 'disabled',
      user_id: (await supabase.auth.getUser()).data.user?.id,
      details: { plugin_name: plugin.name },
    });
    toast({ title: `${plugin.name} ${newState ? 'enabled' : 'disabled'}` });
    fetchPlugins();
    fetchUsageLogs();
  };

  const openConfigDialog = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setEditConfig(plugin.config || {});
    setEditRoles(plugin.allowed_roles || []);
    setEditWebhookUrl(plugin.webhook_url || '');
    setConfigDialog(true);
  };

  const saveConfig = async () => {
    if (!selectedPlugin) return;
    setSaving(true);
    const updates: any = { config: editConfig, allowed_roles: editRoles };
    if (selectedPlugin.category === 'webhook') {
      updates.webhook_url = editWebhookUrl;
    }
    const { error } = await supabase.from('plugins').update(updates).eq('id', selectedPlugin.id);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      await supabase.from('plugin_usage_logs').insert({
        plugin_id: selectedPlugin.id,
        action: 'config_updated',
        user_id: (await supabase.auth.getUser()).data.user?.id,
        details: { changes: updates },
      });
      toast({ title: 'Configuration saved' });
      setConfigDialog(false);
      fetchPlugins();
      fetchUsageLogs();
    }
    setSaving(false);
  };

  const deletePlugin = async (plugin: Plugin) => {
    if (!confirm(`Delete plugin "${plugin.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('plugins').delete().eq('id', plugin.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${plugin.name} deleted` });
      fetchPlugins();
    }
  };

  const addNewPlugin = async () => {
    if (!newPlugin.name || !newPlugin.slug) {
      toast({ title: 'Name and slug are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const insertData: any = {
      name: newPlugin.name,
      slug: newPlugin.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: newPlugin.description,
      category: newPlugin.category,
      allowed_roles: ['admin'],
    };
    if (newPlugin.category === 'webhook') {
      insertData.webhook_url = newPlugin.webhook_url;
      insertData.icon = 'webhook';
    }
    const { error } = await supabase.from('plugins').insert(insertData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Plugin added' });
      setAddDialog(false);
      setNewPlugin({ name: '', slug: '', description: '', category: 'integration', webhook_url: '' });
      fetchPlugins();
    }
    setSaving(false);
  };

  const filtered = plugins.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || p.category === activeTab;
    return matchSearch && matchTab;
  });

  const stats = {
    total: plugins.length,
    enabled: plugins.filter(p => p.is_enabled).length,
    integrations: plugins.filter(p => p.category === 'integration').length,
    webhooks: plugins.filter(p => p.category === 'webhook').length,
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Plug className="h-6 w-6 text-primary" /> Plugin Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage integrations, feature toggles, add-ons, and webhooks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchPlugins(); fetchUsageLogs(); }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Plugin
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Plugins', value: stats.total, icon: <Package className="h-5 w-5 text-primary" /> },
          { label: 'Active', value: stats.enabled, icon: <Activity className="h-5 w-5 text-emerald-500" /> },
          { label: 'Integrations', value: stats.integrations, icon: <Plug className="h-5 w-5 text-blue-500" /> },
          { label: 'Webhooks', value: stats.webhooks, icon: <Webhook className="h-5 w-5 text-amber-500" /> },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search plugins..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="integration">Integrations</TabsTrigger>
          <TabsTrigger value="feature_toggle">Features</TabsTrigger>
          <TabsTrigger value="addon">Add-ons</TabsTrigger>
          <TabsTrigger value="webhook">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Plugin Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map(plugin => {
                const cat = categoryConfig[plugin.category] || categoryConfig.integration;
                return (
                  <motion.div
                    key={plugin.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`transition-all border ${plugin.is_enabled ? 'border-primary/30 shadow-sm' : 'border-border opacity-80'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${plugin.is_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {iconMap[plugin.icon] || <Plug className="h-5 w-5" />}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold">{plugin.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cat.color}`}>
                                  {cat.label}
                                </Badge>
                                {plugin.version && (
                                  <span className="text-[10px] text-muted-foreground">v{plugin.version}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={plugin.is_enabled}
                            onCheckedChange={() => togglePlugin(plugin)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {plugin.description}
                        </p>

                        {/* Allowed Roles */}
                        <div className="flex flex-wrap gap-1">
                          {(plugin.allowed_roles || []).map(role => (
                            <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">
                              <Shield className="h-2.5 w-2.5 mr-0.5" />
                              {role}
                            </Badge>
                          ))}
                        </div>

                        {/* Webhook URL preview */}
                        {plugin.category === 'webhook' && plugin.webhook_url && (
                          <div className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1 truncate font-mono">
                            {plugin.webhook_url}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => openConfigDialog(plugin)}>
                            <Settings className="h-3 w-3 mr-1" /> Configure
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deletePlugin(plugin)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No plugins found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Usage Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Plugin Activity Log
          </CardTitle>
          <CardDescription>Recent plugin configuration changes and toggle actions</CardDescription>
        </CardHeader>
        <CardContent>
          {usageLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity logged yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {usageLogs.slice(0, 20).map(log => {
                const plugin = plugins.find(p => p.id === log.plugin_id);
                return (
                  <div key={log.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30 text-xs">
                    <div className={`w-2 h-2 rounded-full ${log.action === 'enabled' ? 'bg-emerald-500' : log.action === 'disabled' ? 'bg-red-400' : 'bg-blue-400'}`} />
                    <span className="font-medium text-foreground">{plugin?.name || 'Unknown'}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{log.action}</Badge>
                    <span className="ml-auto text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configure Dialog */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configure: {selectedPlugin?.name}
            </DialogTitle>
            <DialogDescription>Update plugin settings, role access, and webhook configuration</DialogDescription>
          </DialogHeader>

          {selectedPlugin && (
            <div className="space-y-5">
              {/* Config Fields */}
              {Object.keys(editConfig).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Settings</h4>
                  {Object.entries(editConfig).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                      {typeof value === 'boolean' ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={value}
                            onCheckedChange={v => setEditConfig(prev => ({ ...prev, [key]: v }))}
                          />
                          <span className="text-xs text-muted-foreground">{value ? 'On' : 'Off'}</span>
                        </div>
                      ) : typeof value === 'object' && Array.isArray(value) ? (
                        <Input
                          value={(value as string[]).join(', ')}
                          onChange={e => setEditConfig(prev => ({ ...prev, [key]: e.target.value.split(',').map(s => s.trim()) }))}
                          placeholder="Comma-separated values"
                        />
                      ) : (
                        <Input
                          value={String(value)}
                          onChange={e => setEditConfig(prev => ({ ...prev, [key]: e.target.value }))}
                          type={key.includes('key') || key.includes('token') || key.includes('secret') ? 'password' : 'text'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Webhook URL */}
              {selectedPlugin.category === 'webhook' && (
                <div className="space-y-1">
                  <Label className="text-xs">Webhook URL</Label>
                  <Input
                    value={editWebhookUrl}
                    onChange={e => setEditWebhookUrl(e.target.value)}
                    placeholder="https://your-server.com/webhook"
                  />
                  {selectedPlugin.webhook_events?.length > 0 && (
                    <div className="mt-2">
                      <Label className="text-xs">Triggered Events</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPlugin.webhook_events.map(evt => (
                          <Badge key={evt} variant="outline" className="text-[10px]">{evt}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role Access */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Role Access</h4>
                <p className="text-xs text-muted-foreground">Select which roles can use this plugin</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map(role => (
                    <label key={role} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-md hover:bg-muted/50">
                      <Checkbox
                        checked={editRoles.includes(role)}
                        onCheckedChange={checked => {
                          setEditRoles(prev =>
                            checked ? [...prev, role] : prev.filter(r => r !== role)
                          );
                        }}
                      />
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(false)}>Cancel</Button>
            <Button onClick={saveConfig} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Plugin Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Add New Plugin
            </DialogTitle>
            <DialogDescription>Create a custom plugin for your platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={newPlugin.name} onChange={e => setNewPlugin(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} placeholder="My Plugin" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Slug</Label>
              <Input value={newPlugin.slug} onChange={e => setNewPlugin(p => ({ ...p, slug: e.target.value }))} placeholder="my-plugin" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={newPlugin.description} onChange={e => setNewPlugin(p => ({ ...p, description: e.target.value }))} placeholder="What does this plugin do?" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={newPlugin.category} onValueChange={v => setNewPlugin(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="feature_toggle">Feature Toggle</SelectItem>
                  <SelectItem value="addon">Add-on</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newPlugin.category === 'webhook' && (
              <div className="space-y-1">
                <Label className="text-xs">Webhook URL</Label>
                <Input value={newPlugin.webhook_url} onChange={e => setNewPlugin(p => ({ ...p, webhook_url: e.target.value }))} placeholder="https://..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={addNewPlugin} disabled={saving}>
              {saving ? 'Adding...' : 'Add Plugin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
