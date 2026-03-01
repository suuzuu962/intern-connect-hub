import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, Search, ClipboardCheck, Handshake, Rocket } from 'lucide-react';

const funnelSteps = [
  { icon: UserPlus, title: 'Sign Up', desc: 'Create your free account as a Student or Company', color: 'from-blue-500 to-blue-600' },
  { icon: Search, title: 'Discover', desc: 'Browse internships or find talented students', color: 'from-indigo-500 to-indigo-600' },
  { icon: ClipboardCheck, title: 'Apply or Post', desc: 'Submit applications or create internship listings', color: 'from-purple-500 to-purple-600' },
  { icon: Handshake, title: 'Get Matched', desc: 'Receive offers, accept, and start your journey', color: 'from-pink-500 to-pink-600' },
  { icon: Rocket, title: 'Grow & Succeed', desc: 'Track progress with diary entries and get certified', color: 'from-emerald-500 to-emerald-600' },
];

export const WorkFunnelSection = () => (
  <section className="py-16 lg:py-20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">
          Your Path to <span className="gradient-text">Success</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Follow the complete work funnel from signup to career growth
        </p>
      </div>

      {/* Vertical funnel */}
      <div className="max-w-2xl mx-auto">
        {funnelSteps.map((step, i) => (
          <div key={i} className="flex items-start gap-4 mb-0">
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg z-10`}>
                <step.icon className="h-5 w-5" />
              </div>
              {i < funnelSteps.length - 1 && (
                <div className="w-0.5 h-12 bg-gradient-to-b from-border to-transparent" />
              )}
            </div>
            <div className="pt-2 pb-6">
              <h3 className="font-heading font-semibold text-lg">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button asChild variant="outline" size="lg">
          <Link to="/work-funnel">
            View Complete Funnel <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);
