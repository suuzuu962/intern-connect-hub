import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, FileText, LogIn } from 'lucide-react';
import { Internship } from '@/types/database';
import { DialogSkeleton } from '@/components/ui/dialog-skeleton';
import { SignedLink } from '@/components/ui/signed-link';

interface ApplyModalProps {
  internship: Internship;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ApplyModal = ({ internship, open, onOpenChange, onSuccess }: ApplyModalProps) => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (open && user && role === 'student') {
      checkApplicationStatus();
    }
  }, [open, user, role]);

  const checkApplicationStatus = async () => {
    setCheckingStatus(true);
    try {
      // Get student record
      const { data: studentData } = await supabase
        .from('students')
        .select('id, resume_url')
        .eq('user_id', user?.id)
        .single();

      if (studentData) {
        setStudentId(studentData.id);
        setResumeUrl(studentData.resume_url);

        // Check if already applied
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('student_id', studentData.id)
          .eq('internship_id', internship.id)
          .single();

        setAlreadyApplied(!!existingApp);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleApply = async () => {
    if (!studentId) {
      toast.error('Please complete your student profile first');
      return;
    }

    if (!resumeUrl) {
      toast.error('Please upload your resume in your profile before applying');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('applications').insert({
        internship_id: internship.id,
        student_id: studentId,
        cover_letter: coverLetter || null,
        resume_url: resumeUrl,
        status: 'applied',
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this internship');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Application submitted successfully!');
      setCoverLetter('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              Please sign in as a student to apply for internships.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <LogIn className="h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground mb-4">
              Create an account or sign in to apply for this internship.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => navigate('/auth?mode=signup&role=student')}>
              Sign Up as Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Logged in but not as student
  if (role !== 'student') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Account Required</DialogTitle>
            <DialogDescription>
              Only students can apply for internships.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-muted-foreground">
              You're currently logged in as a company. Please sign in with a student account to apply.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for {internship.title}</DialogTitle>
          <DialogDescription>
            at {internship.company?.name || 'Company'}
          </DialogDescription>
        </DialogHeader>

        {checkingStatus ? (
          <div className="py-4">
            <DialogSkeleton 
              lines={3} 
              showHeader={false} 
              showActions={true} 
              showAvatar={false}
            />
          </div>
        ) : alreadyApplied ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Already Applied</h3>
            <p className="text-muted-foreground">
              You have already applied to this internship. Check your dashboard for status updates.
            </p>
          </div>
        ) : !resumeUrl ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Resume Required</h3>
            <p className="text-muted-foreground mb-4">
              Please upload your resume in your profile before applying for internships.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Go to Profile
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Resume Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <FileText className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Resume attached from your profile
                  </p>
                </div>
                <SignedLink
                  href={resumeUrl}
                  className="text-sm text-primary hover:underline"
                >
                  View
                </SignedLink>
              </div>

              {/* Cover Letter */}
              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Tell the employer why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  A good cover letter can increase your chances of getting selected.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};