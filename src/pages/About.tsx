import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Lightbulb, Award } from 'lucide-react';

const About = () => {
  const values = [
    { icon: Target, title: 'Mission-Driven', description: 'Connecting students with opportunities that launch careers.' },
    { icon: Users, title: 'Community First', description: 'Building bridges between academia and industry.' },
    { icon: Lightbulb, title: 'Innovation', description: 'Leveraging technology to streamline the internship experience.' },
    { icon: Award, title: 'Excellence', description: 'Committed to quality placements and meaningful experiences.' },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center mb-10 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">About <span className="gradient-text">Economic Labs</span></h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">We're on a mission to bridge the gap between talented students and innovative companies, creating pathways to meaningful careers.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-16">
          {values.map((v, i) => (
            <Card key={i} className="hover-lift text-center">
              <CardContent className="pt-6 pb-5 px-4">
                <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
                  <v.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1.5">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/30 rounded-2xl md:rounded-3xl p-6 md:p-12 text-center">
          <h2 className="text-xl md:text-2xl font-heading font-bold mb-3">Our Story</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Founded with the vision of democratizing access to quality internships, Economic Labs has grown into a trusted platform connecting thousands of students with their dream opportunities. We believe every student deserves a chance to gain real-world experience.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;