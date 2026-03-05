import { Link } from 'react-router-dom';
import { MapPin, Users, Star, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Company } from '@/types/database';
import { cn } from '@/lib/utils';

interface CompanyCardProps {
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

export const CompanyCard = ({ company, internshipCount = 0, className }: CompanyCardProps) => {
  return (
    <Card className={cn("hover-lift cursor-pointer group overflow-hidden border", className)}>
      <CardContent className="p-5">
        {/* Header: Logo + Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm",
            company.logo_url ? 'bg-muted' : getAvatarColor(company.name)
          )}>
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              getInitials(company.name)
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-base group-hover:text-primary transition-colors truncate">
              {company.name}
            </h3>
            {company.industry && (
              <p className="text-xs text-muted-foreground">{company.industry}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {company.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {company.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="space-y-1.5 mb-4 text-sm text-muted-foreground">
          {company.location && (
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {company.location}
            </span>
          )}
          {company.employee_count && (
            <span className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {company.employee_count} employees
            </span>
          )}
          <span className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 shrink-0 text-warning fill-warning" />
            <span className="text-foreground font-medium">4.5</span>
          </span>
        </div>

        {/* Footer: Internship count + View */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Badge variant="secondary" className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 border-0">
            {internshipCount} internship{internshipCount !== 1 ? 's' : ''}
          </Badge>
          <Link to={`/companies/${company.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
