import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Building, Users, Mail, Loader2, ArrowLeft, KeyRound, CheckCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format');

type SignupStep = 'details' | 'verify-email' | 'complete';
type ForgotPasswordStep = 'email' | 'verify-otp' | 'new-password' | 'success';

const UniversityAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialMode = searchParams.get('mode') || 'login';
  const initialRole = (searchParams.get('role') as 'university' | 'college' | 'college_coordinator') || 'university';

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode as 'login' | 'signup');
  const [role, setRole] = useState<'university' | 'college' | 'college_coordinator'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [signupStep, setSignupStep] = useState<SignupStep>('details');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot password state
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = async () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Log the login
      await supabase.from('login_logs').insert({
        user_id: authData.user.id,
        user_email: email,
        role: role,
        user_agent: navigator.userAgent,
      });

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      toast({ title: 'Welcome back!' });

      if (roleData?.role === 'university') {
        navigate('/university/dashboard');
      } else if (roleData?.role === 'college_coordinator') {
        // Both college admins and coordinators use the same role
        navigate('/coordinator/dashboard');
      } else {
        toast({
          title: 'Access Denied',
          description: 'This login is for universities, colleges and coordinators only.',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
      }
    }

    setLoading(false);
  };

  const handleSignupSubmit = async () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      phoneSchema.parse(phoneNumber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    if (!fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    if (!institutionName.trim()) {
      toast({
        title: 'Error',
        description: `Please enter ${role === 'university' ? 'university' : 'college'} name`,
        variant: 'destructive',
      });
      return;
    }

    // Map 'college' role to 'college_coordinator' for database (since college admins use same role)
    const dbRole = role === 'college' ? 'college_coordinator' : role;

    setLoading(true);

    // Use the university-signup edge function to create user without email verification
    const { data: functionData, error: functionError } = await supabase.functions.invoke('university-signup', {
      body: {
        email,
        password,
        fullName,
        role: dbRole,
        phoneNumber,
        institutionName,
        isCollegeAdmin: role === 'college',
      },
    });

    if (functionError || functionData?.error) {
      toast({
        title: 'Signup Failed',
        description: functionData?.error || functionError?.message || 'Failed to create account',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Sign in the user directly after account creation
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      toast({
        title: 'Account Created',
        description: 'Your account was created. Please log in.',
      });
      setMode('login');
      setLoading(false);
      return;
    }

    toast({
      title: 'Account Created!',
      description: role === 'university' 
        ? 'Your university account is pending approval.' 
        : role === 'college'
        ? 'Your college account is pending approval.'
        : 'Your account is pending university approval.',
    });

    if (role === 'university') {
      navigate('/university/dashboard');
    } else if (role === 'college') {
      navigate('/college/dashboard');
    } else {
      navigate('/coordinator/dashboard');
    }

    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      // Update profile
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
        })
        .eq('user_id', data.user.id);

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      // Map 'college' role to 'college_coordinator' for database
      const dbRole = role === 'college' ? 'college_coordinator' : role;

      if (!existingRole) {
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: dbRole as 'university' | 'college_coordinator',
        });

        if (roleError) {
          console.error('Error creating user role:', roleError);
          toast({
            title: 'Error',
            description: 'Failed to create user role. Please try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Create university or college coordinator record
      if (role === 'university') {
        const { error: universityError } = await supabase.from('universities').insert({
          user_id: data.user.id,
          name: institutionName,
          email: email,
          contact_person_name: fullName,
          contact_person_email: email,
          contact_person_phone: phoneNumber,
        });

        if (universityError) {
          console.error('Error creating university:', universityError);
          toast({
            title: 'Error',
            description: 'Failed to create university profile.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        toast({
          title: 'Account Created!',
          description: 'Your university account is pending approval.',
        });
        navigate('/university/dashboard');
      } else {
        const { error: coordinatorError } = await supabase.from('college_coordinators').insert({
          user_id: data.user.id,
          name: fullName,
          email: email,
          phone: phoneNumber,
          is_approved: false,
        });

        if (coordinatorError) {
          console.error('Error creating coordinator:', coordinatorError);
          toast({
            title: 'Error',
            description: 'Failed to create coordinator profile.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        toast({
          title: 'Account Created!',
          description: 'Your account is pending university approval.',
        });
        navigate('/coordinator/dashboard');
      }
    }

    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email',
      });
      startResendCooldown();
    }
    setLoading(false);
  };

  const handleForgotPasswordRequest = async () => {
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/university-auth?mode=reset`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Reset Code Sent',
      description: 'Check your email for the verification code',
    });
    setForgotPasswordStep('verify-otp');
    startResendCooldown();
    setLoading(false);
  };

  const handleVerifyResetOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });

    if (error) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (data.session) {
      setForgotPasswordStep('new-password');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setForgotPasswordStep('success');
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await handleLogin();
    } else if (mode === 'signup') {
      if (signupStep === 'details') {
        await handleSignupSubmit();
      } else if (signupStep === 'verify-email') {
        await handleVerifyOtp();
      }
    }
  };

  const getTitle = () => {
    if (mode === 'forgot-password') {
      switch (forgotPasswordStep) {
        case 'email':
          return 'Forgot Password';
        case 'verify-otp':
          return 'Verify Your Email';
        case 'new-password':
          return 'Set New Password';
        case 'success':
          return 'Password Reset Complete';
      }
    }
    if (mode === 'signup' && signupStep === 'verify-email') {
      return 'Verify Your Email';
    }
    return mode === 'login' ? 'Welcome Back' : 'Create Account';
  };

  const getDescription = () => {
    if (mode === 'forgot-password') {
      switch (forgotPasswordStep) {
        case 'email':
          return 'Enter your email to receive a reset code';
        case 'verify-otp':
          return `Enter the 6-digit code sent to ${email}`;
        case 'new-password':
          return 'Create a new password for your account';
        case 'success':
          return 'Your password has been updated successfully';
      }
    }
    if (mode === 'signup' && signupStep === 'verify-email') {
      return `Enter the 6-digit code sent to ${email}`;
    }
    return mode === 'login'
      ? 'Sign in to your institution account'
      : 'Register your institution';
  };

  const renderForgotPassword = () => {
    if (forgotPasswordStep === 'success') {
      return (
        <div className="space-y-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <p className="text-muted-foreground">You can now sign in with your new password.</p>
          <Button onClick={() => { setMode('login'); setForgotPasswordStep('email'); }} className="w-full">
            Back to Login
          </Button>
        </div>
      );
    }

    if (forgotPasswordStep === 'new-password') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleResetPassword} className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Reset Password
          </Button>
        </div>
      );
    }

    if (forgotPasswordStep === 'verify-otp') {
      return (
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button onClick={handleVerifyResetOtp} className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify Code
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPasswordRequest}
              disabled={resendCooldown > 0 || loading}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={handleForgotPasswordRequest} className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Send Reset Code
        </Button>
        <button
          type="button"
          onClick={() => setMode('login')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link to="/" className="text-2xl font-bold text-primary">
              InternHub
            </Link>
          </div>
          {/* Role indicator badge */}
          {mode !== 'forgot-password' && (
            <div className="flex justify-center mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                role === 'university' 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : role === 'college'
                  ? 'bg-accent text-accent-foreground border border-accent'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}>
                {role === 'university' ? (
                  <Building className="h-3 w-3" />
                ) : role === 'college' ? (
                  <GraduationCap className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {role === 'university' ? 'University Login' : role === 'college' ? 'College Login' : 'College Coordinator Login'}
              </span>
            </div>
          )}
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>

        <CardContent>
          {mode === 'forgot-password' ? (
            renderForgotPassword()
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selection for both login and signup */}
              {(mode === 'login' || (mode === 'signup' && signupStep === 'details')) && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Button
                    type="button"
                    variant={role === 'university' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setRole('university')}
                  >
                    <Building className="h-5 w-5" />
                    <span className="text-xs">University</span>
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'college' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setRole('college')}
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span className="text-xs">College</span>
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'college_coordinator' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => setRole('college_coordinator')}
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Coordinator</span>
                  </Button>
                </div>
              )}

              {mode === 'signup' && signupStep === 'verify-email' ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Verify Email
                  </Button>
                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || loading}
                      className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </button>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSignupStep('details');
                          setOtp('');
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Change email
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {mode === 'signup' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="institutionName">
                          {role === 'university' ? 'University Name' : 'College Name'}
                        </Label>
                        <Input
                          id="institutionName"
                          placeholder={role === 'university' ? 'e.g., VTU University' : 'e.g., ABC Engineering College'}
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Contact Person Name</Label>
                        <Input
                          id="fullName"
                          placeholder="Your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@institution.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot-password')}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <PhoneInput
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>
                </>
              )}
            </form>
          )}

          {mode !== 'forgot-password' && signupStep === 'details' && (
            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
              <p className="mt-2 text-muted-foreground">
                <Link to="/auth" className="hover:underline">
                  Login as Student/Company
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversityAuth;
