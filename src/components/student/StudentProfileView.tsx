import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, GraduationCap, MapPin, Link, FileText, Edit, CheckCircle, ExternalLink, Home, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  aboutMe?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  usn: string;
  college: string;
  university: string;
  domain: string;
  course: string;
  specialization?: string;
  semester: string;
  yearOfStudy?: string;
  expectedGraduationYear?: string;
  address: string;
  country: string;
  state: string;
  city: string;
  permanentAddress?: string;
  permanentCountry?: string;
  permanentState?: string;
  permanentCity?: string;
  linkedinUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  githubUrl: string;
  redditUrl: string;
  slackUrl: string;
  instagramUrl: string;
  otherSocialUrl: string;
  skills: string[];
  interestedDomains: string[];
  resumeUrl: string;
  collegeIdUrl: string;
}

interface StudentProfileViewProps {
  data: StudentData;
  onEdit: () => void;
}

const formatGender = (gender: string) => {
  switch (gender) {
    case 'male': return 'Male';
    case 'female': return 'Female';
    case 'other': return 'Other';
    case 'prefer_not_to_say': return 'Prefer not to say';
    default: return gender;
  }
};

const formatYearOfStudy = (year: string) => {
  const num = parseInt(year);
  if (num === 1) return '1st Year';
  if (num === 2) return '2nd Year';
  if (num === 3) return '3rd Year';
  return `${num}th Year`;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const isGradientCover = (url?: string) => url?.startsWith('gradient:');
const getGradientClass = (url?: string) => url?.replace('gradient:', '') || '';

export const StudentProfileView = ({ data, onEdit }: StudentProfileViewProps) => {
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

      {/* Basic Info with Cover Image */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div className="relative w-full h-32 sm:h-40">
          {data.coverImageUrl ? (
            isGradientCover(data.coverImageUrl) ? (
              <div className={cn("w-full h-full bg-gradient-to-r", getGradientClass(data.coverImageUrl))} />
            ) : (
              <img
                src={data.coverImageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40" />
          )}
          
          {/* Profile Avatar overlapping cover */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={data.avatarUrl} alt={data.fullName} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(data.fullName) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardHeader className="pt-14 sm:pt-6 sm:pl-36">
          <CardTitle className="flex items-center gap-2 text-center sm:text-left">
            <User className="h-5 w-5 text-primary hidden sm:inline" />
            {data.fullName || 'Basic Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Full Name" value={data.fullName} />
            <InfoItem label="Email" value={data.email} />
            <InfoItem label="Phone Number" value={data.phoneNumber} />
            <InfoItem label="Date of Birth" value={data.dob ? new Date(data.dob).toLocaleDateString() : '-'} />
            <InfoItem label="Gender" value={formatGender(data.gender)} />
          </div>
          {data.aboutMe && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">About Me</p>
              <p className="text-sm whitespace-pre-wrap">{data.aboutMe}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="USN / Roll Number" value={data.usn} />
            <InfoItem label="College" value={data.college} />
            <InfoItem label="University" value={data.university} />
            <InfoItem label="Domain" value={data.domain} />
            <InfoItem label="Course" value={data.course} />
            {data.specialization && (
              <InfoItem label="Specialization" value={data.specialization} />
            )}
            <InfoItem label="Semester" value={data.semester ? `Semester ${data.semester}` : '-'} />
            {data.yearOfStudy && (
              <InfoItem label="Year of Study" value={formatYearOfStudy(data.yearOfStudy)} />
            )}
            {data.expectedGraduationYear && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expected Graduation
                </p>
                <p className="font-medium">{data.expectedGraduationYear}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Current Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InfoItem label="Address" value={data.address} />
            </div>
            <InfoItem label="Country" value={data.country} />
            <InfoItem label="State" value={data.state} />
            <InfoItem label="City" value={data.city} />
          </div>
        </CardContent>
      </Card>

      {/* Permanent Address */}
      {(data.permanentAddress || data.permanentCountry || data.permanentState || data.permanentCity) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Permanent Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InfoItem label="Address" value={data.permanentAddress || '-'} />
              </div>
              <InfoItem label="Country" value={data.permanentCountry || '-'} />
              <InfoItem label="State" value={data.permanentState || '-'} />
              <InfoItem label="City" value={data.permanentCity || '-'} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SocialLinkItem label="LinkedIn" url={data.linkedinUrl} />
            <SocialLinkItem label="GitHub" url={data.githubUrl} />
            <SocialLinkItem label="Facebook" url={data.facebookUrl} />
            <SocialLinkItem label="Twitter / X" url={data.twitterUrl} />
            <SocialLinkItem label="Instagram" url={data.instagramUrl} />
            <SocialLinkItem label="Reddit" url={data.redditUrl} />
            <SocialLinkItem label="Slack" url={data.slackUrl} />
            <SocialLinkItem label="Other" url={data.otherSocialUrl} />
          </div>
        </CardContent>
      </Card>

      {/* Skills & Interests */}
      <Card>
        <CardHeader>
          <CardTitle>Skills & Interests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Skills</p>
            {data.skills && data.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <Badge key={skill} variant="default">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No skills added</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Interested Domains</p>
            {data.interestedDomains && data.interestedDomains.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.interestedDomains.map((domain) => (
                  <Badge key={domain} variant="secondary">
                    {domain}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No interested domains added</p>
            )}
          </div>
        </CardContent>
      </Card>

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
            <p className="text-sm text-muted-foreground mb-1">Resume</p>
            {data.resumeUrl ? (
              <a
                href={data.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View Resume
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-muted-foreground">No resume uploaded</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">College ID</p>
            {data.collegeIdUrl ? (
              <a
                href={data.collegeIdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View College ID
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-muted-foreground">No college ID uploaded</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-medium">{value || '-'}</p>
  </div>
);

const SocialLinkItem = ({ label, url }: { label: string; url: string }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    {url ? (
      <a
        href={url}
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
