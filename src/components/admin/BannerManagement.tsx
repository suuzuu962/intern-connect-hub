import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Image, Calendar as CalendarIcon, Clock, MapPin, Users, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  position: string;
  target_roles: string[];
  target_regions: string[];
  target_cities: string[];
  start_date: string;
  end_date: string | null;
  display_hours_start: number;
  display_hours_end: number;
  priority: number;
  is_active: boolean;
  click_count: number;
  view_count: number;
  created_at: string;
}

const ROLES = [
  { value: 'student', label: 'Students' },
  { value: 'company', label: 'Companies' },
  { value: 'university', label: 'Universities' },
  { value: 'college_coordinator', label: 'College Coordinators' },
  { value: 'guest', label: 'Guests (Not Logged In)' },
];

const REGIONS = [
  'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Telangana', 
  'Gujarat', 'Rajasthan', 'West Bengal', 'Uttar Pradesh', 'Kerala',
  'Andhra Pradesh', 'Punjab', 'Haryana', 'Bihar', 'Odisha'
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`
}));

export const BannerManagement = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    position: 'hero',
    target_roles: [] as string[],
    target_regions: [] as string[],
    target_cities: '',
    start_date: new Date(),
    end_date: null as Date | null,
    display_hours_start: 0,
    display_hours_end: 23,
    priority: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('advertisement_banners')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch banners', variant: 'destructive' });
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      position: 'hero',
      target_roles: [],
      target_regions: [],
      target_cities: '',
      start_date: new Date(),
      end_date: null,
      display_hours_start: 0,
      display_hours_end: 23,
      priority: 0,
      is_active: true,
    });
    setSelectedBanner(null);
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      position: banner.position,
      target_roles: banner.target_roles || [],
      target_regions: banner.target_regions || [],
      target_cities: (banner.target_cities || []).join(', '),
      start_date: new Date(banner.start_date),
      end_date: banner.end_date ? new Date(banner.end_date) : null,
      display_hours_start: banner.display_hours_start,
      display_hours_end: banner.display_hours_end,
      priority: banner.priority,
      is_active: banner.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.image_url) {
      toast({ title: 'Error', description: 'Title and image URL are required', variant: 'destructive' });
      return;
    }

    const bannerData = {
      title: formData.title,
      description: formData.description || null,
      image_url: formData.image_url,
      link_url: formData.link_url || null,
      position: formData.position,
      target_roles: formData.target_roles,
      target_regions: formData.target_regions,
      target_cities: formData.target_cities.split(',').map(c => c.trim()).filter(Boolean),
      start_date: formData.start_date.toISOString(),
      end_date: formData.end_date?.toISOString() || null,
      display_hours_start: formData.display_hours_start,
      display_hours_end: formData.display_hours_end,
      priority: formData.priority,
      is_active: formData.is_active,
    };

    let error;
    if (selectedBanner) {
      ({ error } = await supabase
        .from('advertisement_banners')
        .update(bannerData)
        .eq('id', selectedBanner.id));
    } else {
      ({ error } = await supabase
        .from('advertisement_banners')
        .insert([bannerData]));
    }

    if (error) {
      toast({ title: 'Error', description: 'Failed to save banner', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Banner ${selectedBanner ? 'updated' : 'created'} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchBanners();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('advertisement_banners')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete banner', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Banner deleted successfully' });
      fetchBanners();
    }
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from('advertisement_banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update banner', variant: 'destructive' });
    } else {
      fetchBanners();
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      target_regions: prev.target_regions.includes(region)
        ? prev.target_regions.filter(r => r !== region)
        : [...prev.target_regions, region]
    }));
  };

  return (
    <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
    <div className="space-y-6 pr-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Advertisement Banners</h2>
          <p className="text-muted-foreground">Manage homepage banners with role-based targeting</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Banner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedBanner ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
              <DialogDescription>Configure banner content, targeting, and scheduling</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Banner title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image URL *</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link URL</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="https://example.com/promo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={formData.position} onValueChange={(v) => setFormData(prev => ({ ...prev, position: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Hero (Top)</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              {/* Right Column - Targeting & Scheduling */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" /> Target Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {ROLES.map(role => (
                        <Badge
                          key={role.value}
                          variant={formData.target_roles.includes(role.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleRole(role.value)}
                        >
                          {role.label}
                        </Badge>
                      ))}
                    </div>
                    {formData.target_roles.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-2">All roles if none selected</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Target Regions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {REGIONS.map(region => (
                        <Badge
                          key={region}
                          variant={formData.target_regions.includes(region) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleRegion(region)}
                        >
                          {region}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Input
                        value={formData.target_cities}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_cities: e.target.value }))}
                        placeholder="Specific cities (comma separated)"
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <CalendarIcon className="h-3 w-3 mr-2" />
                              {format(formData.start_date, 'PP')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.start_date}
                              onSelect={(d) => d && setFormData(prev => ({ ...prev, start_date: d }))}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-xs">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <CalendarIcon className="h-3 w-3 mr-2" />
                              {formData.end_date ? format(formData.end_date, 'PP') : 'No end'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.end_date || undefined}
                              onSelect={(d) => setFormData(prev => ({ ...prev, end_date: d || null }))}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => setFormData(prev => ({ ...prev, end_date: null }))}
                            >
                              Clear
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Display From</Label>
                        <Select
                          value={String(formData.display_hours_start)}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, display_hours_start: parseInt(v) }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map(h => (
                              <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Display Until</Label>
                        <Select
                          value={String(formData.display_hours_end)}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, display_hours_end: parseInt(v) }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map(h => (
                              <SelectItem key={h.value} value={String(h.value)}>{h.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                {formData.image_url && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Image className="h-4 w-4" /> Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className={cn(
                        "rounded-lg overflow-hidden border",
                        formData.position === 'hero' ? 'aspect-[4/1]' : 'aspect-[1/1]'
                      )}>
                        <img
                          src={formData.image_url}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSave}>{selectedBanner ? 'Update' : 'Create'} Banner</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{banners.length}</div>
            <p className="text-sm text-muted-foreground">Total Banners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {banners.filter(b => b.is_active).length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {banners.reduce((sum, b) => sum + b.view_count, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {banners.reduce((sum, b) => sum + b.click_count, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
          </CardContent>
        </Card>
      </div>

      {/* Banners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Banners</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Target Roles</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No banners created yet
                  </TableCell>
                </TableRow>
              ) : (
                banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="w-20 h-12 rounded overflow-hidden border">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{banner.title}</div>
                      {banner.link_url && (
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {banner.link_url}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{banner.position}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(banner.target_roles || []).length === 0 ? (
                          <span className="text-xs text-muted-foreground">All</span>
                        ) : (
                          banner.target_roles.slice(0, 2).map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))
                        )}
                        {(banner.target_roles || []).length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{banner.target_roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>{format(new Date(banner.start_date), 'PP')}</div>
                        {banner.end_date && (
                          <div className="text-muted-foreground">
                            to {format(new Date(banner.end_date), 'PP')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {banner.view_count}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <BarChart3 className="h-3 w-3" /> {banner.click_count} clicks
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={banner.is_active ? "default" : "secondary"}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(banner)}
                        >
                          {banner.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </ScrollArea>
  );
};
