import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Briefcase } from 'lucide-react';

const domainOptions = [
  'Software Development', 'Web Development', 'Mobile Development', 'Data Science',
  'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design',
  'Digital Marketing', 'Content Writing', 'Business Development', 'Finance',
  'Human Resources', 'Operations', 'Research', 'Other'
];

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
  internship_type: 'full_time' | 'part_time' | 'contract';
  duration: string;
  work_mode: 'remote' | 'onsite' | 'hybrid';
  domain: string;
  skills: string[];
  location: string;
  stipend: number | null;
  is_paid: boolean;
  positions_available: number;
}

export const CreateInternshipForm = ({ companyId, onSuccess }: Props) => {
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    title: '',
    short_description: '',
    description: '',
    application_deadline: '',
    internship_type: 'full_time',
    duration: '',
    work_mode: 'onsite',
    domain: '',
    skills: [],
    location: '',
    stipend: null,
    is_paid: false,
    positions_available: 1,
  });

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Internship title is required';
    if (!formData.description.trim()) newErrors.description = 'About internship is required';
    if (!formData.application_deadline) newErrors.application_deadline = 'Application closing date is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.domain) newErrors.domain = 'Domain is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('internships').insert({
      company_id: companyId,
      title: formData.title,
      short_description: formData.short_description,
      description: formData.description,
      application_deadline: formData.application_deadline,
      internship_type: formData.internship_type,
      duration: formData.duration,
      work_mode: formData.work_mode,
      domain: formData.domain,
      skills: formData.skills,
      location: formData.location,
      stipend: formData.is_paid ? formData.stipend : null,
      is_paid: formData.is_paid,
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
            <RequiredLabel>About Internship</RequiredLabel>
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
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-2">
              <RequiredLabel>Domain</RequiredLabel>
              <Select value={formData.domain} onValueChange={(v) => handleChange('domain', v)}>
                <SelectTrigger className={errors.domain ? 'border-destructive' : ''}><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {domainOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.domain && <p className="text-xs text-destructive">{errors.domain}</p>}
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Mumbai, India"
              />
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

          <div className="space-y-2">
            <Label>Skills Required</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} variant="outline">Add</Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                    {skill} &times;
                  </Badge>
                ))}
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
