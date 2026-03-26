import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import {
  FileText, Download, Search, LayoutDashboard, BarChart3, Target,
  Network, ShieldCheck, GraduationCap, School, Users, Building2,
  Briefcase, CreditCard, Plug, Puzzle, FileBarChart, Map, MapPin,
  Bell, ArrowUpCircle, FileEdit, Settings, LucideIcon, Eye, Plus,
  Upload, Trash2, Loader2, ScanSearch, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { ADMIN_FEATURE_REGISTRY, scanForMissingDocs, type ScanResult as FeatureScanResult } from '@/lib/admin-feature-registry';

interface GuideItem {
  id: string;
  title: string;
  description: string;
  filename: string;
  icon: LucideIcon;
  category: string;
  isCustom?: boolean;
  fileUrl?: string;
}

interface CustomDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  filename: string;
  file_url: string;
  created_at: string;
}

const builtInGuides: GuideItem[] = [
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
  Custom: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const CATEGORIES = ['Core', 'Governance', 'Marketplace', 'Security', 'System', 'Custom'];

export const AdminDocumentation = () => {
  const [search, setSearch] = useState('');
  const [viewingGuide, setViewingGuide] = useState<GuideItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [customDocs, setCustomDocs] = useState<CustomDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', category: 'Custom' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomDocs();
  }, []);

  const fetchCustomDocs = async () => {
    const { data } = await supabase
      .from('admin_documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCustomDocs(data as unknown as CustomDocument[]);
  };

  const allGuides: GuideItem[] = [
    ...builtInGuides,
    ...customDocs.map(doc => ({
      id: `custom-${doc.id}`,
      title: doc.title,
      description: doc.description || 'Custom uploaded document',
      filename: doc.filename,
      icon: FileText,
      category: doc.category || 'Custom',
      isCustom: true,
      fileUrl: doc.file_url,
    })),
  ];

  const filtered = allGuides.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase()) ||
    g.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, GuideItem[]>>((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

  const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/public-assets/admin-guides`;

  const getUrl = (guide: GuideItem) => {
    if (guide.isCustom && guide.fileUrl) return guide.fileUrl;
    return `${STORAGE_BASE}/${guide.filename}`;
  };

  const handleDownload = (guide: GuideItem) => {
    const link = document.createElement('a');
    link.href = getUrl(guide);
    link.download = guide.filename;
    link.target = '_blank';
    link.click();
  };

  const handleView = (guide: GuideItem) => {
    setViewingGuide(guide);
  };

  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    try {
      const zip = new JSZip();
      const guides = allGuides;
      let downloaded = 0;

      for (const guide of guides) {
        try {
          const response = await fetch(getUrl(guide));
          if (response.ok) {
            const blob = await response.blob();
            zip.file(guide.filename, blob);
            downloaded++;
          }
        } catch {
          console.warn(`Skipped: ${guide.filename}`);
        }
      }

      if (downloaded === 0) {
        toast({ title: 'No files could be downloaded', variant: 'destructive' });
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'Admin_Guides_All.zip';
      link.click();
      URL.revokeObjectURL(link.href);
      toast({ title: `Downloaded ${downloaded} guides as ZIP` });
    } catch (err) {
      toast({ title: 'Bulk download failed', variant: 'destructive' });
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title) {
      toast({ title: 'Please fill in title and select a file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop();
      const path = `admin-docs/${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(path, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(path);

      const { error: dbError } = await supabase.from('admin_documents').insert({
        title: uploadForm.title,
        description: uploadForm.description || null,
        category: uploadForm.category,
        filename: selectedFile.name,
        file_url: urlData.publicUrl,
        file_size: selectedFile.size,
      } as any);

      if (dbError) throw dbError;

      toast({ title: 'Document uploaded successfully' });
      setShowUpload(false);
      setUploadForm({ title: '', description: '', category: 'Custom' });
      setSelectedFile(null);
      fetchCustomDocs();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleDelete = async (docId: string) => {
    const { error } = await supabase
      .from('admin_documents')
      .delete()
      .eq('id', docId.replace('custom-', ''));
    if (!error) {
      toast({ title: 'Document deleted' });
      fetchCustomDocs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentation</h2>
          <p className="text-muted-foreground">Step-by-step PDF guides for every admin feature</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkDownload} disabled={bulkDownloading}>
            {bulkDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {bulkDownloading ? 'Zipping...' : 'Download All'}
          </Button>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{builtInGuides.length}</p>
              <p className="text-xs text-muted-foreground">Built-in Guides</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <Upload className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{customDocs.length}</p>
              <p className="text-xs text-muted-foreground">Custom Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <Download className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{Object.keys(grouped).length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={categoryColors[category] || categoryColors.Custom}>{category}</Badge>
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
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-semibold truncate">{guide.title}</h4>
                          {guide.isCustom && <Badge variant="outline" className="text-[9px] px-1 py-0">Custom</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{guide.description}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">PDF</Badge>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => handleView(guide)}>
                            <Eye className="h-3 w-3 mr-1" />View
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => handleDownload(guide)}>
                            <Download className="h-3 w-3 mr-1" />Download
                          </Button>
                          {guide.isCustom && (
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(guide.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
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
          <p>No guides found matching &quot;{search}&quot;</p>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewingGuide} onOpenChange={() => setViewingGuide(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingGuide?.title}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { if (viewingGuide) window.open(getUrl(viewingGuide), '_blank'); }}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" />Open in New Tab
                </Button>
                <Button size="sm" variant="outline" onClick={() => viewingGuide && handleDownload(viewingGuide)}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewingGuide && (
            <div className="flex-1 w-full rounded-md border border-border overflow-hidden">
              <object data={getUrl(viewingGuide)} type="application/pdf" className="w-full h-full">
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <FileText className="h-16 w-16 opacity-40" />
                  <p className="text-lg font-medium">PDF preview not available in this browser</p>
                  <p className="text-sm">Click "Open in New Tab" or "Download" to view the document.</p>
                </div>
              </object>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="Document title..." value={uploadForm.title}
                onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Brief description..." value={uploadForm.description}
                onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={uploadForm.category} onValueChange={v => setUploadForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>PDF File *</Label>
              <input type="file" ref={fileInputRef} accept=".pdf" className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a PDF file</p>
                  </>
                )}
              </div>
            </div>
            <Button className="w-full" onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
