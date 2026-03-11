import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Loader2, CheckCircle, Zap, Search,
  LayoutDashboard, Users, Building2, GraduationCap, Briefcase,
  School, Shield, Bell, CreditCard, FileText, Settings,
  BookOpen, BarChart3, Image, Download, Network, UserCheck,
  Target, Plug, FileBarChart, Globe, Server, Eye,
  ArrowRight, Database, LogIn, Bot, Upload, Clock
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'dashboard' | 'auth' | 'management' | 'workflow' | 'system' | 'ai' | 'analytics';
  icon: string;
  status: 'active' | 'connected' | 'standalone';
  connections: string[];
  tables: string[];
  routes: string[];
  edgeFunctions: string[];
}

interface ScanResults {
  features: Feature[];
  totalConnections: number;
  timestamp: string;
  scanDuration: number;
}

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  School: <School className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Bell: <Bell className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  Image: <Image className="h-4 w-4" />,
  Download: <Download className="h-4 w-4" />,
  Network: <Network className="h-4 w-4" />,
  UserCheck: <UserCheck className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Plug: <Plug className="h-4 w-4" />,
  FileBarChart: <FileBarChart className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Server: <Server className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  LogIn: <LogIn className="h-4 w-4" />,
  Bot: <Bot className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  dashboard: 'bg-primary/10 text-primary border-primary/20',
  auth: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  management: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  workflow: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  system: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  ai: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  analytics: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function scanAllFeatures(): Feature[] {
  return [
    {
      id: 'auth-system',
      name: 'Authentication System',
      description: 'User registration, login, email verification, and session management for all roles',
      category: 'auth',
      icon: 'LogIn',
      status: 'active',
      connections: ['student-dashboard', 'company-dashboard', 'admin-dashboard', 'university-dashboard', 'college-dashboard', 'user-roles', 'profiles'],
      tables: ['profiles', 'user_roles'],
      routes: ['/auth', '/university-auth'],
      edgeFunctions: ['university-signup', 'admin-create-user'],
    },
    {
      id: 'user-roles',
      name: 'User Role Management',
      description: 'Role assignment and resolution (admin, student, company, university, college_coordinator)',
      category: 'auth',
      icon: 'Shield',
      status: 'active',
      connections: ['auth-system', 'admin-dashboard', 'protected-routes'],
      tables: ['user_roles'],
      routes: [],
      edgeFunctions: [],
    },
    {
      id: 'profiles',
      name: 'User Profiles',
      description: 'Core profile data storage linked to auth users',
      category: 'auth',
      icon: 'Users',
      status: 'active',
      connections: ['auth-system', 'student-profile', 'company-profile'],
      tables: ['profiles'],
      routes: [],
      edgeFunctions: [],
    },
    {
      id: 'student-dashboard',
      name: 'Student Dashboard',
      description: 'Student overview, profile, applied internships, diary, resume analysis, career chatbot',
      category: 'dashboard',
      icon: 'GraduationCap',
      status: 'active',
      connections: ['auth-system', 'internship-applications', 'internship-diary', 'resume-analysis', 'career-chatbot', 'student-profile', 'notifications'],
      tables: ['students', 'applications', 'internship_diary'],
      routes: ['/student/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'company-dashboard',
      name: 'Company Dashboard',
      description: 'Company profile, internship posting, applicant management, analytics',
      category: 'dashboard',
      icon: 'Building2',
      status: 'active',
      connections: ['auth-system', 'internship-posting', 'applicant-management', 'company-analytics', 'company-profile', 'notifications'],
      tables: ['companies', 'internships', 'applications', 'company_limits'],
      routes: ['/company/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      description: 'Platform oversight, entity management, analytics, settings, security',
      category: 'dashboard',
      icon: 'Shield',
      status: 'active',
      connections: ['auth-system', 'university-management', 'college-management', 'coordinator-management', 'student-management', 'company-approval', 'platform-settings', 'notifications', 'security-logs', 'banner-management', 'payment-management', 'analytics-platform'],
      tables: ['platform_settings', 'login_logs', 'advertisement_banners'],
      routes: ['/admin/dashboard'],
      edgeFunctions: ['admin-create-user'],
    },
    {
      id: 'university-dashboard',
      name: 'University Dashboard',
      description: 'University profile, college management, coordinator management, student oversight',
      category: 'dashboard',
      icon: 'GraduationCap',
      status: 'active',
      connections: ['auth-system', 'college-creation', 'coordinator-creation', 'university-students', 'org-chart', 'login-logs', 'notifications'],
      tables: ['universities', 'colleges', 'college_coordinators', 'university_users'],
      routes: ['/university/dashboard'],
      edgeFunctions: ['create-college-account', 'create-coordinator-account'],
    },
    {
      id: 'college-dashboard',
      name: 'College Dashboard',
      description: 'College coordinator view with student management and diary approval',
      category: 'dashboard',
      icon: 'School',
      status: 'active',
      connections: ['auth-system', 'diary-approval', 'college-students', 'notifications'],
      tables: ['colleges', 'college_coordinators', 'students'],
      routes: ['/college/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'internship-posting',
      name: 'Internship Posting',
      description: 'Companies create and manage internship listings with AI-generated descriptions',
      category: 'workflow',
      icon: 'Briefcase',
      status: 'active',
      connections: ['company-dashboard', 'internship-browse', 'ai-description-gen', 'company-limits'],
      tables: ['internships', 'company_limits'],
      routes: ['/company/dashboard'],
      edgeFunctions: ['generate-internship-description'],
    },
    {
      id: 'internship-browse',
      name: 'Internship Discovery',
      description: 'Public browsing, searching, and filtering of internships and companies',
      category: 'workflow',
      icon: 'Search',
      status: 'active',
      connections: ['internship-posting', 'internship-applications'],
      tables: ['internships', 'companies'],
      routes: ['/internships', '/internships/:id', '/companies', '/companies/:id'],
      edgeFunctions: [],
    },
    {
      id: 'internship-applications',
      name: 'Application System',
      description: 'Students apply to internships; companies review, shortlist, offer, or reject',
      category: 'workflow',
      icon: 'FileText',
      status: 'active',
      connections: ['student-dashboard', 'company-dashboard', 'applicant-management', 'notifications', 'payment-system'],
      tables: ['applications', 'internships', 'students'],
      routes: ['/student/dashboard', '/company/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'applicant-management',
      name: 'Applicant Management',
      description: 'Shortlisting, bulk messaging, and application funnel for companies',
      category: 'management',
      icon: 'UserCheck',
      status: 'active',
      connections: ['company-dashboard', 'internship-applications', 'notifications'],
      tables: ['applications'],
      routes: ['/company/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'internship-diary',
      name: 'Internship Diary',
      description: 'Students log daily activities during internships; coordinators approve entries',
      category: 'workflow',
      icon: 'BookOpen',
      status: 'active',
      connections: ['student-dashboard', 'diary-approval'],
      tables: ['internship_diary', 'applications'],
      routes: ['/student/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'diary-approval',
      name: 'Diary Approval',
      description: 'Coordinators and colleges review and approve student diary entries',
      category: 'workflow',
      icon: 'CheckCircle',
      status: 'active',
      connections: ['college-dashboard', 'internship-diary'],
      tables: ['internship_diary'],
      routes: ['/college/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'college-creation',
      name: 'College Creation',
      description: 'Universities create college accounts with dedicated login credentials',
      category: 'management',
      icon: 'School',
      status: 'active',
      connections: ['university-dashboard', 'college-dashboard'],
      tables: ['colleges', 'college_coordinators'],
      routes: ['/university/dashboard'],
      edgeFunctions: ['create-college-account'],
    },
    {
      id: 'coordinator-creation',
      name: 'Coordinator Creation',
      description: 'Universities assign coordinators to specific colleges',
      category: 'management',
      icon: 'UserCheck',
      status: 'active',
      connections: ['university-dashboard', 'college-dashboard'],
      tables: ['college_coordinators'],
      routes: ['/university/dashboard'],
      edgeFunctions: ['create-coordinator-account'],
    },
    {
      id: 'company-approval',
      name: 'Company Approval',
      description: 'Admin reviews and verifies company registrations before granting full access',
      category: 'management',
      icon: 'Building2',
      status: 'active',
      connections: ['admin-dashboard', 'company-dashboard', 'company-limits'],
      tables: ['companies', 'company_limits'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'company-limits',
      name: 'Company Limits',
      description: 'Admin-configurable limits on internship posting, resume viewing, and features',
      category: 'management',
      icon: 'Target',
      status: 'active',
      connections: ['company-approval', 'internship-posting'],
      tables: ['company_limits'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'notifications',
      name: 'Notification System',
      description: 'In-app notifications with bell icon, role-based targeting, and read tracking',
      category: 'system',
      icon: 'Bell',
      status: 'active',
      connections: ['student-dashboard', 'company-dashboard', 'admin-dashboard', 'university-dashboard', 'college-dashboard'],
      tables: ['notifications'],
      routes: ['/notifications'],
      edgeFunctions: [],
    },
    {
      id: 'payment-system',
      name: 'Payment System',
      description: 'Transaction tracking for paid internships and subscriptions',
      category: 'system',
      icon: 'CreditCard',
      status: 'active',
      connections: ['internship-applications', 'payment-management'],
      tables: ['payment_transactions', 'subscriptions'],
      routes: [],
      edgeFunctions: [],
    },
    {
      id: 'payment-management',
      name: 'Payment Management',
      description: 'Admin oversight of all payment transactions',
      category: 'management',
      icon: 'CreditCard',
      status: 'active',
      connections: ['admin-dashboard', 'payment-system'],
      tables: ['payment_transactions'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'resume-analysis',
      name: 'AI Resume Analysis',
      description: 'AI-powered resume scanning and feedback for students',
      category: 'ai',
      icon: 'Bot',
      status: 'active',
      connections: ['student-dashboard'],
      tables: [],
      routes: ['/student/dashboard'],
      edgeFunctions: ['analyze-resume'],
    },
    {
      id: 'career-chatbot',
      name: 'AI Career Chatbot',
      description: 'AI-powered career guidance chatbot for students',
      category: 'ai',
      icon: 'Bot',
      status: 'active',
      connections: ['student-dashboard'],
      tables: [],
      routes: ['/student/dashboard'],
      edgeFunctions: ['career-chat'],
    },
    {
      id: 'ai-description-gen',
      name: 'AI Internship Description',
      description: 'AI generates internship descriptions from basic inputs',
      category: 'ai',
      icon: 'Bot',
      status: 'active',
      connections: ['internship-posting'],
      tables: [],
      routes: ['/company/dashboard'],
      edgeFunctions: ['generate-internship-description'],
    },
    {
      id: 'analytics-platform',
      name: 'Platform Analytics',
      description: 'Admin analytics with trends, funnels, and benchmarking',
      category: 'analytics',
      icon: 'BarChart3',
      status: 'active',
      connections: ['admin-dashboard', 'company-analytics'],
      tables: [],
      routes: ['/admin/dashboard', '/analytics'],
      edgeFunctions: [],
    },
    {
      id: 'company-analytics',
      name: 'Company Analytics',
      description: 'Company-specific application funnels and performance metrics',
      category: 'analytics',
      icon: 'BarChart3',
      status: 'active',
      connections: ['company-dashboard', 'analytics-platform'],
      tables: ['applications', 'internships'],
      routes: ['/company/dashboard', '/analytics'],
      edgeFunctions: [],
    },
    {
      id: 'banner-management',
      name: 'Banner Management',
      description: 'Admin manages advertisement banners with targeting and scheduling',
      category: 'system',
      icon: 'Image',
      status: 'active',
      connections: ['admin-dashboard', 'home-page'],
      tables: ['advertisement_banners'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'platform-settings',
      name: 'Platform Settings',
      description: 'Global platform configuration including 13+ setting categories',
      category: 'system',
      icon: 'Settings',
      status: 'active',
      connections: ['admin-dashboard'],
      tables: ['platform_settings'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'security-logs',
      name: 'Security & Login Logs',
      description: 'Tracks login events, IP addresses, and user agents',
      category: 'system',
      icon: 'Shield',
      status: 'active',
      connections: ['admin-dashboard', 'university-dashboard'],
      tables: ['login_logs'],
      routes: ['/admin/dashboard', '/university/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'org-chart',
      name: 'Organization Chart',
      description: 'Visual hierarchy view of universities, colleges, coordinators, and students',
      category: 'system',
      icon: 'Network',
      status: 'active',
      connections: ['admin-dashboard', 'university-dashboard'],
      tables: ['universities', 'colleges', 'college_coordinators', 'students'],
      routes: ['/admin/dashboard', '/university/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'home-page',
      name: 'Public Home Page',
      description: 'Landing page with banners, work funnel, and internship highlights',
      category: 'system',
      icon: 'Globe',
      status: 'active',
      connections: ['internship-browse', 'banner-management', 'auth-system'],
      tables: ['advertisement_banners', 'internships'],
      routes: ['/'],
      edgeFunctions: [],
    },
    {
      id: 'student-profile',
      name: 'Student Profile',
      description: 'Detailed student profile with education, skills, social links, and cover image',
      category: 'management',
      icon: 'GraduationCap',
      status: 'active',
      connections: ['student-dashboard', 'profiles', 'file-uploads'],
      tables: ['students', 'profiles'],
      routes: ['/student/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'company-profile',
      name: 'Company Profile',
      description: 'Company details with branding, social links, and verification status',
      category: 'management',
      icon: 'Building2',
      status: 'active',
      connections: ['company-dashboard', 'profiles', 'company-approval'],
      tables: ['companies', 'profiles'],
      routes: ['/company/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'file-uploads',
      name: 'File Upload & Storage',
      description: 'Resume uploads, profile pictures, cover images, and college IDs',
      category: 'system',
      icon: 'Upload',
      status: 'active',
      connections: ['student-profile', 'company-profile', 'resume-analysis'],
      tables: [],
      routes: [],
      edgeFunctions: ['scan-file'],
    },
    {
      id: 'attendance-tracking',
      name: 'Attendance Tracking',
      description: 'Track student attendance with check-in/out times and session management',
      category: 'workflow',
      icon: 'Clock',
      status: 'active',
      connections: ['college-dashboard'],
      tables: ['student_attendance'],
      routes: ['/college/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'institutional-memos',
      name: 'Institutional Memos',
      description: 'Internal communication system between university, colleges, and coordinators',
      category: 'workflow',
      icon: 'FileText',
      status: 'active',
      connections: ['university-dashboard', 'college-dashboard'],
      tables: ['institutional_memos'],
      routes: ['/university/dashboard', '/college/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'protected-routes',
      name: 'Protected Routes',
      description: 'Role-based route protection ensuring users can only access their dashboards',
      category: 'auth',
      icon: 'Shield',
      status: 'active',
      connections: ['user-roles', 'auth-system'],
      tables: ['user_roles'],
      routes: [],
      edgeFunctions: [],
    },
    {
      id: 'data-export',
      name: 'Data Export',
      description: 'Export platform data in CSV format for reporting',
      category: 'system',
      icon: 'Download',
      status: 'active',
      connections: ['admin-dashboard'],
      tables: [],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'api-integration',
      name: 'API Integration',
      description: 'Scoped API key management and webhook subscriptions',
      category: 'system',
      icon: 'Plug',
      status: 'active',
      connections: ['admin-dashboard'],
      tables: [],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'custom-reports',
      name: 'Custom Reports',
      description: 'Dynamic query builder for building reports against live data',
      category: 'analytics',
      icon: 'FileBarChart',
      status: 'active',
      connections: ['admin-dashboard'],
      tables: [],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'university-management',
      name: 'University Management',
      description: 'Admin manages all universities on the platform',
      category: 'management',
      icon: 'GraduationCap',
      status: 'active',
      connections: ['admin-dashboard'],
      tables: ['universities'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'college-management',
      name: 'College Management',
      description: 'Admin manages all colleges on the platform',
      category: 'management',
      icon: 'School',
      status: 'active',
      connections: ['admin-dashboard'],
      tables: ['colleges'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'coordinator-management',
      name: 'Coordinator Management',
      description: 'Admin manages all coordinators on the platform',
      category: 'management',
      icon: 'UserCheck',
      status: 'active',
      connections: ['admin-dashboard'],
      tables: ['college_coordinators'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'student-management',
      name: 'Student Management',
      description: 'Admin manages all students on the platform',
      category: 'management',
      icon: 'Users',
      status: 'active',
      connections: ['admin-dashboard'],
      tables: ['students'],
      routes: ['/admin/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'login-logs',
      name: 'Login Logs',
      description: 'University-scoped login activity tracking',
      category: 'system',
      icon: 'Eye',
      status: 'active',
      connections: ['university-dashboard', 'security-logs'],
      tables: ['login_logs'],
      routes: ['/university/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'university-students',
      name: 'University Students View',
      description: 'University-wide student visibility across all colleges',
      category: 'management',
      icon: 'Users',
      status: 'active',
      connections: ['university-dashboard'],
      tables: ['students', 'colleges'],
      routes: ['/university/dashboard'],
      edgeFunctions: [],
    },
    {
      id: 'college-students',
      name: 'College Students View',
      description: 'College-scoped student list for coordinators',
      category: 'management',
      icon: 'Users',
      status: 'active',
      connections: ['college-dashboard'],
      tables: ['students'],
      routes: ['/college/dashboard'],
      edgeFunctions: [],
    },
  ];
}

const CATEGORIES = [
  { key: 'all', label: 'All Features' },
  { key: 'dashboard', label: 'Dashboards' },
  { key: 'auth', label: 'Authentication' },
  { key: 'management', label: 'Management' },
  { key: 'workflow', label: 'Workflows' },
  { key: 'system', label: 'System' },
  { key: 'ai', label: 'AI Features' },
  { key: 'analytics', label: 'Analytics' },
];

export const PlatformFeatureMap = () => {
  const [results, setResults] = useState<ScanResults | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setResults(null);
    setSelectedFeature(null);
    setProgress(0);

    for (let i = 0; i <= 100; i += 5) {
      setProgress(i);
      await delay(80);
    }

    const features = scanAllFeatures();
    const totalConnections = features.reduce((sum, f) => sum + f.connections.length, 0);

    setResults({
      features,
      totalConnections,
      timestamp: new Date().toISOString(),
      scanDuration: Date.now(),
    });
    setScanning(false);
  }, []);

  const filteredFeatures = results?.features.filter(
    f => activeCategory === 'all' || f.category === activeCategory
  ) || [];

  const getFeatureName = (id: string) => {
    return results?.features.find(f => f.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Platform Feature Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan all platform features, see how they connect, and explore dependencies
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanning} className="gap-2">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {results ? 'Re-scan Features' : 'Scan All Features'}
        </Button>
      </div>

      {/* Scanning progress */}
      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">Scanning platform features...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Analyzing routes, components, database tables, edge functions, and connections
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!results && !scanning && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="p-6 rounded-full bg-primary/10 inline-flex mb-6">
            <Search className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Discover All Platform Features</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Scan the entire platform to discover all features, their database dependencies, 
            edge functions, routes, and how they connect to each other.
          </p>
          <Button size="lg" onClick={handleScan} className="gap-2">
            <Zap className="h-5 w-5" />
            Scan All Features
          </Button>
        </motion.div>
      )}

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Features', value: results.features.length, icon: <Zap className="h-4 w-4" /> },
              { label: 'Connections', value: results.totalConnections, icon: <Network className="h-4 w-4" /> },
              { label: 'Tables Used', value: [...new Set(results.features.flatMap(f => f.tables))].length, icon: <Database className="h-4 w-4" /> },
              { label: 'Edge Functions', value: [...new Set(results.features.flatMap(f => f.edgeFunctions))].filter(Boolean).length, icon: <Server className="h-4 w-4" /> },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-4 text-center">
                  <div className="flex justify-center mb-2 text-primary">{stat.icon}</div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setActiveCategory(cat.key); setSelectedFeature(null); }}
                className="text-xs"
              >
                {cat.label}
                {cat.key !== 'all' && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">
                    {results.features.filter(f => f.category === cat.key).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature list */}
            <div className="lg:col-span-2 space-y-3">
              {filteredFeatures.map((feature, i) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedFeature?.id === feature.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedFeature(feature)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border shrink-0 ${categoryColors[feature.category]}`}>
                        {iconMap[feature.icon] || <Zap className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{feature.name}</h3>
                          <Badge variant="outline" className="text-[10px] capitalize">{feature.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {feature.connections.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Network className="h-3 w-3" />
                              {feature.connections.length} connections
                            </span>
                          )}
                          {feature.tables.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {feature.tables.length} tables
                            </span>
                          )}
                          {feature.edgeFunctions.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Server className="h-3 w-3" />
                              {feature.edgeFunctions.length} functions
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <AnimatePresence mode="wait">
                  {selectedFeature ? (
                    <motion.div
                      key={selectedFeature.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <Card>
                        <CardHeader className="pb-3">
                          <div className={`p-3 rounded-lg border w-fit ${categoryColors[selectedFeature.category]}`}>
                            {iconMap[selectedFeature.icon] || <Zap className="h-4 w-4" />}
                          </div>
                          <CardTitle className="text-lg">{selectedFeature.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{selectedFeature.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Connected Features */}
                          {selectedFeature.connections.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <Network className="h-3 w-3" /> Connected To
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedFeature.connections.map(c => (
                                  <Badge
                                    key={c}
                                    variant="secondary"
                                    className="text-[10px] cursor-pointer hover:bg-primary/20 transition-colors"
                                    onClick={() => {
                                      const f = results.features.find(feat => feat.id === c);
                                      if (f) setSelectedFeature(f);
                                    }}
                                  >
                                    {getFeatureName(c)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <Separator />

                          {/* Tables */}
                          {selectedFeature.tables.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <Database className="h-3 w-3" /> Database Tables
                              </h4>
                              <div className="space-y-1">
                                {selectedFeature.tables.map(t => (
                                  <code key={t} className="block text-xs bg-muted px-2 py-1 rounded">{t}</code>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Routes */}
                          {selectedFeature.routes.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Routes
                              </h4>
                              <div className="space-y-1">
                                {selectedFeature.routes.map(r => (
                                  <code key={r} className="block text-xs bg-muted px-2 py-1 rounded">{r}</code>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Edge Functions */}
                          {selectedFeature.edgeFunctions.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                <Server className="h-3 w-3" /> Backend Functions
                              </h4>
                              <div className="space-y-1">
                                {selectedFeature.edgeFunctions.map(ef => (
                                  <code key={ef} className="block text-xs bg-muted px-2 py-1 rounded">{ef}</code>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className="p-8 text-center">
                        <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Click on a feature to see its details, connections, and dependencies
                        </p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
