import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Internship } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApplyModal } from '@/components/internships/ApplyModal';
import { cn } from '@/lib/utils';
import { 
  Building2, MapPin, Clock, Briefcase, Calendar, 
  Users, ArrowLeft, CheckCircle, Send, Globe, IndianRupee
} from 'lucide-react';

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

const InternshipDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInternshipDetails();
    }
  }, [id]);

  const fetchInternshipDetails = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('internships')
      .select('*, company:companies(*)')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (!error && data) {
      setInternship(data as Internship);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <Skeleton className="h-6 w-32 mb-8" />
          <Skeleton className="h-48 rounded-xl mb-6" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!internship) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-semibold mb-3">Internship Not Found</h1>
          <p className="text-[14px] text-muted-foreground mb-6">This internship may no longer be active or doesn't exist.</p>
          <Link to="/internships">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Internships
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const companyName = internship.company?.name || 'Company';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl">
        {/* Back Button */}
        <Link to="/internships" className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to Internships
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header Card */}
            <Card className="border">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <div className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-base",
                    internship.company?.logo_url ? 'bg-muted' : getAvatarColor(companyName)
                  )}>
                    {internship.company?.logo_url ? (
                      <img src={internship.company.logo_url} alt={companyName} className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      getInitials(companyName)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-semibold leading-tight">{internship.title}</h1>
                        <Link 
                          to={`/companies/${internship.company_id}`}
                          className="text-[14px] text-primary hover:underline mt-1 inline-flex items-center gap-1.5"
                        >
                          {companyName}
                          {internship.company?.is_verified && <CheckCircle className="h-4 w-4" />}
                        </Link>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("border-0 text-xs font-medium px-2.5 py-1 rounded-md shrink-0", internshipTypeBadgeStyles[internship.internship_type])}
                      >
                        {internshipTypeLabels[internship.internship_type]}
                      </Badge>
                    </div>

                    {/* Apply button inline */}
                    <div className="mt-4">
                      {!user ? (
                        <Link to="/auth?mode=signup&role=student">
                          <Button size="sm" className="text-xs h-8 font-medium">
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Sign Up to Apply
                          </Button>
                        </Link>
                      ) : role === 'student' ? (
                        <Button size="sm" className="text-xs h-8 font-medium" onClick={() => setShowApplyModal(true)}>
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          Apply Now
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground">Only students can apply for internships.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="border">
              <CardHeader className="pb-3 px-5 pt-5">
                <CardTitle className="text-[15px] font-semibold">Internship Details</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {internship.location && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Location
                      </span>
                      <span className="text-[13px] font-medium">{internship.location}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Work Mode
                    </span>
                    <span className="text-[13px] font-medium">{workModeLabels[internship.work_mode]}</span>
                  </div>
                  {internship.duration && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Duration
                      </span>
                      <span className="text-[13px] font-medium">{internship.duration}</span>
                    </div>
                  )}
                  {internship.internship_type === 'stipended' && internship.stipend && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5" /> Stipend
                      </span>
                      <span className="text-[13px] font-medium text-green-600 dark:text-green-400">
                        ₹{internship.stipend.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {internship.internship_type === 'paid' && internship.fees && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5" /> Fees
                      </span>
                      <span className="text-[13px] font-medium text-orange-600 dark:text-orange-400">
                        ₹{internship.fees.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {internship.positions_available && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Positions
                      </span>
                      <span className="text-[13px] font-medium">{internship.positions_available} available</span>
                    </div>
                  )}
                  {internship.start_date && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Start Date
                      </span>
                      <span className="text-[13px] font-medium">{new Date(internship.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {internship.application_deadline && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Deadline
                      </span>
                      <span className="text-[13px] font-medium text-destructive">{new Date(internship.application_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description Card */}
            <Card className="border">
              <CardHeader className="pb-3 px-5 pt-5">
                <CardTitle className="text-[15px] font-semibold">Description</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{internship.description}</p>
              </CardContent>
            </Card>

            {/* Skills Card */}
            {internship.skills && internship.skills.length > 0 && (
              <Card className="border">
                <CardHeader className="pb-3 px-5 pt-5">
                  <CardTitle className="text-[15px] font-semibold">Required Skills</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="flex flex-wrap gap-1.5">
                    {internship.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-[11px] rounded-md px-2.5 py-0.5">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {internship.company && (
              <Card className="border">
                <CardHeader className="pb-3 px-5 pt-5">
                  <CardTitle className="text-[14px] font-semibold">About the Company</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-xs",
                      internship.company.logo_url ? 'bg-muted' : getAvatarColor(companyName)
                    )}>
                      {internship.company.logo_url ? (
                        <img src={internship.company.logo_url} alt={companyName} className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        getInitials(companyName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link to={`/companies/${internship.company_id}`} className="text-[14px] font-medium hover:text-primary transition-colors">
                        {companyName}
                      </Link>
                      {internship.company.industry && (
                        <p className="text-xs text-muted-foreground">{internship.company.industry}</p>
                      )}
                    </div>
                  </div>

                  {internship.company.description && (
                    <p className="text-[13px] text-muted-foreground line-clamp-3 leading-relaxed">
                      {internship.company.description}
                    </p>
                  )}

                  {internship.company.website && (
                    <a
                      href={internship.company.website.startsWith('http') ? internship.company.website : `https://${internship.company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Visit Website
                    </a>
                  )}

                  <Link to={`/companies/${internship.company_id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 mt-1 font-medium rounded-md">
                      View Company Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {user && role === 'student' && (
        <ApplyModal internship={internship} open={showApplyModal} onOpenChange={setShowApplyModal} />
      )}
    </Layout>
  );
};

export default InternshipDetails;
