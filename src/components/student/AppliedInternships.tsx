import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Briefcase, Building2, Calendar, CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    applicationId: string;
    internshipTitle: string;
  } | null>(null);

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

  const hasApprovedApplication = applications.some(app => app.status === 'approved');

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    // Check if student already has an approved internship
    if (newStatus === 'approved' && hasApprovedApplication) {
      toast.error('You can only have one approved internship at a time');
      return;
    }

    setUpdatingId(applicationId);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      toast.success(`Application ${newStatus === 'approved' ? 'accepted' : 'declined'} successfully`);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application status');
    } finally {
      setUpdatingId(null);
      setConfirmDialog(null);
    }
  };

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

      {hasApprovedApplication && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              You have an approved internship. You can only accept one internship at a time.
            </p>
          </CardContent>
        </Card>
      )}

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
                    {getStatusBadge(app.status)}
                    
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          disabled={updatingId === app.id || hasApprovedApplication}
                          onClick={() => setConfirmDialog({
                            open: true,
                            action: 'approve',
                            applicationId: app.id,
                            internshipTitle: app.internship.title,
                          })}
                        >
                          {updatingId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Accept'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          disabled={updatingId === app.id}
                          onClick={() => setConfirmDialog({
                            open: true,
                            action: 'reject',
                            applicationId: app.id,
                            internshipTitle: app.internship.title,
                          })}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'approve' ? 'Accept Internship' : 'Decline Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'approve' ? (
                <>
                  Are you sure you want to accept the internship at <strong>{confirmDialog?.internshipTitle}</strong>?
                  <br /><br />
                  <strong>Note:</strong> You can only accept one internship at a time. Other pending applications will remain pending.
                </>
              ) : (
                <>
                  Are you sure you want to decline your application for <strong>{confirmDialog?.internshipTitle}</strong>?
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog && handleStatusUpdate(confirmDialog.applicationId, confirmDialog.action === 'approve' ? 'approved' : 'rejected')}
              className={confirmDialog?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmDialog?.action === 'approve' ? 'Accept' : 'Decline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};