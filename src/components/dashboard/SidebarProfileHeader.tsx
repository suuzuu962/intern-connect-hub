import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Globe, Linkedin, Twitter, GraduationCap, Building2, Shield, School, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type RoleIndicator = 'student' | 'company' | 'admin' | 'university' | 'college' | 'coordinator';

const roleConfig: Record<RoleIndicator, { label: string; icon: React.ElementType; className: string }> = {
  student: { label: 'Student', icon: GraduationCap, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  company: { label: 'Company', icon: Building2, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  admin: { label: 'Admin', icon: Shield, className: 'bg-red-100 text-red-700 border-red-200' },
  university: { label: 'University', icon: School, className: 'bg-purple-100 text-purple-700 border-purple-200' },
  college: { label: 'College', icon: School, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  coordinator: { label: 'Coordinator', icon: UserCheck, className: 'bg-teal-100 text-teal-700 border-teal-200' },
};

interface SidebarProfileHeaderProps {
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  avatarFallback: ReactNode;
  verified?: boolean;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  role?: RoleIndicator;
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
  role,
  className,
}: SidebarProfileHeaderProps) => {
  const hasSocials = linkedinUrl || websiteUrl || twitterUrl;
  const roleInfo = role ? roleConfig[role] : null;

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

      {roleInfo && (
        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 gap-1 w-fit", roleInfo.className)}>
          <roleInfo.icon className="h-3 w-3" />
          {roleInfo.label}
        </Badge>
      )}

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
