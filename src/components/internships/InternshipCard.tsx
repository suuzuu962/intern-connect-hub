import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, DollarSign, Building2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Internship } from '@/types/database';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ApplyModal } from './ApplyModal';

interface InternshipCardProps {
  internship: Internship;
  className?: string;
}

const workModeLabels = {
  remote: 'Remote',
  onsite: 'On-site',
  hybrid: 'Hybrid',
};

const internshipTypeLabels = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
};

export const InternshipCard = ({ internship, className }: InternshipCardProps) => {
  const { user, role } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowApplyModal(true);
  };

  return (
    <>
      <Link to={`/internships/${internship.id}`}>
        <Card className={cn("hover-lift cursor-pointer group overflow-hidden", className)}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Company Logo */}
              <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {internship.company?.logo_url ? (
                  <img
                    src={internship.company.logo_url}
                    alt={internship.company.name}
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors truncate">
                      {internship.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {internship.company?.name || 'Company'}
                    </p>
                  </div>
                  <Badge
                    variant={internship.is_paid ? 'default' : 'secondary'}
                    className={internship.is_paid ? 'gradient-primary border-0' : ''}
                  >
                    {internship.is_paid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>

                {/* Meta Info */}
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {internship.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {internship.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {workModeLabels[internship.work_mode]}
                  </span>
                  {internship.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {internship.duration}
                    </span>
                  )}
                  {internship.stipend && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${internship.stipend}/month
                    </span>
                  )}
                </div>

                {/* Domain & Skills */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {internship.domain && (
                    <Badge variant="outline" className="text-xs">
                      {internship.domain}
                    </Badge>
                  )}
                  {internship.skills?.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs bg-muted/50">
                      {skill}
                    </Badge>
                  ))}
                  {internship.skills && internship.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{internship.skills.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Short Description */}
                {internship.short_description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {internship.short_description}
                  </p>
                )}

                {/* Apply Button - Only show for students or logged out users */}
                {(!user || role === 'student') && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="gradient-primary border-0"
                      onClick={handleApplyClick}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {user && role === 'student' && (
        <ApplyModal
          internship={internship}
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
        />
      )}

      {/* If not logged in, redirect to auth on apply click */}
      {!user && showApplyModal && (
        <ApplyModal
          internship={internship}
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
        />
      )}
    </>
  );
};
