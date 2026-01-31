import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Check, X, Building2, Globe, MapPin, ExternalLink, ChevronDown, ChevronUp,
  Mail, Phone, User, Calendar, FileText, Linkedin, Facebook, Twitter, Instagram,
  Award, Shield, Users, Hash, Trash2, Plus, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  is_verified: boolean | null;
  created_at: string;
  logo_url: string | null;
  description: string | null;
  short_description: string | null;
  long_description: string | null;
  about_company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  contact_person_designation: string | null;
  employee_count: string | null;
  founded_year: number | null;
  gst_pan: string | null;
  domain_category: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  cover_image_url: string | null;
  company_profile_url: string | null;
  registration_profile_url: string | null;
  awards: string[] | null;
  certifications: string[] | null;
  terms_accepted: boolean | null;
  declaration_accepted: boolean | null;
  user_id: string;
}

interface VerificationState {
  basicInfo: boolean;
  contactPerson: boolean;
  companyDetails: boolean;
  documents: boolean;
  socialLinks: boolean;
  termsDeclaration: boolean;
}

const initialVerificationState: VerificationState = {
  basicInfo: false,
  contactPerson: false,
  companyDetails: false,
  documents: false,
  socialLinks: false,
  termsDeclaration: false,
};

export const CompanyApprovalManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedCompanies, setCollapsedCompanies] = useState<Set<string>>(new Set());
  const [verificationStates, setVerificationStates] = useState<Record<string, VerificationState>>({});
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    email: '',
    password: '',
    name: '',
    industry: '',
    location: '',
    website: '',
    description: '',
  });

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch companies');
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleApprove = async (companyId: string) => {
    const verification = verificationStates[companyId] || initialVerificationState;
    const allVerified = Object.values(verification).every(v => v);
    
    if (!allVerified) {
      toast.error('Please verify all sections before approving');
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: true })
        .eq('id', companyId);

      if (error) throw error;
      toast.success('Company approved successfully');
      setVerificationStates(prev => {
        const newState = { ...prev };
        delete newState[companyId];
        return newState;
      });
      fetchCompanies();
    } catch (error: any) {
      toast.error('Failed to approve company');
      console.error('Error approving company:', error);
    }
  };

  const handleReject = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: false })
        .eq('id', companyId);

      if (error) throw error;
      toast.success('Company rejected');
      fetchCompanies();
    } catch (error: any) {
      toast.error('Failed to reject company');
      console.error('Error rejecting company:', error);
    }
  };

  const handleDelete = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch (error: any) {
      toast.error('Failed to delete company');
      console.error('Error deleting company:', error);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany.email || !newCompany.password || !newCompany.name) {
      toast.error('Please fill in required fields (Email, Password, Company Name)');
      return;
    }

    setAddingCompany(true);
    try {
      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function to create user without email verification
      const response = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newCompany.email,
          password: newCompany.password,
          fullName: newCompany.name,
          role: 'company',
          additionalData: {
            industry: newCompany.industry || null,
            location: newCompany.location || null,
            website: newCompany.website || null,
            description: newCompany.description || null,
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create company');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      // Update the company to be verified and add additional details
      if (response.data?.userId) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            industry: newCompany.industry || null,
            location: newCompany.location || null,
            website: newCompany.website || null,
            description: newCompany.description || null,
            is_verified: true,
          })
          .eq('user_id', response.data.userId);

        if (updateError) {
          console.error('Error updating company details:', updateError);
        }
      }

      toast.success('Company added successfully (no email verification required)');
      setAddCompanyOpen(false);
      setNewCompany({ email: '', password: '', name: '', industry: '', location: '', website: '', description: '' });
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add company');
      console.error('Error adding company:', error);
    } finally {
      setAddingCompany(false);
    }
  };

  const toggleExpanded = (companyId: string) => {
    setCollapsedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  // Pending companies are expanded by default (not in collapsed set)
  // Approved companies are collapsed by default
  const isCompanyExpanded = (companyId: string, isPending: boolean) => {
    if (isPending) {
      return !collapsedCompanies.has(companyId); // Pending: expanded by default
    }
    return collapsedCompanies.has(companyId); // Approved: collapsed by default (inverted logic)
  };

  const updateVerification = (companyId: string, field: keyof VerificationState, value: boolean) => {
    setVerificationStates(prev => ({
      ...prev,
      [companyId]: {
        ...(prev[companyId] || initialVerificationState),
        [field]: value,
      },
    }));
  };

  const getVerificationState = (companyId: string): VerificationState => {
    return verificationStates[companyId] || initialVerificationState;
  };

  const pendingCompanies = companies.filter(c => c.is_verified === null || c.is_verified === false);
  const approvedCompanies = companies.filter(c => c.is_verified === true);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const VerificationCheckbox = ({ 
    companyId, 
    field, 
    label 
  }: { 
    companyId: string; 
    field: keyof VerificationState; 
    label: string;
  }) => {
    const verification = getVerificationState(companyId);
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${companyId}-${field}`}
          checked={verification[field]}
          onCheckedChange={(checked) => updateVerification(companyId, field, checked as boolean)}
        />
        <label
          htmlFor={`${companyId}-${field}`}
          className={`text-sm font-medium cursor-pointer inline-flex items-center gap-1 ${verification[field] ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {verification[field] && <Check className="h-3 w-3 text-primary" />}
          {label}
        </label>
      </div>
    );
  };

  const DocumentViewer = ({ url, title }: { url: string; title: string }) => {
    const isPdf = url.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm flex items-center gap-1"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {isImage ? (
          <img src={url} alt={title} className="w-full h-48 object-contain bg-background" />
        ) : isPdf ? (
          <iframe src={url} className="w-full h-64" title={title} />
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Document preview not available</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              Download to view
            </a>
          </div>
        )}
      </div>
    );
  };

  const CompanyDetailsCard = ({ company, isPending = false }: { company: Company; isPending?: boolean }) => {
    const isExpanded = isCompanyExpanded(company.id, isPending);
    const verification = getVerificationState(company.id);
    const allVerified = Object.values(verification).every(v => v);
    const fullAddress = [company.address, company.city, company.state, company.postal_code, company.country]
      .filter(Boolean)
      .join(', ');

    return (
      <Card className="mb-4 overflow-hidden">
        {/* Header with basic info */}
        <div className="p-4 bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={company.name} 
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center border">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">{company.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {company.industry && (
                    <Badge variant="secondary">{company.industry}</Badge>
                  )}
                  {company.domain_category && (
                    <Badge variant="outline">{company.domain_category}</Badge>
                  )}
                  {company.is_verified ? (
                    <Badge className="bg-green-600">Verified</Badge>
                  ) : (
                    <Badge variant="destructive">Pending</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {company.short_description || company.description || 'No description'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPending && (
                <Button 
                  size="sm" 
                  onClick={() => handleApprove(company.id)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!allVerified}
                  title={!allVerified ? 'Verify all sections before approving' : 'Approve company'}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}
              <Button 
                size="sm" 
                variant={company.is_verified ? "outline" : "destructive"}
                onClick={() => handleReject(company.id)}
              >
                <X className="h-4 w-4 mr-1" />
                {company.is_verified ? 'Revoke' : 'Reject'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Company</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{company.name}"? This action cannot be undone. 
                      All internships and applications associated with this company will also be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(company.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(company.id)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Verification Progress for pending companies */}
          {isPending && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">
                Verification Progress: {Object.values(verification).filter(v => v).length}/6
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${(Object.values(verification).filter(v => v).length / 6) * 100}%` }}
                />
              </div>

              {/* Make checkboxes visible without expanding */}
              {isPending && !isExpanded && (
                <div className="mt-3 rounded-lg border bg-background/50 p-3">
                  <p className="text-sm font-medium mb-2">Verification checklist</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <VerificationCheckbox companyId={company.id} field="basicInfo" label="Basic information" />
                    <VerificationCheckbox companyId={company.id} field="contactPerson" label="Contact person" />
                    <VerificationCheckbox companyId={company.id} field="companyDetails" label="Company details" />
                    <VerificationCheckbox companyId={company.id} field="documents" label="Documents" />
                    <VerificationCheckbox companyId={company.id} field="socialLinks" label="Social links" />
                    <VerificationCheckbox companyId={company.id} field="termsDeclaration" label="Terms & declaration" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: use the arrow to expand and review full details.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <CardContent className="pt-4">
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid gap-6">
                {/* Cover Image & Logo */}
                <div className="grid md:grid-cols-2 gap-4">
                  {company.logo_url && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-3 py-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Company Logo
                        </span>
                      </div>
                      <img src={company.logo_url} alt="Logo" className="w-full h-40 object-contain bg-background p-4" />
                    </div>
                  )}
                  {company.cover_image_url && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-3 py-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Cover Image
                        </span>
                      </div>
                      <img src={company.cover_image_url} alt="Cover" className="w-full h-40 object-cover" />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Basic Info Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Basic Information
                    </h4>
                    {isPending && (
                      <VerificationCheckbox 
                        companyId={company.id} 
                        field="basicInfo" 
                        label="Verified" 
                      />
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Company Name</p>
                      <p className="font-medium">{company.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Industry</p>
                      <p className="font-medium">{company.industry || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Domain Category</p>
                      <p className="font-medium">{company.domain_category || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Address
                      </p>
                      <p className="font-medium">{fullAddress || company.location || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground">About Company</p>
                      <p className="text-sm">{company.about_company || company.long_description || company.description || '-'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Person Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Contact Person
                    </h4>
                    {isPending && (
                      <VerificationCheckbox 
                        companyId={company.id} 
                        field="contactPerson" 
                        label="Verified" 
                      />
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{company.contact_person_name || '-'}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Designation</p>
                      <p className="font-medium">{company.contact_person_designation || '-'}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </p>
                      <p className="font-medium text-sm break-all">
                        {company.contact_person_email ? (
                          <a href={`mailto:${company.contact_person_email}`} className="text-primary hover:underline">
                            {company.contact_person_email}
                          </a>
                        ) : '-'}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </p>
                      <p className="font-medium">
                        {company.contact_person_phone ? (
                          <a href={`tel:${company.contact_person_phone}`} className="text-primary hover:underline">
                            {company.contact_person_phone}
                          </a>
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Company Details Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Company Details
                    </h4>
                    {isPending && (
                      <VerificationCheckbox 
                        companyId={company.id} 
                        field="companyDetails" 
                        label="Verified" 
                      />
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Founded Year
                      </p>
                      <p className="font-medium">{company.founded_year || '-'}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Employee Count
                      </p>
                      <p className="font-medium">{company.employee_count || '-'}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" /> GST/PAN
                      </p>
                      <p className="font-medium">{company.gst_pan || '-'}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Registered On
                      </p>
                      <p className="font-medium">{new Date(company.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Awards & Certifications */}
                  {((company.awards && company.awards.length > 0) || (company.certifications && company.certifications.length > 0)) && (
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      {company.awards && company.awards.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Award className="h-3 w-3" /> Awards
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {company.awards.map((award, index) => (
                              <Badge key={index} variant="secondary">{award}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {company.certifications && company.certifications.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Certifications
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {company.certifications.map((cert, index) => (
                              <Badge key={index} variant="outline">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Documents Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Uploaded Documents
                    </h4>
                    {isPending && (
                      <VerificationCheckbox 
                        companyId={company.id} 
                        field="documents" 
                        label="Verified" 
                      />
                    )}
                  </div>
                  {company.company_profile_url || company.registration_profile_url ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {company.company_profile_url && (
                        <DocumentViewer url={company.company_profile_url} title="Company Profile Document" />
                      )}
                      {company.registration_profile_url && (
                        <DocumentViewer url={company.registration_profile_url} title="Registration Document" />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
                      No documents uploaded
                    </p>
                  )}
                </div>

                <Separator />

                {/* Social Links Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Links & Social Media
                    </h4>
                    {isPending && (
                      <VerificationCheckbox 
                        companyId={company.id} 
                        field="socialLinks" 
                        label="Verified" 
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {company.website && (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {company.linkedin_url && (
                      <a 
                        href={company.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full text-sm text-blue-700 dark:text-blue-300"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {company.facebook_url && (
                      <a 
                        href={company.facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full text-sm text-blue-700 dark:text-blue-300"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {company.twitter_url && (
                      <a 
                        href={company.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/30 dark:hover:bg-sky-900/50 rounded-full text-sm text-sky-700 dark:text-sky-300"
                      >
                        <Twitter className="h-4 w-4" />
                        Twitter
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {company.instagram_url && (
                      <a 
                        href={company.instagram_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 rounded-full text-sm text-pink-700 dark:text-pink-300"
                      >
                        <Instagram className="h-4 w-4" />
                        Instagram
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {!company.website && !company.linkedin_url && !company.facebook_url && !company.twitter_url && !company.instagram_url && (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">No links provided</p>
                  )}
                </div>

                <Separator />

                {/* Terms & Declaration Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Terms & Declaration
                    </h4>
                    {isPending && (
                      <VerificationCheckbox 
                        companyId={company.id} 
                        field="termsDeclaration" 
                        label="Verified" 
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      {company.terms_accepted ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm">Terms Accepted</span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      {company.declaration_accepted ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm">Declaration Accepted</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Add Company Button */}
      <div className="flex justify-end">
        <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>
                Create a company account with login credentials. Admin-added companies are pre-approved.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  placeholder="company@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newCompany.password}
                  onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                    placeholder="e.g., Technology"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                    placeholder="e.g., New York"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={newCompany.website}
                  onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                  placeholder="Brief description of the company"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCompanyOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCompany} disabled={addingCompany}>
                {addingCompany ? 'Adding...' : 'Add Company'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Pending Company Approvals ({pendingCompanies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCompanies.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending approvals</p>
          ) : (
            <div className="space-y-4">
              {pendingCompanies.map((company) => (
                <CompanyDetailsCard key={company.id} company={company} isPending={true} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Companies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Approved Companies ({approvedCompanies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedCompanies.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No approved companies</p>
          ) : (
            <div className="space-y-4">
              {approvedCompanies.map((company) => (
                <CompanyDetailsCard key={company.id} company={company} isPending={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
