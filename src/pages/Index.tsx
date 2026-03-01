import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, Users, CheckCircle, Rocket, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { HomeBanners } from '@/components/home/HomeBanners';
import { WorkFunnelSection } from '@/components/home/WorkFunnelSection';

const Index = () => {
  const steps = [
    { icon: Users, title: 'Create Profile', description: 'Sign up as a student or company' },
    { icon: Target, title: 'Find Matches', description: 'Browse internships or talented students' },
    { icon: Briefcase, title: 'Apply/Post', description: 'Submit applications or post openings' },
    { icon: Award, title: 'Get Started', description: 'Begin your internship journey' },
  ];

  const stats = [
    { value: '500+', label: 'Active Internships' },
    { value: '200+', label: 'Partner Companies' },
    { value: '10K+', label: 'Students Placed' },
    { value: '95%', label: 'Success Rate' },
  ];

  return (
    <Layout>
      {/* Hero Banners */}
      <div className="container mx-auto px-4 pt-6">
        <HomeBanners position="hero" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-28">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight animate-slide-up">
              Launch Your Career with{' '}
              <span className="gradient-text">Dream Internships</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Connect with top companies, gain real-world experience, and kickstart your professional journey with Economic Labs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button size="lg" asChild className="gradient-primary border-0 text-base px-8">
                <Link to="/internships">Find Internships <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link to="/auth?mode=signup&role=company">Post Internships</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 max-w-4xl mx-auto stagger-children">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover-lift">
                <div className="text-2xl md:text-3xl font-heading font-bold gradient-text animate-count-up">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Get started in 4 simple steps</p>
          </div>

          <div className="flex gap-8">
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step, i) => (
                  <Card key={i} className="hover-lift text-center">
                    <CardContent className="pt-8 pb-6 px-4">
                      <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                        <step.icon className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <h3 className="font-heading font-semibold text-base mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Sidebar Banners */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <HomeBanners position="sidebar" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl gradient-primary p-8 md:p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-primary-foreground mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-sm md:text-base">
              Join thousands of students and companies already on the platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth?mode=signup&role=student">I'm a Student</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/auth?mode=signup&role=company">I'm a Company</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
