import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { recordFormLoad, validateNotBot } from '@/lib/bot-prevention';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Briefcase, Plus, ChevronDown, X, AlertTriangle, Sparkles } from 'lucide-react';
import { internshipDomains, domainSkillsMap, getSuggestedSkills } from '@/lib/domain-skills';

const durationOptions = [
  '1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months', '1 Year'
];

interface Props {
  companyId: string | null;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  short_description: string;
  description: string;
  application_deadline: string;
  internship_type: 'free' | 'paid' | 'stipended';
  duration: string;
  work_mode: 'remote' | 'onsite' | 'hybrid';
  domains: string[];
  customDomains: string[];
  skills: string[];
  address: string;
  state: string;
  pincode: string;
  stipend: number | null;
  fees: number | null;
  is_paid: boolean;
  positions_available: number;
}

interface CompanyLimits {
  max_internships: number;
  max_active_internships: number;
  can_post_paid_internships: boolean;
  can_post_free_internships: boolean;
}

export const CreateInternshipForm = ({ companyId, onSuccess }: Props) => {
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState('');
  const [limits, setLimits] = useState<CompanyLimits | null>(null);
  const [totalInternships, setTotalInternships] = useState(0);
  const [activeInternships, setActiveInternships] = useState(0);
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    short_description: '',
    description: '',
    application_deadline: '',
    internship_type: 'free',
    duration: '',
    work_mode: 'onsite',
    domains: [],
    customDomains: [],
    skills: [],
    address: '',
    state: '',
    pincode: '',
    stipend: null,
    fees: null,
    is_paid: false,
    positions_available: 1,
  });

  useEffect(() => {
    recordFormLoad('create-internship');
    if (companyId) fetchLimits();
  }, [companyId]);

  const fetchLimits = async () => {
    setLimitsLoading(true);
    const [limitsRes, internshipsRes] = await Promise.all([
      supabase.from('company_limits').select('max_internships, max_active_internships, can_post_paid_internships, can_post_free_internships').eq('company_id', companyId!).maybeSingle(),
      supabase.from('internships').select('id, is_active').eq('company_id', companyId!),
    ]);
    if (limitsRes.data) setLimits(limitsRes.data as CompanyLimits);
    if (internshipsRes.data) {
      setTotalInternships(internshipsRes.data.length);
      setActiveInternships(internshipsRes.data.filter((i: any) => i.is_active).length);
    }
    setLimitsLoading(false);
  };

  const isOverTotalLimit = limits ? totalInternships >= limits.max_internships : false;
  const isOverActiveLimit = limits ? activeInternships >= limits.max_active_internships : false;
  const isTypeBlocked = limits ? (
    (formData.internship_type === 'paid' && !limits.can_post_paid_internships) ||
    (formData.internship_type === 'free' && !limits.can_post_free_internships)
  ) : false;

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Internship title is required';
    if (!formData.description.trim()) newErrors.description = 'About internship is required';
    if (!formData.application_deadline) newErrors.application_deadline = 'Application closing date is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (formData.domains.length === 0 && formData.customDomains.length === 0) newErrors.domains = 'At least one domain is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Bot/spam prevention
    const botError = validateNotBot('create-internship', honeypot);
    if (botError) {
      toast.error(botError);
      return;
    }

    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    // Enforce limits
    if (limits) {
      if (isOverTotalLimit) {
        toast.error(`You've reached the maximum of ${limits.max_internships} total internships`);
        return;
      }
      if (isOverActiveLimit) {
        toast.error(`You've reached the maximum of ${limits.max_active_internships} active internships`);
        return;
      }
      if (formData.internship_type === 'paid' && !limits.can_post_paid_internships) {
        toast.error('You are not allowed to post paid internships');
        return;
      }
      if (formData.internship_type === 'free' && !limits.can_post_free_internships) {
        toast.error('You are not allowed to post free internships');
        return;
      }
    }

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    const locationString = [formData.address, formData.state, formData.pincode].filter(Boolean).join(', ');
    
    const { error } = await supabase.from('internships').insert({
      company_id: companyId,
      title: formData.title,
      short_description: formData.short_description,
      description: formData.description,
      application_deadline: formData.application_deadline,
      internship_type: formData.internship_type,
      duration: formData.duration,
      work_mode: formData.work_mode,
      domain: allSelectedDomains.join(', '),
      skills: formData.skills,
      location: locationString || null,
      stipend: formData.internship_type === 'stipended' ? formData.stipend : null,
      fees: formData.internship_type === 'paid' ? formData.fees : null,
      is_paid: formData.internship_type === 'paid' || formData.internship_type === 'stipended',
      positions_available: formData.positions_available,
      is_active: true,
    });

    setSaving(false);

    if (error) {
      toast.error('Failed to create internship');
      console.error(error);
    } else {
      toast.success('Internship created successfully');
      onSuccess?.();
    }
  };

  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <Label>{children} <span className="text-destructive">*</span></Label>
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Create New Internship
        </h1>
        <p className="text-muted-foreground">Fill in the details to post a new internship opportunity</p>
      </div>

      {/* Limits Warning */}
      {!limitsLoading && limits && (isOverTotalLimit || isOverActiveLimit) && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isOverTotalLimit
              ? `You've reached your limit of ${limits.max_internships} total internships. Contact admin to increase your limit.`
              : `You've reached your limit of ${limits.max_active_internships} active internships. Deactivate existing ones or contact admin.`}
          </AlertDescription>
        </Alert>
      )}

      {!limitsLoading && limits && (
        <div className="flex gap-3 mb-4 text-sm">
          <Badge variant="outline">Total: {totalInternships}/{limits.max_internships}</Badge>
          <Badge variant="outline">Active: {activeInternships}/{limits.max_active_internships}</Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Internship Details</CardTitle>
          <CardDescription>Provide information about the internship position</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <RequiredLabel>Internship Title</RequiredLabel>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Software Developer Intern"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label>Short Description</Label>
            <Textarea
              rows={2}
              value={formData.short_description}
              onChange={(e) => handleChange('short_description', e.target.value)}
              placeholder="Brief overview of the internship..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <RequiredLabel>About Internship</RequiredLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={generating || !formData.title.trim()}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('generate-internship-description', {
                      body: {
                        title: formData.title,
                        domains: allSelectedDomains,
                        skills: formData.skills,
                        workMode: formData.work_mode,
                        duration: formData.duration,
                        internshipType: formData.internship_type,
                      },
                    });
                    if (error) throw error;
                    if (data?.error) { toast.error(data.error); return; }
                    if (data?.short_description) handleChange('short_description', data.short_description);
                    if (data?.description) handleChange('description', data.description);
                    toast.success('Description generated!');
                  } catch (e) {
                    console.error(e);
                    toast.error('Failed to generate description');
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                {generating ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-3 w-3 mr-1" /> AI Generate</>
                )}
              </Button>
            </div>
            <Textarea
              rows={5}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of responsibilities, requirements, and what the intern will learn..."
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <RequiredLabel>Application Closing Date</RequiredLabel>
              <Input
                type="date"
                value={formData.application_deadline}
                onChange={(e) => handleChange('application_deadline', e.target.value)}
                className={errors.application_deadline ? 'border-destructive' : ''}
              />
              {errors.application_deadline && <p className="text-xs text-destructive">{errors.application_deadline}</p>}
            </div>

            <div className="space-y-2">
              <RequiredLabel>Internship Type</RequiredLabel>
              <Select value={formData.internship_type} onValueChange={(v: any) => handleChange('internship_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="stipended">Stipended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.internship_type === 'paid' && (
              <div className="space-y-2">
                <Label>Fees Amount (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.fees || ''}
                  onChange={(e) => handleChange('fees', parseInt(e.target.value) || null)}
                  placeholder="e.g., 5000"
                />
                <p className="text-xs text-muted-foreground">Amount students will pay for this internship</p>
              </div>
            )}

            {formData.internship_type === 'stipended' && (
              <div className="space-y-2">
                <Label>Monthly Stipend (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.stipend || ''}
                  onChange={(e) => handleChange('stipend', parseInt(e.target.value) || null)}
                  placeholder="e.g., 10000"
                />
                <p className="text-xs text-muted-foreground">Amount you'll pay to interns monthly</p>
              </div>
            )}

            <div className="space-y-2">
              <RequiredLabel>Duration</RequiredLabel>
              <Select value={formData.duration} onValueChange={(v) => handleChange('duration', v)}>
                <SelectTrigger className={errors.duration ? 'border-destructive' : ''}><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  {durationOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.duration && <p className="text-xs text-destructive">{errors.duration}</p>}
            </div>

            <div className="space-y-2">
              <RequiredLabel>Mode</RequiredLabel>
              <Select value={formData.work_mode} onValueChange={(v: any) => handleChange('work_mode', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <RequiredLabel>Domains</RequiredLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-between ${errors.domains ? 'border-destructive' : ''}`}
                  >
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
                          id={`domain-${domain}`}
                          checked={formData.domains.includes(domain)}
                          onCheckedChange={() => toggleDomain(domain)}
                        />
                        <label 
                          htmlFor={`domain-${domain}`} 
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

              {errors.domains && <p className="text-xs text-destructive">{errors.domains}</p>}
            </div>

            <div className="space-y-2">
              <Label>Positions Available</Label>
              <Input
                type="number"
                min={1}
                value={formData.positions_available}
                onChange={(e) => handleChange('positions_available', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g., 123 Tech Park, MG Road"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="e.g., Maharashtra"
                />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  placeholder="e.g., 400001"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Skills Required</Label>
            
            {/* Suggested Skills based on selected domains */}
            {formData.domains.length > 0 && suggestedSkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Suggested skills for {formData.domains.length === 1 ? formData.domains[0] : `${formData.domains.length} domains`}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills
                    .filter(skill => !formData.skills.includes(skill))
                    .slice(0, 20)
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
                  {suggestedSkills.filter(skill => !formData.skills.includes(skill)).length > 20 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{suggestedSkills.filter(skill => !formData.skills.includes(skill)).length - 20} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Custom skill input */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Add custom skill:</p>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Type a skill and press Enter or Add"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline">Add</Button>
              </div>
            </div>

            {/* Selected skills */}
            {formData.skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected skills ({formData.skills.length}):</p>
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

          <div className="flex justify-end gap-4 pt-4">
            <Button onClick={handleSubmit} disabled={saving} className="gradient-primary border-0">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : 'Create Internship'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
