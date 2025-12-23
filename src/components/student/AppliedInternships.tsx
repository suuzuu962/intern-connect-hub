import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Building2, Calendar, CheckCircle, Clock, AlertCircle, XCircle, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  applied_at: string;
  internship: {
    id: string;
    title: string;
    domain: string | null;
    location: string | null;
    stipend: number | null;
    is_paid: boolean | null;
    fees: number | null;
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
            stipend,
            is_paid,
            fees,
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
            stipend: app.internship?.stipend,
            is_paid: app.internship?.is_paid,
            fees: app.internship?.fees,
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

  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;
  const pendingCount = applications.filter(app => app.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
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
          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const requiresPayment = (app: Application) => {
    return app.status === 'approved' && app.internship.is_paid && app.internship.fees && app.internship.fees > 0;
  };

  const handlePayment = (app: Application) => {
    // For now, show a toast since payment integration isn't set up yet
    toast.info(`Payment of ₹${app.internship.fees} required for ${app.internship.title}. Payment gateway coming soon!`);
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

      {approvedCount > 0 && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              You have {approvedCount} approved internship{approvedCount > 1 ? 's' : ''}.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-yellow-500" />
          {pendingCount} Pending
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {approvedCount} Approved
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

                  <div className="flex items-center gap-3">
                    {requiresPayment(app) && (
                      <Button 
                        size="sm" 
                        onClick={() => handlePayment(app)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay ₹{app.internship.fees}
                      </Button>
                    )}
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