import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Building2, Calendar, CheckCircle, Clock, AlertCircle, XCircle, ThumbsUp, FileSearch, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Application {
  id: string;
  status: string;
  applied_at: string;
  internship: {
    id: string;
    title: string;
    domain: string | null;
    location: string | null;
    company: {
      name: string;
      logo_url: string | null;
    };
  };
}

interface AppliedInternshipsProps {
  studentId: string | null;
}

export const AppliedInternships = ({ studentId }: AppliedInternshipsProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchApplications();
    }
  }, [studentId]);

  const fetchApplications = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          internship:internships(
            id,
            title,
            domain,
            location,
            company:companies(name, logo_url)
          )
        `)
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false });

      if (data) {
        const formatted = data.map((app: any) => ({
          id: app.id,
          status: app.status,
          applied_at: app.applied_at,
          internship: {
            id: app.internship?.id || '',
            title: app.internship?.title || 'Unknown',
            domain: app.internship?.domain,
            location: app.internship?.location,
            company: {
              name: app.internship?.company?.name || 'Unknown',
              logo_url: app.internship?.company?.logo_url,
            },
          },
        }));
        setApplications(formatted);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const appliedCount = applications.filter(app => app.status === 'applied').length;
  const underReviewCount = applications.filter(app => app.status === 'under_review').length;
  const shortlistedCount = applications.filter(app => app.status === 'shortlisted').length;
  const offerReleasedCount = applications.filter(app => app.status === 'offer_released').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            <Send className="h-3 w-3 mr-1" />
            Applied
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
            <FileSearch className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'shortlisted':
        return (
          <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">
            <ThumbsUp className="h-3 w-3 mr-1" />
            Shortlisted
          </Badge>
        );
      case 'offer_released':
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Offer Released
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Withdrawn
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Applied Internships</h2>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Applied Internships</h2>
        <Badge variant="outline" className="text-sm">
          {applications.length} Application{applications.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {offerReleasedCount > 0 && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Congratulations! You have {offerReleasedCount} offer{offerReleasedCount > 1 ? 's' : ''} released!
            </p>
          </CardContent>
        </Card>
      )}

      {shortlistedCount > 0 && (
        <Card className="border-purple-500/50 bg-purple-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              You have been shortlisted for {shortlistedCount} internship{shortlistedCount > 1 ? 's' : ''}!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Send className="h-4 w-4 text-blue-500" />
          {appliedCount} Applied
        </span>
        <span className="flex items-center gap-1">
          <FileSearch className="h-4 w-4 text-yellow-500" />
          {underReviewCount} Under Review
        </span>
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-4 w-4 text-purple-500" />
          {shortlistedCount} Shortlisted
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {offerReleasedCount} Offers
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-red-500" />
          {rejectedCount} Rejected
        </span>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No applications yet</p>
            <p className="text-sm text-muted-foreground">Browse internships and start applying!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {app.internship.company.logo_url ? (
                      <img
                        src={app.internship.company.logo_url}
                        alt={app.internship.company.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{app.internship.title}</h3>
                      <p className="text-muted-foreground">{app.internship.company.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {app.internship.domain && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {app.internship.domain}
                          </span>
                        )}
                        {app.internship.location && (
                          <span className="flex items-center gap-1">
                            • {app.internship.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {getStatusBadge(app.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};