import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap, Building2, School, Users, Shield,
  ArrowDown, CheckCircle, Clock, FileText, Briefcase,
  UserPlus, LogIn, Search, Send, BookOpen, Star,
  Settings, Eye, UserCheck, AlertCircle, DollarSign,
  BarChart3, Bell, Lock, Database
} from 'lucide-react';

const UserJourneyMap = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Platform User Journey Map</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete flow from signup to internship completion for every role
          </p>
        </div>

        <Tabs defaultValue="student" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="student" className="gap-1.5 text-xs sm:text-sm">
              <GraduationCap className="h-4 w-4" /> Student
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-1.5 text-xs sm:text-sm">
              <Building2 className="h-4 w-4" /> Company
            </TabsTrigger>
            <TabsTrigger value="university" className="gap-1.5 text-xs sm:text-sm">
              <School className="h-4 w-4" /> University
            </TabsTrigger>
            <TabsTrigger value="college" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" /> College
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-1.5 text-xs sm:text-sm">
              <Shield className="h-4 w-4" /> Admin
            </TabsTrigger>
          </TabsList>

          {/* STUDENT JOURNEY */}
          <TabsContent value="student">
            <JourneyHeader
              icon={<GraduationCap className="h-6 w-6" />}
              title="Student Journey"
              subtitle="From registration to internship completion"
              color="green"
            />
            <div className="space-y-1">
              <PhaseBlock phase="1" title="Registration & Onboarding" color="green">
                <StepRow steps={[
                  { icon: <LogIn />, label: 'Visit /auth', detail: 'Select Student role' },
                  { icon: <UserPlus />, label: 'Sign Up', detail: 'Email & phone, auto-confirmed' },
                  { icon: <Database />, label: 'Records Created', detail: 'profile → user_role → student' },
                  { icon: <CheckCircle />, label: 'Dashboard Access', detail: '/student/dashboard', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="2" title="Profile Completion" color="green">
                <StepRow steps={[
                  { icon: <FileText />, label: 'Fill Profile', detail: 'Academic info, skills, domains' },
                  { icon: <Star />, label: 'Upload Avatar', detail: '20 preset 3D or custom upload' },
                  { icon: <FileText />, label: 'Upload Resume', detail: 'Required for applications' },
                  { icon: <CheckCircle />, label: 'Profile Complete', detail: 'Progress bar reaches 100%', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="3" title="Internship Discovery & Application" color="green">
                <StepRow steps={[
                  { icon: <Search />, label: 'Browse /internships', detail: 'Search, filter by skills/domain' },
                  { icon: <Eye />, label: 'View Details', detail: 'Full description, requirements' },
                  { icon: <Send />, label: 'Apply', detail: 'Cover letter + resume required' },
                  { icon: <Clock />, label: 'Status: Applied', detail: 'Tracked in dashboard', highlight: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="4" title="Application Lifecycle" color="green">
                <StepRow steps={[
                  { icon: <Clock />, label: 'Under Review', detail: 'Company reviewing', highlight: true },
                  { icon: <Star />, label: 'Shortlisted', detail: 'Made the cut', highlight: true },
                  { icon: <Bell />, label: 'Offer Released', detail: 'Company sends offer', highlight: true },
                  { icon: <CheckCircle />, label: 'Accept Offer', detail: 'Pay & Accept or Accept', success: true },
                ]} />
                <div className="mt-2 pl-4">
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Can withdraw at: Applied, Under Review, Shortlisted stages
                  </Badge>
                </div>
              </PhaseBlock>

              <PhaseBlock phase="5" title="Internship & Diary Logging" color="green">
                <StepRow steps={[
                  { icon: <Briefcase />, label: 'Internship Active', detail: 'Status: offer_accepted' },
                  { icon: <BookOpen />, label: 'Write Diary', detail: 'Daily entries with hours & skills' },
                  { icon: <UserCheck />, label: 'Coordinator Review', detail: 'Entries approved/remarked' },
                  { icon: <CheckCircle />, label: 'Internship Complete', detail: 'Full diary logged', success: true },
                ]} />
              </PhaseBlock>
            </div>
          </TabsContent>

          {/* COMPANY JOURNEY */}
          <TabsContent value="company">
            <JourneyHeader
              icon={<Building2 className="h-6 w-6" />}
              title="Company Journey"
              subtitle="From registration to managing interns"
              color="blue"
            />
            <div className="space-y-1">
              <PhaseBlock phase="1" title="Registration & Verification" color="blue">
                <StepRow steps={[
                  { icon: <LogIn />, label: 'Visit /auth', detail: 'Select Company role' },
                  { icon: <UserPlus />, label: 'Sign Up', detail: 'Email, auto-confirmed' },
                  { icon: <Clock />, label: 'Pending Approval', detail: 'Admin must verify', highlight: true },
                  { icon: <CheckCircle />, label: 'Approved', detail: 'Visible in /companies', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="2" title="Company Profile Setup" color="blue">
                <StepRow steps={[
                  { icon: <FileText />, label: 'Fill Profile', detail: 'Name, industry, description' },
                  { icon: <Settings />, label: 'Contact & Social', detail: 'URLs, contact person details' },
                  { icon: <Star />, label: 'Logo & Cover', detail: 'Brand identity' },
                  { icon: <CheckCircle />, label: 'Profile Complete', detail: 'Ready to post internships', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="3" title="Internship Management" color="blue">
                <StepRow steps={[
                  { icon: <FileText />, label: 'Create Internship', detail: 'Title, description, skills, domain' },
                  { icon: <Settings />, label: 'Set Parameters', detail: 'Type, mode, duration, stipend' },
                  { icon: <Eye />, label: 'Listing Live', detail: 'Visible on /internships' },
                  { icon: <BarChart3 />, label: 'Track Views', detail: 'views_count increments', highlight: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="4" title="Applicant Management" color="blue">
                <StepRow steps={[
                  { icon: <Users />, label: 'View Applicants', detail: 'Cover letters & resumes' },
                  { icon: <Eye />, label: 'Review & Shortlist', detail: 'Status: under_review → shortlisted' },
                  { icon: <Send />, label: 'Release Offer', detail: 'Status: offer_released' },
                  { icon: <CheckCircle />, label: 'Offer Accepted', detail: 'Student begins internship', success: true },
                ]} />
                <div className="mt-2 pl-4">
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Can also reject applicants at any stage
                  </Badge>
                </div>
              </PhaseBlock>

              <PhaseBlock phase="5" title="Limits & Governance" color="blue">
                <StepRow steps={[
                  { icon: <AlertCircle />, label: 'company_limits', detail: 'Max internships, max applicants' },
                  { icon: <DollarSign />, label: 'Paid Features', detail: 'Feature listings, resume access' },
                  { icon: <Lock />, label: 'Admin Controlled', detail: 'Limits set by Super Admin' },
                ]} />
              </PhaseBlock>
            </div>
          </TabsContent>

          {/* UNIVERSITY JOURNEY */}
          <TabsContent value="university">
            <JourneyHeader
              icon={<School className="h-6 w-6" />}
              title="University Journey"
              subtitle="From registration to managing the institutional hierarchy"
              color="purple"
            />
            <div className="space-y-1">
              <PhaseBlock phase="1" title="Registration" color="purple">
                <StepRow steps={[
                  { icon: <LogIn />, label: 'Visit /university-auth', detail: 'Select University role' },
                  { icon: <FileText />, label: 'Fill Form', detail: 'Name, email, contact details' },
                  { icon: <Lock />, label: 'Edge Function', detail: 'university-signup, bypasses email verify', highlight: true },
                  { icon: <CheckCircle />, label: 'Dashboard Access', detail: '/university/dashboard', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="2" title="College Creation" color="purple">
                <StepRow steps={[
                  { icon: <School />, label: 'Colleges Tab', detail: 'Add College button' },
                  { icon: <FileText />, label: 'College Form', detail: 'Name, email, password, contact' },
                  { icon: <Lock />, label: 'Edge Function', detail: 'create-college-account', highlight: true },
                  { icon: <CheckCircle />, label: 'College Created', detail: 'Auth user + role + college record', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="3" title="Coordinator Creation" color="purple">
                <StepRow steps={[
                  { icon: <Users />, label: 'Coordinators Tab', detail: 'Add Coordinator button' },
                  { icon: <FileText />, label: 'Select College', detail: 'Name, email, password' },
                  { icon: <Lock />, label: 'Edge Function', detail: 'create-coordinator-account', highlight: true },
                  { icon: <CheckCircle />, label: 'Coordinator Created', detail: 'Linked to specific college', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="4" title="Ongoing Management" color="purple">
                <StepRow steps={[
                  { icon: <GraduationCap />, label: 'View Students', detail: 'All students across colleges' },
                  { icon: <BarChart3 />, label: 'Org Chart', detail: 'Visual hierarchy view' },
                  { icon: <Eye />, label: 'Login Logs', detail: 'Track institutional user activity' },
                  { icon: <Settings />, label: 'Profile Mgmt', detail: 'Update university details' },
                ]} />
              </PhaseBlock>
            </div>

            {/* Hierarchy diagram */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4 text-center">Data Hierarchy</h4>
                <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                  <HierarchyNode label="University" badge="Root" color="purple" />
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  <HierarchyNode label="Colleges" badge="university_id FK" color="blue" />
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-4 w-full">
                    <HierarchyNode label="Coordinators" badge="college_id FK" color="purple" className="flex-1" />
                    <HierarchyNode label="Students" badge="college_id FK" color="green" className="flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COLLEGE/COORDINATOR JOURNEY */}
          <TabsContent value="college">
            <JourneyHeader
              icon={<Users className="h-6 w-6" />}
              title="College / Coordinator Journey"
              subtitle="Account created by university, managing students & diaries"
              color="amber"
            />
            <div className="space-y-1">
              <PhaseBlock phase="1" title="Account Provisioning" color="amber">
                <StepRow steps={[
                  { icon: <School />, label: 'Created by University', detail: 'Via edge function' },
                  { icon: <Database />, label: 'Records Auto-Created', detail: 'Auth user → role → college/coordinator' },
                  { icon: <LogIn />, label: 'Login at /university-auth', detail: 'With provided credentials' },
                  { icon: <CheckCircle />, label: 'Dashboard Access', detail: '/college/dashboard', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="2" title="Student Oversight" color="amber">
                <StepRow steps={[
                  { icon: <GraduationCap />, label: 'View Students', detail: 'Students linked via college_id' },
                  { icon: <Eye />, label: 'Student Profiles', detail: 'Academic info, skills, resumes' },
                  { icon: <BarChart3 />, label: 'Track Applications', detail: 'Monitor student placements' },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="3" title="Diary Approval Workflow" color="amber">
                <StepRow steps={[
                  { icon: <BookOpen />, label: 'View Diary Entries', detail: 'Submitted by students' },
                  { icon: <FileText />, label: 'Review Content', detail: 'Hours, skills, work summary' },
                  { icon: <Send />, label: 'Add Remarks', detail: 'coordinator_remarks field' },
                  { icon: <CheckCircle />, label: 'Approve Entry', detail: 'is_approved = true', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="4" title="Profile & Org" color="amber">
                <StepRow steps={[
                  { icon: <Settings />, label: 'Profile Management', detail: 'Update contact & designation' },
                  { icon: <BarChart3 />, label: 'Org Chart', detail: 'View college structure' },
                  { icon: <Users />, label: 'Manage Coordinators', detail: 'College admin can add more' },
                ]} />
              </PhaseBlock>
            </div>
          </TabsContent>

          {/* SUPER ADMIN JOURNEY */}
          <TabsContent value="admin">
            <JourneyHeader
              icon={<Shield className="h-6 w-6" />}
              title="Super Admin Journey"
              subtitle="Platform-wide oversight, RBAC, and governance"
              color="red"
            />
            <div className="space-y-1">
              <PhaseBlock phase="1" title="Access & Overview" color="red">
                <StepRow steps={[
                  { icon: <LogIn />, label: 'Login at /auth', detail: 'Admin role in user_roles' },
                  { icon: <BarChart3 />, label: 'Platform Stats', detail: 'Users, internships, applications' },
                  { icon: <Bell />, label: 'Notifications', detail: 'System-wide alerts' },
                  { icon: <CheckCircle />, label: 'Full Dashboard', detail: '/admin/dashboard (17 tabs)', success: true },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="2" title="User & Entity Management" color="red">
                <StepRow steps={[
                  { icon: <GraduationCap />, label: 'Students', detail: 'View all, manage profiles' },
                  { icon: <Building2 />, label: 'Companies', detail: 'Approve/reject registrations' },
                  { icon: <School />, label: 'Universities', detail: 'Manage institutional accounts' },
                  { icon: <Users />, label: 'Coordinators', detail: 'Cross-institution visibility' },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="3" title="Access Control (RBAC)" color="red">
                <StepRow steps={[
                  { icon: <Lock />, label: 'Custom Roles', detail: '76+ granular permissions' },
                  { icon: <UserCheck />, label: 'Assign Roles', detail: 'To any user platform-wide' },
                  { icon: <Settings />, label: 'Feature Toggles', detail: 'Legacy role_permissions' },
                  { icon: <Eye />, label: 'Audit Log', detail: 'All RBAC changes tracked', highlight: true },
                ]} />
                <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <strong>3-Layer Permission Resolution:</strong> Role Permissions → Custom Role Permissions → User-Level Overrides
                </div>
              </PhaseBlock>

              <PhaseBlock phase="4" title="Platform Governance" color="red">
                <StepRow steps={[
                  { icon: <DollarSign />, label: 'Payments', detail: 'payment_transactions tracking' },
                  { icon: <Star />, label: 'Banners', detail: 'Ad management with targeting' },
                  { icon: <FileText />, label: 'Data Export', detail: 'Export platform data' },
                  { icon: <Lock />, label: 'Security Logs', detail: 'Login tracking, IP, user agent' },
                ]} />
              </PhaseBlock>

              <PhaseBlock phase="5" title="Internship Oversight" color="red">
                <StepRow steps={[
                  { icon: <Briefcase />, label: 'All Internships', detail: 'Platform-wide listing control' },
                  { icon: <AlertCircle />, label: 'Company Limits', detail: 'Set posting limits per company' },
                  { icon: <Settings />, label: 'Platform Settings', detail: 'Global configuration' },
                  { icon: <BarChart3 />, label: 'Org Chart', detail: 'Full institutional hierarchy' },
                ]} />
              </PhaseBlock>
            </div>
          </TabsContent>
        </Tabs>

        {/* Cross-Role Interaction Map */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Cross-Role Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InteractionCard
                from="Student" to="Company"
                interactions={['Applies to internships', 'Submits cover letter & resume', 'Accepts/withdraws offers']}
                fromColor="green" toColor="blue"
              />
              <InteractionCard
                from="Company" to="Student"
                interactions={['Reviews applications', 'Shortlists candidates', 'Releases offers', 'Rejects applicants']}
                fromColor="blue" toColor="green"
              />
              <InteractionCard
                from="University" to="College"
                interactions={['Creates college accounts', 'Creates coordinators', 'Views all students']}
                fromColor="purple" toColor="amber"
              />
              <InteractionCard
                from="Coordinator" to="Student"
                interactions={['Views assigned students', 'Approves diary entries', 'Adds remarks on diary']}
                fromColor="amber" toColor="green"
              />
              <InteractionCard
                from="Admin" to="Company"
                interactions={['Approves/rejects registration', 'Sets posting limits', 'Manages company visibility']}
                fromColor="red" toColor="blue"
              />
              <InteractionCard
                from="Admin" to="All Roles"
                interactions={['Assigns RBAC roles', 'Manages feature toggles', 'Monitors login activity', 'Exports data']}
                fromColor="red" toColor="gray"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// --- Sub-components ---

const JourneyHeader = ({ icon, title, subtitle, color }: { icon: React.ReactNode; title: string; subtitle: string; color: string }) => {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border mb-6 ${colorMap[color]}`}>
      {icon}
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm opacity-80">{subtitle}</p>
      </div>
    </div>
  );
};

const PhaseBlock = ({ phase, title, color, children }: { phase: string; title: string; color: string; children: React.ReactNode }) => {
  const dotColors: Record<string, string> = {
    green: 'bg-green-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
    amber: 'bg-amber-500', red: 'bg-red-500',
  };
  return (
    <div className="relative pl-8 pb-6">
      {/* Timeline line */}
      <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
      {/* Timeline dot */}
      <div className={`absolute left-1.5 top-1.5 h-4 w-4 rounded-full ${dotColors[color]} ring-4 ring-background`} />
      <div className="mb-3">
        <Badge variant="secondary" className="text-xs mb-1">Phase {phase}</Badge>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
};

interface Step {
  icon: React.ReactNode;
  label: string;
  detail: string;
  success?: boolean;
  highlight?: boolean;
}

const StepRow = ({ steps }: { steps: Step[] }) => (
  <div className="flex flex-wrap gap-2">
    {steps.map((step, i) => (
      <div key={i} className="flex items-center gap-2">
        <div className={`
          flex items-center gap-2 p-2.5 rounded-lg border text-sm min-w-[150px]
          ${step.success ? 'bg-green-500/10 border-green-500/30' : ''}
          ${step.highlight ? 'bg-amber-500/10 border-amber-500/30' : ''}
          ${!step.success && !step.highlight ? 'bg-card border-border' : ''}
        `}>
          <div className={`
            p-1 rounded-full shrink-0
            ${step.success ? 'text-green-600 dark:text-green-400' : ''}
            ${step.highlight ? 'text-amber-600 dark:text-amber-400' : ''}
            ${!step.success && !step.highlight ? 'text-muted-foreground' : ''}
          `}>
            {step.icon}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-xs leading-tight">{step.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{step.detail}</p>
          </div>
        </div>
        {i < steps.length - 1 && (
          <ArrowDown className="h-3 w-3 text-muted-foreground rotate-[-90deg] hidden sm:block shrink-0" />
        )}
      </div>
    ))}
  </div>
);

const HierarchyNode = ({ label, badge, color, className = '' }: { label: string; badge: string; color: string; className?: string }) => {
  const colors: Record<string, string> = {
    purple: 'bg-purple-500/10 border-purple-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20',
    green: 'bg-green-500/10 border-green-500/20',
  };
  return (
    <div className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${colors[color]} ${className}`}>
      <span className="font-medium text-sm">{label}</span>
      <Badge variant="outline" className="text-[10px]">{badge}</Badge>
    </div>
  );
};

const InteractionCard = ({ from, to, interactions, fromColor, toColor }: {
  from: string; to: string; interactions: string[]; fromColor: string; toColor: string;
}) => {
  const badgeColors: Record<string, string> = {
    green: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    red: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
    gray: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Badge className={`text-xs border ${badgeColors[fromColor]}`}>{from}</Badge>
        <ArrowDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />
        <Badge className={`text-xs border ${badgeColors[toColor]}`}>{to}</Badge>
      </div>
      <ul className="space-y-1">
        {interactions.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserJourneyMap;
