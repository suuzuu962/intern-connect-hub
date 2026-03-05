import { Link } from 'react-router-dom';
import { MapPin, Users, Star, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Company } from '@/types/database';
import { cn } from '@/lib/utils';

interface CompanyListItemProps {
  company: Company;
  internshipCount?: number;
  className?: string;
}

const avatarColors = [
  'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export const CompanyListItem = ({ company, internshipCount = 0, className }: CompanyListItemProps) => {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group",
      className
    )}>
      {/* Company Logo */}
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs",
        company.logo_url ? 'bg-muted' : getAvatarColor(company.name)
      )}>
        {company.logo_url ? (
          <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover rounded-lg" />
        ) : (
          getInitials(company.name)
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
            {company.name}
          </h3>
          {company.industry && (
            <p className="text-xs text-muted-foreground truncate">{company.industry}</p>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {company.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="hidden sm:inline">{company.location}</span>
            </span>
          )}
          {company.employee_count && (
            <span className="flex items-center gap-1 hidden md:flex">
              <Users className="h-3 w-3" />
              {company.employee_count}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-warning fill-warning" />
            4.5
          </span>
        </div>
      </div>

      {/* Internship Count */}
      <Badge variant="secondary" className="shrink-0 text-xs text-primary bg-primary/10 border-0">
        {internshipCount} internship{internshipCount !== 1 ? 's' : ''}
      </Badge>

      <Link to={`/companies/${company.id}`}>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0">
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      </Link>
    </div>
  );
};
