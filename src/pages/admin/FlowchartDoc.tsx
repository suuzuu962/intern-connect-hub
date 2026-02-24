import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Printer, ArrowLeft, GitBranch, ArrowDown, ArrowRight, 
  Building2, School, Users, GraduationCap, Briefcase, 
  FileText, Shield, CheckCircle, XCircle, Clock, 
  LogIn, UserPlus, Settings, Bell, Database,
  Eye, Edit, Trash2, Star, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FlowSection = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <section className="mb-12 break-inside-avoid">
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground print:text-black">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
    {children}
  </section>
);

interface FlowNodeProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  variant?: 'default' | 'start' | 'success' | 'warning' | 'danger' | 'process' | 'decision';
}

const FlowNode = ({ icon, label, sublabel, variant = 'default' }: FlowNodeProps) => {
  const variants = {
    default: 'bg-card border-border',
    start: 'bg-primary/10 border-primary/30',
    success: 'bg-green-500/10 border-green-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    danger: 'bg-destructive/10 border-destructive/30',
    process: 'bg-blue-500/10 border-blue-500/30',
    decision: 'bg-purple-500/10 border-purple-500/30 rotate-0',
  };

  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    start: 'bg-primary/20 text-primary',
    success: 'bg-green-500/20 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    danger: 'bg-destructive/20 text-destructive',
    process: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    decision: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-lg border min-w-[170px] ${variants[variant]}`}>
      <div className={`p-1.5 rounded-full shrink-0 ${iconVariants[variant]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight truncate">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground leading-tight">{sublabel}</p>}
      </div>
    </div>
  );
};

const FlowArrow = ({ direction = 'right', label }: { direction?: 'right' | 'down'; label?: string }) => (
  <div className={`flex items-center justify-center ${direction === 'down' ? 'flex-col py-1' : 'px-1'}`}>
    {direction === 'right' ? (
      <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
    ) : (
      <ArrowDown className="h-4 w-4 text-muted-foreground" />
    )}
    {label && <span className="text-[10px] text-muted-foreground font-medium">{label}</span>}
  </div>
);

const HorizontalFlow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2 pl-2">{children}</div>
);

const VerticalFlow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-1">{children}</div>
);

const BranchFlow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-center">{children}</div>
);

