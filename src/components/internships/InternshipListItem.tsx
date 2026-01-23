import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, IndianRupee, Building2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Internship } from '@/types/database';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ApplyModal } from './ApplyModal';

interface InternshipListItemProps {
  internship: Internship;
  className?: string;
}

const workModeLabels = {
  remote: 'Remote',
  onsite: 'On-site',
  hybrid: 'Hybrid',
};

const internshipTypeLabels = {
  free: 'Free',
  paid: 'Paid',
  stipended: 'Stipended',
};

const internshipTypeBadgeStyles = {
  free: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  paid: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  stipended: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export const InternshipListItem = ({ internship, className }: InternshipListItemProps) => {
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
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group",
          className
        )}>
          {/* Company Logo */}
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {internship.company?.logo_url ? (
              <img
                src={internship.company.logo_url}
                alt={internship.company.name}
                className="h-full w-full object-cover rounded-lg"
              />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                {internship.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {internship.company?.name || 'Company'}
              </p>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {internship.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="hidden sm:inline">{internship.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {workModeLabels[internship.work_mode]}
              </span>
              {internship.duration && (
                <span className="flex items-center gap-1 hidden md:flex">
                  <Clock className="h-3 w-3" />
                  {internship.duration}
                </span>
              )}
              {internship.internship_type === 'stipended' && internship.stipend && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <IndianRupee className="h-3 w-3" />
                  {internship.stipend.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Type Badge */}
          <Badge
            variant="outline"
            className={cn("border-0 shrink-0 text-xs", internshipTypeBadgeStyles[internship.internship_type])}
          >
            {internshipTypeLabels[internship.internship_type]}
          </Badge>

          {/* Apply Button */}
          {(!user || role === 'student') && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 hidden sm:flex"
              onClick={handleApplyClick}
            >
              <Send className="h-3 w-3 mr-1" />
              Apply
            </Button>
          )}
        </div>
      </Link>

      {user && role === 'student' && (
        <ApplyModal
          internship={internship}
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
        />
      )}

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
