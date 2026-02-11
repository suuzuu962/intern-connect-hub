import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, MapPin, User, Award, FileText, Edit, CheckCircle, ExternalLink, Briefcase, Calendar } from 'lucide-react';

interface CompanyData {
  name: string;
  domain_category: string | null;
  founded_year: number | null;
  gst_pan: string | null;
  employee_count: string | null;
  short_description: string | null;
  long_description: string | null;
  about_company: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  website: string | null;
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
  internship_durations: string[] | null;
  internship_domains: string[] | null;
  custom_domains: string[] | null;
  internship_skills: string[] | null;
  certifications: string[] | null;
  awards: string[] | null;
  company_profile_url: string | null;
  registration_profile_url: string | null;
  is_verified?: boolean | null;
}

interface CompanyProfileViewProps {
  data: CompanyData;
  onEdit: () => void;
}

export const CompanyProfileView = ({ data, onEdit }: CompanyProfileViewProps) => {
  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-muted-foreground">Profile Submitted</span>
        </div>
        <Button onClick={onEdit} variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Basic Info with Cover Image & Logo */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div className="relative w-full h-32 sm:h-40">
          {data.cover_image_url ? (
            <img
              src={data.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40" />
          )}

          {/* Logo overlapping cover */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0">
            <div className="h-24 w-24 rounded-xl border-4 border-background shadow-lg bg-background flex items-center justify-center overflow-hidden">
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt={data.name}
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <CardHeader className="pt-14 sm:pt-6 sm:pl-36">
          <CardTitle className="flex items-center gap-2 text-center sm:text-left">
            <Building2 className="h-5 w-5 text-primary hidden sm:inline" />
            {data.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Company Name" value={data.name} />
            <InfoItem label="Domain Category" value={data.domain_category} />
            <InfoItem label="Year Founded" value={data.founded_year?.toString()} />
            <InfoItem label="GST/PAN Number" value={data.gst_pan} />
            <InfoItem label="Employees" value={data.employee_count} />
          </div>
          {data.about_company && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">About Company</p>
              <p className="text-sm whitespace-pre-wrap">{data.about_company}</p>
            </div>
          )}
          {data.short_description && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Short Description</p>
              <p className="text-sm whitespace-pre-wrap">{data.short_description}</p>
            </div>
          )}
          {data.long_description && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Long Description</p>
              <p className="text-sm whitespace-pre-wrap">{data.long_description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      {(data.address || data.country || data.state || data.city || data.postal_code) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.address && (
                <div className="md:col-span-2">
                  <InfoItem label="Address" value={data.address} />
                </div>
              )}
              <InfoItem label="Country" value={data.country} />
              <InfoItem label="State" value={data.state} />
              <InfoItem label="City" value={data.city} />
              <InfoItem label="Postal Code" value={data.postal_code} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Person */}
      {(data.contact_person_name || data.contact_person_email || data.contact_person_phone) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Contact Person
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Name" value={data.contact_person_name} />
              <InfoItem label="Email" value={data.contact_person_email} />
              <InfoItem label="Phone" value={data.contact_person_phone} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Designation Info */}
      {(data.contact_person_designation || data.designation_name || data.designation_email) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Designation Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Designation" value={data.contact_person_designation} />
              <InfoItem label="Name" value={data.designation_name} />
              <InfoItem label="Email" value={data.designation_email} />
              <InfoItem label="Phone" value={data.designation_phone} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Website & Social Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SocialLinkItem label="Website" url={data.website} />
            <SocialLinkItem label="LinkedIn" url={data.linkedin_url} />
            <SocialLinkItem label="Facebook" url={data.facebook_url} />
            <SocialLinkItem label="Twitter / X" url={data.twitter_url} />
            <SocialLinkItem label="Instagram" url={data.instagram_url} />
          </div>
        </CardContent>
      </Card>

      {/* Internship Offering Details */}
      {((data.internship_modes && data.internship_modes.length > 0) ||
        (data.internship_durations && data.internship_durations.length > 0) ||
        (data.internship_domains && data.internship_domains.length > 0) ||
        (data.internship_skills && data.internship_skills.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Internship Offering Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.internship_modes && data.internship_modes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Modes of Internship</p>
                <div className="flex flex-wrap gap-2">
                  {data.internship_modes.map((mode) => (
                    <Badge key={mode} variant="default">{mode}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.internship_durations && data.internship_durations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Durations</p>
                <div className="flex flex-wrap gap-2">
                  {data.internship_durations.map((d) => (
                    <Badge key={d} variant="default">{d}</Badge>
                  ))}
                </div>
              </div>
            )}
            {((data.internship_domains && data.internship_domains.length > 0) || (data.custom_domains && data.custom_domains.length > 0)) && (
              <div>
                <p className="text-sm font-medium mb-2">Domains</p>
                <div className="flex flex-wrap gap-2">
                  {data.internship_domains?.map((d) => (
                    <Badge key={d} variant="secondary">{d}</Badge>
                  ))}
                  {data.custom_domains?.map((d) => (
                    <Badge key={d} variant="outline">{d}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.internship_skills && data.internship_skills.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {data.internship_skills.map((skill) => (
                    <Badge key={skill} variant="default">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Credentials */}
      {((data.certifications && data.certifications.length > 0) || (data.awards && data.awards.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Company Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.certifications && data.certifications.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {data.certifications.map((cert, i) => (
                    <Badge key={i} variant="secondary">{cert}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.awards && data.awards.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Awards & Recognitions</p>
                <div className="flex flex-wrap gap-2">
                  {data.awards.map((award, i) => (
                    <Badge key={i} variant="secondary">{award}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Company Profile PDF</p>
            {data.company_profile_url ? (
              <a href={data.company_profile_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Document
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-muted-foreground">No document uploaded</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Registration Proof PDF</p>
            {data.registration_profile_url ? (
              <a href={data.registration_profile_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Document
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-muted-foreground">No document uploaded</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-medium">{value || '-'}</p>
  </div>
);

const SocialLinkItem = ({ label, url }: { label: string; url: string | null | undefined }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    {url ? (
      <a
        href={url.startsWith('http') ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline flex items-center gap-1 font-medium"
      >
        View Profile
        <ExternalLink className="h-4 w-4" />
      </a>
    ) : (
      <p className="text-muted-foreground">-</p>
    )}
  </div>
);