const FlowchartDoc = () => {
  const navigate = useNavigate();
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header */}
      <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Platform Flowchart Documentation</h1>
          </div>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-57px)] print:h-auto">
        <div className="max-w-5xl mx-auto px-8 py-10 print:px-0 print:py-4">

          {/* Title */}
          <div className="text-center mb-12 print:mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground print:text-black mb-2">
              Platform Flowchart Documentation
            </h1>
            <p className="text-lg text-muted-foreground">Visual Process & Workflow Reference</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5" />Start</Badge>
              <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />Process</Badge>
              <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1.5" />Decision</Badge>
              <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />Edge Function</Badge>
              <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />Success</Badge>
              <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-destructive mr-1.5" />Error / Reject</Badge>
            </div>
          </div>

          <Separator className="mb-10" />

          {/* 1. Student Registration Flow */}
          <FlowSection title="1. Student Registration & Onboarding" subtitle="How students sign up, complete profiles, and access the platform">
            <VerticalFlow>
              <FlowNode icon={<LogIn className="h-4 w-4" />} label="Visit /auth" sublabel="Select 'Student' role" variant="start" />
              <FlowArrow direction="down" />
              <FlowNode icon={<FileText className="h-4 w-4" />} label="Fill Registration Form" sublabel="Name, Email, Password" variant="default" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Shield className="h-4 w-4" />} label="Email Verification" sublabel="Confirm email address" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Database className="h-4 w-4" />} label="Auto-Create Records" sublabel="Auth User → Profile → Role → Student" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Edit className="h-4 w-4" />} label="Complete Student Profile" sublabel="College, Degree, Skills, Domain" variant="default" />
              <FlowArrow direction="down" />
              <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="Access Student Dashboard" sublabel="/student/dashboard" variant="success" />
            </VerticalFlow>
          </FlowSection>

          <Separator className="mb-10" />

          {/* 2. Company Registration Flow */}
          <FlowSection title="2. Company Registration & Verification" subtitle="How companies register, get verified, and start posting internships">
            <VerticalFlow>
              <FlowNode icon={<LogIn className="h-4 w-4" />} label="Visit /auth" sublabel="Select 'Company' role" variant="start" />
              <FlowArrow direction="down" />
              <FlowNode icon={<FileText className="h-4 w-4" />} label="Fill Company Details" sublabel="Name, Industry, Contact Info" variant="default" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Shield className="h-4 w-4" />} label="Email Verification" sublabel="Verify company email" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Database className="h-4 w-4" />} label="Create Records" sublabel="Auth User → Profile → Role → Company" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Edit className="h-4 w-4" />} label="Complete Company Profile" sublabel="Logo, Description, Domains, Skills" variant="default" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Eye className="h-4 w-4" />} label="Admin Review" sublabel="Pending verification (is_verified)" variant="decision" />
              <FlowArrow direction="down" />
              <BranchFlow>
                <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="Approved" sublabel="Can post internships" variant="success" />
                <FlowNode icon={<XCircle className="h-4 w-4" />} label="Rejected" sublabel="Notified via system" variant="danger" />
              </BranchFlow>
            </VerticalFlow>
          </FlowSection>

          <Separator className="mb-10" />

          {/* 3. Institutional Onboarding */}
          <FlowSection title="3. Institutional Onboarding Hierarchy" subtitle="University → College → Coordinator → Student chain">
            <Card className="p-6">
              <CardContent className="p-0">
                <VerticalFlow>
                  {/* University */}
                  <div className="w-full max-w-lg">
                    <h3 className="text-sm font-semibold text-primary mb-3 text-center">Step 1: University Registration</h3>
                    <HorizontalFlow>
                      <FlowNode icon={<Building2 className="h-4 w-4" />} label="/university-auth" sublabel="Sign up form" variant="start" />
                      <FlowArrow />
                      <FlowNode icon={<Settings className="h-4 w-4" />} label="university-signup" sublabel="Edge Function" variant="warning" />
                      <FlowArrow />
                      <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="University Created" sublabel="Immediate access" variant="success" />
                    </HorizontalFlow>
                  </div>
                  
                  <FlowArrow direction="down" label="manages" />

                  {/* College */}
                  <div className="w-full max-w-lg">
                    <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 text-center">Step 2: College Creation</h3>
                    <HorizontalFlow>
                      <FlowNode icon={<Building2 className="h-4 w-4" />} label="University Dashboard" sublabel="Colleges Tab" variant="process" />
                      <FlowArrow />
                      <FlowNode icon={<Settings className="h-4 w-4" />} label="create-college-account" sublabel="Edge Function" variant="warning" />
                      <FlowArrow />
                      <FlowNode icon={<School className="h-4 w-4" />} label="College Created" sublabel="Login enabled" variant="success" />
                    </HorizontalFlow>
                  </div>

                  <FlowArrow direction="down" label="assigns" />

                  {/* Coordinator */}
                  <div className="w-full max-w-lg">
                    <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 text-center">Step 3: Coordinator Assignment</h3>
                    <HorizontalFlow>
                      <FlowNode icon={<Building2 className="h-4 w-4" />} label="University Dashboard" sublabel="Coordinators Tab" variant="process" />
                      <FlowArrow />
                      <FlowNode icon={<Settings className="h-4 w-4" />} label="create-coordinator-account" sublabel="Edge Function" variant="warning" />
                      <FlowArrow />
                      <FlowNode icon={<Users className="h-4 w-4" />} label="Coordinator Ready" sublabel="Linked to college" variant="success" />
                    </HorizontalFlow>
                  </div>

                  <FlowArrow direction="down" label="oversees" />

                  {/* Student */}
                  <div className="w-full max-w-lg">
                    <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 text-center">Step 4: Student Self-Registration</h3>
                    <HorizontalFlow>
                      <FlowNode icon={<UserPlus className="h-4 w-4" />} label="Student signs up" sublabel="/auth → selects college" variant="start" />
                      <FlowArrow />
                      <FlowNode icon={<Database className="h-4 w-4" />} label="college_id linked" sublabel="FK to colleges" variant="process" />
                      <FlowArrow />
                      <FlowNode icon={<GraduationCap className="h-4 w-4" />} label="Visible to hierarchy" sublabel="Coordinator & University" variant="success" />
                    </HorizontalFlow>
                  </div>
                </VerticalFlow>
              </CardContent>
            </Card>
          </FlowSection>

          <Separator className="mb-10" />

          {/* 4. Internship Lifecycle */}
          <FlowSection title="4. Internship Lifecycle" subtitle="From posting to completion — the full internship journey">
            <VerticalFlow>
              <FlowNode icon={<Briefcase className="h-4 w-4" />} label="Company Posts Internship" sublabel="Title, Skills, Duration, Stipend" variant="start" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Eye className="h-4 w-4" />} label="Listed on Platform" sublabel="Students can browse & filter" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<FileText className="h-4 w-4" />} label="Student Applies" sublabel="Cover letter + Resume" variant="default" />
              <FlowArrow direction="down" label="status: applied" />
              <FlowNode icon={<Clock className="h-4 w-4" />} label="Under Review" sublabel="Company reviews application" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Eye className="h-4 w-4" />} label="Decision Point" sublabel="Company evaluates candidate" variant="decision" />
              <FlowArrow direction="down" />
              <BranchFlow>
                <VerticalFlow>
                  <FlowNode icon={<Star className="h-4 w-4" />} label="Shortlisted" sublabel="Moves to next round" variant="process" />
                  <FlowArrow direction="down" />
                  <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="Offer Released" sublabel="Student notified" variant="success" />
                  <FlowArrow direction="down" />
                  <BranchFlow>
                    <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="Offer Accepted" sublabel="Internship begins" variant="success" />
                    <FlowNode icon={<XCircle className="h-4 w-4" />} label="Withdrawn" sublabel="Student declines" variant="danger" />
                  </BranchFlow>
                </VerticalFlow>
                <FlowNode icon={<XCircle className="h-4 w-4" />} label="Rejected" sublabel="Application closed" variant="danger" />
              </BranchFlow>
            </VerticalFlow>
          </FlowSection>

          <Separator className="mb-10" />

          {/* 5. Application Status Flow */}
          <FlowSection title="5. Application Status State Machine" subtitle="All valid status transitions for internship applications">
            <Card className="p-6">
              <CardContent className="p-0">
                <HorizontalFlow>
                  <FlowNode icon={<FileText className="h-4 w-4" />} label="applied" variant="start" />
                  <FlowArrow />
                  <FlowNode icon={<Clock className="h-4 w-4" />} label="under_review" variant="process" />
                  <FlowArrow />
                  <FlowNode icon={<Star className="h-4 w-4" />} label="shortlisted" variant="process" />
                  <FlowArrow />
                  <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="offer_released" variant="success" />
                  <FlowArrow />
                  <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="offer_accepted" variant="success" />
                </HorizontalFlow>
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Any stage →</Badge>
                    <FlowNode icon={<XCircle className="h-4 w-4" />} label="withdrawn" sublabel="By student" variant="danger" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Review/Shortlist →</Badge>
                    <FlowNode icon={<XCircle className="h-4 w-4" />} label="rejected" sublabel="By company" variant="danger" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </FlowSection>

          <Separator className="mb-10" />

          {/* 6. Diary Workflow */}
          <FlowSection title="6. Internship Diary Workflow" subtitle="Student diary submission and coordinator approval process">
            <VerticalFlow>
              <FlowNode icon={<GraduationCap className="h-4 w-4" />} label="Student has active internship" sublabel="status: offer_accepted" variant="start" />
              <FlowArrow direction="down" />
              <FlowNode icon={<BookOpen className="h-4 w-4" />} label="Create Diary Entry" sublabel="Date, Title, Content, Hours, Skills" variant="default" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Clock className="h-4 w-4" />} label="Pending Approval" sublabel="is_approved = null" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Users className="h-4 w-4" />} label="Coordinator Reviews" sublabel="College dashboard → Diary Approval" variant="decision" />
              <FlowArrow direction="down" />
              <BranchFlow>
                <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="Approved" sublabel="approved_by + timestamp" variant="success" />
                <FlowNode icon={<XCircle className="h-4 w-4" />} label="Rejected with Remarks" sublabel="coordinator_remarks added" variant="danger" />
              </BranchFlow>
            </VerticalFlow>
          </FlowSection>

          <Separator className="mb-10" />

          {/* 7. RBAC Permission Resolution */}
          <FlowSection title="7. RBAC Permission Resolution Flow" subtitle="How the system determines if a user has access to a feature">
            <VerticalFlow>
              <FlowNode icon={<Shield className="h-4 w-4" />} label="Permission Check Requested" sublabel="usePermissions() hook called" variant="start" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Eye className="h-4 w-4" />} label="Is role 'admin'?" sublabel="Bypass all checks" variant="decision" />
              <FlowArrow direction="down" />
              <BranchFlow>
                <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="Yes → ALLOW" sublabel="Admin has full access" variant="success" />
                <VerticalFlow>
                  <FlowNode icon={<Database className="h-4 w-4" />} label="No → Check user_permissions" sublabel="User-level override?" variant="process" />
                  <FlowArrow direction="down" />
                  <FlowNode icon={<Database className="h-4 w-4" />} label="Check role_permissions" sublabel="Legacy feature toggle?" variant="process" />
                  <FlowArrow direction="down" />
                  <FlowNode icon={<Database className="h-4 w-4" />} label="Check custom_role_permissions" sublabel="Via user_custom_roles" variant="process" />
                  <FlowArrow direction="down" />
                  <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="Default → ALLOW" sublabel="No record = permitted" variant="success" />
                </VerticalFlow>
              </BranchFlow>
            </VerticalFlow>
          </FlowSection>

          <Separator className="mb-10" />

          {/* 8. Notification Flow */}
          <FlowSection title="8. Notification Dispatch Flow" subtitle="How system and admin notifications reach users">
            <VerticalFlow>
              <FlowNode icon={<Bell className="h-4 w-4" />} label="Trigger Event" sublabel="Application update, admin action, etc." variant="start" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Database className="h-4 w-4" />} label="Insert into notifications" sublabel="user_id, title, message, type" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Eye className="h-4 w-4" />} label="Target Filtering" sublabel="target_role or specific user_id" variant="decision" />
              <FlowArrow direction="down" />
              <FlowNode icon={<Bell className="h-4 w-4" />} label="NotificationBell Updates" sublabel="Unread count badge" variant="process" />
              <FlowArrow direction="down" />
              <FlowNode icon={<CheckCircle className="h-4 w-4" />} label="User Views & Reads" sublabel="is_read → true" variant="success" />
            </VerticalFlow>
          </FlowSection>

          <Separator className="mb-10" />

          {/* 9. Data Hierarchy Diagram */}
          <FlowSection title="9. Data Hierarchy & Relationships" subtitle="How database entities relate to each other">
            <Card className="p-6">
              <CardContent className="p-0">
                <VerticalFlow>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 w-full max-w-sm text-center">
                    <Building2 className="h-5 w-5 text-primary mx-auto mb-1" />
                    <span className="font-semibold">Universities</span>
                    <Badge variant="outline" className="ml-2 text-xs">Root Entity</Badge>
                  </div>
                  <FlowArrow direction="down" label="university_id FK" />
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 w-full max-w-sm text-center">
                    <School className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <span className="font-semibold">Colleges</span>
                  </div>
                  <FlowArrow direction="down" label="college_id FK" />
                  <BranchFlow>
                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 text-center flex-1">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                      <span className="font-semibold text-sm">Coordinators</span>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center flex-1">
                      <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                      <span className="font-semibold text-sm">Students</span>
                    </div>
                  </BranchFlow>
                  <FlowArrow direction="down" label="student_id FK" />
                  <BranchFlow>
                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 text-center flex-1">
                      <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                      <span className="font-semibold text-sm">Applications</span>
                    </div>
                    <div className="p-4 bg-card rounded-lg border border-border text-center flex-1">
                      <BookOpen className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <span className="font-semibold text-sm">Diary Entries</span>
                    </div>
                  </BranchFlow>
                </VerticalFlow>

                <Separator className="my-6" />

                <div className="text-center">
                  <h3 className="text-sm font-semibold mb-3">Company Side</h3>
                  <VerticalFlow>
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 w-full max-w-sm text-center mx-auto">
                      <Briefcase className="h-5 w-5 text-primary mx-auto mb-1" />
                      <span className="font-semibold">Companies</span>
                    </div>
                    <FlowArrow direction="down" label="company_id FK" />
                    <BranchFlow>
                      <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-center flex-1">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                        <span className="font-semibold text-sm">Internships</span>
                      </div>
                      <div className="p-4 bg-card rounded-lg border border-border text-center flex-1">
                        <Settings className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <span className="font-semibold text-sm">Company Limits</span>
                      </div>
                    </BranchFlow>
                  </VerticalFlow>
                </div>
              </CardContent>
            </Card>
          </FlowSection>

          {/* Footer */}
          <Separator className="my-6" />
          <div className="text-center text-xs text-muted-foreground pb-8">
            <p>Internship Management Portal — Flowchart Documentation</p>
            <p>Generated {new Date().toISOString()}</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default FlowchartDoc;
