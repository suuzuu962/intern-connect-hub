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
import { Upload, Building2, Globe, MapPin, User, Award, FileText, Loader2, Briefcase } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const domainCategories = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Media & Entertainment', 'Consulting',
  'E-commerce', 'Logistics', 'Agriculture', 'Energy', 'Hospitality',
  'Legal', 'Non-Profit', 'Government', 'Telecommunications', 'Other'
];

const internshipModes = ['Remote', 'On-site', 'Hybrid'];
const internshipDomains = [
  'Software Development', 'Web Development', 'Mobile Development', 'Data Science',
  'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design',
  'Digital Marketing', 'Content Writing', 'Business Development', 'Finance',
  'Human Resources', 'Operations', 'Research', 'Other'
];

const designationTitles = [
  'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'Director', 'Managing Director',
  'Founder', 'Co-Founder', 'President', 'Vice President', 'Partner'
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
  designation_title: string | null;
  designation_name: string | null;
  designation_email: string | null;
  designation_phone: string | null;
  internship_mode: string | null;
  internship_domain: string | null;
  internship_duration: string | null;
  stipend_offered: string | null;
  certifications: string[] | null;
  awards: string[] | null;
  company_profile_url: string | null;
  registration_profile_url: string | null;
  terms_accepted: boolean | null;
  declaration_accepted: boolean | null;
}

