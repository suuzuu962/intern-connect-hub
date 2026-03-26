import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import {
  FileText, Download, Search, LayoutDashboard, BarChart3, Target,
  Network, ShieldCheck, GraduationCap, School, Users, Building2,
  Briefcase, CreditCard, Plug, Puzzle, FileBarChart, Map, MapPin,
  Bell, ArrowUpCircle, FileEdit, Settings, LucideIcon, Eye
} from 'lucide-react';

interface GuideItem {
  id: string;
  title: string;
  description: string;
  filename: string;
  icon: LucideIcon;
  category: string;
}

const guides: GuideItem[] = [
  { id: '01', title: 'Dashboard Overview', description: 'Navigate the main admin dashboard and key metrics', filename: '01_Dashboard_Overview.pdf', icon: LayoutDashboard, category: 'Core' },
  { id: '02', title: 'Platform Analytics', description: 'Monitor growth, user activity, and engagement', filename: '02_Analytics.pdf', icon: BarChart3, category: 'Core' },
  { id: '03', title: 'Benchmarking', description: 'Compare KPIs and performance indicators', filename: '03_Benchmarking.pdf', icon: Target, category: 'Core' },
  { id: '04', title: 'Organization Chart', description: 'View platform hierarchy and entity relationships', filename: '04_Org_Chart.pdf', icon: Network, category: 'Core' },
  { id: '05', title: 'Admin Management', description: 'Create and manage administrator accounts', filename: '05_Admin_Management.pdf', icon: ShieldCheck, category: 'Core' },
  { id: '06', title: 'University Management', description: 'Add, edit, and verify university partnerships', filename: '06_University_Management.pdf', icon: GraduationCap, category: 'Governance' },
  { id: '07', title: 'College Management', description: 'Manage colleges within university hierarchy', filename: '07_College_Management.pdf', icon: School, category: 'Governance' },
  { id: '08', title: 'Student Management', description: 'Search, filter, and manage student accounts', filename: '08_Student_Management.pdf', icon: Users, category: 'Governance' },
  { id: '09', title: 'Company Approval', description: 'Review, approve, and manage company registrations', filename: '09_Company_Approval.pdf', icon: Building2, category: 'Marketplace' },
  { id: '10', title: 'Internship Management', description: 'Oversee and manage all internship listings', filename: '10_Internship_Management.pdf', icon: Briefcase, category: 'Marketplace' },
  { id: '11', title: 'Payments Management', description: 'Track revenue, process refunds, manage subscriptions', filename: '11_Payments_Management.pdf', icon: CreditCard, category: 'Marketplace' },
  { id: '12', title: 'Security Logs', description: 'Monitor login activity and security events', filename: '12_Security_Logs.pdf', icon: FileText, category: 'Security' },
  { id: '13', title: 'API Integration', description: 'Manage API keys and webhook configurations', filename: '13_API_Integration.pdf', icon: Plug, category: 'System' },
  { id: '14', title: 'Plugin Management', description: 'Install, configure, and manage platform plugins', filename: '14_Plugin_Management.pdf', icon: Puzzle, category: 'System' },
  { id: '15', title: 'Custom Reports', description: 'Build and schedule custom data reports', filename: '15_Custom_Reports.pdf', icon: FileBarChart, category: 'System' },
  { id: '16', title: 'Feature Map', description: 'Explore platform features and technical dependencies', filename: '16_Feature_Map.pdf', icon: Map, category: 'System' },
  { id: '17', title: 'Sitemap', description: 'View all platform routes and page hierarchy', filename: '17_Sitemap.pdf', icon: MapPin, category: 'System' },
  { id: '18', title: 'Notifications', description: 'Send and manage platform-wide notifications', filename: '18_Notifications.pdf', icon: Bell, category: 'System' },
  { id: '19', title: 'Upgrade Requests', description: 'Manage meeting requests and feature access', filename: '19_Upgrade_Requests.pdf', icon: ArrowUpCircle, category: 'System' },
  { id: '20', title: 'Landing Pages CMS', description: 'Customize landing page content for all roles', filename: '20_Landing_Pages.pdf', icon: FileEdit, category: 'System' },
  { id: '21', title: 'Data Export', description: 'Export platform data as CSV and PDF', filename: '21_Data_Export.pdf', icon: Download, category: 'System' },
  { id: '22', title: 'Platform Settings', description: 'Configure global platform settings and policies', filename: '22_Platform_Settings.pdf', icon: Settings, category: 'System' },
];

const categoryColors: Record<string, string> = {
  Core: 'bg-primary/10 text-primary',
  Governance: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Marketplace: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  System: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export const AdminDocumentation = () => {
  const [search, setSearch] = useState('');
  const [viewingGuide, setViewingGuide] = useState<GuideItem | null>(null);

  const filtered = guides.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase()) ||
    g.category.toLowerCase().includes(search.toLowerCase())
  );

  const getUrl = (filename: string) => `/admin_guides/${filename}`;

  const grouped = filtered.reduce<Record<string, GuideItem[]>>((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

  const handleDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = getUrl(filename);
    link.download = filename;
    link.target = '_blank';
    link.click();
  };

  const handleView = (guide: GuideItem) => {
    setViewingGuide(guide);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documentation</h2>
        <p className="text-muted-foreground">Step-by-step PDF guides for every admin feature</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guides..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{guides.length}</p>
              <p className="text-xs text-muted-foreground">Total Guides</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <Download className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={categoryColors[category] || ''}>{category}</Badge>
            <span className="text-sm text-muted-foreground">{items.length} guides</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map(guide => {
              const Icon = guide.icon;
              return (
                <Card key={guide.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{guide.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{guide.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">PDF</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs px-2"
                            onClick={() => handleDownload(guide.filename)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No guides found matching "{search}"</p>
        </div>
      )}
    </div>
  );
};
