import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, 
  Users, 
  BarChart3, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  BookOpen,
  Building2,
  ClipboardList,
  UserCheck,
  FileText,
  Bell
} from 'lucide-react';

const ForUniversities = () => {
  const benefits = [
    {
      icon: Users,
      title: 'Centralized Student Management',
      description: 'Track all your students across multiple colleges from a single dashboard. View internship progress, diary entries, and placement statistics.'
    },
    {
      icon: Building2,
      title: 'Multi-College Support',
      description: 'Add and manage multiple colleges under your university. Assign coordinators to oversee student activities at each college.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Access comprehensive reports on student placements, internship completion rates, and company partnerships.'
    },
    {
      icon: ClipboardList,
      title: 'Internship Diary Tracking',
      description: 'Monitor student internship diaries with approval workflows. Ensure quality documentation of practical learning.'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with role-based access control. Protect student data while enabling collaboration.'
    },
    {
      icon: Bell,
      title: 'Automated Notifications',
      description: 'Stay informed with real-time updates on student applications, diary submissions, and important milestones.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Register Your University',
      description: 'Create your university account with basic details. Our team will verify your credentials within 24 hours.'
    },
    {
      number: '02',
      title: 'Add Your Colleges',
      description: 'Set up colleges under your university umbrella. Add contact persons and configure college-specific settings.'
    },
    {
      number: '03',
      title: 'Assign Coordinators',
      description: 'Invite college coordinators to manage students and approve internship diaries at their respective colleges.'
    },
    {
      number: '04',
      title: 'Onboard Students',
      description: 'Students register and link to their college. Start tracking their internship journey from day one.'
    }
  ];

  const features = [
    { icon: UserCheck, text: 'Coordinator management with approval workflow' },
    { icon: FileText, text: 'Bulk student data export for reports' },
    { icon: GraduationCap, text: 'College-wise student analytics' },
    { icon: BookOpen, text: 'Internship diary review and approval' }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-medium">For Universities & Colleges</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Empower Your Institution with{' '}
              <span className="gradient-text">Smart Internship Management</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Streamline student internships, track progress across colleges, and build stronger 
              industry connections—all from one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground">
                <Link to="/university-auth">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Why Universities Choose Us
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join leading institutions that trust our platform to manage student internships effectively.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover-lift border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From registration to full deployment—we make onboarding smooth and hassle-free.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-heading font-bold text-primary/10 mb-4">
                  {step.number}
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="h-6 w-6 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features List Section */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                Everything You Need to Manage Internships
              </h2>
              <p className="text-background/70 mb-8">
                Our comprehensive platform provides all the tools universities and colleges need 
                to streamline internship programs and ensure student success.
              </p>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-background/90">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-background/10 rounded-2xl p-8 backdrop-blur-sm border border-background/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-background/10 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>University verified and active</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-background/10 rounded-xl">
                    <Building2 className="h-5 w-5 text-info" />
                    <span>12 colleges connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-background/10 rounded-xl">
                    <Users className="h-5 w-5 text-warning" />
                    <span>2,450 students enrolled</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-background/10 rounded-xl">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <span>89% internship completion rate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Internship Program?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join universities across India that are already using our platform to connect 
              students with meaningful internship opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground">
                <Link to="/university-auth">
                  Register Your University <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/university-auth">
                  Already Registered? Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ForUniversities;
