import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getHomeConfig,
  type RoleHomeConfig,
  type RoleHeroContent,
  type RoleStat,
  type RoleAdBanner,
} from '@/components/home/roleHomeContent';
import type { CustomSectionData } from '@/components/home/CustomSection';

const SETTINGS_KEY = 'landing_page_content';

interface SerializableConfig {
  hero?: Partial<RoleHeroContent>;
  stats?: RoleStat[];
  ads?: RoleAdBanner[];
  showUniversitySection?: boolean;
  showWorkFunnel?: boolean;
  customSections?: CustomSectionData[];
}

export interface LandingPageConfig extends RoleHomeConfig {
  customSections: CustomSectionData[];
}

export function useLandingPageContent(role: string | null): LandingPageConfig {
  const defaultConfig = getHomeConfig(role);
  const [config, setConfig] = useState<LandingPageConfig>({ ...defaultConfig, customSections: [] });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (cancelled) return;

      const roleKey = role || 'guest';
      const saved = (data?.value as Record<string, SerializableConfig> | null)?.[roleKey];

      if (saved) {
        const fallback = getHomeConfig(role);
        setConfig({
          hero: {
            headline: saved.hero?.headline ?? fallback.hero.headline,
            highlightedText: saved.hero?.highlightedText ?? fallback.hero.highlightedText,
            description: saved.hero?.description ?? fallback.hero.description,
            primaryCta: saved.hero?.primaryCta ?? fallback.hero.primaryCta,
            secondaryCta: saved.hero?.secondaryCta ?? fallback.hero.secondaryCta,
            imageUrl: saved.hero?.imageUrl,
          },
          stats: saved.stats ?? fallback.stats,
          steps: fallback.steps,
          ads: saved.ads ?? fallback.ads,
          showUniversitySection: saved.showUniversitySection ?? fallback.showUniversitySection,
          showWorkFunnel: saved.showWorkFunnel ?? fallback.showWorkFunnel,
          customSections: saved.customSections ?? [],
        });
      } else {
        setConfig({ ...getHomeConfig(role), customSections: [] });
      }
    };

    load();
    return () => { cancelled = true; };
  }, [role]);

  return config;
}
