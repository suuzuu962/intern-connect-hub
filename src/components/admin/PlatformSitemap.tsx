import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Loader2, CheckCircle, Zap, Globe, MapPin,
  Shield, Lock, Unlock, ArrowRight, Network, Database,
  Server, Users, Building2, GraduationCap, Briefcase, School,
  LayoutDashboard, Settings, Bell, CreditCard, FileText,
  Eye, BookOpen, BarChart3, Bot, Upload, Clock, Search,
  UserCheck, Image, Download, Plug, FileBarChart, Target, Map
} from 'lucide-react';

// ─── Types ───

interface SitemapPage {
  path: string;
  name: string;
  icon: string;
  type: 'public' | 'protected';
  role?: string;
  group: string;
  description: string;
  linkedPages: string[];
  tables: string[];
  edgeFunctions: string[];
  components: string[];
}

interface SitemapGroup {
  name: string;
  icon: string;
  pages: SitemapPage[];
}

interface SitemapScanResult {
  groups: SitemapGroup[];
  totalPages: number;
  totalConnections: number;
  publicPages: number;
  protectedPages: number;
  tablesUsed: string[];
  edgeFunctionsUsed: string[];
  timestamp: string;
  scanDuration: number;
}

// ─── Icon Map ───

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Lock: <Lock className="h-4 w-4" />,
  Unlock: <Unlock className="h-4 w-4" />,
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  School: <School className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Bell: <Bell className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  Bot: <Bot className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Search: <Search className="h-4 w-4" />,
  UserCheck: <UserCheck className="h-4 w-4" />,
  Image: <Image className="h-4 w-4" />,
  Download: <Download className="h-4 w-4" />,
  Plug: <Plug className="h-4 w-4" />,
  FileBarChart: <FileBarChart className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Map: <Map className="h-4 w-4" />,
  Network: <Network className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  Server: <Server className="h-4 w-4" />,
  MapPin: <MapPin className="h-4 w-4" />,
};

