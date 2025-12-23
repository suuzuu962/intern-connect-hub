import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Upload, Building2, Globe, MapPin, User, Award, FileText, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const domainCategories = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Media & Entertainment', 'Consulting',
  'E-commerce', 'Logistics', 'Agriculture', 'Energy', 'Hospitality',
  'Legal', 'Non-Profit', 'Government', 'Telecommunications', 'Other'
];

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  long_description: string | null;
  about_company: string | null;
  website: string | null;
  founded_year: number | null;
  employee_count: string | null;
  industry: string | null;
  location: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gst_pan: string | null;
  domain_category: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  contact_person_designation: string | null;
  certifications: string[] | null;
  awards: string[] | null;
  company_profile_url: string | null;
  registration_profile_url: string | null;
  terms_accepted: boolean | null;
  declaration_accepted: boolean | null;
}

export const CompanyProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [certificationInput, setCertificationInput] = useState('');
  const [awardInput, setAwardInput] = useState('');

  useEffect(() => {
    if (user) fetchCompany();
  }, [user]);

  const fetchCompany = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (data) setCompany(data as CompanyData);
    setLoading(false);
  };

  const handleChange = (field: keyof CompanyData, value: any) => {
    if (company) {
      setCompany({ ...company, [field]: value });
    }
  };

  const handleFileUpload = async (file: File, field: 'logo_url' | 'cover_image_url' | 'company_profile_url' | 'registration_profile_url') => {
    if (file.size > 1048576) {
      toast.error('File size must be less than 1MB');
      return;
    }

    setUploading(field);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${field}-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('company-files')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed');
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('company-files')
      .getPublicUrl(fileName);

    handleChange(field, publicUrl);
    setUploading(null);
    toast.success('File uploaded successfully');
  };

  const addCertification = () => {
    if (certificationInput.trim()) {
      handleChange('certifications', [...(company?.certifications || []), certificationInput.trim()]);
      setCertificationInput('');
    }
  };

  const removeCertification = (index: number) => {
    const newCerts = [...(company?.certifications || [])];
    newCerts.splice(index, 1);
    handleChange('certifications', newCerts);
  };

  const addAward = () => {
    if (awardInput.trim()) {
      handleChange('awards', [...(company?.awards || []), awardInput.trim()]);
      setAwardInput('');
    }
  };

  const removeAward = (index: number) => {
    const newAwards = [...(company?.awards || [])];
    newAwards.splice(index, 1);
    handleChange('awards', newAwards);
  };

  const handleSave = async () => {
    if (!company) return;

    setSaving(true);
    const { error } = await supabase
      .from('companies')
      .update({
        name: company.name,
        description: company.description,
        short_description: company.short_description,
        long_description: company.long_description,
        about_company: company.about_company,
        website: company.website,
        founded_year: company.founded_year,
        employee_count: company.employee_count,
        industry: company.industry,
        logo_url: company.logo_url,
        cover_image_url: company.cover_image_url,
        gst_pan: company.gst_pan,
        domain_category: company.domain_category,
        facebook_url: company.facebook_url,
        twitter_url: company.twitter_url,
        linkedin_url: company.linkedin_url,
        instagram_url: company.instagram_url,
        address: company.address,
        country: company.country,
        state: company.state,
        city: company.city,
        postal_code: company.postal_code,
        contact_person_name: company.contact_person_name,
        contact_person_email: company.contact_person_email,
        contact_person_phone: company.contact_person_phone,
        contact_person_designation: company.contact_person_designation,
        certifications: company.certifications,
        awards: company.awards,
        company_profile_url: company.company_profile_url,
        registration_profile_url: company.registration_profile_url,
        terms_accepted: company.terms_accepted,
        declaration_accepted: company.declaration_accepted,
        is_verified: false, // Reset verification on any profile edit
      })
      .eq('id', company.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile saved successfully');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!company) {
    return <div className="text-center py-12 text-muted-foreground">No company profile found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Basic Information</CardTitle>
          <CardDescription>Your company's basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={company.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Domain Category</Label>
              <Select value={company.domain_category || ''} onValueChange={(v) => handleChange('domain_category', v)}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {domainCategories.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year Founded</Label>
              <Input type="number" value={company.founded_year || ''} onChange={(e) => handleChange('founded_year', parseInt(e.target.value) || null)} />
            </div>
            <div className="space-y-2">
              <Label>GST/PAN Number</Label>
              <Input value={company.gst_pan || ''} onChange={(e) => handleChange('gst_pan', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Description (max 750 words)</Label>
            <Textarea rows={3} value={company.short_description || ''} onChange={(e) => handleChange('short_description', e.target.value)} placeholder="Brief overview of your company..." />
          </div>

          <div className="space-y-2">
            <Label>Long Description (max 2000 words)</Label>
            <Textarea rows={6} value={company.long_description || ''} onChange={(e) => handleChange('long_description', e.target.value)} placeholder="Detailed description of your company..." />
          </div>

          <div className="space-y-2">
            <Label>About Company</Label>
            <Textarea rows={4} value={company.about_company || ''} onChange={(e) => handleChange('about_company', e.target.value)} placeholder="Tell us about your company culture, mission, and values..." />
          </div>
        </CardContent>
      </Card>

      {/* Media & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Media & Branding</CardTitle>
          <CardDescription>Upload logo and cover image (max 1MB each)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Company Logo</Label>
              {company.logo_url && <img src={company.logo_url} alt="Logo" className="h-20 w-20 object-contain rounded-lg border" />}
              <Input type="file" accept="image/*" disabled={uploading === 'logo_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo_url')} />
              {uploading === 'logo_url' && <span className="text-sm text-muted-foreground">Uploading...</span>}
            </div>
            <div className="space-y-3">
              <Label>Cover Image</Label>
              {company.cover_image_url && <img src={company.cover_image_url} alt="Cover" className="h-20 w-full object-cover rounded-lg border" />}
              <Input type="file" accept="image/*" disabled={uploading === 'cover_image_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover_image_url')} />
              {uploading === 'cover_image_url' && <span className="text-sm text-muted-foreground">Uploading...</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Website & Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={company.website || ''} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input value={company.facebook_url || ''} onChange={(e) => handleChange('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Twitter</Label>
              <Input value={company.twitter_url || ''} onChange={(e) => handleChange('twitter_url', e.target.value)} placeholder="https://twitter.com/..." />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={company.linkedin_url || ''} onChange={(e) => handleChange('linkedin_url', e.target.value)} placeholder="https://linkedin.com/company/..." />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={company.instagram_url || ''} onChange={(e) => handleChange('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea rows={2} value={company.address || ''} onChange={(e) => handleChange('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={company.country || ''} onChange={(e) => handleChange('country', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={company.state || ''} onChange={(e) => handleChange('state', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={company.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input value={company.postal_code || ''} onChange={(e) => handleChange('postal_code', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Person */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Contact Person</CardTitle>
          <CardDescription>Primary contact for internship inquiries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={company.contact_person_name || ''} onChange={(e) => handleChange('contact_person_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Select value={company.contact_person_designation || ''} onValueChange={(v) => handleChange('contact_person_designation', v)}>
                <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="csuit">C-Suite Executive</SelectItem>
                  <SelectItem value="hr_manager">HR Manager</SelectItem>
                  <SelectItem value="hr_employee">HR Employee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={company.contact_person_email || ''} onChange={(e) => handleChange('contact_person_email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={company.contact_person_phone || ''} onChange={(e) => handleChange('contact_person_phone', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Company Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Certifications</Label>
            <div className="flex gap-2">
              <Input value={certificationInput} onChange={(e) => setCertificationInput(e.target.value)} placeholder="Add certification" onKeyPress={(e) => e.key === 'Enter' && addCertification()} />
              <Button type="button" onClick={addCertification}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {company.certifications?.map((cert, i) => (
                <span key={i} className="px-3 py-1 bg-secondary rounded-full text-sm flex items-center gap-2">
                  {cert}
                  <button onClick={() => removeCertification(i)} className="text-muted-foreground hover:text-foreground">&times;</button>
                </span>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Awards & Recognitions</Label>
            <div className="flex gap-2">
              <Input value={awardInput} onChange={(e) => setAwardInput(e.target.value)} placeholder="Add award" onKeyPress={(e) => e.key === 'Enter' && addAward()} />
              <Button type="button" onClick={addAward}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {company.awards?.map((award, i) => (
                <span key={i} className="px-3 py-1 bg-secondary rounded-full text-sm flex items-center gap-2">
                  {award}
                  <button onClick={() => removeAward(i)} className="text-muted-foreground hover:text-foreground">&times;</button>
                </span>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Company Profile Document</Label>
              {company.company_profile_url && <a href={company.company_profile_url} target="_blank" className="text-primary underline text-sm">View uploaded file</a>}
              <Input type="file" accept=".pdf,.doc,.docx" disabled={uploading === 'company_profile_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'company_profile_url')} />
            </div>
            <div className="space-y-3">
              <Label>Registration Profile</Label>
              {company.registration_profile_url && <a href={company.registration_profile_url} target="_blank" className="text-primary underline text-sm">View uploaded file</a>}
              <Input type="file" accept=".pdf,.doc,.docx" disabled={uploading === 'registration_profile_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'registration_profile_url')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Declaration & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox checked={company.terms_accepted || false} onCheckedChange={(checked) => handleChange('terms_accepted', checked)} id="terms" />
            <label htmlFor="terms" className="text-sm">
              I accept the <a href="#" className="text-primary underline">Terms & Conditions</a> and agree to abide by the platform policies.
            </label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox checked={company.declaration_accepted || false} onCheckedChange={(checked) => handleChange('declaration_accepted', checked)} id="declaration" />
            <label htmlFor="declaration" className="text-sm">
              I declare that all information provided is accurate and complete to the best of my knowledge.
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={fetchCompany}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
};
