import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, MessageCircle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
  featureKey?: string;
}

export const ScheduleMeetingDialog = ({
  open,
  onOpenChange,
  featureLabel,
  featureKey,
}: ScheduleMeetingDialogProps) => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    preferredDate: '',
    preferredTime: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      const { error } = await supabase.from('upgrade_requests').insert({
        user_id: user.id,
        user_email: profile?.email || user.email || '',
        user_name: profile?.full_name || 'User',
        user_role: role || 'unknown',
        feature_requested: featureKey || featureLabel || 'General Upgrade',
        preferred_date: form.preferredDate || null,
        preferred_time: form.preferredTime || null,
        phone: form.phone || null,
        message: form.message || null,
        whatsapp_contact: form.phone || null,
      } as any);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Request Submitted!',
        description: 'Our team will contact you shortly to schedule your meeting.',
      });
    } catch (err) {
      console.error('Error submitting upgrade request:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (submitted) {
      setTimeout(() => {
        setSubmitted(false);
        setForm({ preferredDate: '', preferredTime: '', phone: '', message: '' });
      }, 300);
    }
  };

  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(
    `Hi, I'm interested in upgrading my access for "${featureLabel || 'premium features'}". Please schedule a 1:1 meeting.`
  )}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule a 1:1 Meeting
          </DialogTitle>
          <DialogDescription>
            {featureLabel
              ? `Unlock "${featureLabel}" by scheduling a meeting with our team.`
              : 'Get access to premium features by scheduling a meeting with our team.'}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Request Submitted!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Our team will reach out to you shortly to confirm your meeting time.
            </p>
            <Button onClick={handleClose} className="mt-2">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => setForm(f => ({ ...f, preferredDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Preferred Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.preferredTime}
                  onChange={(e) => setForm(f => ({ ...f, preferredTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone / WhatsApp Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you're looking for..."
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Request
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.open(whatsappLink, '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact via WhatsApp
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
