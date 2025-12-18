import { Link } from 'react-router-dom';
import { MapPin, Users, Globe, Building2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Company } from '@/types/database';
import { cn } from '@/lib/utils';

interface CompanyCardProps {
  company: Company;
  internshipCount?: number;
  className?: string;
}

export const CompanyCard = ({ company, internshipCount = 0, className }: CompanyCardProps) => {
  return (
    <Link to={`/companies/${company.id}`}>
      <Card className={cn("hover-lift cursor-pointer group overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Company Logo */}
            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors truncate">
                    {company.name}
                  </h3>
                  {company.is_verified && (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  )}
                </div>
              </div>

              {company.industry && (
                <p className="text-sm text-muted-foreground mt-1">{company.industry}</p>
              )}

              {/* Meta Info */}
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                  </span>
                )}
                {company.employee_count && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {company.employee_count} employees
                  </span>
                )}
                {company.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Website
                  </span>
                )}
              </div>

              {/* Internship Count & Description */}
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {internshipCount} Active Internship{internshipCount !== 1 ? 's' : ''}
                </Badge>
              </div>

              {company.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {company.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
