import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { guestConfig, studentConfig, companyConfig, universityConfig, adminConfig } from '@/components/home/roleHomeContent';
import type { RoleHomeConfig, RoleHeroContent, RoleStat, RoleAdBanner } from '@/components/home/roleHomeContent';
import { Loader2, Save, RotateCcw, Plus, Trash2, Eye } from 'lucide-react';

const ROLES = [
  { key: 'guest', label: 'Guest (Not logged in)' },
  { key: 'student', label: 'Student' },
  { key: 'company', label: 'Company' },
  { key: 'university', label: 'University' },
  { key: 'admin', label: 'Admin' },
] as const;

type RoleKey = typeof ROLES[number]['key'];

const defaultConfigs: Record<RoleKey, RoleHomeConfig> = {
  guest: guestConfig,
  student: studentConfig,
  company: companyConfig,
  university: universityConfig,
  admin: adminConfig,
};

const SETTINGS_KEY = 'landing_page_content';

interface SerializableConfig {
  hero: RoleHeroContent;
  stats: RoleStat[];
  ads: RoleAdBanner[];
  showUniversitySection: boolean;
  showWorkFunnel: boolean;
}

function toSerializable(config: RoleHomeConfig): SerializableConfig {
  return {
    hero: config.hero,
    stats: config.stats,
    ads: config.ads,
    showUniversitySection: config.showUniversitySection,
    showWorkFunnel: config.showWorkFunnel,
  };
}

