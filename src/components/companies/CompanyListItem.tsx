import { Link } from 'react-router-dom';
import { MapPin, Users, Globe, Building2, CheckCircle, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Company } from '@/types/database';
import { cn } from '@/lib/utils';

interface CompanyListItemProps {
  company: Company;
  internshipCount?: number;
  className?: string;
}

export const CompanyListItem = ({ company, internshipCount = 0, className }: CompanyListItemProps) => {
  return (
    <Link to={`/companies/${company.id}`}>
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group",
        className
      )}>
        {/* Company Logo */}
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-full w-full object-cover rounded-lg"
            />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                {company.name}
              </h3>
              {company.is_verified && (
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>
            {company.industry && (
              <p className="text-xs text-muted-foreground truncate">
                {company.industry}
              </p>
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
            {company.website && (
              <span className="flex items-center gap-1 hidden lg:flex">
                <Globe className="h-3 w-3" />
                Website
              </span>
            )}
          </div>
        </div>

        {/* Internship Count Badge */}
        <Badge variant="secondary" className="shrink-0 text-xs">
          <Briefcase className="h-3 w-3 mr-1" />
          {internshipCount} {internshipCount === 1 ? 'Internship' : 'Internships'}
        </Badge>
      </div>
    </Link>
  );
};
