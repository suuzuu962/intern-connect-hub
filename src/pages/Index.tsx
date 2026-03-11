import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, Users, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';

import { WorkFunnelSection } from '@/components/home/WorkFunnelSection';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
};

function ScrollSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <div className="container mx-auto px-4 relative">
          <ScrollSection className="max-w-3xl mx-auto text-center">
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight"
            >
              Launch Your Career with{' '}
              <span className="gradient-text">Dream Internships</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Connect with top companies, gain real-world experience, and kickstart your professional journey with Economic Labs.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="gradient-primary border-0 text-base px-8">
                <Link to="/internships">Find Internships <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link to="/auth?mode=signup&role=company">Post Internships</Link>
              </Button>
            </motion.div>
          </ScrollSection>

          {/* Stats */}
          <ScrollSection className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="text-center p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 cursor-default"
              >
                <div className="text-2xl md:text-3xl font-heading font-bold gradient-text">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </ScrollSection>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-heading font-bold mb-3">How It Works</motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto">Get started in 4 simple steps</motion.p>
          </ScrollSection>

          <div className="flex gap-8">
            <div className="flex-1 min-w-0">
              <ScrollSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="text-center h-full">
                      <CardContent className="pt-8 pb-6 px-4">
                        <motion.div
                          whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }}
                          className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4"
                        >
                          <step.icon className="h-7 w-7 text-primary-foreground" />
                        </motion.div>
                        <h3 className="font-heading font-semibold text-base mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </ScrollSection>
            </div>

            {/* Sidebar Banners */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <HomeBanners position="sidebar" />
            </div>
          </div>
        </div>
      </section>

      {/* Work Funnel */}
      <WorkFunnelSection />

      {/* CTA Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <ScrollSection>
            <motion.div
              variants={scaleIn}
              className="rounded-3xl gradient-primary p-8 md:p-12 text-center max-w-4xl mx-auto"
            >
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
            </motion.div>
          </ScrollSection>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
