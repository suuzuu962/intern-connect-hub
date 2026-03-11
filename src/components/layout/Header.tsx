import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, Users, Plus, Building2, Settings, Shield, Briefcase, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/internships', label: 'Internships' },
  { href: '/companies', label: 'Companies' },
  { href: '/about', label: 'About Us' },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCompanyVerified, setIsCompanyVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    const fetchCompanyStatus = async () => {
      if (user && role === 'company') {
        const { data } = await supabase
          .from('companies')
          .select('is_verified')
          .eq('user_id', user.id)
          .single();
        setIsCompanyVerified(data?.is_verified ?? false);
      }
    };
    fetchCompanyStatus();
  }, [user, role]);

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'company') return '/company/dashboard';
    if (role === 'student') return '/student/dashboard';
    return '/';
  };

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <span className="text-xl font-bold text-primary-foreground">EL</span>
            </div>
            <span className="text-xl font-heading font-bold text-foreground">
              Economic Labs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to={getDashboardLink()}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
                  location.pathname.includes('/dashboard')
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardLink()} className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {role === 'company' && (
                      <>
                        {isCompanyVerified && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link to="/company/dashboard?section=applicants" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Applicants
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/company/dashboard?section=create-internship" className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create Internship
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem asChild>
                          <Link to="/company/dashboard?section=profile" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Company Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/company/dashboard?section=change-password" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Change Password
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {role === 'student' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/student/dashboard?section=profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/student/dashboard?section=applied" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Applied Internships
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/student/dashboard?section=diary" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Internship Diary
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/student/dashboard?section=change-password" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Change Password
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {role === 'admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/dashboard?section=companies" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Manage Companies
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/dashboard?section=internships" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Manage Internships
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/dashboard?section=students" className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Manage Students
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth?mode=login">Log In</Link>
                </Button>
                <Button asChild className="gradient-primary border-0">
                  <Link to="/auth?mode=signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary px-2 py-2",
                    location.pathname === link.href
                      ? "text-primary bg-primary/5 rounded-lg"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary px-2 py-2 flex items-center gap-2",
                    location.pathname.includes('/dashboard')
                      ? "text-primary bg-primary/5 rounded-lg"
                      : "text-muted-foreground"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              {!user && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button variant="ghost" asChild className="justify-start">
                    <Link to="/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                  <Button asChild className="gradient-primary border-0">
                    <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
