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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Building2, Globe, MapPin, User, Award, FileText, Loader2, Briefcase, X, ImageIcon, Camera, Pencil, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PhoneInput } from '@/components/ui/phone-input';
import { getSuggestedSkills } from '@/lib/domain-skills';
import { CompanyProfileView } from './CompanyProfileView';

const domainCategories = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Media & Entertainment', 'Consulting',
  'E-commerce', 'Logistics', 'Agriculture', 'Energy', 'Hospitality',
  'Legal', 'Non-Profit', 'Government', 'Telecommunications', 'Other'
];

const internshipModes = ['Remote', 'On-site', 'Hybrid'];

const internshipDurations = ['1 Month', '2 Months', '3 Months', '6 Months', '1 Year'];

const internshipDomainOptions = ['Management', 'Engineering', 'Arts & Science', 'Law'];

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
  internship_modes: string[] | null;
  internship_domain: string | null;
  internship_durations: string[] | null;
  internship_domains: string[] | null;
  custom_domains: string[] | null;
  internship_skills: string[] | null;
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
  const [skillInput, setSkillInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalCompany, setOriginalCompany] = useState<CompanyData | null>(null);

  // Get suggested skills based on selected domains
  const selectedDomains = company?.internship_domains || [];
  const customDomains = company?.custom_domains || [];
  const allDomains = [...selectedDomains, ...customDomains];
  const suggestedSkills = getSuggestedSkills(allDomains);
  const selectedSkills = company?.internship_skills || [];
  const selectedModes = company?.internship_modes || [];
  const selectedDurations = company?.internship_durations || [];

  useEffect(() => {
    if (user) fetchCompany();
  }, [user]);

  const fetchCompany = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      // Handle both old and new column names for backwards compatibility
      const companyData = data as any;
      const parsed = {
        ...companyData,
        internship_domains: companyData.internship_domains || [],
        custom_domains: companyData.custom_domains || [],
        internship_skills: companyData.internship_skills || [],
        internship_modes: companyData.internship_modes || [],
        internship_durations: companyData.internship_durations || [],
      } as CompanyData;
      setCompany(parsed);
      setOriginalCompany(parsed);
    } else if (error?.code === 'PGRST116') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          user_id: user?.id,
          name: profile?.full_name || 'My Company'
        })
        .select()
        .single();

      if (newCompany) {
        setCompany({
          ...newCompany,
          internship_domains: [],
          custom_domains: [],
          internship_skills: [],
          internship_modes: [],
          internship_durations: [],
        } as CompanyData);
        toast.info('Company profile created. Please fill in the required details.');
      } else if (createError) {
        console.error('Error creating company:', createError);
        toast.error('Failed to create company profile. Please try again.');
      }
    }
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
    const maxSize = 5 * 1024 * 1024;
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

  const toggleDomain = (domain: string) => {
    const current = company?.internship_domains || [];
    if (current.includes(domain)) {
      handleChange('internship_domains', current.filter(d => d !== domain));
    } else {
      handleChange('internship_domains', [...current, domain]);
    }
  };

  const toggleSkill = (skill: string) => {
    const current = company?.internship_skills || [];
    if (current.includes(skill)) {
      handleChange('internship_skills', current.filter(s => s !== skill));
    } else {
      handleChange('internship_skills', [...current, skill]);
    }
  };

  const addCustomSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      handleChange('internship_skills', [...selectedSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const toggleMode = (mode: string) => {
    const current = company?.internship_modes || [];
    if (current.includes(mode)) {
      handleChange('internship_modes', current.filter(m => m !== mode));
    } else {
      handleChange('internship_modes', [...current, mode]);
    }
  };

  const toggleDuration = (duration: string) => {
    const current = company?.internship_durations || [];
    if (current.includes(duration)) {
      handleChange('internship_durations', current.filter(d => d !== duration));
    } else {
      handleChange('internship_durations', [...current, duration]);
    }
  };

  const addCustomDomain = () => {
    if (customDomainInput.trim() && !customDomains.includes(customDomainInput.trim())) {
      handleChange('custom_domains', [...customDomains, customDomainInput.trim()]);
      setCustomDomainInput('');
    }
  };

  const removeCustomDomain = (domain: string) => {
    handleChange('custom_domains', customDomains.filter(d => d !== domain));
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
    if (!company?.company_profile_url) newErrors.company_profile_url = 'Company profile document is required';
    if (!company?.registration_profile_url) newErrors.registration_profile_url = 'Registration proof document is required';
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

    // Determine if only image fields changed — skip re-verification in that case
    const imageOnlyFields = ['logo_url', 'cover_image_url'];
    const nonImageFieldChanged = originalCompany ? Object.keys(company).some(key => {
      if (imageOnlyFields.includes(key)) return false;
      if (key === 'id' || key === 'user_id' || key === 'created_at' || key === 'updated_at' || key === 'is_verified') return false;
      return JSON.stringify((company as any)[key]) !== JSON.stringify((originalCompany as any)[key]);
    }) : true;

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
        internship_modes: company.internship_modes || [],
        internship_domain: company.internship_domain,
        internship_durations: company.internship_durations || [],
        internship_domains: company.internship_domains || [],
        custom_domains: company.custom_domains || [],
        internship_skills: company.internship_skills || [],
        certifications: company.certifications,
        awards: company.awards,
        company_profile_url: company.company_profile_url,
        registration_profile_url: company.registration_profile_url,
        terms_accepted: company.terms_accepted,
        declaration_accepted: company.declaration_accepted,
        ...(nonImageFieldChanged ? { is_verified: false } : {}),
      })
      .eq('id', company.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to save profile');
    } else {
      setOriginalCompany(company);
      if (nonImageFieldChanged) {
        toast.success('Profile submitted for approval');
      } else {
        toast.success('Profile updated successfully');
      }
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

  if (!isEditing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <CompanyProfileView data={company} onEdit={() => setIsEditing(true)} />
      </div>
    );
  }

   return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Company Profile</h1>
            <p className="text-muted-foreground">Complete your company profile to get verified and start posting internships</p>
          </div>
        </div>
      </div>

      {/* Cover Image & Logo at Top */}
      <Card className="overflow-hidden">
        <div className="space-y-0">
          {/* Cover Image */}
          <div className="relative w-full" style={{ aspectRatio: '1130/200' }}>
            <div className="relative w-full h-full overflow-hidden bg-muted/30">
              {company.cover_image_url ? (
                <>
                  <img 
                    src={company.cover_image_url} 
                    alt="Cover Image" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <label className="absolute bottom-3 right-3 cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      disabled={uploading === 'cover_image_url'} 
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover_image_url')} 
                    />
                    <div className="flex items-center gap-2 bg-background/90 hover:bg-background text-foreground px-3 py-2 rounded-lg shadow-md transition-colors">
                      {uploading === 'cover_image_url' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">Edit Cover</span>
                    </div>
                  </label>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed rounded-t-lg">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    disabled={uploading === 'cover_image_url'} 
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover_image_url')} 
                  />
                  {uploading === 'cover_image_url' ? (
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Click to upload cover image</p>
                      <p className="text-xs text-muted-foreground">1130 × 200 px recommended</p>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Logo overlapping cover - outside overflow-hidden */}
            <div className="absolute -bottom-12 left-6 z-10">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-background shadow-lg bg-background flex items-center justify-center overflow-hidden">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt="Company Logo" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    disabled={uploading === 'logo_url'} 
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo_url')} 
                  />
                  <div className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-colors">
                    {uploading === 'logo_url' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : company.logo_url ? (
                      <Pencil className="h-3.5 w-3.5" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div className="pt-14 px-6 pb-2">
            <p className="text-sm text-muted-foreground">{company.logo_url ? 'Click the icon to change logo' : 'Click the icon to upload logo'}</p>
            {company.logo_url && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive h-auto p-0 mt-1"
                onClick={() => handleChange('logo_url', null)}
              >
                Remove logo
              </Button>
            )}
          </div>
        </div>
      </Card>

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

      {/* Media & Branding section removed - logo/cover now at top */}

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2 md:col-span-2">
              <RequiredLabel>Phone</RequiredLabel>
              <PhoneInput 
                value={company.contact_person_phone || ''} 
                onChange={(v) => handleChange('contact_person_phone', v)} 
                error={!!errors.contact_person_phone}
              />
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
              <Select value={company.contact_person_designation || ''} onValueChange={(v) => handleChange('contact_person_designation', v)}>
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
              <PhoneInput 
                value={company.designation_phone || ''} 
                onChange={(v) => handleChange('designation_phone', v)} 
              />
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
        <CardContent className="space-y-6">
          {/* Mode of Internship - Multi Select */}
          <div className="space-y-3">
            <Label>Mode of Internship (select multiple)</Label>
            <div className="flex flex-wrap gap-2">
              {internshipModes.map(mode => (
                <Badge
                  key={mode}
                  variant={selectedModes.includes(mode) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${selectedModes.includes(mode) ? 'bg-primary' : 'hover:bg-muted'}`}
                  onClick={() => toggleMode(mode)}
                >
                  {mode}
                  {selectedModes.includes(mode) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Duration - Multi Select */}
          <div className="space-y-3">
            <Label>Duration (select multiple)</Label>
            <div className="flex flex-wrap gap-2">
              {internshipDurations.map(duration => (
                <Badge
                  key={duration}
                  variant={selectedDurations.includes(duration) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${selectedDurations.includes(duration) ? 'bg-primary' : 'hover:bg-muted'}`}
                  onClick={() => toggleDuration(duration)}
                >
                  {duration}
                  {selectedDurations.includes(duration) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Multi-select Domains */}
          <div className="space-y-3">
            <Label>Internship Domains (select multiple)</Label>
            <div className="flex flex-wrap gap-2">
              {internshipDomainOptions.map(domain => (
                <Badge
                  key={domain}
                  variant={selectedDomains.includes(domain) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${selectedDomains.includes(domain) ? 'bg-primary' : 'hover:bg-muted'}`}
                  onClick={() => toggleDomain(domain)}
                >
                  {domain}
                  {selectedDomains.includes(domain) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>

            {/* Custom Domains - Other */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm text-muted-foreground">Add Other Domains</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter custom domain" 
                  value={customDomainInput} 
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomDomain())}
                />
                <Button type="button" variant="outline" onClick={addCustomDomain} className="gap-1">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              {customDomains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customDomains.map(domain => (
                    <Badge key={domain} variant="secondary" className="gap-1">
                      {domain}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeCustomDomain(domain)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Skills based on selected domains */}
          <div className="space-y-3">
            <Label>Skills (based on selected domains)</Label>
            {allDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground">Select domains above to see suggested skills</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Click to add/remove skills</p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {suggestedSkills.map(skill => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${selectedSkills.includes(skill) ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-muted'}`}
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                      {selectedSkills.includes(skill) && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {/* Selected skills display */}
            {selectedSkills.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Selected Skills ({selectedSkills.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map(skill => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSkill(skill)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add custom skill */}
            <div className="flex gap-2">
              <Input 
                placeholder="Add custom skill" 
                value={skillInput} 
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
              />
              <Button type="button" variant="outline" onClick={addCustomSkill}>Add</Button>
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
              <Input placeholder="Add certification" value={certificationInput} onChange={(e) => setCertificationInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())} />
              <Button type="button" variant="outline" onClick={addCertification}>Add</Button>
            </div>
            {company.certifications && company.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {company.certifications.map((cert, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {cert}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeCertification(i)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Awards & Recognitions</Label>
            <div className="flex gap-2">
              <Input placeholder="Add award" value={awardInput} onChange={(e) => setAwardInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())} />
              <Button type="button" variant="outline" onClick={addAward}>Add</Button>
            </div>
            {company.awards && company.awards.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {company.awards.map((award, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {award}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeAward(i)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Required Documents</CardTitle>
          <CardDescription>Upload company documents (PDF only, max 5MB each)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <RequiredLabel>Company Profile PDF</RequiredLabel>
              {company.company_profile_url && (
                <a href={company.company_profile_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">View uploaded document</a>
              )}
              <Input type="file" accept=".pdf" disabled={uploading === 'company_profile_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'company_profile_url', true)} className={errors.company_profile_url ? 'border-destructive' : ''} />
              {uploading === 'company_profile_url' && <span className="text-sm text-muted-foreground">Uploading...</span>}
              {errors.company_profile_url && <p className="text-xs text-destructive">{errors.company_profile_url}</p>}
            </div>
            <div className="space-y-3">
              <RequiredLabel>Registration Proof PDF</RequiredLabel>
              {company.registration_profile_url && (
                <a href={company.registration_profile_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">View uploaded document</a>
              )}
              <Input type="file" accept=".pdf" disabled={uploading === 'registration_profile_url'} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'registration_profile_url', true)} className={errors.registration_profile_url ? 'border-destructive' : ''} />
              {uploading === 'registration_profile_url' && <span className="text-sm text-muted-foreground">Uploading...</span>}
              {errors.registration_profile_url && <p className="text-xs text-destructive">{errors.registration_profile_url}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration */}
      <Card>
        <CardHeader>
          <CardTitle>Declaration & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox id="terms" checked={company.terms_accepted || false} onCheckedChange={(checked) => handleChange('terms_accepted', checked)} className={errors.terms_accepted ? 'border-destructive' : ''} />
            <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I accept the Terms & Conditions and Privacy Policy of the platform. I understand that my company profile will be reviewed before approval.
            </label>
          </div>
          {errors.terms_accepted && <p className="text-xs text-destructive">{errors.terms_accepted}</p>}

          <div className="flex items-start gap-3">
            <Checkbox id="declaration" checked={company.declaration_accepted || false} onCheckedChange={(checked) => handleChange('declaration_accepted', checked)} className={errors.declaration_accepted ? 'border-destructive' : ''} />
            <label htmlFor="declaration" className="text-sm leading-relaxed cursor-pointer">
              I declare that all the information provided above is true and accurate to the best of my knowledge. I understand that providing false information may result in account suspension.
            </label>
          </div>
          {errors.declaration_accepted && <p className="text-xs text-destructive">{errors.declaration_accepted}</p>}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" disabled={saving} onClick={() => setIsEditing(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving} className="gradient-primary border-0">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
};
