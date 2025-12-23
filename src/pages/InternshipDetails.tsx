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
import { 
  Building2, MapPin, Clock, Briefcase, DollarSign, Calendar, 
  Users, ArrowLeft, CheckCircle, Send, Globe
} from 'lucide-react';

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
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 rounded-xl mb-8" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!internship) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Internship Not Found</h1>
          <p className="text-muted-foreground mb-6">This internship may no longer be active or doesn't exist.</p>
          <Link to="/internships">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Internships
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link to="/internships" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Internships
        </Link>

        {/* Apply Section at Top */}
        <Card className="mb-8">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-semibold text-lg">{internship.title}</h2>
              <p className="text-muted-foreground">{internship.company?.name}</p>
            </div>
            
            {!user ? (
              <Link to="/auth?mode=signup&role=student">
                <Button className="gradient-primary border-0">
                  <Send className="h-4 w-4 mr-2" />
                  Sign Up to Apply
                </Button>
              </Link>
            ) : role === 'student' ? (
              <Button 
                className="gradient-primary border-0"
                onClick={() => setShowApplyModal(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only students can apply for internships.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  {/* Company Logo */}
                  <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {internship.company?.logo_url ? (
                      <img
                        src={internship.company.logo_url}
                        alt={internship.company.name}
                        className="h-full w-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* Title & Company */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold">{internship.title}</h1>
                        <Link 
                          to={`/companies/${internship.company_id}`}
                          className="text-lg text-primary hover:underline mt-1 inline-flex items-center gap-2"
                        >
                          {internship.company?.name || 'Company'}
                          {internship.company?.is_verified && (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </Link>
                      </div>
                      <Badge
                        variant={internship.is_paid ? 'default' : 'secondary'}
                        className={internship.is_paid ? 'gradient-primary border-0 text-base px-4 py-1' : 'text-base px-4 py-1'}
                      >
                        {internship.is_paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Internship Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {internship.location && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Location
                      </span>
                      <span className="font-medium">{internship.location}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" /> Work Mode
                    </span>
                    <span className="font-medium">{workModeLabels[internship.work_mode]}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Type
                    </span>
                    <span className="font-medium">{internshipTypeLabels[internship.internship_type]}</span>
                  </div>
                  {internship.duration && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Duration
                      </span>
                      <span className="font-medium">{internship.duration}</span>
                    </div>
                  )}
                  {internship.stipend && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Stipend
                      </span>
                      <span className="font-medium">${internship.stipend}/month</span>
                    </div>
                  )}
                  {internship.positions_available && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" /> Positions
                      </span>
                      <span className="font-medium">{internship.positions_available} available</span>
                    </div>
                  )}
                  {internship.start_date && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Start Date
                      </span>
                      <span className="font-medium">{new Date(internship.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {internship.application_deadline && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Deadline
                      </span>
                      <span className="font-medium text-destructive">{new Date(internship.application_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{internship.description}</p>
              </CardContent>
            </Card>

            {/* Skills Card */}
            {internship.skills && internship.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {internship.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info Card */}
            {internship.company && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About the Company</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      {internship.company.logo_url ? (
                        <img
                          src={internship.company.logo_url}
                          alt={internship.company.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Link 
                        to={`/companies/${internship.company_id}`}
                        className="font-medium hover:text-primary"
                      >
                        {internship.company.name}
                      </Link>
                      {internship.company.industry && (
                        <p className="text-sm text-muted-foreground">{internship.company.industry}</p>
                      )}
                    </div>
                  </div>

                  {internship.company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {internship.company.description}
                    </p>
                  )}

                  {internship.company.website && (
                    <a
                      href={internship.company.website.startsWith('http') ? internship.company.website : `https://${internship.company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Website
                    </a>
                  )}

                  <Link to={`/companies/${internship.company_id}`}>
                    <Button variant="outline" className="w-full mt-2">
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
        <ApplyModal
          internship={internship}
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
        />
      )}
    </Layout>
  );
};

export default InternshipDetails;