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
import { Building2, Globe, MapPin, Users, ArrowLeft, CheckCircle } from 'lucide-react';

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    
    // Fetch company details
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('is_verified', true)
      .single();

    if (!companyError && companyData) {
      setCompany(companyData as Company);
      
      // Fetch company internships
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
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 rounded-xl mb-8" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Company Not Found</h1>
          <p className="text-muted-foreground mb-6">This company may not be approved yet or doesn't exist.</p>
          <Link to="/companies">
            <Button variant="outline">
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
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link to="/companies" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Companies
        </Link>

        {/* Company Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Logo */}
              <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              {/* Company Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-heading font-bold">{company.name}</h1>
                  {company.is_verified && (
                    <CheckCircle className="h-6 w-6 text-primary" />
                  )}
                </div>

                {company.industry && (
                  <p className="text-lg text-muted-foreground mb-4">{company.industry}</p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  {company.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {company.location}
                    </span>
                  )}
                  {company.employee_count && (
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {company.employee_count} employees
                    </span>
                  )}
                </div>

                {/* Website Link */}
                {company.website && (
                  <div className="mt-4">
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-5 w-5" />
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
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About Company</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {company.about_company || company.long_description || company.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Location Section */}
        {(company.address || company.state || company.postal_code) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {company.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                    <p className="text-foreground">{company.address}</p>
                  </div>
                )}
                {company.state && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">State</p>
                    <p className="text-foreground">{company.state}</p>
                  </div>
                )}
                {company.postal_code && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pincode</p>
                    <p className="text-foreground">{company.postal_code}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Internships */}
        <div>
          <h2 className="text-2xl font-heading font-bold mb-6">
            Active Internships
            <Badge variant="secondary" className="ml-3">
              {internships.length}
            </Badge>
          </h2>

          {internships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active internships at this time.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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