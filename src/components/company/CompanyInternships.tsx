import { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Clock, Loader2, ChevronDown, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { internshipDomains, getSuggestedSkills } from '@/lib/domain-skills';

interface InternshipFormData {
  id?: string;
  title: string;
  short_description: string;
  description: string;
  domains: string[];
  customDomains: string[];
  skills: string[];
  duration: string;
  internship_type: 'free' | 'paid' | 'stipended';
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

const initialFormData: InternshipFormData = {
  title: '',
  short_description: '',
  description: '',
  domains: [],
  customDomains: [],
  skills: [],
  duration: '',
  internship_type: 'free',
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
  const [customDomainInput, setCustomDomainInput] = useState('');

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

  const toggleDomain = (domain: string) => {
    const current = formData.domains;
    if (current.includes(domain)) {
      handleChange('domains', current.filter(d => d !== domain));
    } else {
      handleChange('domains', [...current, domain]);
    }
  };

  const addCustomDomain = () => {
    const trimmed = customDomainInput.trim();
    if (trimmed && !formData.customDomains.includes(trimmed) && !formData.domains.includes(trimmed)) {
      handleChange('customDomains', [...formData.customDomains, trimmed]);
      setCustomDomainInput('');
    }
  };

  const removeCustomDomain = (domain: string) => {
    handleChange('customDomains', formData.customDomains.filter(d => d !== domain));
  };

  const allSelectedDomains = useMemo(() => {
    return [...formData.domains, ...formData.customDomains];
  }, [formData.domains, formData.customDomains]);

  const suggestedSkills = useMemo(() => {
    return getSuggestedSkills(formData.domains.filter(d => d !== 'Other'));
  }, [formData.domains]);

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
    setCustomDomainInput('');
    setDialogOpen(true);
  };

  const parseDomains = (domainString: string): { domains: string[], customDomains: string[] } => {
    if (!domainString) return { domains: [], customDomains: [] };
    const allDomains = domainString.split(',').map(d => d.trim()).filter(Boolean);
    const knownDomains = allDomains.filter(d => internshipDomains.includes(d));
    const customDomains = allDomains.filter(d => !internshipDomains.includes(d));
    return { domains: knownDomains, customDomains };
  };

  const openEditDialog = (internship: any) => {
    const { domains, customDomains } = parseDomains(internship.domain || '');
    
    setFormData({
      id: internship.id,
      title: internship.title,
      short_description: internship.short_description || '',
      description: internship.description,
      domains,
      customDomains,
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
    setCustomDomainInput('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);

    const domainString = allSelectedDomains.join(', ');

    const payload = {
      company_id: companyId,
      title: formData.title,
      short_description: formData.short_description,
      description: formData.description,
      domain: domainString,
      skills: formData.skills,
      duration: formData.duration,
      internship_type: formData.internship_type,
      work_mode: formData.work_mode,
      location: formData.location,
      stipend: formData.internship_type === 'stipended' ? formData.stipend : null,
      is_paid: formData.internship_type === 'paid' || formData.internship_type === 'stipended',
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

              {/* Multi-domain selection */}
              <div className="space-y-2">
                <Label>Domains</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {allSelectedDomains.length > 0 
                        ? `${allSelectedDomains.length} domain${allSelectedDomains.length > 1 ? 's' : ''} selected`
                        : 'Select domains'}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-80 overflow-y-auto p-2">
                    <div className="space-y-2">
                      {internshipDomains.map(domain => (
                        <div key={domain} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`edit-domain-${domain}`}
                            checked={formData.domains.includes(domain)}
                            onCheckedChange={() => toggleDomain(domain)}
                          />
                          <label 
                            htmlFor={`edit-domain-${domain}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
                            {domain}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Selected domains display */}
                {allSelectedDomains.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.domains.map(domain => (
                      <Badge key={domain} variant="secondary" className="text-xs">
                        {domain}
                        <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleDomain(domain)} />
                      </Badge>
                    ))}
                    {formData.customDomains.map(domain => (
                      <Badge key={domain} variant="outline" className="text-xs bg-primary/10">
                        {domain}
                        <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeCustomDomain(domain)} />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Custom domain input when "Other" is selected */}
                {formData.domains.includes('Other') && (
                  <div className="mt-3 p-3 border rounded-md bg-muted/30">
                    <Label className="text-sm">Add Custom Domain</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={customDomainInput}
                        onChange={(e) => setCustomDomainInput(e.target.value)}
                        placeholder="Enter custom domain name"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomDomain())}
                      />
                      <Button type="button" onClick={addCustomDomain} variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.customDomains.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Custom domains added: {formData.customDomains.length}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Input value={formData.duration} onChange={(e) => handleChange('duration', e.target.value)} placeholder="e.g., 3 months" />
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea rows={2} value={formData.short_description} onChange={(e) => handleChange('short_description', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Full Description *</Label>
                <Textarea rows={4} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
              </div>

              {/* Skills section with suggestions */}
              <div className="space-y-3">
                <Label>Skills Required</Label>
                
                {/* Suggested skills from domains */}
                {formData.domains.length > 0 && suggestedSkills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Suggested skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills
                        .filter(skill => !formData.skills.includes(skill))
                        .slice(0, 15)
                        .map(skill => (
                          <Badge 
                            key={skill} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleChange('skills', [...formData.skills, skill])}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Custom skill input */}
                <div className="flex gap-2">
                  <Input 
                    value={skillInput} 
                    onChange={(e) => setSkillInput(e.target.value)} 
                    placeholder="Add custom skill" 
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} 
                  />
                  <Button type="button" onClick={addSkill} variant="outline">Add</Button>
                </div>

                {/* Selected skills */}
                {formData.skills.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Selected ({formData.skills.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                          {skill} &times;
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Internship Type</Label>
                  <Select value={formData.internship_type} onValueChange={(v: any) => handleChange('internship_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="stipended">Stipended</SelectItem>
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

              {formData.internship_type === 'stipended' && (
                <div className="space-y-2">
                  <Label>Monthly Stipend (₹)</Label>
                  <Input type="number" min={0} value={formData.stipend || ''} onChange={(e) => handleChange('stipend', parseInt(e.target.value) || null)} placeholder="e.g., 10000" />
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
