import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Building2, GraduationCap, Mail, Loader2, ArrowLeft, KeyRound, CheckCircle, Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { recordFormLoad, validateNotBot } from '@/lib/bot-prevention';
import { PasswordStrength, getPasswordStrength } from '@/components/ui/password-strength';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format');

type SignupRole = 'student' | 'company' | 'university';
type ForgotPasswordStep = 'email' | 'verify-otp' | 'new-password' | 'success';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const initialMode = searchParams.get('mode') || 'login';
  const initialRole = (searchParams.get('role') as SignupRole) || 'student';

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode as 'login' | 'signup');
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [honeypot, setHoneypot] = useState('');

  const isInstitutionalRole = role === 'university';

  useEffect(() => {
    recordFormLoad('auth-form');
  }, []);

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const redirectByRole = (userRole: string) => {
    switch (userRole) {
      case 'admin': navigate('/admin/dashboard'); break;
      case 'company': navigate('/company/dashboard'); break;
      case 'student': navigate('/student/dashboard'); break;
      case 'university': navigate('/university/dashboard'); break;
      default: navigate('/');
    }
  };

  const handleLogin = async () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' });
        return;
      }
    }
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Log the login
      await supabase.from('login_logs').insert({
        user_id: authData.user.id,
        user_email: email,
        role: 'unknown',
        user_agent: navigator.userAgent,
      });

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      toast({ title: 'Welcome back!' });

      if (roleData?.role) {
        redirectByRole(roleData.role);
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  };

  const handleSignupSubmit = async () => {
    const botError = validateNotBot('auth-form', honeypot);
    if (botError) {
      toast({ title: 'Error', description: botError, variant: 'destructive' });
      return;
    }

    const strength = getPasswordStrength(password);
    if (strength.score < 3) {
      toast({ title: 'Weak Password', description: 'Please choose a stronger password that meets at least 3 of the requirements.', variant: 'destructive' });
      return;
    }

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      phoneSchema.parse(phoneNumber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' });
        return;
      }
    }

    if (!fullName.trim()) {
      toast({ title: 'Error', description: 'Please enter your name', variant: 'destructive' });
      return;
    }

    if (isInstitutionalRole && !institutionName.trim()) {
      toast({ title: 'Error', description: `Please enter ${role === 'university' ? 'university' : 'college'} name`, variant: 'destructive' });
      return;
    }

    setLoading(true);

    if (isInstitutionalRole) {
      // Use university-signup edge function for institutional roles
      const dbRole = 'university';
      const { data: functionData, error: functionError } = await supabase.functions.invoke('university-signup', {
        body: {
          email,
          password,
          fullName,
          role: dbRole,
          phoneNumber,
          institutionName,
          isCollegeAdmin: false,
        },
      });

      if (functionError || functionData?.error) {
        toast({ title: 'Signup Failed', description: functionData?.error || functionError?.message || 'Failed to create account', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Sign in after account creation
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast({ title: 'Account Created', description: 'Your account was created. Please log in.' });
        setMode('login');
        setLoading(false);
        return;
      }

      toast({
        title: 'Account Created!',
        description: role === 'university' ? 'Your university account is pending approval.' : 'Your college account is pending approval.',
      });
      redirectByRole(dbRole);
    } else {
      // Standard student/company signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName, phone_number: phoneNumber },
        },
      });

      if (error) {
        toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        await supabase.from('profiles').update({ full_name: fullName, phone_number: phoneNumber }).eq('user_id', data.user.id);

        const { data: existingRole } = await supabase.from('user_roles').select('id').eq('user_id', data.user.id).single();
        if (!existingRole) {
          const { error: roleError } = await supabase.from('user_roles').insert({ user_id: data.user.id, role: role as AppRole });
          if (roleError) {
            console.error('Error creating user role:', roleError);
            toast({ title: 'Error', description: 'Failed to create user role.', variant: 'destructive' });
            setLoading(false);
            return;
          }
        }

        if (role === 'company') {
          const { data: existing } = await supabase.from('companies').select('id').eq('user_id', data.user.id).single();
          if (!existing) {
            await supabase.from('companies').insert({ user_id: data.user.id, name: fullName, contact_person_phone: phoneNumber });
          }
        } else {
          const { data: existing } = await supabase.from('students').select('id').eq('user_id', data.user.id).single();
          if (!existing) {
            await supabase.from('students').insert({ user_id: data.user.id });
          }
        }

        toast({ title: 'Account Created!', description: 'Your account has been created successfully' });
        redirectByRole(role);
      } else {
        toast({ title: 'Error', description: 'Account created but session not established. Please try logging in.', variant: 'destructive' });
        setMode('login');
      }
    }
    setLoading(false);
  };

  // Forgot Password Handlers
  const handleForgotPasswordRequest = async () => {
    try { emailSchema.parse(email); } catch (err) {
      if (err instanceof z.ZodError) { toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' }); return; }
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=reset` });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setLoading(false); return; }
    toast({ title: 'Reset Code Sent', description: 'Check your email for the verification code' });
    setForgotPasswordStep('verify-otp');
    startResendCooldown();
    setLoading(false);
  };

  const handleVerifyResetOtp = async () => {
    if (otp.length !== 6) { toast({ title: 'Error', description: 'Please enter a valid 6-digit code', variant: 'destructive' }); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });
    if (error) { toast({ title: 'Verification Failed', description: error.message, variant: 'destructive' }); setLoading(false); return; }
    if (data.session) setForgotPasswordStep('new-password');
    setLoading(false);
  };

  const handleResetPassword = async () => {
    try { passwordSchema.parse(newPassword); } catch (err) {
      if (err instanceof z.ZodError) { toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' }); return; }
    }
    if (newPassword !== confirmPassword) { toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setLoading(false); return; }
    setForgotPasswordStep('success');
    setLoading(false);
  };

  const handleResendResetOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=reset` });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Code Resent', description: 'A new verification code has been sent to your email' }); startResendCooldown(); }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth?mode=login` },
    });
    if (error) { toast({ title: 'Google Sign In Failed', description: error.message, variant: 'destructive' }); setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') await handleLogin();
    else if (mode === 'signup') await handleSignupSubmit();
  };

  const resetToLogin = () => {
    setMode('login');
    setForgotPasswordStep('email');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const getTitle = () => {
    if (mode === 'forgot-password') {
      switch (forgotPasswordStep) {
        case 'email': return 'Forgot Password';
        case 'verify-otp': return 'Verify Your Email';
        case 'new-password': return 'Set New Password';
        case 'success': return 'Password Reset Complete';
      }
    }
    if (mode === 'login') return 'Welcome Back';
    return 'Create Account';
  };

  const getDescription = () => {
    if (mode === 'forgot-password') {
      switch (forgotPasswordStep) {
        case 'email': return 'Enter your email to receive a reset code';
        case 'verify-otp': return `Enter the 6-digit code sent to ${email}`;
        case 'new-password': return 'Create a new secure password';
        case 'success': return 'Your password has been updated successfully';
      }
    }
    if (mode === 'login') return 'Sign in to your account';
    return 'Join Economic Labs today';
  };

  const renderForgotPassword = () => {
    switch (forgotPasswordStep) {
      case 'email':
        return (
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button onClick={handleForgotPasswordRequest} className="w-full gradient-primary border-0" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : 'Send Reset Code'}
            </Button>
            <button onClick={resetToLogin} className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 w-full mt-4">
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </button>
          </div>
        );
      case 'verify-otp':
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="flex justify-center">
              <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                  <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerifyResetOtp} className="w-full gradient-primary border-0" disabled={loading || otp.length !== 6}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : 'Verify Code'}
            </Button>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?{' '}
                <button onClick={handleResendResetOtp} disabled={resendCooldown > 0 || loading} className="text-primary font-medium disabled:opacity-50">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </p>
              <button onClick={() => setForgotPasswordStep('email')} className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 w-full">
                <ArrowLeft className="h-3 w-3" /> Change email address
              </button>
            </div>
          </div>
        );
      case 'new-password':
        return (
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <Label>New Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <PasswordStrength password={newPassword} className="mt-2" />
            </div>
            <div>
              <Label>Confirm Password <span className="text-destructive">*</span></Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button onClick={handleResetPassword} className="w-full gradient-primary border-0" disabled={loading || getPasswordStrength(newPassword).score < 3}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : 'Update Password'}
            </Button>
          </div>
        );
      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <p className="text-muted-foreground">Your password has been reset successfully. You can now sign in with your new password.</p>
            <Button onClick={resetToLogin} className="w-full gradient-primary border-0">Sign In</Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <span className="text-3xl font-bold text-white">EL</span>
          </div>
          <h2 className="text-4xl font-heading font-bold text-white mb-4">
            Launch Your Career Journey
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Connect with top companies, gain real-world experience, and build your professional future with Economic Labs.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="text-2xl font-bold text-white">500+</span>
              <p className="text-white/60 text-sm">Active Internships</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="text-2xl font-bold text-white">10K+</span>
              <p className="text-white/60 text-sm">Students Placed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md border-0 shadow-xl bg-card">
          <CardHeader className="text-center pb-2">
            <Link to="/" className="flex items-center justify-center gap-2 mb-6 lg:hidden">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">EL</span>
              </div>
              <span className="text-xl font-heading font-bold">Economic Labs</span>
            </Link>
            <CardTitle className="text-2xl font-heading">{getTitle()}</CardTitle>
            <CardDescription className="text-muted-foreground">{getDescription()}</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {mode === 'forgot-password' ? renderForgotPassword() : (
              <>
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <Button type="button" variant={role === 'student' ? 'default' : 'outline'} size="sm"
                      className={role === 'student' ? 'gradient-primary border-0 shadow-md' : ''}
                      onClick={() => setRole('student')}>
                      <GraduationCap className="h-4 w-4 mr-1" /> Student
                    </Button>
                    <Button type="button" variant={role === 'company' ? 'default' : 'outline'} size="sm"
                      className={role === 'company' ? 'gradient-primary border-0 shadow-md' : ''}
                      onClick={() => setRole('company')}>
                      <Building2 className="h-4 w-4 mr-1" /> Company
                    </Button>
                    <Button type="button" variant={role === 'university' ? 'default' : 'outline'} size="sm"
                      className={role === 'university' ? 'gradient-primary border-0 shadow-md' : ''}
                      onClick={() => setRole('university')}>
                      <Building className="h-4 w-4 mr-1" /> University
                    </Button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <>
                      {isInstitutionalRole && (
                        <div>
                          <Label className="text-sm font-medium">{role === 'university' ? 'University Name' : 'College Name'} <span className="text-destructive">*</span></Label>
                          <Input value={institutionName} onChange={e => setInstitutionName(e.target.value)}
                            placeholder={role === 'university' ? 'e.g., XYZ University' : 'e.g., ABC College'} className="mt-1.5 h-11" />
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium">
                          {role === 'company' ? 'Company Name' : isInstitutionalRole ? 'Contact Person Name' : 'Full Name'} <span className="text-destructive">*</span>
                        </Label>
                        <Input value={fullName} onChange={e => setFullName(e.target.value)}
                          placeholder={role === 'company' ? 'Acme Inc.' : 'John Doe'} className="mt-1.5 h-11" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone Number <span className="text-destructive">*</span></Label>
                        <div className="mt-1.5"><PhoneInput value={phoneNumber} onChange={setPhoneNumber} /></div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-sm font-medium">Email <span className="text-destructive">*</span></Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 h-11" />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Password <span className="text-destructive">*</span></Label>
                    <div className="relative mt-1.5">
                      <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pr-10" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-11 w-11" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {mode === 'signup' && <PasswordStrength password={password} className="mt-2" />}
                  </div>

                  {/* Honeypot field */}
                  <div className="absolute opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
                    <Input type="text" name="website_url" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
                  </div>

                  {mode === 'login' && (
                    <div className="text-right">
                      <button type="button" onClick={() => setMode('forgot-password')} className="text-sm text-primary hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 gradient-primary border-0 shadow-md hover:shadow-lg transition-shadow"
                    disabled={loading || (mode === 'signup' && getPasswordStrength(password).score < 3)}>
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Please wait...</> : mode === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>

                {mode === 'login' && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="w-full h-11 hover:shadow-sm transition-shadow" onClick={handleGoogleSignIn} disabled={loading}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </Button>
                  </>
                )}

                <div className="mt-6 text-center text-sm">
                  {mode === 'login' ? (
                    <p className="text-muted-foreground">Don't have an account? <button onClick={() => setMode('signup')} className="text-primary font-semibold hover:underline">Sign up</button></p>
                  ) : (
                    <p className="text-muted-foreground">Already have an account? <button onClick={() => setMode('login')} className="text-primary font-semibold hover:underline">Sign in</button></p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