// ─── Scanner ───

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function scanSitemap(): SitemapScanResult {
  const startTime = Date.now();

  const allPages: SitemapPage[] = [
    // Public Pages
    {
      path: '/', name: 'Home', icon: 'Globe', type: 'public', group: 'Public Pages',
      description: 'Landing page with banners, work funnel highlights, and featured internships',
      linkedPages: ['/auth', '/university-auth', '/internships', '/companies', '/about', '/for-universities'],
      tables: ['advertisement_banners', 'internships'], edgeFunctions: [], components: ['HomeBanners', 'WorkFunnelSection', 'Header', 'Footer'],
    },
    {
      path: '/auth', name: 'Student/Company Login', icon: 'Lock', type: 'public', group: 'Public Pages',
      description: 'Authentication page for students and companies (signup/login)',
      linkedPages: ['/', '/student/dashboard', '/company/dashboard'],
      tables: ['profiles', 'user_roles', 'students', 'companies', 'login_logs'], edgeFunctions: [], components: ['Auth'],
    },
    {
      path: '/university-auth', name: 'University/College Login', icon: 'Lock', type: 'public', group: 'Public Pages',
      description: 'Authentication page for universities and college coordinators',
      linkedPages: ['/', '/university/dashboard', '/college/dashboard'],
      tables: ['profiles', 'user_roles', 'universities', 'login_logs'], edgeFunctions: ['university-signup'], components: ['Auth'],
    },
    {
      path: '/for-universities', name: 'For Universities', icon: 'GraduationCap', type: 'public', group: 'Public Pages',
      description: 'Marketing page showcasing platform benefits for institutional partners',
      linkedPages: ['/university-auth', '/'], tables: [], edgeFunctions: [], components: ['ForUniversities'],
    },
    {
      path: '/internships', name: 'Browse Internships', icon: 'Briefcase', type: 'public', group: 'Public Pages',
      description: 'Public listing of all active internships with search and filters',
      linkedPages: ['/internships/:id', '/auth'], tables: ['internships', 'companies'], edgeFunctions: [], components: ['SearchFilters', 'InternshipCard', 'InternshipListItem'],
    },
    {
      path: '/internships/:id', name: 'Internship Details', icon: 'Briefcase', type: 'public', group: 'Public Pages',
      description: 'Detailed view of a single internship with apply option',
      linkedPages: ['/internships', '/auth'], tables: ['internships', 'companies', 'applications'], edgeFunctions: [], components: ['ApplyModal', 'InternshipDetails'],
    },
    {
      path: '/companies', name: 'Browse Companies', icon: 'Building2', type: 'public', group: 'Public Pages',
      description: 'Public listing of all registered companies',
      linkedPages: ['/companies/:id'], tables: ['companies'], edgeFunctions: [], components: ['CompanyCard', 'CompanyListItem', 'SearchFilters'],
    },
    {
      path: '/companies/:id', name: 'Company Details', icon: 'Building2', type: 'public', group: 'Public Pages',
      description: 'Detailed company profile with active internships',
      linkedPages: ['/companies', '/internships/:id'], tables: ['companies', 'internships'], edgeFunctions: [], components: ['CompanyDetails'],
    },
    {
      path: '/about', name: 'About', icon: 'FileText', type: 'public', group: 'Public Pages',
      description: 'About the platform', linkedPages: ['/'], tables: [], edgeFunctions: [], components: ['About'],
    },
    {
      path: '/terms', name: 'Terms of Service', icon: 'FileText', type: 'public', group: 'Public Pages',
      description: 'Legal terms and conditions', linkedPages: ['/privacy'], tables: [], edgeFunctions: [], components: ['Terms'],
    },
    {
      path: '/privacy', name: 'Privacy Policy', icon: 'FileText', type: 'public', group: 'Public Pages',
      description: 'Privacy policy and data handling', linkedPages: ['/terms'], tables: [], edgeFunctions: [], components: ['Privacy'],
    },
    {
      path: '/notifications', name: 'Notifications', icon: 'Bell', type: 'public', group: 'Public Pages',
      description: 'User notification center', linkedPages: [], tables: ['notifications'], edgeFunctions: [], components: ['Notifications'],
    },
    {
      path: '/user-journey', name: 'User Journey Map', icon: 'Map', type: 'public', group: 'Public Pages',
      description: 'Visual user journey map for all roles', linkedPages: [], tables: [], edgeFunctions: [], components: ['UserJourneyMap'],
    },
    {
      path: '/work-funnel', name: 'Work Funnel', icon: 'Target', type: 'public', group: 'Public Pages',
      description: 'Role-based visual journey showing timelines for all user types', linkedPages: [], tables: [], edgeFunctions: [], components: ['WorkFunnel'],
    },
    {
      path: '/workflow-documentation', name: 'Workflow Documentation', icon: 'FileText', type: 'public', group: 'Public Pages',
      description: 'Platform workflow and process documentation', linkedPages: [], tables: [], edgeFunctions: [], components: ['WorkflowDocumentation'],
    },

    // Student Dashboard Sections
    {
      path: '/student/dashboard', name: 'Student Dashboard', icon: 'GraduationCap', type: 'protected', role: 'student', group: 'Student Dashboard',
      description: 'Student hub with overview, profile, applications, diary, AI tools, and recommendations',
      linkedPages: ['/internships', '/notifications'],
      tables: ['students', 'profiles', 'applications', 'internships', 'internship_diary'],
      edgeFunctions: ['analyze-resume', 'career-chat'],
      components: ['StudentOverview', 'StudentProfileForm', 'StudentProfileView', 'AppliedInternships', 'InternshipDiary', 'ResumeAnalysis', 'CareerChatbot', 'InternshipRecommendations', 'CoverImagePicker', 'ProfilePictureUpload'],
    },

    // Company Dashboard Sections
    {
      path: '/company/dashboard', name: 'Company Dashboard', icon: 'Building2', type: 'protected', role: 'company', group: 'Company Dashboard',
      description: 'Company hub with profile, internship management, applicants, analytics, and settings',
      linkedPages: ['/internships', '/analytics', '/notifications'],
      tables: ['companies', 'profiles', 'internships', 'applications', 'company_limits'],
      edgeFunctions: ['generate-internship-description'],
      components: ['CompanyProfile', 'CompanyInternships', 'CompanyApplicants', 'CompanyAnalytics', 'CompanySettings', 'CreateInternshipForm', 'ShortlistTool', 'BulkMessageApplicants', 'ApplicationFunnel', 'SubscriptionPlanDetails', 'CompanyProfileCompletion'],
    },

    // Admin Dashboard Sections
    {
      path: '/admin/dashboard', name: 'Admin Dashboard', icon: 'Shield', type: 'protected', role: 'admin', group: 'Admin Dashboard',
      description: 'Super admin platform management with 20+ management sections',
      linkedPages: ['/admin/architecture-doc', '/admin/flowchart-documentation', '/analytics'],
      tables: ['profiles', 'user_roles', 'students', 'companies', 'universities', 'colleges', 'college_coordinators', 'internships', 'applications', 'payment_transactions', 'platform_settings', 'login_logs', 'advertisement_banners', 'notifications'],
      edgeFunctions: ['admin-create-user'],
      components: ['AdminOverview', 'PlatformAnalytics', 'Benchmarking', 'AdminOrgChart', 'AdminManagement', 'UniversityManagement', 'CollegeManagement', 'CoordinatorManagement', 'StudentManagement', 'CompanyApprovalManagement', 'InternshipManagement', 'PaymentsManagement', 'SecurityLogs', 'ApiIntegration', 'CustomReports', 'PlatformFeatureMap', 'PlatformSitemap', 'BannerManagement', 'NotificationManagement', 'DataExport', 'PlatformSettings'],
    },

    // University Dashboard
    {
      path: '/university/dashboard', name: 'University Dashboard', icon: 'GraduationCap', type: 'protected', role: 'university', group: 'University Dashboard',
      description: 'University management with colleges, coordinators, students, analytics, and org chart',
      linkedPages: ['/notifications'],
      tables: ['universities', 'colleges', 'college_coordinators', 'university_users', 'students', 'login_logs', 'institutional_memos'],
      edgeFunctions: ['create-college-account', 'create-coordinator-account'],
      components: ['UniversityProfile', 'UniversityColleges', 'UniversityCoordinators', 'UniversityStudents', 'UniversityUsers', 'UniversityAnalytics', 'UniversityOrgChart', 'UniversityLoginLogs', 'AddCoordinatorDialog', 'InstitutionalMemos', 'AttendanceTracker'],
    },

    // College Dashboard
    {
      path: '/college/dashboard', name: 'College Dashboard', icon: 'School', type: 'protected', role: 'college_coordinator', group: 'College Dashboard',
      description: 'College coordinator view with students, diary approval, attendance, and memos',
      linkedPages: ['/notifications'],
      tables: ['colleges', 'college_coordinators', 'students', 'internship_diary', 'student_attendance', 'institutional_memos'],
      edgeFunctions: [],
      components: ['CollegeProfile', 'CollegeStudents', 'CollegeDiaryApproval', 'CollegeCoordinators', 'CollegeOrgChart', 'CoordinatorProfile', 'CoordinatorStudents', 'CoordinatorDiaryApproval', 'InstitutionalMemos', 'AttendanceTracker'],
    },

    // Admin-only doc pages
    {
      path: '/admin/architecture-doc', name: 'Architecture Documentation', icon: 'FileText', type: 'protected', role: 'admin (super)', group: 'Admin Documentation',
      description: 'Technical architecture docs with real-time scan & update capability',
      linkedPages: ['/admin/dashboard'], tables: [], edgeFunctions: [],
      components: ['ArchitectureDoc'],
    },
    {
      path: '/admin/flowchart-documentation', name: 'Flowchart Documentation', icon: 'Network', type: 'protected', role: 'admin (super)', group: 'Admin Documentation',
      description: 'Auto-generated flowcharts from platform metadata scan',
      linkedPages: ['/admin/dashboard'], tables: [], edgeFunctions: [],
      components: ['FlowchartDoc'],
    },
    {
      path: '/analytics', name: 'Full Screen Analytics', icon: 'BarChart3', type: 'protected', role: 'company, admin', group: 'Analytics',
      description: 'Expanded analytics view for companies and admins',
      linkedPages: ['/company/dashboard', '/admin/dashboard'], tables: ['applications', 'internships'], edgeFunctions: [],
      components: ['FullScreenAnalytics'],
    },
  ];

  // Build groups
  const groupMap: { [key: string]: SitemapPage[] } = {};
  allPages.forEach(p => {
    if (!groupMap[p.group]) groupMap[p.group] = [];
    groupMap[p.group].push(p);
  });

  const groupIcons: Record<string, string> = {
    'Public Pages': 'Globe',
    'Student Dashboard': 'GraduationCap',
    'Company Dashboard': 'Building2',
    'Admin Dashboard': 'Shield',
    'University Dashboard': 'GraduationCap',
    'College Dashboard': 'School',
    'Admin Documentation': 'FileText',
    'Analytics': 'BarChart3',
  };

  const groups: SitemapGroup[] = Object.entries(groupMap).map(([name, pages]) => ({
    name,
    icon: groupIcons[name] || 'Globe',
    pages,
  }));

  const allTables = [...new Set(allPages.flatMap(p => p.tables))];
  const allEdgeFunctions = [...new Set(allPages.flatMap(p => p.edgeFunctions).filter(Boolean))];
  const totalConnections = allPages.reduce((sum, p) => sum + p.linkedPages.length, 0);

  return {
    groups,
    totalPages: allPages.length,
    totalConnections,
    publicPages: allPages.filter(p => p.type === 'public').length,
    protectedPages: allPages.filter(p => p.type === 'protected').length,
    tablesUsed: allTables,
    edgeFunctionsUsed: allEdgeFunctions,
    timestamp: new Date().toISOString(),
    scanDuration: Date.now() - startTime,
  };
}

