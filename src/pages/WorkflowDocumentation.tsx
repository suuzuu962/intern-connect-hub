import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, Building2, Users, Shield, ArrowRight, ArrowDown,
  UserPlus, FileText, Search, ClipboardCheck, Handshake, Rocket,
  CheckCircle, Clock, Eye, Star, CreditCard, BookOpen, Settings
} from 'lucide-react';

const WorkflowDocumentation = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading font-bold mb-3">
            Platform <span className="gradient-text">Workflow Documentation</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive end-to-end process documentation for every role and workflow on the platform.
          </p>
        </div>

        <Tabs defaultValue="student" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
            <TabsTrigger value="student" className="gap-1"><GraduationCap className="h-4 w-4" /> Student</TabsTrigger>
            <TabsTrigger value="company" className="gap-1"><Building2 className="h-4 w-4" /> Company</TabsTrigger>
            <TabsTrigger value="institutional" className="gap-1"><Users className="h-4 w-4" /> Institutional</TabsTrigger>
            <TabsTrigger value="admin" className="gap-1"><Shield className="h-4 w-4" /> Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <WorkflowCard
              title="Student Complete Workflow"
              processes={[
                { phase: 'Registration', steps: ['Visit /auth', 'Select Student role', 'Enter email & password', 'Verify email', 'Auto-create profile & student record', 'Auto-assign Student Standard Access role'] },
                { phase: 'Profile Setup', steps: ['Select Domain → Course → Specialization', 'Fill academic details (USN, College, Semester)', 'Upload resume & college ID', 'Set avatar & cover image', 'Fill current & permanent address', 'Write About Me bio', 'Add social links & skills'] },
                { phase: 'Internship Discovery', steps: ['Browse /internships page', 'Filter by domain, skills, location, work mode', 'Search by title or company', 'View internship details & company profile', 'AI-powered recommendations based on skills'] },
                { phase: 'Application', steps: ['Click Apply on internship', 'Write cover letter', 'Attach resume (from profile)', 'Submit application', 'Status set to "Applied"'] },
                { phase: 'Selection Process', steps: ['Company reviews → status: Under Review', 'Shortlisted candidates notified', 'Offer Released with details', 'Student views offer on dashboard'] },
                { phase: 'Offer & Onboarding', steps: ['Accept offer (free) or Pay & Accept (paid)', 'Confirmation dialog prevents accidents', 'Status → Offer Accepted', 'Internship Diary unlocked', 'Daily diary entries with title, content, skills, hours'] },
                { phase: 'AI Features', steps: ['AI Profile Analysis on Overview tab', 'Career Chatbot for guidance & tips', 'Skill-matched internship recommendations'] },
              ]}
            />
          </TabsContent>

          <TabsContent value="company">
            <WorkflowCard
              title="Company Complete Workflow"
              processes={[
                { phase: 'Registration', steps: ['Visit /auth', 'Select Company role', 'Enter email & password', 'Verify email', 'Auto-create profile & company record'] },
                { phase: 'Profile Completion', steps: ['Fill company details (name, industry, size)', 'Add GST/PAN, address, social links', 'Upload logo & cover image', 'Set internship domains, skills, modes', 'Fill contact person details', 'Accept terms & declaration'] },
                { phase: 'Admin Verification', steps: ['Admin reviews company profile', 'Verification checklist completed', 'Operational limits configured (max internships, etc.)', 'Company role assignment', 'is_verified set to true'] },
                { phase: 'Internship Management', steps: ['Create new internship listing', 'AI-generate description from title + skills', 'Set type (free/paid/stipended), work mode, duration', 'Set application deadline & positions', 'Publish listing (is_active = true)'] },
                { phase: 'Applicant Review', steps: ['View incoming applications', 'Review student profiles & resumes', 'Update status: Under Review → Shortlisted', 'Release offers to selected candidates', 'Track accepted/rejected ratios'] },
                { phase: 'Post-Verification', steps: ['Profile edits reset verification (except branding)', 'Logo/cover updates exempt from re-approval', 'Company limits enforce posting constraints'] },
              ]}
            />
          </TabsContent>

          <TabsContent value="institutional">
            <WorkflowCard
              title="Institutional Complete Workflow"
              processes={[
                { phase: 'University Registration', steps: ['Visit /auth', 'Select University role', 'Fill registration form', 'Edge Function: university-signup', 'Email verification bypassed', 'Creates: Auth User → Profile → Role → University'] },
                { phase: 'College Creation', steps: ['University Dashboard → Colleges Tab', 'Fill college form (name, email, password)', 'Edge Function: create-college-account', 'Creates: Auth User → Role → College → Coordinator', 'College can login at /auth'] },
                { phase: 'Coordinator Management', steps: ['University or College → Add Coordinator', 'Select college, fill name/email/password', 'Edge Function: create-coordinator-account', 'Links coordinator to specific college', 'Coordinator can login at /auth'] },
                { phase: 'Student Oversight', steps: ['Students register and select college', 'college_id FK links student to college', 'Coordinators see their college students', 'University sees all students across colleges'] },
                { phase: 'Diary Approval', steps: ['Students submit daily diary entries', 'Coordinators review entries', 'Approve/reject with remarks', 'Track hours worked & skills learned'] },
                { phase: 'Administration', steps: ['View org chart (University → Colleges → Coordinators/Students)', 'Login logs for all institutional users', 'Deactivate/remove coordinators', 'Manage college active status'] },
              ]}
            />
          </TabsContent>

          <TabsContent value="admin">
            <WorkflowCard
              title="Super Admin Complete Workflow"
              processes={[
                { phase: 'Platform Oversight', steps: ['Dashboard with real-time stats', 'Total companies, internships, students, applications', 'Pending actions & platform health cards', 'Architecture & flowchart documentation'] },
                { phase: 'Company Management', steps: ['Review pending company registrations', 'Verification checklist & approval dialog', 'Set company operational limits', 'Assign company roles', 'Delete companies if needed'] },
                { phase: 'User Management', steps: ['Manage all students, companies, universities', 'Create admin accounts', 'View all user profiles'] },
                { phase: 'RBAC Management', steps: ['Create custom roles with 76 granular permissions', 'Assign roles to users', 'Role scopes: super_admin, admin, university, college, coordinator, company, student', 'Audit log for all RBAC changes'] },
                { phase: 'Access Control', steps: ['Feature toggles via role_permissions', 'Per-user overrides via user_permissions', 'Field-level visibility controls', 'PermissionGate component enforcement'] },
                { phase: 'Platform Config', steps: ['Payment transaction oversight', 'Security logs & monitoring', 'Notification management', 'Data export & reports'] },
              ]}
            />
          </TabsContent>
        </Tabs>

        {/* Application Status Machine */}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Application Status Machine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Applied', 'Under Review', 'Shortlisted', 'Offer Released', 'Offer Accepted'].map((status, i, arr) => (
                <div key={status} className="flex items-center gap-2">
                  <Badge variant={i === arr.length - 1 ? 'default' : 'outline'} className="text-sm py-1 px-3">
                    {status}
                  </Badge>
                  {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-3 gap-4">
              <Badge variant="destructive" className="text-sm py-1 px-3">Rejected</Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3">Withdrawn</Badge>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Students can withdraw during Applied, Under Review, or Shortlisted phases. Companies can reject at any stage before acceptance.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

const WorkflowCard = ({ title, processes }: { title: string; processes: { phase: string; steps: string[] }[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {processes.map((p, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {i + 1}
              </div>
              <h3 className="font-semibold text-lg">{p.phase}</h3>
            </div>
            <div className="ml-9 space-y-1.5">
              {p.steps.map((step, j) => (
                <div key={j} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default WorkflowDocumentation;
