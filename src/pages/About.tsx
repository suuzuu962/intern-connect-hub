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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">About <span className="gradient-text">Economic Labs</span></h1>
          <p className="text-lg text-muted-foreground">We're on a mission to bridge the gap between talented students and innovative companies, creating pathways to meaningful careers.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {values.map((v, i) => (
            <Card key={i} className="hover-lift text-center">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/30 rounded-3xl p-12 text-center">
          <h2 className="text-2xl font-heading font-bold mb-4">Our Story</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Founded with the vision of democratizing access to quality internships, Economic Labs has grown into a trusted platform connecting thousands of students with their dream opportunities. We believe every student deserves a chance to gain real-world experience.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;