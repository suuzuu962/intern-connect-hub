import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Briefcase, Building2, Calendar, CheckCircle, Clock, AlertCircle, XCircle, ThumbsUp, FileSearch, Send, CheckCheck, Loader2, CreditCard, MapPin, IndianRupee, ExternalLink, Undo2, BookOpen, ArrowRight } from 'lucide-react';
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
    internship_type: string;
    fees: number | null;
    stipend: number | null;
    duration: string | null;
    work_mode: string | null;
    company: {
      name: string;
      logo_url: string | null;
    };
  };
}

interface DiaryEntryCounts {
  [applicationId: string]: number;
}

interface AppliedInternshipsProps {
  studentId: string | null;
  onNavigateToDiary?: () => void;
}

export const AppliedInternships = ({ studentId, onNavigateToDiary }: AppliedInternshipsProps) => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [diaryEntryCounts, setDiaryEntryCounts] = useState<DiaryEntryCounts>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    application: Application | null;
    type: 'accept' | 'withdraw';
  }>({ open: false, application: null, type: 'accept' });

  useEffect(() => {
    if (studentId) {
      fetchApplications();
    }
  }, [studentId]);

  // Fetch diary entry counts for accepted applications
  const fetchDiaryEntryCounts = async (acceptedApplicationIds: string[]) => {
    if (acceptedApplicationIds.length === 0) return;
    
    try {
      const { data } = await supabase
        .from('internship_diary')
        .select('application_id')
        .in('application_id', acceptedApplicationIds);
      
      if (data) {
        const counts: DiaryEntryCounts = {};
        acceptedApplicationIds.forEach(id => {
          counts[id] = data.filter(entry => entry.application_id === id).length;
        });
        setDiaryEntryCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching diary entry counts:', error);
    }
  };

  const openConfirmDialog = (application: Application, type: 'accept' | 'withdraw') => {
    setConfirmDialog({ open: true, application, type });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, application: null, type: 'accept' });
  };

  const handleAcceptOffer = async () => {
    if (!confirmDialog.application) return;
    
    const applicationId = confirmDialog.application.id;
    closeConfirmDialog();
    setAcceptingId(applicationId);
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'offer_accepted' })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Congratulations! You have accepted the offer!');
      fetchApplications();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Failed to accept offer. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleWithdraw = async () => {
    if (!confirmDialog.application) return;
    
    const applicationId = confirmDialog.application.id;
    closeConfirmDialog();
    setWithdrawingId(applicationId);
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const canWithdraw = (status: string) => {
    return ['applied', 'under_review', 'shortlisted'].includes(status);
  };

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
            internship_type,
            fees,
            stipend,
            duration,
            work_mode,
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
            internship_type: app.internship?.internship_type || 'free',
            fees: app.internship?.fees,
            stipend: app.internship?.stipend,
            duration: app.internship?.duration,
            work_mode: app.internship?.work_mode,
            company: {
              name: app.internship?.company?.name || 'Unknown',
              logo_url: app.internship?.company?.logo_url,
            },
          },
        }));
        setApplications(formatted);
        
        // Fetch diary counts for accepted applications
        const acceptedIds = formatted
          .filter(app => app.status === 'offer_accepted')
          .map(app => app.id);
        fetchDiaryEntryCounts(acceptedIds);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPaidInternship = (app: Application) => {
    return app.internship.internship_type === 'paid' && app.internship.fees && app.internship.fees > 0;
  };

  const appliedCount = applications.filter(app => app.status === 'applied').length;
  const underReviewCount = applications.filter(app => app.status === 'under_review').length;
  const shortlistedCount = applications.filter(app => app.status === 'shortlisted').length;
  const offerReleasedCount = applications.filter(app => app.status === 'offer_released').length;
  const offerAcceptedCount = applications.filter(app => app.status === 'offer_accepted').length;
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
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 animate-pulse">
            <CheckCircle className="h-3 w-3 mr-1" />
            Offer Released
          </Badge>
        );
      case 'offer_accepted':
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCheck className="h-3 w-3 mr-1" />
            Offer Accepted
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
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              You have {offerReleasedCount} offer{offerReleasedCount > 1 ? 's' : ''} waiting for your response! Accept below to confirm.
            </p>
          </CardContent>
        </Card>
      )}

      {offerAcceptedCount > 0 && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCheck className="h-4 w-4" />
              Congratulations! You have accepted {offerAcceptedCount} offer{offerAcceptedCount > 1 ? 's' : ''}!
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
          <CheckCircle className="h-4 w-4 text-amber-500" />
          {offerReleasedCount} Pending
        </span>
        <span className="flex items-center gap-1">
          <CheckCheck className="h-4 w-4 text-green-500" />
          {offerAcceptedCount} Accepted
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
            <Card 
              key={app.id} 
              className={cn(
                "hover:shadow-md transition-shadow",
                app.status === 'offer_accepted' && "border-green-500/50 bg-green-500/5"
              )}
            >
              <CardContent className="p-4">
                {/* Accepted Internship Banner */}
                {app.status === 'offer_accepted' && (
                  <div className="mb-4 pb-4 border-b border-green-500/30">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCheck className="h-5 w-5" />
                        <span className="font-semibold">Internship Confirmed!</span>
                        {diaryEntryCounts[app.id] !== undefined && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {diaryEntryCounts[app.id]} {diaryEntryCounts[app.id] === 1 ? 'Entry' : 'Entries'}
                          </Badge>
                        )}
                      </div>
                      {onNavigateToDiary && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToDiary();
                          }}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Go to Internship Diary
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div 
                    className="flex items-start gap-4 flex-1 cursor-pointer group"
                    onClick={() => navigate(`/internships/${app.internship.id}`)}
                  >
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {app.internship.title}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className={cn(
                        "text-muted-foreground",
                        app.status === 'offer_accepted' && "text-green-600 dark:text-green-400 font-medium"
                      )}>
                        <Building2 className={cn(
                          "h-4 w-4 inline-block mr-1",
                          app.status === 'offer_accepted' ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        )} />
                        {app.internship.company.name}
                      </p>
                      
                      {/* Internship Details */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        {app.internship.domain && (
                          <Badge variant="secondary" className="font-normal">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {app.internship.domain}
                          </Badge>
                        )}
                        {app.internship.location && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {app.internship.location}
                          </span>
                        )}
                        {app.internship.work_mode && (
                          <Badge variant="outline" className="capitalize font-normal">
                            {app.internship.work_mode}
                          </Badge>
                        )}
                        {app.internship.duration && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {app.internship.duration}
                          </span>
                        )}
                      </div>

                      {/* Payment Info */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        {app.internship.internship_type === 'paid' && app.internship.fees ? (
                          <span className="flex items-center gap-1 text-orange-600 font-medium">
                            <IndianRupee className="h-3 w-3" />
                            {app.internship.fees.toLocaleString('en-IN')} (Fees)
                          </span>
                        ) : app.internship.internship_type === 'stipended' && app.internship.stipend ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <IndianRupee className="h-3 w-3" />
                            {app.internship.stipend.toLocaleString('en-IN')} Stipend
                          </span>
                        ) : (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 font-normal">
                            Free
                          </Badge>
                        )}
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {getStatusBadge(app.status)}
                    <div className="flex gap-2">
                      {app.status === 'offer_released' && (
                        <Button
                          size="sm"
                          onClick={() => openConfirmDialog(app, 'accept')}
                          disabled={acceptingId === app.id}
                          className={isPaidInternship(app) 
                            ? "bg-orange-600 hover:bg-orange-700 text-white" 
                            : "bg-green-600 hover:bg-green-700 text-white"
                          }
                        >
                          {acceptingId === app.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Accepting...
                            </>
                          ) : isPaidInternship(app) ? (
                            <>
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay & Accept
                            </>
                          ) : (
                            <>
                              <CheckCheck className="h-4 w-4 mr-1" />
                              Accept Offer
                            </>
                          )}
                        </Button>
                      )}
                      {canWithdraw(app.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConfirmDialog(app, 'withdraw')}
                          disabled={withdrawingId === app.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {withdrawingId === app.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Withdrawing...
                            </>
                          ) : (
                            <>
                              <Undo2 className="h-4 w-4 mr-1" />
                              Withdraw
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'withdraw' 
                ? 'Withdraw Application'
                : confirmDialog.application && isPaidInternship(confirmDialog.application)
                  ? 'Pay & Accept Offer'
                  : 'Accept Offer'
              }
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {confirmDialog.application && (
                <>
                  {confirmDialog.type === 'withdraw' ? (
                    <>
                      <p>
                        Are you sure you want to withdraw your application for{' '}
                        <span className="font-semibold text-foreground">
                          {confirmDialog.application.internship.title}
                        </span>{' '}
                        at{' '}
                        <span className="font-semibold text-foreground">
                          {confirmDialog.application.internship.company.name}
                        </span>
                        ?
                      </p>
                      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mt-2">
                        <p className="text-destructive font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          This action cannot be undone
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You will not be able to apply again for this internship.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        Are you sure you want to accept the offer for{' '}
                        <span className="font-semibold text-foreground">
                          {confirmDialog.application.internship.title}
                        </span>{' '}
                        at{' '}
                        <span className="font-semibold text-foreground">
                          {confirmDialog.application.internship.company.name}
                        </span>
                        ?
                      </p>
                      {isPaidInternship(confirmDialog.application) && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-2">
                          <p className="text-orange-600 dark:text-orange-400 font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            This is a paid internship
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Fees: <span className="font-semibold text-orange-600">₹{confirmDialog.application.internship.fees?.toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone.
                      </p>
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {confirmDialog.type === 'withdraw' ? (
              <AlertDialogAction
                onClick={handleWithdraw}
                className="bg-destructive hover:bg-destructive/90"
              >
                Withdraw Application
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={handleAcceptOffer}
                className={confirmDialog.application && isPaidInternship(confirmDialog.application)
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
                }
              >
                {confirmDialog.application && isPaidInternship(confirmDialog.application)
                  ? 'Pay & Accept'
                  : 'Accept Offer'
                }
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