export const CompanyProfileForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [certificationInput, setCertificationInput] = useState('');
  const [awardInput, setAwardInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      if (errors[field]) {
        setErrors({ ...errors, [field]: '' });
      }
    }
  };

  const handleFileUpload = async (file: File, field: 'logo_url' | 'cover_image_url' | 'company_profile_url' | 'registration_profile_url', isPdf = false) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (isPdf && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploading(field);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${field}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!company?.name?.trim()) newErrors.name = 'Company name is required';
    if (!company?.about_company?.trim()) newErrors.about_company = 'About company is required';
    if (!company?.founded_year) newErrors.founded_year = 'Year founded is required';
    if (!company?.gst_pan?.trim()) newErrors.gst_pan = 'GST/PAN is required';
    if (!company?.domain_category) newErrors.domain_category = 'Domain category is required';
    if (!company?.address?.trim()) newErrors.address = 'Address is required';
    if (!company?.country?.trim()) newErrors.country = 'Country is required';
    if (!company?.state?.trim()) newErrors.state = 'State is required';
    if (!company?.city?.trim()) newErrors.city = 'City is required';
    if (!company?.postal_code?.trim()) newErrors.postal_code = 'Postal code is required';
    if (!company?.contact_person_name?.trim()) newErrors.contact_person_name = 'Contact person name is required';
    if (!company?.contact_person_email?.trim()) newErrors.contact_person_email = 'Contact person email is required';
    if (!company?.contact_person_phone?.trim()) newErrors.contact_person_phone = 'Contact person phone is required';
    if (!company?.contact_person_designation) newErrors.contact_person_designation = 'Designation is required';
    if (!company?.terms_accepted) newErrors.terms_accepted = 'You must accept terms & conditions';
    if (!company?.declaration_accepted) newErrors.declaration_accepted = 'You must confirm accuracy';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!company) return;

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

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
        designation_title: company.designation_title,
        designation_name: company.designation_name,
        designation_email: company.designation_email,
        designation_phone: company.designation_phone,
        internship_mode: company.internship_mode,
        internship_domain: company.internship_domain,
        internship_duration: company.internship_duration,
        stipend_offered: company.stipend_offered,
        certifications: company.certifications,
        awards: company.awards,
        company_profile_url: company.company_profile_url,
        registration_profile_url: company.registration_profile_url,
        terms_accepted: company.terms_accepted,
        declaration_accepted: company.declaration_accepted,
      })
      .eq('id', company.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile submitted for approval');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!company) {
    return <div className="text-center py-12 text-muted-foreground">No company profile found</div>;
  }

  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <Label>{children} <span className="text-destructive">*</span></Label>
  );

  const OptionalLabel = ({ children }: { children: React.ReactNode }) => (
    <Label>{children} <span className="text-muted-foreground text-xs">(optional)</span></Label>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Company Profile</h1>
        <p className="text-muted-foreground">Complete your company profile to get verified and start posting internships</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Basic Information</CardTitle>
          <CardDescription>Your company's basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <RequiredLabel>Company Name</RequiredLabel>
              <Input value={company.name || ''} onChange={(e) => handleChange('name', e.target.value)} className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel>Domain Category</RequiredLabel>
              <Select value={company.domain_category || ''} onValueChange={(v) => handleChange('domain_category', v)}>
                <SelectTrigger className={errors.domain_category ? 'border-destructive' : ''}><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {domainCategories.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.domain_category && <p className="text-xs text-destructive">{errors.domain_category}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel>Year Founded</RequiredLabel>
              <Input type="number" value={company.founded_year || ''} onChange={(e) => handleChange('founded_year', parseInt(e.target.value) || null)} className={errors.founded_year ? 'border-destructive' : ''} />
              {errors.founded_year && <p className="text-xs text-destructive">{errors.founded_year}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel>GST/PAN Number</RequiredLabel>
              <Input value={company.gst_pan || ''} onChange={(e) => handleChange('gst_pan', e.target.value)} className={errors.gst_pan ? 'border-destructive' : ''} />
              {errors.gst_pan && <p className="text-xs text-destructive">{errors.gst_pan}</p>}
            </div>
            <div className="space-y-2">
              <Label>Number of Employees</Label>
              <Select value={company.employee_count || ''} onValueChange={(v) => handleChange('employee_count', v)}>
                <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-500">201-500</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
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
            <RequiredLabel>About Company</RequiredLabel>
            <Textarea rows={4} value={company.about_company || ''} onChange={(e) => handleChange('about_company', e.target.value)} placeholder="Tell us about your company culture, mission, and values..." className={errors.about_company ? 'border-destructive' : ''} />
            {errors.about_company && <p className="text-xs text-destructive">{errors.about_company}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Media & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Media & Branding</CardTitle>
          <CardDescription>Upload logo and cover image (max 5MB each)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Company Logo</Label>
              {company.logo_url && <img src={company.logo_url} alt="Logo" className="h-20 w-20 object-contain rounded-lg border" />}
              <Input type="file" accept="image/*" disabled={uploading === 'logo_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo_url')} />
              {uploading === 'logo_url' && <span className="text-sm text-muted-foreground">Uploading...</span>}
              <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
            </div>
            <div className="space-y-3">
              <Label>Cover Image</Label>
              {company.cover_image_url && <img src={company.cover_image_url} alt="Cover" className="h-20 w-full object-cover rounded-lg border" />}
              <Input type="file" accept="image/*" disabled={uploading === 'cover_image_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover_image_url')} />
              {uploading === 'cover_image_url' && <span className="text-sm text-muted-foreground">Uploading...</span>}
              <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Website & Social Links</CardTitle>
          <CardDescription>All social links are optional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <OptionalLabel>Website</OptionalLabel>
              <Input value={company.website || ''} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <OptionalLabel>Facebook</OptionalLabel>
              <Input value={company.facebook_url || ''} onChange={(e) => handleChange('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <OptionalLabel>Twitter</OptionalLabel>
              <Input value={company.twitter_url || ''} onChange={(e) => handleChange('twitter_url', e.target.value)} placeholder="https://twitter.com/..." />
            </div>
            <div className="space-y-2">
              <OptionalLabel>LinkedIn</OptionalLabel>
              <Input value={company.linkedin_url || ''} onChange={(e) => handleChange('linkedin_url', e.target.value)} placeholder="https://linkedin.com/company/..." />
            </div>
            <div className="space-y-2">
              <OptionalLabel>Instagram</OptionalLabel>
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
            <RequiredLabel>Address</RequiredLabel>
            <Textarea rows={2} value={company.address || ''} onChange={(e) => handleChange('address', e.target.value)} className={errors.address ? 'border-destructive' : ''} />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <RequiredLabel>Country</RequiredLabel>
              <Input value={company.country || ''} onChange={(e) => handleChange('country', e.target.value)} className={errors.country ? 'border-destructive' : ''} />
              {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel>State</RequiredLabel>
              <Input value={company.state || ''} onChange={(e) => handleChange('state', e.target.value)} className={errors.state ? 'border-destructive' : ''} />
              {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel>City</RequiredLabel>
              <Input value={company.city || ''} onChange={(e) => handleChange('city', e.target.value)} className={errors.city ? 'border-destructive' : ''} />
              {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel>Postal Code</RequiredLabel>
              <Input value={company.postal_code || ''} onChange={(e) => handleChange('postal_code', e.target.value)} className={errors.postal_code ? 'border-destructive' : ''} />
              {errors.postal_code && <p className="text-xs text-destructive">{errors.postal_code}</p>}
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
              <RequiredLabel>Name</RequiredLabel>
              <Input value={company.contact_person_name || ''} onChange={(e) => handleChange('contact_person_name', e.target.value)} className={errors.contact_person_name ? 'border-destructive' : ''} />
              {errors.contact_person_name && <p className="text-xs text-destructive">{errors.contact_person_name}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel>Email</RequiredLabel>
              <Input type="email" value={company.contact_person_email || ''} onChange={(e) => handleChange('contact_person_email', e.target.value)} className={errors.contact_person_email ? 'border-destructive' : ''} />
              {errors.contact_person_email && <p className="text-xs text-destructive">{errors.contact_person_email}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel>Phone</RequiredLabel>
              <Input value={company.contact_person_phone || ''} onChange={(e) => handleChange('contact_person_phone', e.target.value)} className={errors.contact_person_phone ? 'border-destructive' : ''} />
              {errors.contact_person_phone && <p className="text-xs text-destructive">{errors.contact_person_phone}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Designation Info (Top Level Management) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Designation Info</CardTitle>
          <CardDescription>Top level management details (CEO, Director, etc.)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <RequiredLabel>Designation</RequiredLabel>
              <Select value={company.designation_title || ''} onValueChange={(v) => handleChange('designation_title', v)}>
                <SelectTrigger className={errors.contact_person_designation ? 'border-destructive' : ''}><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  {designationTitles.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.contact_person_designation && <p className="text-xs text-destructive">{errors.contact_person_designation}</p>}
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={company.designation_name || ''} onChange={(e) => handleChange('designation_name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={company.designation_email || ''} onChange={(e) => handleChange('designation_email', e.target.value)} placeholder="Email address" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={company.designation_phone || ''} onChange={(e) => handleChange('designation_phone', e.target.value)} placeholder="Phone number" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internship Offering Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Internship Offering Details</CardTitle>
          <CardDescription>General information about internships you offer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mode of Internship</Label>
              <Select value={company.internship_mode || ''} onValueChange={(v) => handleChange('internship_mode', v)}>
                <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  {internshipModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Select value={company.internship_domain || ''} onValueChange={(v) => handleChange('internship_domain', v)}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {internshipDomains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={company.internship_duration || ''} onValueChange={(v) => handleChange('internship_duration', v)}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-month">1 Month</SelectItem>
                  <SelectItem value="2-months">2 Months</SelectItem>
                  <SelectItem value="3-months">3 Months</SelectItem>
                  <SelectItem value="6-months">6 Months</SelectItem>
                  <SelectItem value="1-year">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stipend Offered</Label>
              <Select value={company.stipend_offered || ''} onValueChange={(v) => handleChange('stipend_offered', v)}>
                <SelectTrigger><SelectValue placeholder="Select stipend range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="0-5000">₹0 - ₹5,000/month</SelectItem>
                  <SelectItem value="5000-10000">₹5,000 - ₹10,000/month</SelectItem>
                  <SelectItem value="10000-20000">₹10,000 - ₹20,000/month</SelectItem>
                  <SelectItem value="20000-30000">₹20,000 - ₹30,000/month</SelectItem>
                  <SelectItem value="30000+">₹30,000+/month</SelectItem>
                </SelectContent>
              </Select>
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
              <Input value={certificationInput} onChange={(e) => setCertificationInput(e.target.value)} placeholder="Add certification" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())} />
              <Button type="button" onClick={addCertification} variant="outline">Add</Button>
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
              <Input value={awardInput} onChange={(e) => setAwardInput(e.target.value)} placeholder="Add award" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())} />
              <Button type="button" onClick={addAward} variant="outline">Add</Button>
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
              <Label>Company Profile Document (PDF only)</Label>
              {company.company_profile_url && <a href={company.company_profile_url} target="_blank" className="text-primary underline text-sm block">View uploaded file</a>}
              <Input type="file" accept=".pdf" disabled={uploading === 'company_profile_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'company_profile_url', true)} />
              {uploading === 'company_profile_url' && <span className="text-sm text-muted-foreground">Uploading...</span>}
              <p className="text-xs text-muted-foreground">Max file size: 5MB (PDF only)</p>
            </div>
            <div className="space-y-3">
              <Label>Registration Proof (PDF only)</Label>
              {company.registration_profile_url && <a href={company.registration_profile_url} target="_blank" className="text-primary underline text-sm block">View uploaded file</a>}
              <Input type="file" accept=".pdf" disabled={uploading === 'registration_profile_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'registration_profile_url', true)} />
              {uploading === 'registration_profile_url' && <span className="text-sm text-muted-foreground">Uploading...</span>}
              <p className="text-xs text-muted-foreground">Max file size: 5MB (PDF only)</p>
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
            <div>
              <label htmlFor="terms" className="text-sm cursor-pointer">
                I accept the <a href="#" className="text-primary underline">Terms & Conditions</a> and agree to abide by the platform policies. <span className="text-destructive">*</span>
              </label>
              {errors.terms_accepted && <p className="text-xs text-destructive mt-1">{errors.terms_accepted}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox checked={company.declaration_accepted || false} onCheckedChange={(checked) => handleChange('declaration_accepted', checked)} id="declaration" />
            <div>
              <label htmlFor="declaration" className="text-sm cursor-pointer">
                I declare that all information provided is accurate and complete to the best of my knowledge. <span className="text-destructive">*</span>
              </label>
              {errors.declaration_accepted && <p className="text-xs text-destructive mt-1">{errors.declaration_accepted}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pb-8">
        <Button variant="outline" onClick={fetchCompany}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving} className="gradient-primary border-0">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit for Approval'}
        </Button>
      </div>
    </div>
  );
};
