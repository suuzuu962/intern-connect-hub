import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Company, Internship } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InternshipCard } from '@/components/internships/InternshipCard';
import { cn } from '@/lib/utils';
import { Building2, Globe, MapPin, Users, ArrowLeft, CheckCircle } from 'lucide-react';

const avatarColors = [
  'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverImageError, setCoverImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    setCoverImageError(false);
    setLogoError(false);
    
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('is_verified', true)
      .maybeSingle();

    if (!companyError && companyData) {
      setCompany(companyData as Company);
      
      const { data: internshipsData, error: internshipsError } = await supabase
        .from('internships')
        .select('*, company:companies(*)')
        .eq('company_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!internshipsError && internshipsData) {
        setInternships(internshipsData as Internship[]);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <Skeleton className="h-6 w-32 mb-8" />
          <Skeleton className="h-48 rounded-xl mb-6" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-semibold mb-3">Company Not Found</h1>
          <p className="text-[14px] text-muted-foreground mb-6">This company may not be approved yet or doesn't exist.</p>
          <Link to="/companies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl">
        {/* Back Button */}
        <Link to="/companies" className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to Companies
        </Link>

        {/* Cover Image */}
        {company.cover_image_url && !coverImageError && (
          <div className="relative w-full h-40 md:h-56 rounded-xl overflow-hidden mb-6">
            <img
              src={company.cover_image_url}
              alt={`${company.name} cover`}
              className="w-full h-full object-cover"
              onError={() => setCoverImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        )}

        {/* Company Header Card */}
        <Card className="border mb-6">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row items-start gap-4">
              {/* Logo */}
              <div className={cn(
                "h-16 w-16 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-lg border border-border/50 overflow-hidden",
                company.logo_url && !logoError ? 'bg-muted' : getAvatarColor(company.name)
              )}>
                {company.logo_url && !logoError ? (
                  <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" onError={() => setLogoError(true)} />
                ) : (
                  getInitials(company.name)
                )}
              </div>

              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-semibold">{company.name}</h1>
                  {company.is_verified && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>

                {company.industry && (
                  <p className="text-[14px] text-muted-foreground mb-3">{company.industry}</p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
                  {company.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {company.location}
                    </span>
                  )}
                  {company.employee_count && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {company.employee_count} employees
                    </span>
                  )}
                </div>

                {/* Website Link */}
                {company.website && (
                  <div className="mt-3">
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Company */}
        {(company.about_company || company.description || company.long_description) && (
          <Card className="border mb-6">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-[15px] font-semibold">About Company</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {company.about_company || company.long_description || company.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Location Section */}
        {(company.address || company.state || company.postal_code) && (
          <Card className="border mb-6">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {company.address && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                    <p className="text-[13px] font-medium">{company.address}</p>
                  </div>
                )}
                {company.state && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">State</p>
                    <p className="text-[13px] font-medium">{company.state}</p>
                  </div>
                )}
                {company.postal_code && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Pincode</p>
                    <p className="text-[13px] font-medium">{company.postal_code}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Internships */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-[17px] font-semibold">Active Internships</h2>
            <Badge variant="secondary" className="text-xs rounded-md px-2 py-0.5 bg-primary/10 text-primary border-0">
              {internships.length}
            </Badge>
          </div>

          {internships.length === 0 ? (
            <Card className="border">
              <CardContent className="py-10 text-center text-[13px] text-muted-foreground">
                No active internships at this time.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {internships.map((internship) => (
                <InternshipCard key={internship.id} internship={internship} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDetails;
