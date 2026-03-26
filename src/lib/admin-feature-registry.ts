// Admin Feature Registry - Single source of truth for all admin sidebar features
// When new features are added to AdminDashboard sidebar, add them here too.
// The documentation scanner uses this to detect missing guides.

export interface AdminFeatureEntry {
  sectionId: string;
  label: string;
  category: 'Core' | 'Governance' | 'Marketplace' | 'Security' | 'System';
  description: string;
  docFilename: string;
}

/**
 * Master registry of all admin dashboard features.
 * Each entry maps a sidebar section ID → expected documentation file.
 * Keep this in sync with AdminDashboard sidebar groups.
 */
export const ADMIN_FEATURE_REGISTRY: AdminFeatureEntry[] = [
  // Core
  { sectionId: 'overview', label: 'Dashboard Overview', category: 'Core', description: 'Navigate the main admin dashboard and key metrics', docFilename: '01_Dashboard_Overview.pdf' },
  { sectionId: 'analytics', label: 'Platform Analytics', category: 'Core', description: 'Monitor growth, user activity, and engagement', docFilename: '02_Analytics.pdf' },
  { sectionId: 'benchmarking', label: 'Benchmarking', category: 'Core', description: 'Compare KPIs and performance indicators', docFilename: '03_Benchmarking.pdf' },
  { sectionId: 'org-chart', label: 'Organization Chart', category: 'Core', description: 'View platform hierarchy and entity relationships', docFilename: '04_Org_Chart.pdf' },
  { sectionId: 'admins', label: 'Admin Management', category: 'Core', description: 'Create and manage administrator accounts', docFilename: '05_Admin_Management.pdf' },
  // Governance
  { sectionId: 'universities', label: 'University Management', category: 'Governance', description: 'Add, edit, and verify university partnerships', docFilename: '06_University_Management.pdf' },
  { sectionId: 'colleges', label: 'College Management', category: 'Governance', description: 'Manage colleges within university hierarchy', docFilename: '07_College_Management.pdf' },
  { sectionId: 'students', label: 'Student Management', category: 'Governance', description: 'Search, filter, and manage student accounts', docFilename: '08_Student_Management.pdf' },
  // Marketplace
  { sectionId: 'companies', label: 'Company Approval', category: 'Marketplace', description: 'Review, approve, and manage company registrations', docFilename: '09_Company_Approval.pdf' },
  { sectionId: 'internships', label: 'Internship Management', category: 'Marketplace', description: 'Oversee and manage all internship listings', docFilename: '10_Internship_Management.pdf' },
  { sectionId: 'payments', label: 'Payments Management', category: 'Marketplace', description: 'Track revenue, process refunds, manage subscriptions', docFilename: '11_Payments_Management.pdf' },
  // Security
  { sectionId: 'security', label: 'Security Logs', category: 'Security', description: 'Monitor login activity and security events', docFilename: '12_Security_Logs.pdf' },
  // System
  { sectionId: 'api-integration', label: 'API Integration', category: 'System', description: 'Manage API keys and webhook configurations', docFilename: '13_API_Integration.pdf' },
  { sectionId: 'plugins', label: 'Plugin Management', category: 'System', description: 'Install, configure, and manage platform plugins', docFilename: '14_Plugin_Management.pdf' },
  { sectionId: 'custom-reports', label: 'Custom Reports', category: 'System', description: 'Build and schedule custom data reports', docFilename: '15_Custom_Reports.pdf' },
  { sectionId: 'feature-map', label: 'Feature Map', category: 'System', description: 'Explore platform features and technical dependencies', docFilename: '16_Feature_Map.pdf' },
  { sectionId: 'sitemap', label: 'Sitemap', category: 'System', description: 'View all platform routes and page hierarchy', docFilename: '17_Sitemap.pdf' },
  { sectionId: 'notifications', label: 'Notifications', category: 'System', description: 'Send and manage platform-wide notifications', docFilename: '18_Notifications.pdf' },
  { sectionId: 'upgrade-requests', label: 'Upgrade Requests', category: 'System', description: 'Manage meeting requests and feature access', docFilename: '19_Upgrade_Requests.pdf' },
  { sectionId: 'landing-content', label: 'Landing Pages CMS', category: 'System', description: 'Customize landing page content for all roles', docFilename: '20_Landing_Pages.pdf' },
  { sectionId: 'reports', label: 'Data Export', category: 'System', description: 'Export platform data as CSV and PDF', docFilename: '21_Data_Export.pdf' },
  { sectionId: 'documentation', label: 'Documentation', category: 'System', description: 'Centralized documentation management', docFilename: '22_Platform_Settings.pdf' },
  { sectionId: 'settings', label: 'Platform Settings', category: 'System', description: 'Configure global platform settings and policies', docFilename: '22_Platform_Settings.pdf' },
];

export interface ScanResult {
  totalFeatures: number;
  documented: number;
  missing: AdminFeatureEntry[];
  covered: AdminFeatureEntry[];
}

/**
 * Scans the feature registry against a list of existing document filenames
 * and returns which features are documented vs missing.
 */
export function scanForMissingDocs(existingFilenames: string[]): ScanResult {
  const filenameSet = new Set(existingFilenames.map(f => f.toLowerCase()));
  const missing: AdminFeatureEntry[] = [];
  const covered: AdminFeatureEntry[] = [];

  // Deduplicate by docFilename to avoid counting shared docs twice
  const seen = new Set<string>();
  for (const feature of ADMIN_FEATURE_REGISTRY) {
    if (seen.has(feature.docFilename)) continue;
    seen.add(feature.docFilename);

    if (filenameSet.has(feature.docFilename.toLowerCase())) {
      covered.push(feature);
    } else {
      missing.push(feature);
    }
  }

  return {
    totalFeatures: seen.size,
    documented: covered.length,
    missing,
    covered,
  };
}
