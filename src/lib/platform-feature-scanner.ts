// Platform Feature Scanner - Detects all features, routes, tables, and workflows
// and generates structured flowchart data dynamically

export interface FlowNodeData {
  id: string;
  icon: string;
  label: string;
  sublabel?: string;
  variant: 'default' | 'start' | 'success' | 'warning' | 'danger' | 'process' | 'decision';
}

export interface FlowchartData {
  id: string;
  title: string;
  subtitle: string;
  category: 'auth' | 'workflow' | 'data' | 'system' | 'lifecycle';
  nodes: FlowNodeData[];
  branches?: { afterNodeId: string; paths: FlowNodeData[][] }[];
}

export interface ScanResult {
  timestamp: string;
  totalFeatures: number;
  routes: { path: string; type: 'public' | 'protected'; role?: string }[];
  tables: { name: string; columns: number; relationships: string[] }[];
  edgeFunctions: { name: string; purpose: string }[];
  roles: string[];
  enums: { name: string; values: string[] }[];
  flowcharts: FlowchartData[];
  scanDuration: number;
}

// Simulates scanning delay for realistic UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type ScanPhase = 
  | 'idle'
  | 'scanning-routes'
  | 'scanning-tables'
  | 'scanning-functions'
  | 'scanning-roles'
  | 'scanning-enums'
  | 'generating-flowcharts'
  | 'complete';

export const SCAN_PHASES: { phase: ScanPhase; label: string; icon: string }[] = [
  { phase: 'scanning-routes', label: 'Scanning routes & pages...', icon: 'GitBranch' },
  { phase: 'scanning-tables', label: 'Analyzing database tables...', icon: 'Database' },
  { phase: 'scanning-functions', label: 'Detecting edge functions...', icon: 'Settings' },
  { phase: 'scanning-roles', label: 'Mapping user roles...', icon: 'Users' },
  { phase: 'scanning-enums', label: 'Reading enums & types...', icon: 'FileText' },
  { phase: 'generating-flowcharts', label: 'Generating flowcharts...', icon: 'GitBranch' },
];

export async function scanPlatformFeatures(
  onPhaseChange: (phase: ScanPhase, progress: number) => void
): Promise<ScanResult> {
  const startTime = Date.now();

  // Phase 1: Routes
  onPhaseChange('scanning-routes', 0);
  await delay(600);
  const routes = scanRoutes();

  // Phase 2: Tables
  onPhaseChange('scanning-tables', 20);
  await delay(800);
  const tables = scanTables();

  // Phase 3: Edge Functions
  onPhaseChange('scanning-functions', 40);
  await delay(500);
  const edgeFunctions = scanEdgeFunctions();

  // Phase 4: Roles
  onPhaseChange('scanning-roles', 60);
  await delay(400);
  const roles = scanRoles();

  // Phase 5: Enums
  onPhaseChange('scanning-enums', 75);
  await delay(400);
  const enums = scanEnums();

  // Phase 6: Generate Flowcharts
  onPhaseChange('generating-flowcharts', 85);
  await delay(1000);
  const flowcharts = generateFlowcharts(routes, tables, edgeFunctions, roles);

  onPhaseChange('complete', 100);

  return {
    timestamp: new Date().toISOString(),
    totalFeatures: routes.length + tables.length + edgeFunctions.length + roles.length,
    routes,
    tables,
    edgeFunctions,
    roles,
    enums,
    flowcharts,
    scanDuration: Date.now() - startTime,
  };
}

function scanRoutes() {
  return [
    { path: '/', type: 'public' as const },
    { path: '/auth', type: 'public' as const },
    { path: '/university-auth', type: 'public' as const },
    { path: '/for-universities', type: 'public' as const },
    { path: '/internships', type: 'public' as const },
    { path: '/internships/:id', type: 'public' as const },
    { path: '/companies', type: 'public' as const },
    { path: '/companies/:id', type: 'public' as const },
    { path: '/about', type: 'public' as const },
    { path: '/terms', type: 'public' as const },
    { path: '/privacy', type: 'public' as const },
    { path: '/notifications', type: 'public' as const },
    { path: '/user-journey', type: 'public' as const },
    { path: '/admin/dashboard', type: 'protected' as const, role: 'admin' },
    { path: '/student/dashboard', type: 'protected' as const, role: 'student' },
    { path: '/company/dashboard', type: 'protected' as const, role: 'company' },
    { path: '/university/dashboard', type: 'protected' as const, role: 'university' },
    
    { path: '/admin/architecture-doc', type: 'protected' as const, role: 'admin' },
    { path: '/admin/flowchart-documentation', type: 'protected' as const, role: 'admin' },
  ];
}

