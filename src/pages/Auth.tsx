import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Building2, GraduationCap, Phone, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const initialMode = searchParams.get('mode') || 'login';
  const initialRole = (searchParams.get('role') as AppRole) || 'student';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode as 'login' | 'signup');
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
        toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' });
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!' });
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
        toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' });
        return;
      }
    }

    if (!fullName.trim()) {
      toast({ title: 'Error', description: 'Please enter your name', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Sign up with email - this will send OTP to email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    });

    if (error) {
      toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Move to OTP verification step
    toast({ title: 'Verification Code Sent', description: 'Please check your email for the OTP code' });
    setSignupStep('verify-email');
    startResendCooldown();
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter a valid 6-digit code', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      toast({ title: 'Verification Failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile with phone number
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        email,
        full_name: fullName,
        phone_number: phoneNumber,
      });

      // Create user role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: role,
      });

      // Create company or student record
      if (role === 'company') {
        await supabase.from('companies').insert({
          user_id: data.user.id,
          name: fullName,
          contact_person_phone: phoneNumber,
        });
      } else {
        await supabase.from('students').insert({
          user_id: data.user.id,
        });
      }

      toast({ title: 'Account Verified!', description: 'Your account has been created successfully' });
      navigate(role === 'company' ? '/company/dashboard' : '/');
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
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Code Resent', description: 'A new verification code has been sent to your email' });
      startResendCooldown();
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      await handleLogin();
    } else if (signupStep === 'details') {
      await handleSignupSubmit();
    } else if (signupStep === 'verify-email') {
      await handleVerifyOtp();
    }
  };

  const resetToDetails = () => {
    setSignupStep('details');
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      
      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">EL</span>
            </div>
          </Link>
          <CardTitle className="text-2xl font-heading">
            {mode === 'login' 
              ? 'Welcome Back' 
              : signupStep === 'verify-email' 
                ? 'Verify Your Email' 
                : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Sign in to your account' 
              : signupStep === 'verify-email'
                ? `Enter the 6-digit code sent to ${email}`
                : 'Join Economic Labs today'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {mode === 'signup' && signupStep === 'verify-email' ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                >
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

              <Button
                onClick={handleVerifyOtp}
                className="w-full gradient-primary border-0"
                disabled={loading || otp.length !== 6}
              >
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : 'Verify Email'}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{' '}
                  <button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-primary font-medium disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </p>
                <button
                  onClick={resetToDetails}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 w-full"
                >
                  <ArrowLeft className="h-3 w-3" /> Change email address
                </button>
              </div>
            </div>
          ) : (
            <>
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button
                    type="button"
                    variant={role === 'student' ? 'default' : 'outline'}
                    className={role === 'student' ? 'gradient-primary border-0' : ''}
                    onClick={() => setRole('student')}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" /> Student
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'company' ? 'default' : 'outline'}
                    className={role === 'company' ? 'gradient-primary border-0' : ''}
                    onClick={() => setRole('company')}
                  >
                    <Building2 className="h-4 w-4 mr-2" /> Company
                  </Button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <Label>{role === 'company' ? 'Company Name' : 'Full Name'} <span className="text-destructive">*</span></Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={role === 'company' ? 'Acme Inc.' : 'John Doe'}
                      />
                    </div>
                    <div>
                      <Label>Phone Number <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+91 9876543210"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <Label>Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Please wait...</>
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                {mode === 'login' ? (
                  <p>Don't have an account? <button onClick={() => setMode('signup')} className="text-primary font-medium">Sign up</button></p>
                ) : (
                  <p>Already have an account? <button onClick={() => setMode('login')} className="text-primary font-medium">Sign in</button></p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
