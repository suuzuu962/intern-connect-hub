import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Globe, Linkedin, Twitter } from 'lucide-react';

interface SidebarProfileHeaderProps {
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  avatarFallback: ReactNode;
  verified?: boolean;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  className?: string;
}

export const SidebarProfileHeader = ({
  name,
  subtitle,
  avatarUrl,
  avatarFallback,
  verified,
  linkedinUrl,
  websiteUrl,
  twitterUrl,
  className,
}: SidebarProfileHeaderProps) => {
  const hasSocials = linkedinUrl || websiteUrl || twitterUrl;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/10">
            {avatarFallback}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-sm">{name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {verified !== undefined && (
              <span className={verified ? 'text-green-600' : 'text-amber-600'}>
                {verified ? '✓ Verified' : '⏳ Pending'}{' '}
              </span>
            )}
            {subtitle}
          </p>
        </div>
      </div>

      {hasSocials && (
        <div className="flex items-center gap-2 pt-1">
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          )}
          {twitterUrl && (
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Twitter"
            >
              <Twitter className="h-3.5 w-3.5" />
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Website"
            >
              <Globe className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
