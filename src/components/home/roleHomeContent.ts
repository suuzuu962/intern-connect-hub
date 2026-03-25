import { Briefcase, Building2, Users, Target, Award, GraduationCap, TrendingUp, BookOpen, Search, FileText, BarChart3, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RoleHeroContent {
  headline: string;
  highlightedText: string;
  description: string;
  primaryCta: { label: string; link: string };
  secondaryCta?: { label: string; link: string };
}

export interface RoleStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface RoleStat {
  value: string;
  label: string;
}

export interface RoleAdBanner {
  title: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
  variant: 'primary' | 'accent' | 'success' | 'warning';
}

export interface RoleHomeConfig {
  hero: RoleHeroContent;
  stats: RoleStat[];
  steps: RoleStep[];
  ads: RoleAdBanner[];
  showUniversitySection: boolean;
  showWorkFunnel: boolean;
}

export const guestConfig: RoleHomeConfig = {
  hero: {
    headline: 'Launch Your Career with',
    highlightedText: 'Dream Internships',
    description: 'Connect with top companies, gain real-world experience, and kickstart your professional journey with Economic Labs.',
    primaryCta: { label: 'Find Internships', link: '/internships' },
    secondaryCta: { label: 'Post Internships', link: '/auth?mode=signup&role=company' },
  },
  stats: [
    { value: '500+', label: 'Active Internships' },
    { value: '200+', label: 'Partner Companies' },
    { value: '10K+', label: 'Students Placed' },
    { value: '95%', label: 'Success Rate' },
  ],
  steps: [
    { icon: Users, title: 'Create Profile', description: 'Sign up as a student or company' },
    { icon: Target, title: 'Find Matches', description: 'Browse internships or talented students' },
    { icon: Briefcase, title: 'Apply/Post', description: 'Submit applications or post openings' },
    { icon: Award, title: 'Get Started', description: 'Begin your internship journey' },
  ],
  ads: [],
  showUniversitySection: true,
  showWorkFunnel: true,
};

export const studentConfig: RoleHomeConfig = {
  hero: {
    headline: 'Discover Internships That',
    highlightedText: 'Shape Your Future',
    description: 'Browse curated internships matched to your skills, track your applications, and build your professional portfolio.',
    primaryCta: { label: 'Browse Internships', link: '/internships' },
    secondaryCta: { label: 'Go to Dashboard', link: '/student/dashboard' },
  },
  stats: [
    { value: '500+', label: 'Active Internships' },
    { value: '200+', label: 'Partner Companies' },
    { value: '50+', label: 'Domains' },
    { value: '95%', label: 'Success Rate' },
  ],
  steps: [
    { icon: Search, title: 'Explore Opportunities', description: 'Search internships by domain, location & skills' },
    { icon: FileText, title: 'Apply with Ease', description: 'One-click apply with your saved profile & resume' },
    { icon: BookOpen, title: 'Track Progress', description: 'Maintain your internship diary & milestones' },
    { icon: Award, title: 'Get Certified', description: 'Earn completion certificates & endorsements' },
  ],
  ads: [
    {
      title: '📄 Complete Your Profile',
      description: 'A complete profile increases your chances of getting shortlisted by 3x!',
      ctaLabel: 'Update Profile',
      ctaLink: '/student/dashboard?section=profile',
      variant: 'primary',
    },
    {
      title: '🤖 Try AI Resume Analysis',
      description: 'Get instant feedback on your resume with our AI-powered analyzer.',
      ctaLabel: 'Analyze Resume',
      ctaLink: '/student/dashboard?section=resume-analysis',
      variant: 'accent',
    },
  ],
  showUniversitySection: false,
  showWorkFunnel: true,
};

export const companyConfig: RoleHomeConfig = {
  hero: {
    headline: 'Find Top Talent for',
    highlightedText: 'Your Organization',
    description: 'Post internships, review applications from qualified students, and build your future workforce pipeline.',
    primaryCta: { label: 'Post Internship', link: '/company/dashboard?section=create-internship' },
    secondaryCta: { label: 'Go to Dashboard', link: '/company/dashboard' },
  },
  stats: [
    { value: '10K+', label: 'Registered Students' },
    { value: '95%', label: 'Fill Rate' },
    { value: '48h', label: 'Avg. First Application' },
    { value: '200+', label: 'Universities Connected' },
  ],
  steps: [
    { icon: Briefcase, title: 'Post Internships', description: 'Create listings with role details & requirements' },
    { icon: Users, title: 'Review Applicants', description: 'Browse, filter & shortlist candidates' },
    { icon: Target, title: 'Shortlist & Hire', description: 'Use our tools to find the best fit' },
    { icon: TrendingUp, title: 'Track Analytics', description: 'Monitor applications & engagement metrics' },
  ],
  ads: [
    {
      title: '🚀 Boost Your Listings',
      description: 'Featured internships receive 5x more applications. Upgrade to get noticed.',
      ctaLabel: 'Learn More',
      ctaLink: '/company/dashboard?section=subscription',
      variant: 'warning',
    },
    {
      title: '📊 Company Analytics',
      description: 'Track application trends, view funnel metrics, and optimize your hiring.',
      ctaLabel: 'View Analytics',
      ctaLink: '/company/dashboard?section=analytics',
      variant: 'accent',
    },
  ],
  showUniversitySection: false,
  showWorkFunnel: false,
};

export const universityConfig: RoleHomeConfig = {
  hero: {
    headline: 'Empower Your Institution with',
    highlightedText: 'Smart Placements',
    description: 'Manage colleges, track student internships, and access real-time placement analytics — all from one dashboard.',
    primaryCta: { label: 'Go to Dashboard', link: '/university/dashboard' },
  },
  stats: [
    { value: '200+', label: 'Partner Companies' },
    { value: '10K+', label: 'Students Managed' },
    { value: '95%', label: 'Placement Rate' },
    { value: '50+', label: 'Colleges Connected' },
  ],
  steps: [
    { icon: Building2, title: 'Add Colleges', description: 'Onboard affiliated colleges to the platform' },
    { icon: Users, title: 'Monitor Students', description: 'Track student applications & placements' },
    { icon: BarChart3, title: 'View Analytics', description: 'Real-time placement insights & reports' },
    { icon: Shield, title: 'Manage Access', description: 'Control user permissions & oversight' },
  ],
  ads: [
    {
      title: '📈 Placement Analytics',
      description: 'Unlock advanced analytics to track department-wise placement trends.',
      ctaLabel: 'View Analytics',
      ctaLink: '/university/dashboard?section=analytics',
      variant: 'primary',
    },
  ],
  showUniversitySection: false,
  showWorkFunnel: false,
};

export const adminConfig: RoleHomeConfig = {
  hero: {
    headline: 'Platform Administration',
    highlightedText: 'Control Center',
    description: 'Manage users, review company approvals, monitor platform health, and configure system settings.',
    primaryCta: { label: 'Admin Dashboard', link: '/admin/dashboard' },
  },
  stats: [
    { value: '500+', label: 'Active Internships' },
    { value: '200+', label: 'Companies' },
    { value: '10K+', label: 'Students' },
    { value: '50+', label: 'Universities' },
  ],
  steps: [
    { icon: Shield, title: 'Review Approvals', description: 'Approve or reject company registrations' },
    { icon: Users, title: 'Manage Users', description: 'Oversee students, companies & institutions' },
    { icon: BarChart3, title: 'Platform Analytics', description: 'Monitor engagement & growth metrics' },
    { icon: Target, title: 'System Settings', description: 'Configure features, plugins & permissions' },
  ],
  ads: [],
  showUniversitySection: false,
  showWorkFunnel: false,
};

export function getHomeConfig(role: string | null): RoleHomeConfig {
  switch (role) {
    case 'student': return studentConfig;
    case 'company': return companyConfig;
    case 'university': return universityConfig;
    case 'admin': return adminConfig;
    default: return guestConfig;
  }
}
