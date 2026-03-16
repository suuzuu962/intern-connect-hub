import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, IndianRupee, Building2, Send } from 'lucide-react';
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

export const InternshipCard = ({ internship, className }: InternshipCardProps) => {
  const { user, role } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowApplyModal(true);
  };

  const companyName = internship.company?.name || 'Company';

  return (
    <>
      <Link to={`/internships/${internship.id}`}>
        <Card className={cn("cursor-pointer group overflow-hidden border hover:shadow-md transition-shadow duration-200", className)}>
          <CardContent className="p-5">
            {/* Header: Logo + Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-sm",
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
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[15px] leading-tight group-hover:text-primary transition-colors truncate">
                  {internship.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {companyName}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("border-0 shrink-0 text-xs font-medium rounded-md px-2.5 py-0.5", internshipTypeBadgeStyles[internship.internship_type])}
              >
                {internshipTypeLabels[internship.internship_type]}
              </Badge>
            </div>

            {/* Short Description */}
            {internship.short_description && (
              <p className="text-[13px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                {internship.short_description}
              </p>
            )}

            {/* Meta Info */}
            <div className="space-y-1.5 mb-4 text-[13px] text-muted-foreground">
              {internship.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {internship.location}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                {workModeLabels[internship.work_mode]}
              </span>
              {internship.duration && (
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {internship.duration}
                </span>
              )}
              {internship.internship_type === 'stipended' && internship.stipend && (
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                  <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                  ₹{internship.stipend.toLocaleString('en-IN')} stipend
                </span>
              )}
              {internship.internship_type === 'paid' && internship.fees && (
                <span className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium">
                  <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                  ₹{internship.fees.toLocaleString('en-IN')} fees
                </span>
              )}
            </div>

            {/* Domain & Skills */}
            {(internship.domain || (internship.skills && internship.skills.length > 0)) && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {internship.domain && (
                  <Badge variant="outline" className="text-[11px] rounded-md px-2 py-0.5">
                    {internship.domain}
                  </Badge>
                )}
                {internship.skills?.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[11px] bg-muted/50 rounded-md px-2 py-0.5">
                    {skill}
                  </Badge>
                ))}
                {internship.skills && internship.skills.length > 2 && (
                  <Badge variant="outline" className="text-[11px] rounded-md px-2 py-0.5">
                    +{internship.skills.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer: Apply Button */}
            {(!user || role === 'student') && (
              <div className="pt-3 border-t border-border/60">
                <Button
                  size="sm"
                  className="w-full text-xs font-medium h-8"
                  onClick={handleApplyClick}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Apply Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
