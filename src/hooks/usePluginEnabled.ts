import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a plugin (by slug) is enabled.
 * Returns { enabled, loading } — defaults to true while loading so features
 * don't flash-hide on initial render.
 */
export const usePluginEnabled = (slug: string) => {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data, error } = await supabase
        .from('plugins')
        .select('is_enabled')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error(`Plugin check failed for "${slug}":`, error.message);
        setEnabled(true); // fail-open
      } else if (data) {
        setEnabled(data.is_enabled);
      } else {
        // Plugin row doesn't exist — treat as enabled (no restriction)
        setEnabled(true);
      }
      setLoading(false);
    };

    check();
    return () => { cancelled = true; };
  }, [slug]);

  return { enabled, loading };
};
