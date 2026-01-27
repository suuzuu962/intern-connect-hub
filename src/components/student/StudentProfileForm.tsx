import { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Upload, X, User, GraduationCap, MapPin, Link, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { StudentProfileView } from './StudentProfileView';
import { PhoneInput } from '@/components/ui/phone-input';
import { departmentSkillsMap, getSuggestedSkillsForDepartment, getSuggestedDomainsForDepartment } from '@/lib/department-skills';

const ALL_SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java',
  'C++', 'C#', '.NET', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker',
  'Kubernetes', 'Git', 'Machine Learning', 'Data Science', 'UI/UX Design', 'Figma',
  'Adobe XD', 'Communication', 'Problem Solving', 'Team Work', 'Leadership', 'TensorFlow',
  'PyTorch', 'MATLAB', 'AutoCAD', 'SolidWorks', 'Excel', 'Tally', 'R', 'Statistics',
  'Embedded Systems', 'IoT', 'Linux', 'Networking', 'NLP', 'Computer Vision', 'Deep Learning'
];

const ALL_DOMAIN_OPTIONS = [
  'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
  'Artificial Intelligence', 'Cloud Computing', 'DevOps', 'Cybersecurity',
  'UI/UX Design', 'Product Management', 'Digital Marketing', 'Content Writing',
  'Finance', 'Human Resources', 'Business Development', 'Research & Development',
  'Software Development', 'Operations', 'Research', 'Other'
];

const DEPARTMENT_OPTIONS = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Aeronautical Engineering',
  'Automobile Engineering',
  'Information Technology',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Business Administration',
  'Commerce',
  'Arts',
  'Science',
  'Law',
  'Medicine',
  'Pharmacy',
  'Architecture',
  'Other'
];

const COUNTRY_OPTIONS = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Singapore',
  'United Arab Emirates',
  'Other'
];

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

interface StudentProfileFormProps {
  onSuccess?: () => void;
}

const isProfileComplete = (data: {
  usn: string;
  college: string;
  university: string;
  department: string;
  semester: string;
  address: string;
  country: string;
  state: string;
  city: string;
  resumeUrl: string;
  collegeIdUrl: string;
  termsAccepted: boolean;
  accuracyConfirmation: boolean;
}) => {
  return !!(
    data.usn &&
    data.college &&
    data.university &&
    data.department &&
    data.semester &&
    data.address &&
    data.country &&
    data.state &&
    data.city &&
    data.resumeUrl &&
    data.collegeIdUrl &&
    data.termsAccepted &&
    data.accuracyConfirmation
  );
};


