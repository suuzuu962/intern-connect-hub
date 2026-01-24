import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Building2, GraduationCap, Mail, Loader2, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
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
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format');
type SignupStep = 'details' | 'verify-email' | 'complete';
type ForgotPasswordStep = 'email' | 'verify-otp' | 'new-password' | 'success';
const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    signIn
  } = useAuth();
  const {
    toast
  } = useToast();
  const initialMode = searchParams.get('mode') || 'login';
  const initialRole = searchParams.get('role') as AppRole || 'student';
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode as 'login' | 'signup');
  const [role, setRole] = useState<AppRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
      setResendCooldown(prev => {
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
          variant: 'destructive'
        });
        return;
      }
    }
    setLoading(true);
    const {
      error
    } = await signIn(email, password);
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    // Fetch user role to redirect appropriately
    const {
      data: session
    } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const {
        data: roleData
      } = await supabase.from('user_roles').select('role').eq('user_id', session.session.user.id).single();
      toast({
        title: 'Welcome back!'
      });
      if (roleData?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (roleData?.role === 'company') {
        navigate('/company/dashboard');
      } else if (roleData?.role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  };
  const handleSignupSubmit = async () => {
    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      phoneSchema.parse(phoneNumber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive'
        });
        return;
      }
    }
    if (!fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);

    // Sign up with email - auto-confirm is enabled, no OTP needed
    const {
      data,
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone_number: phoneNumber
        }
      }
    });
    if (error) {
      toast({
        title: 'Signup Failed',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    // With auto-confirm enabled, user is immediately signed in
    if (data.user && data.session) {
      // Update profile with phone number
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber
        })
        .eq('user_id', data.user.id);
      
      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Check if user role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      if (!existingRole) {
        // Create user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: role
          });
        if (roleError) {
          console.error('Error creating user role:', roleError);
          toast({
            title: 'Error',
            description: 'Failed to create user role. Please try again.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      // Create company or student record if it doesn't exist
      if (role === 'company') {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (!existingCompany) {
          const { error: companyError } = await supabase
            .from('companies')
            .insert({
              user_id: data.user.id,
              name: fullName,
              contact_person_phone: phoneNumber
            });
          if (companyError) {
            console.error('Error creating company:', companyError);
            toast({
              title: 'Error',
              description: 'Failed to create company profile. Please try again.',
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }
        }
      } else {
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (!existingStudent) {
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: data.user.id
            });
          if (studentError) {
            console.error('Error creating student:', studentError);
            toast({
              title: 'Error',
              description: 'Failed to create student profile. Please try again.',
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }
        }
      }

      toast({
        title: 'Account Created!',
        description: 'Your account has been created successfully'
      });
      navigate(role === 'company' ? '/company/dashboard' : '/student/dashboard');
    } else {
      toast({
        title: 'Error',
        description: 'Account created but session not established. Please try logging in.',
        variant: 'destructive'
      });
      setMode('login');
    }
    setLoading(false);
  };
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit code',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    const {
      data,
      error
    } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });
    if (error) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    if (data.user && data.session) {
      // Update profile with phone number (profile is created by trigger, so we update it)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber
        })
        .eq('user_id', data.user.id);
      
      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't block - profile might have been created by trigger
      }

      // Check if user role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      if (!existingRole) {
        // Create user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: role
          });
        if (roleError) {
          console.error('Error creating user role:', roleError);
          toast({
            title: 'Error',
            description: 'Failed to create user role. Please try again.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      // Create company or student record if it doesn't exist
      if (role === 'company') {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (!existingCompany) {
          const { error: companyError } = await supabase
            .from('companies')
            .insert({
              user_id: data.user.id,
              name: fullName,
              contact_person_phone: phoneNumber
            });
          if (companyError) {
            console.error('Error creating company:', companyError);
            toast({
              title: 'Error',
              description: 'Failed to create company profile. Please try again.',
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }
        }
      } else {
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (!existingStudent) {
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: data.user.id
            });
          if (studentError) {
            console.error('Error creating student:', studentError);
            toast({
              title: 'Error',
              description: 'Failed to create student profile. Please try again.',
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }
        }
      }

      toast({
        title: 'Account Verified!',
        description: 'Your account has been created successfully'
      });
      navigate(role === 'company' ? '/company/dashboard' : '/student/dashboard');
    } else {
      toast({
        title: 'Error',
        description: 'Verification successful but session not created. Please try logging in.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const {
      error
    } = await supabase.auth.resend({
      type: 'signup',
      email
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email'
      });
      startResendCooldown();
    }
    setLoading(false);
  };

  // Forgot Password Handlers
  const handleForgotPasswordRequest = async () => {
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive'
        });
        return;
      }
    }
    setLoading(true);
    const {
      error
    } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    toast({
      title: 'Reset Code Sent',
      description: 'Check your email for the verification code'
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
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    const {
      data,
      error
    } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery'
    });
    if (error) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive'
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
          variant: 'destructive'
        });
        return;
      }
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    const {
      error
    } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    setForgotPasswordStep('success');
    setLoading(false);
  };
  const handleResendResetOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const {
      error
    } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email'
      });
      startResendCooldown();
    }
    setLoading(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await handleLogin();
    } else if (mode === 'signup') {
      await handleSignupSubmit();
    }
  };
  const resetToDetails = () => {
    setSignupStep('details');
    setOtp('');
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
    if (mode === 'login') return 'Welcome Back';
    return 'Create Account';
  };
  const getDescription = () => {
    if (mode === 'forgot-password') {
      switch (forgotPasswordStep) {
        case 'email':
          return 'Enter your email to receive a reset code';
        case 'verify-otp':
          return `Enter the 6-digit code sent to ${email}`;
        case 'new-password':
          return 'Create a new secure password';
        case 'success':
          return 'Your password has been updated successfully';
      }
    }
    if (mode === 'login') return 'Sign in to your account';
    return 'Join Economic Labs today';
  };

  // Render Forgot Password Flow
  const renderForgotPassword = () => {
    switch (forgotPasswordStep) {
      case 'email':
        return <div className="space-y-4">
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
          </div>;
      case 'verify-otp':
        return <div className="space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="flex justify-center">
              <InputOTP value={otp} onChange={setOtp} maxLength={6}>
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
          </div>;
      case 'new-password':
        return <div className="space-y-4">
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
            </div>
            <div>
              <Label>Confirm Password <span className="text-destructive">*</span></Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button onClick={handleResetPassword} className="w-full gradient-primary border-0" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : 'Update Password'}
            </Button>
          </div>;
      case 'success':
        return <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <p className="text-muted-foreground">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Button onClick={resetToLogin} className="w-full gradient-primary border-0">
              Sign In
            </Button>
          </div>;
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      
      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">EL</span>
            </div>
          </Link>
          <CardTitle className="text-2xl font-heading">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>

        <CardContent>
          {mode === 'forgot-password' ? renderForgotPassword() : <>
              {mode === 'signup' && <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button type="button" variant={role === 'student' ? 'default' : 'outline'} className={role === 'student' ? 'gradient-primary border-0' : ''} onClick={() => setRole('student')}>
                    <GraduationCap className="h-4 w-4 mr-2" /> Student
                  </Button>
                  <Button type="button" variant={role === 'company' ? 'default' : 'outline'} className={role === 'company' ? 'gradient-primary border-0' : ''} onClick={() => setRole('company')}>
                    <Building2 className="h-4 w-4 mr-2" /> Company
                  </Button>
                </div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && <>
                    <div>
                      <Label>{role === 'company' ? 'Company Name' : 'Full Name'} <span className="text-destructive">*</span></Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={role === 'company' ? 'Acme Inc.' : 'John Doe'} />
                    </div>
                    <div>
                      <Label>Phone Number <span className="text-destructive">*</span></Label>
                      <PhoneInput value={phoneNumber} onChange={setPhoneNumber} />
                    </div>
                  </>}
                <div>
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <Label>Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {mode === 'login' && <div className="text-right">
                    <button type="button" onClick={() => setMode('forgot-password')} className="text-sm text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>}

                <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Please wait...</> : mode === 'login' ? 'Sign In' : 'Continue'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                {mode === 'login' ? <p>Don't have an account? <button onClick={() => setMode('signup')} className="text-primary font-medium">Sign up</button></p> : <p>Already have an account? <button onClick={() => setMode('login')} className="text-primary font-medium">Sign in</button></p>}
              </div>

              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground mb-2">Are you a University, College or Coordinator?</p>
                <Link to="/university-auth" className="text-sm text-primary font-medium hover:underline">
                  Login / Register here →
                </Link>
              </div>
            </>}
        </CardContent>
      </Card>
    </div>;
};
export default Auth;