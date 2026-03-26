import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_TIMEOUT_MINUTES = 15;

export const useIdleTimeoutSetting = (): number => {
  const [timeoutMs, setTimeoutMs] = useState(DEFAULT_TIMEOUT_MINUTES * 60 * 1000);

  useEffect(() => {
    const fetchTimeout = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'all_settings')
          .maybeSingle();

        if (!error && data?.value) {
          const settings = data.value as Record<string, any>;
          const minutes = Number(settings.sessionTimeout) || DEFAULT_TIMEOUT_MINUTES;
          setTimeoutMs(Math.max(1, minutes) * 60 * 1000);
        }
      } catch {
        // Use default on error
      }
    };

    fetchTimeout();
  }, []);

  return timeoutMs;
};
