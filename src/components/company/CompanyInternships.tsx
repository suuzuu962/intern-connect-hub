import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface InternshipFormData {
  id?: string;
  title: string;
  short_description: string;
  description: string;
  domain: string;
  skills: string[];
  duration: string;
  internship_type: 'full_time' | 'part_time' | 'contract';
  work_mode: 'remote' | 'onsite' | 'hybrid';
  location: string;
  stipend: number | null;
  is_paid: boolean;
  fees: number | null;
  positions_available: number;
  start_date: string;
  application_deadline: string;
  is_active: boolean;
}

const domainOptions = [
  'Software Development', 'Web Development', 'Mobile Development', 'Data Science',
  'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design',
  'Digital Marketing', 'Content Writing', 'Business Development', 'Finance',
  'Human Resources', 'Operations', 'Research', 'Other'
];

const initialFormData: InternshipFormData = {
  title: '',
  short_description: '',
  description: '',
  domain: '',
  skills: [],
  duration: '',
  internship_type: 'full_time',
  work_mode: 'onsite',
  location: '',
  stipend: null,
  is_paid: false,
  fees: null,
  positions_available: 1,
  start_date: '',
  application_deadline: '',
  is_active: true,
};

interface Props {
  companyId: string | null;
  onUpdate?: () => void;
}

export const CompanyInternships = ({ companyId, onUpdate }: Props) => {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InternshipFormData>(initialFormData);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (companyId) fetchInternships();
  }, [companyId]);

  const fetchInternships = async () => {
    const { data } = await supabase
      .from('internships')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    setInternships(data || []);
    setLoading(false);
  };

  const handleChange = (field: keyof InternshipFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      handleChange('skills', [...formData.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    handleChange('skills', formData.skills.filter(s => s !== skill));
  };

  const openCreateDialog = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (internship: any) => {
    setFormData({
      id: internship.id,
      title: internship.title,
      short_description: internship.short_description || '',
      description: internship.description,
      domain: internship.domain || '',
      skills: internship.skills || [],
      duration: internship.duration || '',
      internship_type: internship.internship_type,
      work_mode: internship.work_mode,
      location: internship.location || '',
      stipend: internship.stipend,
      is_paid: internship.is_paid || false,
      fees: internship.fees,
      positions_available: internship.positions_available || 1,
      start_date: internship.start_date || '',
      application_deadline: internship.application_deadline || '',
      is_active: internship.is_active,
    });
    setEditingId(internship.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);

    const payload = {
      company_id: companyId,
      title: formData.title,
      short_description: formData.short_description,
      description: formData.description,
      domain: formData.domain,
      skills: formData.skills,
      duration: formData.duration,
      internship_type: formData.internship_type,
      work_mode: formData.work_mode,
      location: formData.location,
      stipend: formData.is_paid ? formData.stipend : null,
      is_paid: formData.is_paid,
      fees: formData.fees,
      positions_available: formData.positions_available,
      start_date: formData.start_date || null,
      application_deadline: formData.application_deadline || null,
      is_active: formData.is_active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('internships').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('internships').insert(payload));
    }

    setSaving(false);

    if (error) {
      toast.error('Failed to save internship');
    } else {
      toast.success(editingId ? 'Internship updated' : 'Internship created');
      setDialogOpen(false);
      fetchInternships();
      onUpdate?.();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('internships').update({ is_active: isActive }).eq('id', id);
    fetchInternships();
    onUpdate?.();
  };

  const deleteInternship = async (id: string) => {
    if (!confirm('Are you sure you want to delete this internship?')) return;
    await supabase.from('internships').delete().eq('id', id);
    toast.success('Internship deleted');
    fetchInternships();
    onUpdate?.();
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Internships ({internships.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gradient-primary border-0">
              <Plus className="h-4 w-4 mr-2" /> Create Internship
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Internship' : 'Create New Internship'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="e.g., Software Developer Intern" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Select value={formData.domain} onValueChange={(v) => handleChange('domain', v)}>
                    <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                    <SelectContent>
                      {domainOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input value={formData.duration} onChange={(e) => handleChange('duration', e.target.value)} placeholder="e.g., 3 months" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea rows={2} value={formData.short_description} onChange={(e) => handleChange('short_description', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Full Description *</Label>
                <Textarea rows={4} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Skills Required</Label>
                <div className="flex gap-2">
                  <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add skill" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                  <Button type="button" onClick={addSkill} variant="outline">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                      {skill} &times;
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Internship Type</Label>
                  <Select value={formData.internship_type} onValueChange={(v: any) => handleChange('internship_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Work Mode</Label>
                  <Select value={formData.work_mode} onValueChange={(v: any) => handleChange('work_mode', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={formData.location} onChange={(e) => handleChange('location', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Positions Available</Label>
                  <Input type="number" min={1} value={formData.positions_available} onChange={(e) => handleChange('positions_available', parseInt(e.target.value) || 1)} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_paid} onCheckedChange={(v) => handleChange('is_paid', v)} />
                  <Label>Paid Internship</Label>
                </div>
              </div>

              {formData.is_paid && (
                <div className="space-y-2">
                  <Label>Monthly Stipend (₹)</Label>
                  <Input type="number" value={formData.stipend || ''} onChange={(e) => handleChange('stipend', parseInt(e.target.value) || null)} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Registration Fee (₹) - Optional</Label>
                <Input type="number" value={formData.fees || ''} onChange={(e) => handleChange('fees', parseInt(e.target.value) || null)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => handleChange('start_date', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Application Deadline</Label>
                  <Input type="date" value={formData.application_deadline} onChange={(e) => handleChange('application_deadline', e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={(v) => handleChange('is_active', v)} />
                <Label>Active (visible to students)</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {internships.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No internships created yet. Create your first internship to start receiving applications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {internships.map((internship) => (
            <Card key={internship.id} className={`${!internship.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{internship.title}</h3>
                      <Badge variant={internship.is_active ? 'default' : 'secondary'}>
                        {internship.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {internship.domain && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {internship.domain}</span>}
                      {internship.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {internship.location}</span>}
                      {internship.application_deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Deadline: {format(new Date(internship.application_deadline), 'MMM d, yyyy')}</span>}
                      <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {internship.views_count || 0} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={internship.is_active} onCheckedChange={(v) => toggleActive(internship.id, v)} />
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(internship)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteInternship(internship.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