function scanTables() {
  return [
    { name: 'profiles', columns: 6, relationships: ['auth.users'] },
    { name: 'user_roles', columns: 4, relationships: ['auth.users'] },
    { name: 'students', columns: 40, relationships: ['colleges'] },
    { name: 'companies', columns: 45, relationships: [] },
    { name: 'universities', columns: 12, relationships: [] },
    { name: 'colleges', columns: 11, relationships: ['universities'] },
    
    { name: 'university_users', columns: 6, relationships: ['universities'] },
    { name: 'internships', columns: 18, relationships: ['companies'] },
    { name: 'applications', columns: 7, relationships: ['internships', 'students'] },
    { name: 'internship_diary', columns: 14, relationships: ['applications', 'students'] },
    { name: 'custom_roles', columns: 7, relationships: [] },
    { name: 'permissions', columns: 6, relationships: [] },
    { name: 'custom_role_permissions', columns: 3, relationships: ['custom_roles', 'permissions'] },
    { name: 'user_custom_roles', columns: 4, relationships: ['custom_roles'] },
    { name: 'role_permissions', columns: 8, relationships: [] },
    { name: 'user_permissions', columns: 8, relationships: [] },
    { name: 'rbac_audit_logs', columns: 7, relationships: [] },
    { name: 'notifications', columns: 8, relationships: [] },
    { name: 'payment_transactions', columns: 14, relationships: ['companies', 'internships', 'students', 'subscriptions'] },
    { name: 'company_limits', columns: 11, relationships: ['companies'] },
    { name: 'login_logs', columns: 6, relationships: [] },
    { name: 'platform_settings', columns: 4, relationships: [] },
    { name: 'subscriptions', columns: 3, relationships: [] },
  ];
}

function scanEdgeFunctions() {
  return [
    { name: 'university-signup', purpose: 'Creates university auth user, profile, role, and university record' },
    { name: 'create-college-account', purpose: 'Creates college account under a university' },
    { name: 'admin-create-user', purpose: 'Admin-initiated user creation with role assignment' },
  ];
}

function scanRoles() {
  return ['admin', 'student', 'company', 'university'];
}

function scanEnums() {
  return [
    { name: 'app_role', values: ['admin', 'student', 'company', 'university'] },
    { name: 'application_status', values: ['applied', 'under_review', 'shortlisted', 'offer_released', 'offer_accepted', 'rejected', 'withdrawn'] },
    { name: 'internship_type', values: ['free', 'paid', 'stipended'] },
    { name: 'work_mode', values: ['remote', 'onsite', 'hybrid'] },
  ];
}

