import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  School, 
  Users, 
  GraduationCap, 
  ArrowDown, 
  ArrowRight,
  UserPlus,
  KeyRound,
  Database,
  CheckCircle,
  FileText,
  LogIn
} from 'lucide-react';

export const InstitutionalWorkflowDiagram = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Institutional Registration & Management Workflow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* University Registration Flow */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              1. University Registration
            </h3>
            <div className="flex flex-wrap items-center gap-3 pl-4">
              <WorkflowStep 
                icon={<LogIn className="h-4 w-4" />}
                label="Visit /auth"
                sublabel="Select 'University' role"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<FileText className="h-4 w-4" />}
                label="Fill Registration Form"
                sublabel="Name, Email, Contact Details"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<KeyRound className="h-4 w-4" />}
                label="Edge Function: university-signup"
                sublabel="Bypasses email verification"
                highlight
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<Database className="h-4 w-4" />}
                label="Creates Records"
                sublabel="Auth User → Profile → Role → University"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<CheckCircle className="h-4 w-4" />}
                label="Access Dashboard"
                sublabel="/university/dashboard"
                success
              />
            </div>
          </div>

          {/* College Creation Flow */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <School className="h-5 w-5" />
              2. College Creation (by University)
            </h3>
            <div className="flex flex-wrap items-center gap-3 pl-4">
              <WorkflowStep 
                icon={<Building2 className="h-4 w-4" />}
                label="University Dashboard"
                sublabel="Colleges Tab → Add College"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<FileText className="h-4 w-4" />}
                label="Fill College Form"
                sublabel="Name, Email, Password, Contact"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<KeyRound className="h-4 w-4" />}
                label="Edge Function: create-college-account"
                sublabel="Admin creates auth user"
                highlight
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<Database className="h-4 w-4" />}
                label="Creates Records"
                sublabel="Auth User → Role → College"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<CheckCircle className="h-4 w-4" />}
                label="College Can Login"
                sublabel="/auth → /college/dashboard"
                success
              />
            </div>
          </div>


          {/* Student Assignment Flow */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
              <GraduationCap className="h-5 w-5" />
              3. Student Assignment
            </h3>
            <div className="flex flex-wrap items-center gap-3 pl-4">
              <WorkflowStep 
                icon={<UserPlus className="h-4 w-4" />}
                label="Student Registers"
                sublabel="/auth → Selects College"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<Database className="h-4 w-4" />}
                label="college_id Linked"
                sublabel="Student → College FK"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
              <WorkflowStep 
                icon={<CheckCircle className="h-4 w-4" />}
                label="Visible to College"
                sublabel="& University Admins"
                success
              />
            </div>
          </div>

          {/* Data Hierarchy */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Data Hierarchy (Database Relationships)</h3>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20 w-full max-w-md justify-center">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium">Universities</span>
                <Badge variant="outline" className="ml-2">Root</Badge>
              </div>
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 w-full max-w-md justify-center">
                <School className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Colleges</span>
                <Badge variant="outline" className="ml-2">university_id FK</Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-lg">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex-1 justify-center">
                  <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-sm">Students</span>
                  <Badge variant="outline" className="text-xs">college_id FK</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Access Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <DashboardAccessCard 
              role="University"
              route="/university/dashboard"
              capabilities={['Manage Colleges', 'View All Students', 'Org Chart', 'Login Logs']}
              color="primary"
            />
            <DashboardAccessCard 
              role="College"
              route="/college/dashboard"
              capabilities={['View Students', 'Approve Diary Entries', 'Profile Management']}
              color="blue"
            />
            <DashboardAccessCard 
              role="Super Admin"
              route="/admin/dashboard"
              capabilities={['Platform Oversight', 'Approve Universities', 'Full Org Chart', 'Manage All Entities']}
              color="amber"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface WorkflowStepProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  highlight?: boolean;
  success?: boolean;
}

const WorkflowStep = ({ icon, label, sublabel, highlight, success }: WorkflowStepProps) => (
  <div className={`
    flex items-center gap-2 p-3 rounded-lg border min-w-[160px]
    ${highlight ? 'bg-amber-500/10 border-amber-500/30' : ''}
    ${success ? 'bg-green-500/10 border-green-500/30' : ''}
    ${!highlight && !success ? 'bg-card border-border' : ''}
  `}>
    <div className={`
      p-1.5 rounded-full
      ${highlight ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : ''}
      ${success ? 'bg-green-500/20 text-green-600 dark:text-green-400' : ''}
      ${!highlight && !success ? 'bg-muted text-muted-foreground' : ''}
    `}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium leading-tight">{label}</p>
      <p className="text-xs text-muted-foreground leading-tight">{sublabel}</p>
    </div>
  </div>
);

interface DashboardAccessCardProps {
  role: string;
  route: string;
  capabilities: string[];
  color: 'primary' | 'blue' | 'amber';
}

const DashboardAccessCard = ({ role, route, capabilities, color }: DashboardAccessCardProps) => {
  const colorClasses = {
    primary: 'border-primary/30 bg-primary/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
  };

  const iconColors = {
    primary: 'text-primary',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Building2 className={`h-4 w-4 ${iconColors[color]}`} />
        <span className="font-semibold">{role}</span>
      </div>
      <code className="text-xs bg-muted px-2 py-1 rounded block mb-3">{route}</code>
      <ul className="text-xs space-y-1">
        {capabilities.map((cap, i) => (
          <li key={i} className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            {cap}
          </li>
        ))}
      </ul>
    </div>
  );
};