export const StudentProfileForm = ({ onSuccess }: StudentProfileFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCollegeId, setUploadingCollegeId] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);


  // Basic Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  // Academic Info
  const [usn, setUsn] = useState('');
  const [college, setCollege] = useState('');
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
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [redditUrl, setRedditUrl] = useState('');
  const [slackUrl, setSlackUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [otherSocialUrl, setOtherSocialUrl] = useState('');

  // Additional Info
  const [skills, setSkills] = useState<string[]>([]);
  const [interestedDomains, setInterestedDomains] = useState<string[]>([]);

  // Documents
  const [resumeUrl, setResumeUrl] = useState('');
  const [collegeIdUrl, setCollegeIdUrl] = useState('');
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
        setCollege(studentData.college || '');
        setUniversity(studentData.university || '');
        setDepartment(studentData.department || '');
        setSemester(studentData.semester?.toString() || '');
        setAddress(studentData.address || '');
        setCountry(studentData.country || '');
        setState(studentData.state || '');
        setCity(studentData.city || '');
        setLinkedinUrl(studentData.linkedin_url || '');
        setFacebookUrl((studentData as any).facebook_url || '');
        setTwitterUrl((studentData as any).twitter_url || '');
        setGithubUrl(studentData.github_url || '');
        setRedditUrl((studentData as any).reddit_url || '');
        setSlackUrl((studentData as any).slack_url || '');
        setInstagramUrl((studentData as any).instagram_url || '');
        setOtherSocialUrl((studentData as any).other_social_url || '');
        setSkills(studentData.skills || []);
        setInterestedDomains(studentData.interested_domains || []);
        setResumeUrl(studentData.resume_url || '');
        setCollegeIdUrl(studentData.college_id_url || '');
        setAccuracyConfirmation(studentData.accuracy_confirmation || false);
        setTermsAccepted(studentData.terms_accepted || false);

        // Check if profile is complete
        const complete = isProfileComplete({
          usn: studentData.usn || '',
          college: studentData.college || '',
          university: studentData.university || '',
          department: studentData.department || '',
          semester: studentData.semester?.toString() || '',
          address: studentData.address || '',
          country: studentData.country || '',
          state: studentData.state || '',
          city: studentData.city || '',
          resumeUrl: studentData.resume_url || '',
          collegeIdUrl: studentData.college_id_url || '',
          termsAccepted: studentData.terms_accepted || false,
          accuracyConfirmation: studentData.accuracy_confirmation || false,
        });
        setProfileComplete(complete);
        setIsEditMode(!complete);
      } else {
        setIsEditMode(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setIsEditMode(true);
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

  const handleCollegeIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, or PDF files are allowed');
      return;
    }

    setUploadingCollegeId(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user?.id}/college_id_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-files')
        .getPublicUrl(fileName);

      setCollegeIdUrl(publicUrl);
      toast.success('College ID uploaded successfully');
    } catch (error) {
      console.error('Error uploading college ID:', error);
      toast.error('Failed to upload college ID');
    } finally {
      setUploadingCollegeId(false);
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
    if (!usn || !college || !university || !department || !semester) {
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

    if (!collegeIdUrl) {
      toast.error('Please upload your college ID');
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
        college: college || null,
        college_id: null,
        university: university || null,
        department: department || null,
        semester: semester ? parseInt(semester) : null,
        address: address || null,
        country: country || null,
        state: state || null,
        city: city || null,
        linkedin_url: linkedinUrl || null,
        facebook_url: facebookUrl || null,
        twitter_url: twitterUrl || null,
        github_url: githubUrl || null,
        reddit_url: redditUrl || null,
        slack_url: slackUrl || null,
        instagram_url: instagramUrl || null,
        other_social_url: otherSocialUrl || null,
        skills,
        interested_domains: interestedDomains,
        resume_url: resumeUrl || null,
        college_id_url: collegeIdUrl || null,
        accuracy_confirmation: accuracyConfirmation,
        terms_accepted: termsAccepted,
      };

      const { error: studentError } = await supabase
        .from('students')
        .update(studentUpdate)
        .eq('user_id', user?.id);

      if (studentError) throw studentError;

      toast.success('Profile updated successfully');
      setProfileComplete(true);
      setIsEditMode(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Show view mode if profile is complete and not in edit mode
  if (profileComplete && !isEditMode) {
    return (
      <StudentProfileView
        data={{
          fullName,
          email,
          phoneNumber,
          dob,
          gender,
          usn,
          college,
          university,
          department,
          semester,
          address,
          country,
          state,
          city,
          linkedinUrl,
          facebookUrl,
          twitterUrl,
          githubUrl,
          redditUrl,
          slackUrl,
          instagramUrl,
          otherSocialUrl,
          skills,
          interestedDomains,
          resumeUrl,
          collegeIdUrl,
        }}
        onEdit={() => setIsEditMode(true)}
      />
    );
  }

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
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
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
            <Label htmlFor="college">College Name <span className="text-destructive">*</span></Label>
            <Input
              id="college"
              placeholder="Enter your college name"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="university">University <span className="text-destructive">*</span></Label>
            <Input
              id="university"
              placeholder="Enter your university name"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department / Branch <span className="text-destructive">*</span></Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester">Semester <span className="text-destructive">*</span></Label>
            <Select value={semester} onValueChange={setSemester}>
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
            <Select value={country} onValueChange={(value) => { setCountry(value); setState(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
            {country === 'India' ? (
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {INDIA_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="state"
                placeholder="Enter your state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
            <Input
              id="city"
              placeholder="Enter your city"
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              type="url"
              placeholder="https://github.com/yourusername"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input
              id="facebookUrl"
              type="url"
              placeholder="https://facebook.com/yourprofile"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterUrl">Twitter / X URL</Label>
            <Input
              id="twitterUrl"
              type="url"
              placeholder="https://twitter.com/yourusername"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input
              id="instagramUrl"
              type="url"
              placeholder="https://instagram.com/yourusername"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="redditUrl">Reddit URL</Label>
            <Input
              id="redditUrl"
              type="url"
              placeholder="https://reddit.com/user/yourusername"
              value={redditUrl}
              onChange={(e) => setRedditUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slackUrl">Slack URL</Label>
            <Input
              id="slackUrl"
              type="url"
              placeholder="https://yourworkspace.slack.com"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otherSocialUrl">Other Social URL</Label>
            <Input
              id="otherSocialUrl"
              type="url"
              placeholder="https://yourprofile.com"
              value={otherSocialUrl}
              onChange={(e) => setOtherSocialUrl(e.target.value)}
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
            <div className="flex items-center justify-between">
              <Label>Skills (Select all that apply)</Label>
              {department && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggested for {department}
                </span>
              )}
            </div>
            {department && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Recommended skills for your department:</p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedSkillsForDepartment(department).map((skill) => (
                    <Badge
                      key={skill}
                      variant={skills.includes(skill) ? "default" : "secondary"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                      {skills.includes(skill) && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {department && <p className="text-xs text-muted-foreground">Other skills:</p>}
              <div className="flex flex-wrap gap-2">
                {ALL_SKILL_OPTIONS.filter(skill => !department || !getSuggestedSkillsForDepartment(department).includes(skill)).map((skill) => (
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
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Interested Domains</Label>
              {department && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggested for {department}
                </span>
              )}
            </div>
            {department && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Recommended domains for your department:</p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedDomainsForDepartment(department).map((domain) => (
                    <Badge
                      key={domain}
                      variant={interestedDomains.includes(domain) ? "default" : "secondary"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleDomain(domain)}
                    >
                      {domain}
                      {interestedDomains.includes(domain) && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {department && <p className="text-xs text-muted-foreground">Other domains:</p>}
              <div className="flex flex-wrap gap-2">
                {ALL_DOMAIN_OPTIONS.filter(domain => !department || !getSuggestedDomainsForDepartment(department).includes(domain)).map((domain) => (
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

          <div className="space-y-2">
            <Label>College ID (JPG, PNG, or PDF, max 5MB) <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleCollegeIdUpload}
                disabled={uploadingCollegeId}
                className="max-w-xs"
              />
              {uploadingCollegeId && <Loader2 className="h-4 w-4 animate-spin" />}
              {collegeIdUrl && (
                <a
                  href={collegeIdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  View College ID
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