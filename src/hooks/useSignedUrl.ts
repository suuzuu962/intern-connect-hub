import { useState, useEffect } from 'react';
import { resolveStorageUrl } from '@/lib/storage-utils';

/**
 * React hook that resolves a storage URL (resume://, private://) to a signed URL.
 * Returns the resolved URL and loading state.
 * For public URLs, returns them immediately without async resolution.
 */
export function useSignedUrl(storageUrl: string | null) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storageUrl) {
      setResolvedUrl(null);
      return;
    }

    // If it's a regular URL, use directly
    if (!storageUrl.startsWith('resume://') && !storageUrl.startsWith('private://')) {
      setResolvedUrl(storageUrl);
      return;
    }

    // Resolve private URL to signed URL
    setLoading(true);
    resolveStorageUrl(storageUrl)
      .then(setResolvedUrl)
      .catch(() => setResolvedUrl(null))
      .finally(() => setLoading(false));
  }, [storageUrl]);

  return { url: resolvedUrl, loading };
}
