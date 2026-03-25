import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, HelpCircle, Zap, Users, Quote, BarChart3, Layers, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
};

function ScrollSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

export type CustomSectionType =
  | 'features_grid'
  | 'testimonials'
  | 'faq'
  | 'cta_banner'
  | 'stats_highlight'
  | 'partner_logos'
  | 'checklist'
  | 'text_block';

export interface CustomSectionItem {
  title?: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  link?: string;
}

export interface CustomSectionData {
  id: string;
  type: CustomSectionType;
  title: string;
  subtitle?: string;
  items: CustomSectionItem[];
  bgStyle?: 'default' | 'muted' | 'gradient';
  ctaLabel?: string;
  ctaLink?: string;
  enabled: boolean;
}

const iconMap: Record<CustomSectionType, LucideIcon> = {
  features_grid: Zap,
  testimonials: Quote,
  faq: HelpCircle,
  cta_banner: Star,
  stats_highlight: BarChart3,
  partner_logos: Layers,
  checklist: CheckCircle2,
  text_block: Users,
};

const bgClass: Record<string, string> = {
  default: '',
  muted: 'bg-muted/30',
  gradient: 'bg-gradient-to-br from-primary/5 to-secondary/5',
};

export function CustomSectionRenderer({ section }: { section: CustomSectionData }) {
  if (!section.enabled) return null;
  const bg = bgClass[section.bgStyle || 'default'];

  return (
    <section className={`py-16 lg:py-20 ${bg}`}>
      <div className="container mx-auto px-4">
        <ScrollSection className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-heading font-bold mb-3">
            {section.title}
          </motion.h2>
          {section.subtitle && (
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto">
              {section.subtitle}
            </motion.p>
          )}
        </ScrollSection>

        {section.type === 'features_grid' && (
          <ScrollSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {section.items.map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="text-center h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-8 pb-6 px-4">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-14 w-14 rounded-2xl object-cover mx-auto mb-4" />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-7 w-7 text-primary-foreground" />
                      </div>
                    )}
                    <h3 className="font-heading font-semibold text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </ScrollSection>
        )}

        {section.type === 'testimonials' && (
          <ScrollSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {section.items.map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full">
                  <CardContent className="pt-6 pb-6 px-5">
                    <Quote className="h-6 w-6 text-primary/30 mb-3" />
                    <p className="text-sm text-muted-foreground mb-4 italic">"{item.description}"</p>
                    <div className="flex items-center gap-3">
                      {item.imageUrl && <img src={item.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />}
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.author && <p className="text-xs text-muted-foreground">{item.author}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </ScrollSection>
        )}

        {section.type === 'faq' && (
          <ScrollSection className="max-w-2xl mx-auto space-y-3">
            {section.items.map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card>
                  <CardContent className="py-4 px-5">
                    <h3 className="font-heading font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </ScrollSection>
        )}

        {section.type === 'cta_banner' && (
          <ScrollSection>
            <motion.div variants={scaleIn} className="rounded-3xl gradient-primary p-8 md:p-12 text-center max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-heading font-bold text-primary-foreground mb-4">
                {section.items[0]?.title || section.title}
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto text-sm">
                {section.items[0]?.description || section.subtitle}
              </p>
              {section.ctaLabel && section.ctaLink && (
                <Button size="lg" variant="secondary" asChild>
                  <Link to={section.ctaLink}>{section.ctaLabel} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
            </motion.div>
          </ScrollSection>
        )}

        {section.type === 'stats_highlight' && (
          <ScrollSection className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {section.items.map((item, i) => (
              <motion.div key={i} variants={scaleIn} className="text-center p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50">
                <div className="text-3xl font-heading font-bold gradient-text">{item.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{item.description}</div>
              </motion.div>
            ))}
          </ScrollSection>
        )}

        {section.type === 'partner_logos' && (
          <ScrollSection className="flex flex-wrap justify-center items-center gap-8 max-w-4xl mx-auto">
            {section.items.map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center gap-2">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title || ''} className="h-12 object-contain grayscale hover:grayscale-0 transition-all" />
                ) : (
                  <div className="h-12 w-24 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">{item.title}</div>
                )}
              </motion.div>
            ))}
          </ScrollSection>
        )}

        {section.type === 'checklist' && (
          <ScrollSection className="max-w-2xl mx-auto space-y-3">
            {section.items.map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                </div>
              </motion.div>
            ))}
          </ScrollSection>
        )}

        {section.type === 'text_block' && (
          <ScrollSection className="max-w-3xl mx-auto">
            {section.items.map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="prose prose-sm mx-auto text-center">
                {item.title && <h3 className="font-heading font-semibold">{item.title}</h3>}
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </ScrollSection>
        )}

        {section.ctaLabel && section.ctaLink && section.type !== 'cta_banner' && (
          <ScrollSection className="text-center mt-8">
            <motion.div variants={fadeUp}>
              <Button size="lg" asChild variant="outline">
                <Link to={section.ctaLink}>{section.ctaLabel} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </ScrollSection>
        )}
      </div>
    </section>
  );
}

