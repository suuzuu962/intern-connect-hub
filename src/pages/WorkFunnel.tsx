import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, Search, FileText, ClipboardCheck, Handshake, Rocket,
  Building2, GraduationCap, Briefcase, Users, ArrowDown, CheckCircle,
  Clock, Star, TrendingUp, Eye
} from 'lucide-react';

const WorkFunnel = () => {
  const studentFunnel = [
    { stage: 'Registration', icon: UserPlus, color: 'bg-blue-500', desc: 'Create account & select role', metric: 'Entry Point', pct: 100 },
    { stage: 'Profile Completion', icon: FileText, color: 'bg-indigo-500', desc: 'Fill academic details, upload resume, set preferences', metric: 'Activation', pct: 85 },
    { stage: 'Discovery', icon: Search, color: 'bg-purple-500', desc: 'Browse internships, filter by domain/skills/location', metric: 'Engagement', pct: 70 },
    { stage: 'Application', icon: ClipboardCheck, color: 'bg-pink-500', desc: 'Submit cover letter & resume to internships', metric: 'Conversion', pct: 45 },
    { stage: 'Interview & Selection', icon: Star, color: 'bg-orange-500', desc: 'Shortlisted → Under Review → Offer Released', metric: 'Qualification', pct: 25 },
    { stage: 'Offer Acceptance', icon: Handshake, color: 'bg-emerald-500', desc: 'Accept offer, pay fees (if paid), begin internship', metric: 'Success', pct: 15 },
    { stage: 'Internship & Diary', icon: Rocket, color: 'bg-green-600', desc: 'Daily diary entries, coordinator approvals, completion', metric: 'Retention', pct: 12 },
  ];

  const companyFunnel = [
    { stage: 'Registration', icon: UserPlus, color: 'bg-blue-500', desc: 'Sign up as company, fill profile', metric: 'Entry', pct: 100 },
    { stage: 'Profile & Verification', icon: Building2, color: 'bg-indigo-500', desc: 'Complete company profile, submit for admin approval', metric: 'Activation', pct: 80 },
    { stage: 'Admin Approval', icon: CheckCircle, color: 'bg-purple-500', desc: 'Admin verifies company, sets operational limits', metric: 'Qualification', pct: 60 },
    { stage: 'Post Internships', icon: Briefcase, color: 'bg-pink-500', desc: 'Create listings with AI-generated descriptions', metric: 'Engagement', pct: 50 },
    { stage: 'Review Applications', icon: Eye, color: 'bg-orange-500', desc: 'Screen candidates, shortlist, release offers', metric: 'Conversion', pct: 35 },
    { stage: 'Onboard Interns', icon: Rocket, color: 'bg-emerald-500', desc: 'Accepted students begin internship', metric: 'Success', pct: 20 },
  ];

  const institutionalFunnel = [
    { stage: 'University Registration', icon: GraduationCap, color: 'bg-blue-500', desc: 'Register via /university-auth, bypasses email verification', metric: 'Entry', pct: 100 },
    { stage: 'Create Colleges', icon: Building2, color: 'bg-indigo-500', desc: 'Add affiliated colleges with login credentials', metric: 'Setup', pct: 85 },
    { stage: 'Assign Coordinators', icon: Users, color: 'bg-purple-500', desc: 'Create coordinator accounts linked to colleges', metric: 'Activation', pct: 70 },
    { stage: 'Student Enrollment', icon: UserPlus, color: 'bg-pink-500', desc: 'Students register and select their college', metric: 'Growth', pct: 55 },
    { stage: 'Monitor & Approve', icon: ClipboardCheck, color: 'bg-orange-500', desc: 'Review diary entries, track student progress', metric: 'Engagement', pct: 40 },
    { stage: 'Reporting & Analytics', icon: TrendingUp, color: 'bg-emerald-500', desc: 'View org charts, login logs, placement metrics', metric: 'Insight', pct: 30 },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold mb-3">
            Complete <span className="gradient-text">Work Funnel</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            End-to-end journey visualization for every role on the platform — from registration to success.
          </p>
        </div>

        {/* Student Funnel */}
        <FunnelSection
          title="Student Journey Funnel"
          subtitle="From signup to internship completion"
          icon={<GraduationCap className="h-6 w-6" />}
          stages={studentFunnel}
          gradient="from-blue-500 to-emerald-500"
        />

        {/* Company Funnel */}
        <FunnelSection
          title="Company Journey Funnel"
          subtitle="From registration to onboarding interns"
          icon={<Building2 className="h-6 w-6" />}
          stages={companyFunnel}
          gradient="from-blue-500 to-emerald-500"
        />

        {/* Institutional Funnel */}
        <FunnelSection
          title="Institutional Journey Funnel"
          subtitle="University → College → Coordinator → Student pipeline"
          icon={<Users className="h-6 w-6" />}
          stages={institutionalFunnel}
          gradient="from-blue-500 to-emerald-500"
        />
      </div>
    </Layout>
  );
};

interface FunnelStage {
  stage: string;
  icon: React.ElementType;
  color: string;
  desc: string;
  metric: string;
  pct: number;
}

const FunnelSection = ({ title, subtitle, icon, stages, gradient }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  stages: FunnelStage[];
  gradient: string;
}) => (
  <div className="mb-16">
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} text-white`}>{icon}</div>
      <div>
        <h2 className="text-2xl font-heading font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>

    <div className="mt-6 space-y-0">
      {stages.map((s, i) => (
        <div key={i} className="relative">
          <div className="flex items-stretch gap-4">
            {/* Funnel bar */}
            <div className="flex flex-col items-center w-12 shrink-0">
              <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center text-white z-10`}>
                <s.icon className="h-5 w-5" />
              </div>
              {i < stages.length - 1 && (
                <div className="w-0.5 flex-1 bg-border" />
              )}
            </div>

            {/* Content */}
            <Card className="flex-1 mb-3 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{s.stage}</h3>
                      <Badge variant="outline" className="text-xs">{s.metric}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                  {/* Visual funnel width */}
                  <div className="w-32 hidden sm:block">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.color} transition-all duration-700`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right mt-0.5">{s.pct}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default WorkFunnel;