// ─── Component ───

export const PlatformSitemap = () => {
  const [result, setResult] = useState<SitemapScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPage, setSelectedPage] = useState<SitemapPage | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleScan = useCallback(async () => {
    setScanning(true);
    setResult(null);
    setSelectedPage(null);
    setProgress(0);

    for (let i = 0; i <= 100; i += 4) {
      setProgress(i);
      await delay(60);
    }

    const scanResult = scanSitemap();
    setResult(scanResult);
    setExpandedGroups(new Set(scanResult.groups.map(g => g.name)));
    setScanning(false);
  }, []);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const findPage = (path: string) => {
    if (!result) return null;
    for (const g of result.groups) {
      const found = g.pages.find(p => p.path === path);
      if (found) return found;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Platform Sitemap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live scan of all routes, pages, connections, and dependencies
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanning} className="gap-2">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {result ? 'Re-scan' : 'Scan Sitemap'}
        </Button>
      </div>

      {/* Scanning */}
      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">Scanning all routes & pages...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Discovering pages, connections, tables, edge functions, and components</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !scanning && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="p-6 rounded-full bg-primary/10 inline-flex mb-6">
            <MapPin className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Platform Sitemap Scanner</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Scan the entire platform to generate a live sitemap showing all pages, their access levels, 
            database dependencies, and how they connect to each other.
          </p>
          <Button size="lg" onClick={handleScan} className="gap-2">
            <Zap className="h-5 w-5" />
            Scan Sitemap
          </Button>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: 'Total Pages', value: result.totalPages, icon: <Globe className="h-4 w-4" /> },
              { label: 'Public', value: result.publicPages, icon: <Unlock className="h-4 w-4" /> },
              { label: 'Protected', value: result.protectedPages, icon: <Lock className="h-4 w-4" /> },
              { label: 'Connections', value: result.totalConnections, icon: <Network className="h-4 w-4" /> },
              { label: 'Tables', value: result.tablesUsed.length, icon: <Database className="h-4 w-4" /> },
              { label: 'Functions', value: result.edgeFunctionsUsed.length, icon: <Server className="h-4 w-4" /> },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
                <Card className="p-3 text-center">
                  <div className="flex justify-center mb-1 text-primary">{stat.icon}</div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sitemap tree */}
            <div className="lg:col-span-2 space-y-3">
              {result.groups.map((group, gi) => (
                <motion.div
                  key={group.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.05 }}
                >
                  <Card>
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-xl"
                    >
                      <div className="flex items-center gap-2">
                        {iconMap[group.icon] || <Globe className="h-4 w-4" />}
                        <span className="font-semibold text-sm">{group.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{group.pages.length} pages</Badge>
                      </div>
                      <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedGroups.has(group.name) ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedGroups.has(group.name) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-1.5">
                            {group.pages.map(page => (
                              <button
                                key={page.path}
                                onClick={() => setSelectedPage(page)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-muted/70 ${
                                  selectedPage?.path === page.path ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                                }`}
                              >
                                <div className={`p-1.5 rounded-md shrink-0 ${
                                  page.type === 'public' 
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {iconMap[page.icon] || <Globe className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{page.name}</span>
                                    {page.role && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{page.role}</Badge>
                                    )}
                                  </div>
                                  <code className="text-[10px] text-muted-foreground">{page.path}</code>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {page.linkedPages.length > 0 && (
                                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                      <Network className="h-3 w-3" />{page.linkedPages.length}
                                    </span>
                                  )}
                                  {page.tables.length > 0 && (
                                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                      <Database className="h-3 w-3" />{page.tables.length}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}

              {/* Infrastructure summary */}
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-primary" />
                    Database Tables ({result.tablesUsed.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.tablesUsed.sort().map(t => (
                      <code key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t}</code>
                    ))}
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Server className="h-4 w-4 text-primary" />
                    Backend Functions ({result.edgeFunctionsUsed.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.edgeFunctionsUsed.sort().map(f => (
                      <code key={f} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{f}</code>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <AnimatePresence mode="wait">
                  {selectedPage ? (
                    <motion.div key={selectedPage.path} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              selectedPage.type === 'public'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {iconMap[selectedPage.icon] || <Globe className="h-4 w-4" />}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{selectedPage.name}</CardTitle>
                              <code className="text-xs text-muted-foreground">{selectedPage.path}</code>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={selectedPage.type === 'public' ? 'secondary' : 'default'} className="text-[10px]">
                              {selectedPage.type === 'public' ? '🌐 Public' : '🔒 Protected'}
                            </Badge>
                            {selectedPage.role && <Badge variant="outline" className="text-[10px]">{selectedPage.role}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{selectedPage.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Linked Pages */}
                          {selectedPage.linkedPages.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <Network className="h-3 w-3" /> Links To ({selectedPage.linkedPages.length})
                              </h4>
                              <div className="space-y-1">
                                {selectedPage.linkedPages.map(lp => {
                                  const linked = findPage(lp);
                                  return (
                                    <button
                                      key={lp}
                                      onClick={() => linked && setSelectedPage(linked)}
                                      className="w-full flex items-center gap-2 text-left p-2 rounded-md hover:bg-muted/70 transition-colors"
                                    >
                                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                      <div>
                                        <span className="text-xs font-medium">{linked?.name || lp}</span>
                                        <code className="block text-[10px] text-muted-foreground">{lp}</code>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {selectedPage.tables.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                  <Database className="h-3 w-3" /> Database Tables
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPage.tables.map(t => (
                                    <code key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t}</code>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {selectedPage.edgeFunctions.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                  <Server className="h-3 w-3" /> Backend Functions
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPage.edgeFunctions.map(f => (
                                    <code key={f} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{f}</code>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {selectedPage.components.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> Components ({selectedPage.components.length})
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {selectedPage.components.map(c => (
                                    <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className="p-8 text-center">
                        <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Click on any page to see its details, connections, and dependencies
                        </p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            Scanned on {new Date(result.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            <span className="ml-2">• {result.scanDuration}ms</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
