import { useState } from 'react';
import { resolveStorageUrl, isPrivateStorageUrl } from '@/lib/storage-utils';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignedLinkProps {
  href: string | null;
  children: React.ReactNode;
  className?: string;
}

/**
 * A link component that resolves private storage URLs (resume://, private://) 
 * to signed URLs on click, or opens public URLs directly.
 */
export const SignedLink = ({ href, children, className }: SignedLinkProps) => {
  const [loading, setLoading] = useState(false);

  if (!href) return null;

  const handleClick = async (e: React.MouseEvent) => {
    if (!isPrivateStorageUrl(href)) return; // Let regular links work normally
    
    e.preventDefault();
    setLoading(true);
    try {
      const signedUrl = await resolveStorageUrl(href);
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      console.error('Failed to open file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <a
      href={isPrivateStorageUrl(href) ? '#' : href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn('inline-flex items-center gap-1', className)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </a>
  );
};
