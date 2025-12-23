import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, GraduationCap, MapPin, Link, FileText, Edit, CheckCircle, ExternalLink } from 'lucide-react';

interface StudentData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  usn: string;
  college: string;
  university: string;
  department: string;
  semester: string;
  address: string;
  country: string;
  state: string;
  city: string;
  linkedinUrl: string;
  skills: string[];
  interestedDomains: string[];
  resumeUrl: string;
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

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Full Name" value={data.fullName} />
            <InfoItem label="Email" value={data.email} />
            <InfoItem label="Phone Number" value={data.phoneNumber} />
            <InfoItem label="Date of Birth" value={data.dob ? new Date(data.dob).toLocaleDateString() : '-'} />
            <InfoItem label="Gender" value={formatGender(data.gender)} />
          </div>
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
            <InfoItem label="Department / Branch" value={data.department} />
            <InfoItem label="Semester" value={data.semester ? `Semester ${data.semester}` : '-'} />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location
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

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.linkedinUrl ? (
            <a
              href={data.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              LinkedIn Profile
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-muted-foreground">No LinkedIn profile added</p>
          )}
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
        <CardContent>
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
