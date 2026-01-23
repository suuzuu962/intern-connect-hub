import { useState, useEffect } from 'react';

type ViewMode = 'grid' | 'list';

const STORAGE_KEY_PREFIX = 'viewMode_';

export const useViewMode = (pageKey: string, defaultMode: ViewMode = 'grid') => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${pageKey}`);
      if (stored === 'grid' || stored === 'list') {
        return stored;
      }
    }
    return defaultMode;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${pageKey}`, viewMode);
  }, [viewMode, pageKey]);

  return [viewMode, setViewMode] as const;
};
