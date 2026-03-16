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
  free: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
  stipended: 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300',
};

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

export const InternshipListItem = ({ internship, className }: InternshipListItemProps) => {
  const { user, role } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const companyName = internship.company?.name || 'Company';

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowApplyModal(true);
  };

  return (
    <>
      <Link to={`/internships/${internship.id}`}>
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow group",
          className
        )}>
          {/* Company Logo */}
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-xs",
            internship.company?.logo_url ? 'bg-muted' : getAvatarColor(companyName)
          )}>
            {internship.company?.logo_url ? (
              <img
                src={internship.company.logo_url}
                alt={companyName}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              getInitials(companyName)
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[14px] group-hover:text-primary transition-colors truncate">
                {internship.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {companyName}
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
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                  <IndianRupee className="h-3 w-3" />
                  ₹{internship.stipend.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Type Badge */}
          <Badge
            variant="outline"
            className={cn("border-0 shrink-0 text-xs font-medium rounded-md px-2.5", internshipTypeBadgeStyles[internship.internship_type])}
          >
            {internshipTypeLabels[internship.internship_type]}
          </Badge>

          {/* Apply Button */}
          {(!user || role === 'student') && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 hidden sm:flex h-8 text-xs rounded-md font-medium"
              onClick={handleApplyClick}
            >
              <Send className="h-3 w-3 mr-1" />
              Apply
            </Button>
          )}
        </div>
      </Link>

      {user && role === 'student' && (
        <ApplyModal internship={internship} open={showApplyModal} onOpenChange={setShowApplyModal} />
      )}
      {!user && showApplyModal && (
        <ApplyModal internship={internship} open={showApplyModal} onOpenChange={setShowApplyModal} />
      )}
    </>
  );
};
