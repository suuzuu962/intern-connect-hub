import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeatureAccessConfig {
  feature_key: string;
  feature_label: string;
  is_locked: boolean;
  upgrade_message: string | null;
}

export const useFeatureAccess = (role: string | null) => {
  const [lockedFeatures, setLockedFeatures] = useState<Record<string, FeatureAccessConfig>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) {
      setLoading(false);
      return;
    }

    const mappedRole = role;

    const fetch = async () => {
      const { data, error } = await supabase
        .from('feature_access_config')
        .select('*')
        .eq('role', mappedRole)
        .eq('is_locked', true);

      if (!error && data) {
        const map: Record<string, FeatureAccessConfig> = {};
        data.forEach((item: any) => {
          map[item.feature_key] = item;
        });
        setLockedFeatures(map);
      }
      setLoading(false);
    };

    fetch();
  }, [role]);

  const isLocked = (featureKey: string) => !!lockedFeatures[featureKey];
  const getMessage = (featureKey: string) =>
    lockedFeatures[featureKey]?.upgrade_message || 'This feature requires an upgrade.';

  return { isLocked, getMessage, loading, lockedFeatures };
};
