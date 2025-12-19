import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, X, Building2, Globe, MapPin, ExternalLink, ChevronDown, ChevronUp,
  Mail, Phone, User, Calendar, FileText, Linkedin, Facebook, Twitter, Instagram,
  Award, Shield, Users, Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

export const CompanyApprovalManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);

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
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: true })
        .eq('id', companyId);

      if (error) throw error;
      toast.success('Company approved successfully');
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

  const toggleExpanded = (companyId: string) => {
    setExpandedCompanyId(expandedCompanyId === companyId ? null : companyId);
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

  const CompanyDetailsCard = ({ company, showActions = true }: { company: Company; showActions?: boolean }) => {
    const isExpanded = expandedCompanyId === company.id;
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
              {showActions && (
                <>
                  {!company.is_verified && (
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(company.id)}
                      className="bg-green-600 hover:bg-green-700"
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
                </>
              )}
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
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <CardContent className="pt-4">
            <ScrollArea className="max-h-[600px]">
              <div className="grid gap-6">
                {/* Cover Image */}
                {company.cover_image_url && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Cover Image</h4>
                    <img 
                      src={company.cover_image_url} 
                      alt="Company cover" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}

                {/* About Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      About Company
                    </h4>
                    <p className="text-sm">
                      {company.about_company || company.long_description || company.description || 'No description provided'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </h4>
                    <p className="text-sm">{fullAddress || company.location || 'Not provided'}</p>
                  </div>
                </div>

                <Separator />

                {/* Contact Person */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Person
                  </h4>
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

                {/* Company Details */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Company Details
                  </h4>
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
                </div>

                <Separator />

                {/* Links */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Links & Social Media
                  </h4>
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
                    <p className="text-sm text-muted-foreground">No links provided</p>
                  )}
                </div>

                {/* Documents */}
                {(company.company_profile_url || company.registration_profile_url) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {company.company_profile_url && (
                          <a 
                            href={company.company_profile_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm"
                          >
                            <FileText className="h-4 w-4" />
                            Company Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {company.registration_profile_url && (
                          <a 
                            href={company.registration_profile_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm"
                          >
                            <FileText className="h-4 w-4" />
                            Registration Document
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Awards & Certifications */}
                {((company.awards && company.awards.length > 0) || (company.certifications && company.certifications.length > 0)) && (
                  <>
                    <Separator />
                    <div className="grid md:grid-cols-2 gap-6">
                      {company.awards && company.awards.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Awards
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {company.awards.map((award, index) => (
                              <Badge key={index} variant="secondary">{award}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {company.certifications && company.certifications.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Certifications
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {company.certifications.map((cert, index) => (
                              <Badge key={index} variant="outline">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Terms & Declaration */}
                <Separator />
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    {company.terms_accepted ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm">Terms Accepted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.declaration_accepted ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm">Declaration Accepted</span>
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
                <CompanyDetailsCard key={company.id} company={company} />
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
                <CompanyDetailsCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