// ── Section Templates for Auto-Suggest ──
export const SECTION_TEMPLATES: { type: CustomSectionType; label: string; description: string; icon: LucideIcon; defaultItems: CustomSectionItem[] }[] = [
  {
    type: 'features_grid',
    label: 'Features Grid',
    description: 'Showcase key features in a card grid layout',
    icon: Zap,
    defaultItems: [
      { title: 'Feature 1', description: 'Describe this feature and its benefit.' },
      { title: 'Feature 2', description: 'Describe this feature and its benefit.' },
      { title: 'Feature 3', description: 'Describe this feature and its benefit.' },
    ],
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Display user reviews and success stories',
    icon: Quote,
    defaultItems: [
      { title: 'John Doe', description: 'This platform helped me land my dream internship!', author: 'Student, MIT' },
      { title: 'Jane Smith', description: 'We found incredible talent through this platform.', author: 'HR Manager, TechCorp' },
    ],
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Frequently asked questions and answers',
    icon: HelpCircle,
    defaultItems: [
      { title: 'How do I apply for internships?', description: 'Create a profile, browse listings, and click Apply on any internship.' },
      { title: 'Is there a cost to use the platform?', description: 'The platform is free for students. Companies have various plans available.' },
    ],
  },
  {
    type: 'cta_banner',
    label: 'CTA Banner',
    description: 'A prominent call-to-action banner',
    icon: Star,
    defaultItems: [
      { title: 'Ready to Get Started?', description: 'Join thousands of users already on the platform.' },
    ],
  },
  {
    type: 'stats_highlight',
    label: 'Stats Highlight',
    description: 'Highlight key numbers and achievements',
    icon: BarChart3,
    defaultItems: [
      { title: '10K+', description: 'Students Placed' },
      { title: '500+', description: 'Partner Companies' },
      { title: '95%', description: 'Satisfaction Rate' },
      { title: '50+', description: 'Cities Covered' },
    ],
  },
  {
    type: 'partner_logos',
    label: 'Partner Logos',
    description: 'Display logos of partner companies or institutions',
    icon: Layers,
    defaultItems: [
      { title: 'Partner 1' },
      { title: 'Partner 2' },
      { title: 'Partner 3' },
      { title: 'Partner 4' },
    ],
  },
  {
    type: 'checklist',
    label: 'Checklist / Benefits',
    description: 'List benefits or features with checkmarks',
    icon: CheckCircle2,
    defaultItems: [
      { title: 'AI-Powered Matching', description: 'Smart recommendations based on your skills' },
      { title: 'Real-Time Tracking', description: 'Track application status in real-time' },
      { title: 'Certificate Generation', description: 'Auto-generate completion certificates' },
    ],
  },
  {
    type: 'text_block',
    label: 'Text Block',
    description: 'A simple content block with heading and text',
    icon: Users,
    defaultItems: [
      { title: 'About Our Platform', description: 'Economic Labs connects students with top companies for meaningful internship experiences.' },
    ],
  },
];
