import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Building2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/database';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const initialMode = searchParams.get('mode') || 'login';
  const initialRole = (searchParams.get('role') as AppRole) || 'student';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode as 'login' | 'signup');
  const [role, setRole] = useState<AppRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' });
        setLoading(false);
        return;
      }
    }

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Welcome back!' });
        navigate('/');
      }
    } else {
      if (!fullName.trim()) {
        toast({ title: 'Error', description: 'Please enter your name', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, role, fullName);
      if (error) {
        toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Account created successfully!' });
        navigate(role === 'company' ? '/company/dashboard' : '/student/dashboard');
      }
    }
    setLoading(false);
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
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Sign in to your account' : 'Join Economic Labs today'}
          </CardDescription>
        </CardHeader>

        <CardContent>
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
              <div>
                <Label>{role === 'company' ? 'Company Name' : 'Full Name'}</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'company' ? 'Acme Inc.' : 'John Doe'}
                />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label>Password</Label>
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
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === 'login' ? (
              <p>Don't have an account? <button onClick={() => setMode('signup')} className="text-primary font-medium">Sign up</button></p>
            ) : (
              <p>Already have an account? <button onClick={() => setMode('login')} className="text-primary font-medium">Sign in</button></p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;