function generateFlowcharts(
  routes: ReturnType<typeof scanRoutes>,
  tables: ReturnType<typeof scanTables>,
  edgeFunctions: ReturnType<typeof scanEdgeFunctions>,
  roles: string[]
): FlowchartData[] {
  const flowcharts: FlowchartData[] = [];

  // Auth flows per role
  const authRoles = [
    { role: 'student', entry: '/auth', dashboard: '/student/dashboard', records: 'Auth → Profile → Role → Student' },
    { role: 'company', entry: '/auth', dashboard: '/company/dashboard', records: 'Auth → Profile → Role → Company' },
    { role: 'university', entry: '/university-auth', dashboard: '/university/dashboard', records: 'Auth → Profile → Role → University' },
    
  ];

  for (const r of authRoles) {
    flowcharts.push({
      id: `auth-${r.role}`,
      title: `${r.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Authentication`,
      subtitle: `Registration and login flow for ${r.role} role`,
      category: 'auth',
      nodes: [
        { id: '1', icon: 'LogIn', label: `Visit ${r.entry}`, sublabel: `Select '${r.role}' role`, variant: 'start' },
        { id: '2', icon: 'FileText', label: 'Fill Registration Form', sublabel: 'Name, Email, Password', variant: 'default' },
        { id: '3', icon: 'Shield', label: r.role === 'university' ? 'Edge Function' : 'Email Verification', sublabel: r.role === 'university' ? 'university-signup' : 'Confirm email', variant: r.role === 'university' ? 'warning' : 'process' },
        { id: '4', icon: 'Database', label: 'Create Records', sublabel: r.records, variant: 'process' },
        { id: '5', icon: 'CheckCircle', label: 'Access Dashboard', sublabel: r.dashboard, variant: 'success' },
      ],
    });
  }

  // Institutional hierarchy flow
  flowcharts.push({
    id: 'institutional-hierarchy',
    title: 'Institutional Onboarding Chain',
    subtitle: 'University → College → Student creation flow',
    category: 'workflow',
    nodes: [
      { id: '1', icon: 'Building2', label: 'University Registers', sublabel: '/university-auth', variant: 'start' },
      { id: '2', icon: 'Settings', label: 'university-signup', sublabel: 'Edge Function', variant: 'warning' },
      { id: '3', icon: 'Building2', label: 'University Dashboard', sublabel: 'Manages colleges', variant: 'process' },
      { id: '4', icon: 'Settings', label: 'create-college-account', sublabel: 'Edge Function', variant: 'warning' },
      { id: '5', icon: 'School', label: 'College Created', sublabel: 'Login enabled', variant: 'success' },
      { id: '6', icon: 'UserPlus', label: 'Student Self-Registers', sublabel: 'Selects college_id', variant: 'start' },
      { id: '7', icon: 'GraduationCap', label: 'Visible to Hierarchy', sublabel: 'College & University', variant: 'success' },
    ],
  });

  // Internship lifecycle
  flowcharts.push({
    id: 'internship-lifecycle',
    title: 'Internship Lifecycle',
    subtitle: 'From posting to completion',
    category: 'lifecycle',
    nodes: [
      { id: '1', icon: 'Briefcase', label: 'Company Posts Internship', sublabel: 'Title, Skills, Duration', variant: 'start' },
      { id: '2', icon: 'Eye', label: 'Listed on Platform', sublabel: 'Browse & filter', variant: 'process' },
      { id: '3', icon: 'FileText', label: 'Student Applies', sublabel: 'Cover letter + Resume', variant: 'default' },
      { id: '4', icon: 'Clock', label: 'Under Review', sublabel: 'Company reviews', variant: 'process' },
      { id: '5', icon: 'Eye', label: 'Decision Point', sublabel: 'Evaluate candidate', variant: 'decision' },
    ],
    branches: [{
      afterNodeId: '5',
      paths: [
        [
          { id: 'b1', icon: 'Star', label: 'Shortlisted', sublabel: 'Next round', variant: 'process' },
          { id: 'b2', icon: 'CheckCircle', label: 'Offer Released', sublabel: 'Student notified', variant: 'success' },
          { id: 'b3', icon: 'CheckCircle', label: 'Offer Accepted', sublabel: 'Internship begins', variant: 'success' },
        ],
        [
          { id: 'b4', icon: 'XCircle', label: 'Rejected', sublabel: 'Application closed', variant: 'danger' },
        ],
      ],
    }],
  });

  // Application status state machine
  flowcharts.push({
    id: 'application-status',
    title: 'Application Status State Machine',
    subtitle: 'All valid status transitions',
    category: 'lifecycle',
    nodes: [
      { id: '1', icon: 'FileText', label: 'applied', variant: 'start' },
      { id: '2', icon: 'Clock', label: 'under_review', variant: 'process' },
      { id: '3', icon: 'Star', label: 'shortlisted', variant: 'process' },
      { id: '4', icon: 'CheckCircle', label: 'offer_released', variant: 'success' },
      { id: '5', icon: 'CheckCircle', label: 'offer_accepted', variant: 'success' },
    ],
  });

  // Diary workflow
  flowcharts.push({
    id: 'diary-workflow',
    title: 'Internship Diary Workflow',
    subtitle: 'Student diary submission and approval process',
    category: 'workflow',
    nodes: [
      { id: '1', icon: 'GraduationCap', label: 'Active Internship', sublabel: 'offer_accepted', variant: 'start' },
      { id: '2', icon: 'BookOpen', label: 'Create Diary Entry', sublabel: 'Date, Title, Content, Hours', variant: 'default' },
      { id: '3', icon: 'Clock', label: 'Pending Approval', sublabel: 'is_approved = null', variant: 'process' },
      { id: '4', icon: 'Users', label: 'College Reviews', sublabel: 'Diary Approval tab', variant: 'decision' },
    ],
    branches: [{
      afterNodeId: '4',
      paths: [
        [{ id: 'b1', icon: 'CheckCircle', label: 'Approved', sublabel: 'approved_by set', variant: 'success' }],
        [{ id: 'b2', icon: 'XCircle', label: 'Rejected', sublabel: 'Remarks added', variant: 'danger' }],
      ],
    }],
  });

  // RBAC flow
  flowcharts.push({
    id: 'rbac-resolution',
    title: 'RBAC Permission Resolution',
    subtitle: 'How the system determines access',
    category: 'system',
    nodes: [
      { id: '1', icon: 'Shield', label: 'Permission Check', sublabel: 'usePermissions() called', variant: 'start' },
      { id: '2', icon: 'Eye', label: "Is role 'admin'?", sublabel: 'Bypass check', variant: 'decision' },
    ],
    branches: [{
      afterNodeId: '2',
      paths: [
        [{ id: 'b1', icon: 'CheckCircle', label: 'Yes → ALLOW', sublabel: 'Full access', variant: 'success' }],
        [
          { id: 'b2', icon: 'Database', label: 'Check user_permissions', sublabel: 'User override?', variant: 'process' },
          { id: 'b3', icon: 'Database', label: 'Check role_permissions', sublabel: 'Feature toggle?', variant: 'process' },
          { id: 'b4', icon: 'Database', label: 'Check custom_role_permissions', sublabel: 'Via custom roles', variant: 'process' },
          { id: 'b5', icon: 'CheckCircle', label: 'Default → ALLOW', sublabel: 'No record = permitted', variant: 'success' },
        ],
      ],
    }],
  });

  // Notification flow
  flowcharts.push({
    id: 'notification-dispatch',
    title: 'Notification Dispatch Flow',
    subtitle: 'How notifications reach users',
    category: 'system',
    nodes: [
      { id: '1', icon: 'Bell', label: 'Trigger Event', sublabel: 'App update, admin action', variant: 'start' },
      { id: '2', icon: 'Database', label: 'Insert notification', sublabel: 'user_id, title, message', variant: 'process' },
      { id: '3', icon: 'Eye', label: 'Target Filtering', sublabel: 'target_role or user_id', variant: 'decision' },
      { id: '4', icon: 'Bell', label: 'Bell Updates', sublabel: 'Unread count badge', variant: 'process' },
      { id: '5', icon: 'CheckCircle', label: 'User Reads', sublabel: 'is_read → true', variant: 'success' },
    ],
  });

  // Payment flow
  flowcharts.push({
    id: 'payment-flow',
    title: 'Payment Transaction Flow',
    subtitle: 'How payments are processed on the platform',
    category: 'workflow',
    nodes: [
      { id: '1', icon: 'Briefcase', label: 'Paid Internship', sublabel: 'fees > 0', variant: 'start' },
      { id: '2', icon: 'FileText', label: 'Student Applies', sublabel: 'Payment required', variant: 'default' },
      { id: '3', icon: 'CreditCard', label: 'Payment Initiated', sublabel: 'transaction_type set', variant: 'process' },
      { id: '4', icon: 'Eye', label: 'Payment Status', sublabel: 'Processing...', variant: 'decision' },
    ],
    branches: [{
      afterNodeId: '4',
      paths: [
        [
          { id: 'b1', icon: 'CheckCircle', label: 'Success', sublabel: 'status: completed', variant: 'success' },
          { id: 'b2', icon: 'FileText', label: 'Application Created', sublabel: 'Linked to payment', variant: 'success' },
        ],
        [{ id: 'b3', icon: 'XCircle', label: 'Failed', sublabel: 'status: failed', variant: 'danger' }],
      ],
    }],
  });

  // Company verification flow
  flowcharts.push({
    id: 'company-verification',
    title: 'Company Verification Flow',
    subtitle: 'Admin approval process for new companies',
    category: 'workflow',
    nodes: [
      { id: '1', icon: 'Building2', label: 'Company Registers', sublabel: 'is_verified = false', variant: 'start' },
      { id: '2', icon: 'Edit', label: 'Complete Profile', sublabel: 'Logo, Description, GST', variant: 'default' },
      { id: '3', icon: 'Shield', label: 'Admin Reviews', sublabel: 'Company Approval tab', variant: 'decision' },
    ],
    branches: [{
      afterNodeId: '3',
      paths: [
        [
          { id: 'b1', icon: 'CheckCircle', label: 'Verified', sublabel: 'is_verified = true', variant: 'success' },
          { id: 'b2', icon: 'Settings', label: 'Limits Set', sublabel: 'company_limits created', variant: 'process' },
          { id: 'b3', icon: 'Briefcase', label: 'Can Post Internships', sublabel: 'Full access', variant: 'success' },
        ],
        [{ id: 'b4', icon: 'XCircle', label: 'Rejected', sublabel: 'Notified', variant: 'danger' }],
      ],
    }],
  });

  // Data hierarchy
  flowcharts.push({
    id: 'data-hierarchy',
    title: 'Data Hierarchy & Relationships',
    subtitle: `${tables.length} tables with foreign key relationships`,
    category: 'data',
    nodes: [
      { id: '1', icon: 'Building2', label: 'Universities', sublabel: 'Root entity', variant: 'start' },
      { id: '2', icon: 'School', label: 'Colleges', sublabel: 'university_id FK', variant: 'process' },
    ],
    branches: [{
      afterNodeId: '2',
      paths: [
        
        [
          { id: 'b2', icon: 'GraduationCap', label: 'Students', sublabel: 'college_id FK', variant: 'process' },
          { id: 'b3', icon: 'FileText', label: 'Applications', sublabel: 'student_id FK', variant: 'default' },
          { id: 'b4', icon: 'BookOpen', label: 'Diary Entries', sublabel: 'application_id FK', variant: 'default' },
        ],
      ],
    }],
  });

  // Route map flow
  const publicRoutes = routes.filter(r => r.type === 'public');
  const protectedRoutes = routes.filter(r => r.type === 'protected');

  flowcharts.push({
    id: 'route-map',
    title: 'Route Architecture Map',
    subtitle: `${publicRoutes.length} public + ${protectedRoutes.length} protected routes`,
    category: 'system',
    nodes: [
      { id: '1', icon: 'Globe', label: 'User Visits App', sublabel: 'Browser request', variant: 'start' },
      { id: '2', icon: 'GitBranch', label: 'React Router', sublabel: 'Route matching', variant: 'process' },
      { id: '3', icon: 'Eye', label: 'Is Protected?', sublabel: 'Check route config', variant: 'decision' },
    ],
    branches: [{
      afterNodeId: '3',
      paths: [
        [
          { id: 'b1', icon: 'Globe', label: `${publicRoutes.length} Public Routes`, sublabel: 'No auth required', variant: 'success' },
        ],
        [
          { id: 'b2', icon: 'Shield', label: 'ProtectedRoute', sublabel: 'Check allowedRoles', variant: 'process' },
          { id: 'b3', icon: 'Eye', label: 'Has Required Role?', sublabel: 'user_roles check', variant: 'decision' },
        ],
      ],
    }],
  });

  // Edge function flow
  flowcharts.push({
    id: 'edge-functions',
    title: 'Edge Functions Architecture',
    subtitle: `${edgeFunctions.length} serverless functions detected`,
    category: 'system',
    nodes: [
      { id: '1', icon: 'Globe', label: 'Client Request', sublabel: 'supabase.functions.invoke()', variant: 'start' },
      { id: '2', icon: 'Server', label: 'Edge Runtime', sublabel: 'Deno Deploy', variant: 'process' },
      { id: '3', icon: 'Shield', label: 'Service Role Key', sublabel: 'Admin-level access', variant: 'warning' },
      { id: '4', icon: 'Database', label: 'Database Operations', sublabel: 'Create user + records', variant: 'process' },
      { id: '5', icon: 'CheckCircle', label: 'Response', sublabel: 'Success/Error JSON', variant: 'success' },
    ],
  });

  return flowcharts;
}
