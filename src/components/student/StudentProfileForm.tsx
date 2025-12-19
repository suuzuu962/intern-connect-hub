import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Upload, X, User, GraduationCap, MapPin, Link, FileText, CheckCircle } from 'lucide-react';

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java',
  'C++', 'C#', '.NET', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker',
  'Kubernetes', 'Git', 'Machine Learning', 'Data Science', 'UI/UX Design', 'Figma',
  'Adobe XD', 'Communication', 'Problem Solving', 'Team Work', 'Leadership'
];

const DOMAIN_OPTIONS = [
  'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
  'Artificial Intelligence', 'Cloud Computing', 'DevOps', 'Cybersecurity',
  'UI/UX Design', 'Product Management', 'Digital Marketing', 'Content Writing',
  'Finance', 'Human Resources', 'Business Development', 'Research & Development'
];

interface StudentProfileFormProps {
  onSuccess?: () => void;
}

export const StudentProfileForm = ({ onSuccess }: StudentProfileFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Basic Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  // Academic Info
  const [usn, setUsn] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');

  // Location
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  // Social Links
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Additional Info
  const [skills, setSkills] = useState<string[]>([]);
  const [interestedDomains, setInterestedDomains] = useState<string[]>([]);

  // Documents
  const [resumeUrl, setResumeUrl] = useState('');
  const [accuracyConfirmation, setAccuracyConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileData) {
        setFullName(profileData.full_name || '');
        setEmail(profileData.email || '');
        setPhoneNumber(profileData.phone_number || '');
      }

      // Fetch student data
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (studentData) {
        setStudentId(studentData.id);
        setDob(studentData.dob || '');
        setGender(studentData.gender || '');
        setUsn(studentData.usn || '');
        setUniversity(studentData.university || '');
        setDepartment(studentData.department || '');
        setSemester(studentData.semester?.toString() || '');
        setAddress(studentData.address || '');
        setCountry(studentData.country || '');
        setState(studentData.state || '');
        setCity(studentData.city || '');
        setLinkedinUrl(studentData.linkedin_url || '');
        setSkills(studentData.skills || []);
        setInterestedDomains(studentData.interested_domains || []);
        setResumeUrl(studentData.resume_url || '');
        setAccuracyConfirmation(studentData.accuracy_confirmation || false);
        setTermsAccepted(studentData.terms_accepted || false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.includes('pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${user?.id}/resume_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-files')
        .getPublicUrl(fileName);

      setResumeUrl(publicUrl);
      toast.success('Resume uploaded successfully');
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleDomain = (domain: string) => {
    setInterestedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accuracyConfirmation || !termsAccepted) {
      toast.error('Please confirm accuracy and accept terms');
      return;
    }

    // Validate required fields
    if (!usn || !university || !department || !semester) {
      toast.error('Please complete all academic information fields');
      return;
    }

    if (!address || !country || !state || !city) {
      toast.error('Please complete all location fields');
      return;
    }

    if (!resumeUrl) {
      toast.error('Please upload your resume');
      return;
    }

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Update student
      const studentUpdate = {
        dob: dob || null,
        gender: gender || null,
        usn: usn || null,
        university: university || null,
        department: department || null,
        semester: semester ? parseInt(semester) : null,
        address: address || null,
        country: country || null,
        state: state || null,
        city: city || null,
        linkedin_url: linkedinUrl || null,
        skills,
        interested_domains: interestedDomains,
        resume_url: resumeUrl || null,
        accuracy_confirmation: accuracyConfirmation,
        terms_accepted: termsAccepted,
      };

      const { error: studentError } = await supabase
        .from('students')
        .update(studentUpdate)
        .eq('user_id', user?.id);

      if (studentError) throw studentError;

      toast.success('Profile updated successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usn">USN / Roll Number <span className="text-destructive">*</span></Label>
            <Input
              id="usn"
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="university">College / University <span className="text-destructive">*</span></Label>
            <Input
              id="university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department / Branch <span className="text-destructive">*</span></Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester">Semester <span className="text-destructive">*</span></Label>
            <Select value={semester} onValueChange={setSemester} required>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
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
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Skills (Select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <Badge
                  key={skill}
                  variant={skills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  {skills.includes(skill) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Interested Domains</Label>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map((domain) => (
                <Badge
                  key={domain}
                  variant={interestedDomains.includes(domain) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleDomain(domain)}
                >
                  {domain}
                  {interestedDomains.includes(domain) && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
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
          <div className="space-y-2">
            <Label>Resume (PDF, max 5MB) <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={uploading}
                className="max-w-xs"
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  View Resume
                </a>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accuracy"
                checked={accuracyConfirmation}
                onCheckedChange={(checked) => setAccuracyConfirmation(checked as boolean)}
              />
              <Label htmlFor="accuracy" className="text-sm">
                I confirm that all the information provided is accurate and true to the best of my knowledge.
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the Terms & Conditions and Privacy Policy.
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-[150px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Submit Profile'
          )}
        </Button>
      </div>
    </form>
  );
};