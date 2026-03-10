import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock, Loader2, Shield, AlertTriangle, Mail, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrength, getPasswordStrength } from '@/components/ui/password-strength';

export const ChangePassword = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    setError('');
    setSaving(true);

    // Send password reset email (acts as OTP)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
      redirectTo: `${window.location.origin}/company-dashboard`,
    });

    setSaving(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      toast.success('Verification email sent! Check your inbox.');
      setStep('verify');
    }
  };

  const handleChangePassword = async () => {
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setStep('success');
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="h-6 w-6" />
          Change Password
        </h1>
        <p className="text-muted-foreground">Secure your account with a new password</p>
      </div>

      {step === 'request' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Request Password Change
            </CardTitle>
            <CardDescription>
              We'll send a verification email to confirm your identity before changing your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Email: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRequestOtp}
              disabled={saving}
              className="w-full gradient-primary border-0"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Email'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              A verification link will be sent to your email address
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Set New Password
            </CardTitle>
            <CardDescription>
              Enter your new password. Make sure it's strong and unique.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                We've sent a verification email to <strong>{user?.email}</strong>.
                If you clicked the link in that email, you can now set your new password below.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
              <PasswordStrength password={newPassword} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('request')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={saving || getPasswordStrength(newPassword).score < 3}
                className="flex-1 gradient-primary border-0"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'success' && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Password Updated!</h3>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully changed. Use your new password next time you log in.
            </p>
            <Button onClick={() => setStep('request')} variant="outline">
              Done
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Account Security Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <div>
              <p className="font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <div>
              <p className="font-medium">Account Created</p>
              <p className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium">Last Sign In</p>
              <p className="text-sm text-muted-foreground">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