export const LandingPageContentManager = () => {
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState<RoleKey>('guest');
  const [configs, setConfigs] = useState<Record<RoleKey, SerializableConfig>>(() => {
    const initial: Record<string, SerializableConfig> = {};
    ROLES.forEach(r => { initial[r.key] = toSerializable(defaultConfigs[r.key]); });
    return initial as Record<RoleKey, SerializableConfig>;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
      const saved = data.value as unknown as Record<string, SerializableConfig>;
      setConfigs(prev => {
        const merged: Record<string, SerializableConfig> = { ...prev };
        ROLES.forEach(r => {
          if (saved[r.key]) {
            merged[r.key] = { ...prev[r.key], ...saved[r.key] };
          }
        });
        return merged as Record<RoleKey, SerializableConfig>;
      });
    }
    setLoading(false);
  };

  const saveContent = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from('platform_settings')
      .select('id')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('platform_settings')
        .update({ value: JSON.parse(JSON.stringify(configs)), updated_at: new Date().toISOString() })
        .eq('key', SETTINGS_KEY));
    } else {
      ({ error } = await supabase
        .from('platform_settings')
        .insert([{ key: SETTINGS_KEY, value: JSON.parse(JSON.stringify(configs)) }]));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Landing page content updated successfully.' });
    }
    setSaving(false);
  };

  const resetRole = (role: RoleKey) => {
    setConfigs(prev => ({ ...prev, [role]: toSerializable(defaultConfigs[role]) }));
    toast({ title: 'Reset', description: `${role} content reset to defaults (not saved yet).` });
  };

  const updateHero = (field: keyof RoleHeroContent, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        hero: { ...prev[activeRole].hero, [field]: value },
      },
    }));
  };

  const updateHeroCta = (type: 'primaryCta' | 'secondaryCta', field: 'label' | 'link', value: string) => {
    setConfigs(prev => {
      const current = prev[activeRole];
      if (type === 'secondaryCta') {
        return {
          ...prev,
          [activeRole]: {
            ...current,
            hero: {
              ...current.hero,
              secondaryCta: { ...(current.hero.secondaryCta || { label: '', link: '' }), [field]: value },
            },
          },
        };
      }
      return {
        ...prev,
        [activeRole]: {
          ...current,
          hero: {
            ...current.hero,
            primaryCta: { ...current.hero.primaryCta, [field]: value },
          },
        },
      };
    });
  };

  const updateStat = (index: number, field: keyof RoleStat, value: string) => {
    setConfigs(prev => {
      const stats = [...prev[activeRole].stats];
      stats[index] = { ...stats[index], [field]: value };
      return { ...prev, [activeRole]: { ...prev[activeRole], stats } };
    });
  };

  const updateAd = (index: number, field: keyof RoleAdBanner, value: string) => {
    setConfigs(prev => {
      const ads = [...prev[activeRole].ads];
      ads[index] = { ...ads[index], [field]: value };
      return { ...prev, [activeRole]: { ...prev[activeRole], ads } };
    });
  };

  const addAd = () => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        ads: [...prev[activeRole].ads, { title: 'New Banner', description: 'Description here', ctaLabel: 'Learn More', ctaLink: '/', variant: 'primary' as const }],
      },
    }));
  };

  const removeAd = (index: number) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        ads: prev[activeRole].ads.filter((_, i) => i !== index),
      },
    }));
  };

  const updateToggle = (field: 'showUniversitySection' | 'showWorkFunnel', value: boolean) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], [field]: value },
    }));
  };

  const current = configs[activeRole];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Landing Page Content</h2>
          <p className="text-sm text-muted-foreground">Manage hero sections, stats, and ad banners for each user role.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => resetRole(activeRole)}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={saveContent} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => (
          <Button
            key={r.key}
            variant={activeRole === r.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveRole(r.key)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="ads">Ad Banners</TabsTrigger>
          <TabsTrigger value="sections">Section Toggles</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hero Content</CardTitle>
              <CardDescription>Edit the main headline, description, and call-to-action buttons.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Headline</Label>
                  <Input value={current.hero.headline} onChange={e => updateHero('headline', e.target.value)} />
                </div>
                <div>
                  <Label>Highlighted Text</Label>
                  <Input value={current.hero.highlightedText} onChange={e => updateHero('highlightedText', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={current.hero.description} onChange={e => updateHero('description', e.target.value)} rows={3} />
              </div>

              <Separator />
              <p className="text-sm font-medium">Primary CTA</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Button Label</Label>
                  <Input value={current.hero.primaryCta.label} onChange={e => updateHeroCta('primaryCta', 'label', e.target.value)} />
                </div>
                <div>
                  <Label>Button Link</Label>
                  <Input value={current.hero.primaryCta.link} onChange={e => updateHeroCta('primaryCta', 'link', e.target.value)} />
                </div>
              </div>

              <p className="text-sm font-medium">Secondary CTA (optional)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Button Label</Label>
                  <Input
                    value={current.hero.secondaryCta?.label || ''}
                    onChange={e => updateHeroCta('secondaryCta', 'label', e.target.value)}
                    placeholder="Leave empty to hide"
                  />
                </div>
                <div>
                  <Label>Button Link</Label>
                  <Input
                    value={current.hero.secondaryCta?.link || ''}
                    onChange={e => updateHeroCta('secondaryCta', 'link', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
              <CardDescription>Edit the 4 stat cards shown on the home page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {current.stats.map((stat, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg bg-muted/30">
                  <div>
                    <Label>Value (e.g. "500+")</Label>
                    <Input value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)} />
                  </div>
                  <div>
                    <Label>Label</Label>
                    <Input value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ads */}
        <TabsContent value="ads">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Ad Banners</CardTitle>
                  <CardDescription>Promotional banners shown to this role on the home page.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={addAd}>
                  <Plus className="h-4 w-4 mr-1" /> Add Banner
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {current.ads.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No ad banners for this role.</p>
              )}
              {current.ads.map((ad, i) => (
                <div key={i} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Banner {i + 1}</Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeAd(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={ad.title} onChange={e => updateAd(i, 'title', e.target.value)} />
                    </div>
                    <div>
                      <Label>Variant</Label>
                      <Select value={ad.variant} onValueChange={v => updateAd(i, 'variant', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="accent">Accent</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={ad.description} onChange={e => updateAd(i, 'description', e.target.value)} rows={2} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>CTA Label</Label>
                      <Input value={ad.ctaLabel} onChange={e => updateAd(i, 'ctaLabel', e.target.value)} />
                    </div>
                    <div>
                      <Label>CTA Link</Label>
                      <Input value={ad.ctaLink} onChange={e => updateAd(i, 'ctaLink', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section Toggles */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Section Visibility</CardTitle>
              <CardDescription>Toggle which sections appear on the home page for this role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">University & College Section</p>
                  <p className="text-xs text-muted-foreground">Show the "For Universities & Colleges" feature cards</p>
                </div>
                <Switch checked={current.showUniversitySection} onCheckedChange={v => updateToggle('showUniversitySection', v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Work Funnel Section</p>
                  <p className="text-xs text-muted-foreground">Show the work funnel visualization</p>
                </div>
                <Switch checked={current.showWorkFunnel} onCheckedChange={v => updateToggle('showWorkFunnel', v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
