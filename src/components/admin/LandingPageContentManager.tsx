import { useState, useEffect, useRef } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { guestConfig, studentConfig, companyConfig, universityConfig, adminConfig } from '@/components/home/roleHomeContent';
import type { RoleHomeConfig, RoleHeroContent, RoleStat, RoleAdBanner } from '@/components/home/roleHomeContent';
import { Loader2, Save, RotateCcw, Plus, Trash2, Eye, Upload, X, Image as ImageIcon, ArrowRight, GripVertical, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { SECTION_TEMPLATES, type CustomSectionData, type CustomSectionType, type CustomSectionItem } from '@/components/home/CustomSection';

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

export interface ExternalLink {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  openInNewTab: boolean;
  enabled: boolean;
}

interface SerializableConfig {
  hero: RoleHeroContent;
  stats: RoleStat[];
  ads: RoleAdBanner[];
  showUniversitySection: boolean;
  showWorkFunnel: boolean;
  customSections: CustomSectionData[];
  externalLinks: ExternalLink[];
}

function toSerializable(config: RoleHomeConfig): SerializableConfig {
  return {
    hero: config.hero,
    stats: config.stats,
    ads: config.ads,
    showUniversitySection: config.showUniversitySection,
    showWorkFunnel: config.showWorkFunnel,
    customSections: [],
    externalLinks: [],
  };
}

// ── Image Upload Helper ──
async function uploadImage(file: File, path: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${path}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('public-assets').upload(fileName, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('public-assets').getPublicUrl(fileName);
  return data.publicUrl;
}

async function deleteImage(url: string) {
  const match = url.match(/public-assets\/(.+)$/);
  if (match) {
    await supabase.storage.from('public-assets').remove([match[1]]);
  }
}

// ── Image Upload Button ──
function ImageUploadField({
  label,
  value,
  onChange,
  onRemove,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, 'landing-page');
    if (url) onChange(url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div className="mt-1 relative group rounded-lg overflow-hidden border bg-muted/30">
          <img src={value} alt="" className="w-full h-32 object-cover" />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-1 w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-xs">Upload image</span>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Preview Panel ──
const variantStyles: Record<RoleAdBanner['variant'], string> = {
  primary: 'bg-primary/5 border-primary/20',
  accent: 'bg-accent border-accent-foreground/10',
  success: 'bg-[hsl(142,71%,45%)]/5 border-[hsl(142,71%,45%)]/20',
  warning: 'bg-[hsl(38,92%,50%)]/5 border-[hsl(38,92%,50%)]/20',
};

function LandingPreview({ config, role }: { config: SerializableConfig; role: string }) {
  return (
    <div className="space-y-6 text-sm">
      {/* Hero Preview */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        {config.hero.imageUrl && (
          <img src={config.hero.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <div className="relative text-center max-w-md mx-auto">
          <h2 className="text-xl font-heading font-bold mb-2">
            {config.hero.headline}{' '}
            <span className="gradient-text">{config.hero.highlightedText}</span>
          </h2>
          <p className="text-xs text-muted-foreground mb-3">{config.hero.description}</p>
          <div className="flex gap-2 justify-center">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium">
              {config.hero.primaryCta.label} <ArrowRight className="h-3 w-3" />
            </span>
            {config.hero.secondaryCta?.label && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-medium">
                {config.hero.secondaryCta.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-4 gap-2">
        {config.stats.map((stat, i) => (
          <div key={i} className="text-center p-2 rounded-lg bg-card border">
            <div className="text-sm font-bold gradient-text">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Ad Banners Preview */}
      {config.ads.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ad Banners</p>
          {config.ads.map((ad, i) => (
            <div key={i} className={`rounded-lg border p-3 ${variantStyles[ad.variant]}`}>
              <div className="flex gap-3">
                {ad.imageUrl && (
                  <img src={ad.imageUrl} alt="" className="w-16 h-12 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs">{ad.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{ad.description}</p>
                </div>
                <span className="text-[10px] text-primary font-medium shrink-0">{ad.ctaLabel} →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Sections Preview */}
      {config.customSections?.filter(s => s.enabled).map((s, i) => (
        <div key={i} className="rounded-lg border p-3 bg-card">
          <div className="flex items-center gap-2 mb-1">
            {(() => { const T = SECTION_TEMPLATES.find(t => t.type === s.type); return T ? <T.icon className="h-3 w-3 text-muted-foreground" /> : null; })()}
            <p className="font-semibold text-xs">{s.title}</p>
            <Badge variant="outline" className="ml-auto text-[8px]">{s.type.replace('_', ' ')}</Badge>
          </div>
          {s.subtitle && <p className="text-[10px] text-muted-foreground">{s.subtitle}</p>}
          <p className="text-[10px] text-muted-foreground mt-1">{s.items.length} item(s)</p>
        </div>
      ))}

      {/* Section indicators */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={config.showWorkFunnel ? 'default' : 'secondary'} className="text-[10px]">
          Work Funnel: {config.showWorkFunnel ? 'ON' : 'OFF'}
        </Badge>
        <Badge variant={config.showUniversitySection ? 'default' : 'secondary'} className="text-[10px]">
          University Section: {config.showUniversitySection ? 'ON' : 'OFF'}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {config.customSections?.filter(s => s.enabled).length || 0} custom section(s)
        </Badge>
      </div>
    </div>
  );
}

// ── Main Component ──
export const LandingPageContentManager = () => {
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState<RoleKey>('guest');
  const [showPreview, setShowPreview] = useState(false);
  const [configs, setConfigs] = useState<Record<RoleKey, SerializableConfig>>(() => {
    const initial: Record<string, SerializableConfig> = {};
    ROLES.forEach(r => { initial[r.key] = toSerializable(defaultConfigs[r.key]); });
    return initial as Record<RoleKey, SerializableConfig>;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadContent(); }, []);

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
          if (saved[r.key]) merged[r.key] = { ...prev[r.key], ...saved[r.key] };
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

  const updateHeroImage = (url: string) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        hero: { ...prev[activeRole].hero, imageUrl: url },
      },
    }));
  };

  const removeHeroImage = async () => {
    const url = configs[activeRole].hero.imageUrl;
    if (url) await deleteImage(url);
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        hero: { ...prev[activeRole].hero, imageUrl: undefined },
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
          hero: { ...current.hero, primaryCta: { ...current.hero.primaryCta, [field]: value } },
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

  const updateAdImage = (index: number, url: string) => {
    setConfigs(prev => {
      const ads = [...prev[activeRole].ads];
      ads[index] = { ...ads[index], imageUrl: url };
      return { ...prev, [activeRole]: { ...prev[activeRole], ads } };
    });
  };

  const removeAdImage = async (index: number) => {
    const url = configs[activeRole].ads[index]?.imageUrl;
    if (url) await deleteImage(url);
    setConfigs(prev => {
      const ads = [...prev[activeRole].ads];
      ads[index] = { ...ads[index], imageUrl: undefined };
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

  const removeAd = async (index: number) => {
    const url = configs[activeRole].ads[index]?.imageUrl;
    if (url) await deleteImage(url);
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

  // ── Custom Sections ──
  const [showAddSection, setShowAddSection] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const addCustomSection = (type: CustomSectionType) => {
    const template = SECTION_TEMPLATES.find(t => t.type === type)!;
    const newSection: CustomSectionData = {
      id: `${type}_${Date.now()}`,
      type,
      title: template.label,
      subtitle: template.description,
      items: [...template.defaultItems],
      bgStyle: 'default',
      enabled: true,
    };
    if (type === 'cta_banner') {
      newSection.ctaLabel = 'Get Started';
      newSection.ctaLink = '/auth';
    }
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        customSections: [...(prev[activeRole].customSections || []), newSection],
      },
    }));
    setShowAddSection(false);
    setExpandedSection(newSection.id);
  };

  const removeCustomSection = (id: string) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        customSections: (prev[activeRole].customSections || []).filter(s => s.id !== id),
      },
    }));
  };

  const updateCustomSection = (id: string, updates: Partial<CustomSectionData>) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        customSections: (prev[activeRole].customSections || []).map(s =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    }));
  };

  const updateSectionItem = (sectionId: string, itemIndex: number, updates: Partial<CustomSectionItem>) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        customSections: (prev[activeRole].customSections || []).map(s => {
          if (s.id !== sectionId) return s;
          const items = [...s.items];
          items[itemIndex] = { ...items[itemIndex], ...updates };
          return { ...s, items };
        }),
      },
    }));
  };

  const addSectionItem = (sectionId: string) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        customSections: (prev[activeRole].customSections || []).map(s =>
          s.id === sectionId ? { ...s, items: [...s.items, { title: 'New Item', description: 'Description here' }] } : s
        ),
      },
    }));
  };

  const removeSectionItem = (sectionId: string, itemIndex: number) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        customSections: (prev[activeRole].customSections || []).map(s =>
          s.id === sectionId ? { ...s, items: s.items.filter((_, i) => i !== itemIndex) } : s
        ),
      },
    }));
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    setConfigs(prev => {
      const sections = [...(prev[activeRole].customSections || [])];
      [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
      return { ...prev, [activeRole]: { ...prev[activeRole], customSections: sections } };
    });
  };

  const moveSectionDown = (index: number) => {
    setConfigs(prev => {
      const sections = [...(prev[activeRole].customSections || [])];
      if (index >= sections.length - 1) return prev;
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
      return { ...prev, [activeRole]: { ...prev[activeRole], customSections: sections } };
    });
  };

  // ── External Links ──
  const addExternalLink = () => {
    const newLink: ExternalLink = {
      id: `link_${Date.now()}`,
      title: 'New External Page',
      description: 'Description of the external page',
      url: 'https://',
      openInNewTab: true,
      enabled: true,
    };
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        externalLinks: [...(prev[activeRole].externalLinks || []), newLink],
      },
    }));
  };

  const removeExternalLink = async (id: string) => {
    const link = (configs[activeRole].externalLinks || []).find(l => l.id === id);
    if (link?.imageUrl) await deleteImage(link.imageUrl);
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        externalLinks: (prev[activeRole].externalLinks || []).filter(l => l.id !== id),
      },
    }));
  };

  const updateExternalLink = (id: string, updates: Partial<ExternalLink>) => {
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        externalLinks: (prev[activeRole].externalLinks || []).map(l =>
          l.id === id ? { ...l, ...updates } : l
        ),
      },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Landing Page Content</h2>
          <p className="text-sm text-muted-foreground">Manage hero, stats, images, and ad banners for each role.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
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
          <Button key={r.key} variant={activeRole === r.key ? 'default' : 'outline'} size="sm" onClick={() => setActiveRole(r.key)}>
            {r.label}
          </Button>
        ))}
      </div>

      {/* Editor + Inline Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="xl:col-span-2">
          <Tabs defaultValue="hero" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="hero">Hero Section</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="ads">Ad Banners</TabsTrigger>
              <TabsTrigger value="custom">
                <Sparkles className="h-3 w-3 mr-1" /> Custom Sections
              </TabsTrigger>
              <TabsTrigger value="sections">Toggles</TabsTrigger>
            </TabsList>

            {/* Hero */}
            <TabsContent value="hero">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hero Content</CardTitle>
                  <CardDescription>Edit headline, description, CTAs, and hero image.</CardDescription>
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
                  <ImageUploadField
                    label="Hero Background Image (optional)"
                    value={current.hero.imageUrl}
                    onChange={updateHeroImage}
                    onRemove={removeHeroImage}
                  />

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
                      <Input value={current.hero.secondaryCta?.link || ''} onChange={e => updateHeroCta('secondaryCta', 'link', e.target.value)} />
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
                      <CardDescription>Promotional banners with optional images.</CardDescription>
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
                      <ImageUploadField
                        label="Banner Image (optional)"
                        value={ad.imageUrl}
                        onChange={(url) => updateAdImage(i, url)}
                        onRemove={() => removeAdImage(i)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom Sections */}
            <TabsContent value="custom">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> Custom Sections
                      </CardTitle>
                      <CardDescription>Add, reorder, and manage custom content sections for this role's landing page.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setShowAddSection(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(!current.customSections || current.customSections.length === 0) && (
                    <div className="text-center py-12 space-y-3">
                      <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-sm text-muted-foreground">No custom sections yet.</p>
                      <Button size="sm" variant="outline" onClick={() => setShowAddSection(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Add Your First Section
                      </Button>
                    </div>
                  )}

                  {(current.customSections || []).map((section, sIdx) => {
                    const template = SECTION_TEMPLATES.find(t => t.type === section.type);
                    const Icon = template?.icon || Sparkles;
                    const isExpanded = expandedSection === section.id;

                    return (
                      <div key={section.id} className="rounded-lg border overflow-hidden">
                        {/* Section Header */}
                        <div
                          className="flex items-center gap-3 p-3 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{section.title}</p>
                            <p className="text-[10px] text-muted-foreground">{section.type.replace(/_/g, ' ')} · {section.items.length} item(s)</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Switch
                              checked={section.enabled}
                              onCheckedChange={v => { updateCustomSection(section.id, { enabled: v }); }}
                              onClick={e => e.stopPropagation()}
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); moveSectionUp(sIdx); }} disabled={sIdx === 0}>
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); moveSectionDown(sIdx); }} disabled={sIdx >= (current.customSections?.length || 0) - 1}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); removeCustomSection(section.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Editor */}
                        {isExpanded && (
                          <div className="p-4 space-y-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Section Title</Label>
                                <Input value={section.title} onChange={e => updateCustomSection(section.id, { title: e.target.value })} />
                              </div>
                              <div>
                                <Label>Background Style</Label>
                                <Select value={section.bgStyle || 'default'} onValueChange={v => updateCustomSection(section.id, { bgStyle: v as CustomSectionData['bgStyle'] })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    <SelectItem value="muted">Muted</SelectItem>
                                    <SelectItem value="gradient">Gradient</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label>Subtitle</Label>
                              <Input value={section.subtitle || ''} onChange={e => updateCustomSection(section.id, { subtitle: e.target.value })} placeholder="Optional subtitle text" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>CTA Label (optional)</Label>
                                <Input value={section.ctaLabel || ''} onChange={e => updateCustomSection(section.id, { ctaLabel: e.target.value })} placeholder="e.g. Learn More" />
                              </div>
                              <div>
                                <Label>CTA Link</Label>
                                <Input value={section.ctaLink || ''} onChange={e => updateCustomSection(section.id, { ctaLink: e.target.value })} placeholder="e.g. /internships" />
                              </div>
                            </div>

                            <Separator />

                            {/* Items */}
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Items ({section.items.length})</p>
                              <Button size="sm" variant="outline" onClick={() => addSectionItem(section.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add Item
                              </Button>
                            </div>

                            {section.items.map((item, iIdx) => (
                              <div key={iIdx} className="p-3 rounded-lg bg-muted/20 space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-[10px]">Item {iIdx + 1}</Badge>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeSectionItem(section.id, iIdx)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Title</Label>
                                    <Input className="h-8 text-sm" value={item.title || ''} onChange={e => updateSectionItem(section.id, iIdx, { title: e.target.value })} />
                                  </div>
                                  {(section.type === 'testimonials') && (
                                    <div>
                                      <Label className="text-xs">Author / Role</Label>
                                      <Input className="h-8 text-sm" value={item.author || ''} onChange={e => updateSectionItem(section.id, iIdx, { author: e.target.value })} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <Label className="text-xs">Description</Label>
                                  <Textarea className="text-sm" value={item.description || ''} onChange={e => updateSectionItem(section.id, iIdx, { description: e.target.value })} rows={2} />
                                </div>
                                {['features_grid', 'testimonials', 'partner_logos'].includes(section.type) && (
                                  <ImageUploadField
                                    label="Image (optional)"
                                    value={item.imageUrl}
                                    onChange={url => updateSectionItem(section.id, iIdx, { imageUrl: url })}
                                    onRemove={() => updateSectionItem(section.id, iIdx, { imageUrl: undefined })}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Add Section Dialog */}
              <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Add New Section
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground mb-4">Choose a section template to get started quickly.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {SECTION_TEMPLATES.map(template => (
                      <button
                        key={template.type}
                        onClick={() => addCustomSection(template.type)}
                        className="text-left p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all space-y-1 group"
                      >
                        <div className="flex items-center gap-2">
                          <template.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                          <span className="font-semibold text-sm">{template.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                        <p className="text-[10px] text-primary/60">{template.defaultItems.length} default item(s)</p>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>


            <TabsContent value="sections">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Section Visibility</CardTitle>
                  <CardDescription>Toggle which sections appear for this role.</CardDescription>
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

        {/* Inline Preview (desktop) */}
        <div className="hidden xl:block">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Live Preview</CardTitle>
                <Badge variant="outline" className="ml-auto text-[10px]">{activeRole}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <LandingPreview config={current} role={activeRole} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog (mobile/tablet) */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Preview — {ROLES.find(r => r.key === activeRole)?.label}
            </DialogTitle>
          </DialogHeader>
          <LandingPreview config={current} role={activeRole} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
