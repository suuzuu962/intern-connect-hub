import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { RoleAdBanner } from './roleHomeContent';

const variantStyles: Record<RoleAdBanner['variant'], string> = {
  primary: 'bg-primary/5 border-primary/20 text-foreground',
  accent: 'bg-accent border-accent-foreground/10 text-foreground',
  success: 'bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/20 text-foreground',
  warning: 'bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/20 text-foreground',
};

interface AdBannerProps {
  ads: RoleAdBanner[];
}

export function AdBanner({ ads }: AdBannerProps) {
  if (ads.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className={`grid gap-4 ${ads.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
          {ads.map((ad, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`rounded-xl border p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${variantStyles[ad.variant]}`}
            >
              <div>
                <h3 className="font-heading font-semibold text-base mb-1">{ad.title}</h3>
                <p className="text-sm text-muted-foreground">{ad.description}</p>
              </div>
              <Button size="sm" variant="outline" asChild className="shrink-0">
                <Link to={ad.ctaLink}>
                  {ad.ctaLabel} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
