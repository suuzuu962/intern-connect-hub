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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Upload, X, User, GraduationCap, MapPin, Link, FileText, CheckCircle, Sparkles, Copy, Calendar } from 'lucide-react';
import { StudentProfileView } from './StudentProfileView';
import { PhoneInput } from '@/components/ui/phone-input';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { CoverImagePicker } from './CoverImagePicker';
import { getSuggestedSkillsForDepartment, getSuggestedDomainsForDepartment } from '@/lib/department-skills';
import { DOMAIN_OPTIONS, getCoursesForDomain, getSpecializationsForCourse } from '@/lib/domain-course-mapping';
import { calculateGraduationYear, getYearOfStudyOptions } from '@/lib/graduation-year-calculator';

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
  domain: string;
  course: string;
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
    data.domain &&
    data.course &&
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
  const [aboutMe, setAboutMe] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // Academic Info
  const [usn, setUsn] = useState('');
  const [college, setCollege] = useState('');
  const [university, setUniversity] = useState('');
  const [domain, setDomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [course, setCourse] = useState('');
  const [customCourse, setCustomCourse] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [semester, setSemester] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');

  // Current Address
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  // Permanent Address
  const [permanentAddress, setPermanentAddress] = useState('');
  const [permanentCountry, setPermanentCountry] = useState('');
  const [permanentState, setPermanentState] = useState('');
  const [permanentCity, setPermanentCity] = useState('');

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

  // Derived course options based on domain
  const courseOptions = getCoursesForDomain(domain);
  const specializationOptions = getSpecializationsForCourse(course);
  const yearOfStudyOptions = getYearOfStudyOptions(course || 'B.Tech');

  // Calculate expected graduation year
  const graduationInfo = useMemo(() => {
    if (course && semester) {
      return calculateGraduationYear(
        course,
        parseInt(semester),
        yearOfStudy ? parseInt(yearOfStudy) : undefined
      );
    }
    return null;
  }, [course, semester, yearOfStudy]);

  // Calculate profile completion percentage
  const profileCompletionInfo = useMemo(() => {
    const fields = [
      { name: 'Full Name', value: fullName, required: true },
      { name: 'Phone Number', value: phoneNumber, required: true },
      { name: 'Date of Birth', value: dob, required: false },
      { name: 'Gender', value: gender, required: false },
      { name: 'Profile Picture', value: avatarUrl, required: false },
      { name: 'Cover Image', value: coverImageUrl, required: false },
      { name: 'About Me', value: aboutMe, required: false },
      { name: 'USN/Roll Number', value: usn, required: true },
      { name: 'College', value: college, required: true },
      { name: 'University', value: university, required: true },
      { name: 'Domain', value: domain === 'Other' ? customDomain : domain, required: true },
      { name: 'Course', value: course === 'Other' ? customCourse : course, required: true },
      { name: 'Specialization', value: specialization, required: false },
      { name: 'Semester', value: semester, required: true },
      { name: 'Year of Study', value: yearOfStudy, required: false },
      { name: 'Address', value: address, required: true },
      { name: 'Country', value: country, required: true },
      { name: 'State', value: state, required: true },
      { name: 'City', value: city, required: true },
      { name: 'Permanent Address', value: permanentAddress, required: true },
      { name: 'Permanent Country', value: permanentCountry, required: true },
      { name: 'Permanent State', value: permanentState, required: true },
      { name: 'Permanent City', value: permanentCity, required: true },
      { name: 'LinkedIn', value: linkedinUrl, required: false },
      { name: 'GitHub', value: githubUrl, required: false },
      { name: 'Skills', value: skills.length > 0 ? 'filled' : '', required: false },
      { name: 'Interested Domains', value: interestedDomains.length > 0 ? 'filled' : '', required: false },
      { name: 'Resume', value: resumeUrl, required: true },
      { name: 'College ID', value: collegeIdUrl, required: true },
    ];

    const filledFields = fields.filter(f => f.value).length;
    const totalFields = fields.length;
    const percentage = Math.round((filledFields / totalFields) * 100);
    
    const missingRequired = fields.filter(f => f.required && !f.value).map(f => f.name);
    const missingOptional = fields.filter(f => !f.required && !f.value).map(f => f.name);

    return {
      percentage,
      filledFields,
      totalFields,
      missingRequired,
      missingOptional,
    };
  }, [
    fullName, phoneNumber, dob, gender, avatarUrl, coverImageUrl, aboutMe,
    usn, college, university, domain, customDomain, course, customCourse,
    specialization, semester, yearOfStudy, address, country, state, city,
    permanentAddress, linkedinUrl, githubUrl, skills, interestedDomains,
    resumeUrl, collegeIdUrl
  ]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  // Reset course when domain changes
  useEffect(() => {
    if (domain !== 'Other') {
      setCustomDomain('');
    }
    setCourse('');
    setCustomCourse('');
    setSpecialization('');
  }, [domain]);

  // Reset specialization when course changes
  useEffect(() => {
    if (course !== 'Other') {
      setCustomCourse('');
    }
    setSpecialization('');
  }, [course]);

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
        setAvatarUrl(profileData.avatar_url || '');
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
        setAboutMe((studentData as any).about_me || '');
        setCoverImageUrl((studentData as any).cover_image_url || '');
        setUsn(studentData.usn || '');
        setCollege(studentData.college || '');
        setUniversity(studentData.university || '');
        setDomain((studentData as any).domain || '');
        setCustomDomain((studentData as any).custom_domain || '');
        setCourse((studentData as any).course || '');
        setCustomCourse((studentData as any).custom_course || '');
        setSpecialization((studentData as any).specialization || '');
        setSemester(studentData.semester?.toString() || '');
        setYearOfStudy((studentData as any).year_of_study?.toString() || '');
        setAddress(studentData.address || '');
        setCountry(studentData.country || '');
        setState(studentData.state || '');
        setCity(studentData.city || '');
        setPermanentAddress((studentData as any).permanent_address || '');
        setPermanentCountry((studentData as any).permanent_country || '');
        setPermanentState((studentData as any).permanent_state || '');
        setPermanentCity((studentData as any).permanent_city || '');
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
          domain: (studentData as any).domain || '',
          course: (studentData as any).course || '',
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
        .from('resume-storage')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Store path for signed URL access
      const storagePath = `resume://${fileName}`;
      setResumeUrl(storagePath);
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
        .from('private-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Store path for private document
      const storagePath = `private://${fileName}`;
      setCollegeIdUrl(storagePath);
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

  const toggleDomain = (domainItem: string) => {
    setInterestedDomains(prev =>
      prev.includes(domainItem)
        ? prev.filter(d => d !== domainItem)
        : [...prev, domainItem]
    );
  };

  const copyCurrentToPermanent = () => {
    setPermanentAddress(address);
    setPermanentCountry(country);
    setPermanentState(state);
    setPermanentCity(city);
    toast.success('Current address copied to permanent address');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accuracyConfirmation || !termsAccepted) {
      toast.error('Please confirm accuracy and accept terms');
      return;
    }

    // Validate required fields
    if (!usn || !college || !university || !domain || !course || !semester) {
      toast.error('Please complete all academic information fields');
      return;
    }

    if (domain === 'Other' && !customDomain) {
      toast.error('Please enter your domain');
      return;
    }

    if (course === 'Other' && !customCourse) {
      toast.error('Please enter your course');
      return;
    }

    if (!address || !country || !state || !city) {
      toast.error('Please complete all current address fields');
      return;
    }

    if (!permanentAddress || !permanentCountry || !permanentState || !permanentCity) {
      toast.error('Please complete all permanent address fields');
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
          avatar_url: avatarUrl || null,
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Update student
      const studentUpdate = {
        dob: dob || null,
        gender: gender || null,
        about_me: aboutMe || null,
        cover_image_url: coverImageUrl || null,
        usn: usn || null,
        college: college || null,
        college_id: null,
        university: university || null,
        domain: domain || null,
        custom_domain: customDomain || null,
        course: course || null,
        custom_course: customCourse || null,
        specialization: specialization || null,
        department: domain === 'Other' ? customDomain : domain, // Keep department for backward compatibility
        semester: semester ? parseInt(semester) : null,
        year_of_study: yearOfStudy ? parseInt(yearOfStudy) : null,
        graduation_year: graduationInfo?.expectedGraduationYear || null,
        address: address || null,
        country: country || null,
        state: state || null,
        city: city || null,
        permanent_address: permanentAddress || null,
        permanent_country: permanentCountry || null,
        permanent_state: permanentState || null,
        permanent_city: permanentCity || null,
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
          aboutMe,
          avatarUrl,
          coverImageUrl,
          usn,
          college,
          university,
          domain: domain === 'Other' ? customDomain : domain,
          course: course === 'Other' ? customCourse : course,
          specialization,
          semester,
          yearOfStudy,
          expectedGraduationYear: graduationInfo?.expectedGraduationYear?.toString() || '',
          address,
          country,
          state,
          city,
          permanentAddress,
          permanentCountry,
          permanentState,
          permanentCity,
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
      {/* Profile Completion Progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                profileCompletionInfo.percentage === 100 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-primary/10 text-primary'
              }`}>
                {profileCompletionInfo.percentage === 100 ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">Profile Completion</h3>
                <p className="text-xs text-muted-foreground">
                  {profileCompletionInfo.filledFields} of {profileCompletionInfo.totalFields} fields completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${
                profileCompletionInfo.percentage === 100 
                  ? 'text-green-500' 
                  : profileCompletionInfo.percentage >= 70 
                    ? 'text-primary' 
                    : 'text-yellow-500'
              }`}>
                {profileCompletionInfo.percentage}%
              </span>
            </div>
          </div>
          <Progress 
            value={profileCompletionInfo.percentage} 
            className={`h-2 ${
              profileCompletionInfo.percentage === 100 
                ? '[&>div]:bg-green-500' 
                : profileCompletionInfo.percentage >= 70 
                  ? '' 
                  : '[&>div]:bg-yellow-500'
            }`}
          />
          {profileCompletionInfo.missingRequired.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-500/10 rounded-md">
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                Required fields missing:
              </p>
              <div className="flex flex-wrap gap-1">
                {profileCompletionInfo.missingRequired.slice(0, 5).map((field) => (
                  <Badge key={field} variant="outline" className="text-xs border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
                    {field}
                  </Badge>
                ))}
                {profileCompletionInfo.missingRequired.length > 5 && (
                  <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
                    +{profileCompletionInfo.missingRequired.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Info with Cover Image */}
      <Card className="overflow-hidden">
        {/* Cover Image Picker */}
        <CoverImagePicker
          currentCoverUrl={coverImageUrl}
          userId={user?.id || ''}
          onCoverChange={setCoverImageUrl}
        />

        <CardHeader className="relative">
          {/* Profile Picture - overlapping cover */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0">
            <ProfilePictureUpload
              currentImageUrl={avatarUrl}
              userId={user?.id || ''}
              onUploadComplete={setAvatarUrl}
              fullName={fullName}
            />
          </div>
          <CardTitle className="flex items-center gap-2 pt-14 sm:pt-0 sm:pl-32">
            <User className="h-5 w-5 text-primary hidden sm:inline" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* About Me */}
          <div className="space-y-2">
            <Label htmlFor="aboutMe">About Me (max 1000 words)</Label>
            <Textarea
              id="aboutMe"
              value={aboutMe}
              onChange={(e) => {
                const words = e.target.value.split(/\s+/).filter(Boolean);
                if (words.length <= 1000) {
                  setAboutMe(e.target.value);
                }
              }}
              placeholder="Tell us about yourself, your interests, goals, and aspirations..."
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              {aboutMe.split(/\s+/).filter(Boolean).length} / 1000 words
            </p>
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
            <Label htmlFor="domain">Domain <span className="text-destructive">*</span></Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                {DOMAIN_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {domain === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="customDomain">Enter Domain <span className="text-destructive">*</span></Label>
              <Input
                id="customDomain"
                placeholder="Enter your domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                required
              />
            </div>
          )}
          {domain && domain !== 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="course">Course <span className="text-destructive">*</span></Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {domain === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="customCourse">Course <span className="text-destructive">*</span></Label>
              <Input
                id="customCourse"
                placeholder="Enter your course"
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                required
              />
            </div>
          )}
          {course === 'Other' && domain !== 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="customCourse">Enter Course <span className="text-destructive">*</span></Label>
              <Input
                id="customCourse"
                placeholder="Enter your course"
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                required
              />
            </div>
          )}
          {course && course !== 'Other' && specializationOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializationOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="semester">Semester <span className="text-destructive">*</span></Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearOfStudy">Year of Study</Label>
            <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearOfStudyOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year === 1 ? '1st Year' : year === 2 ? '2nd Year' : year === 3 ? '3rd Year' : `${year}th Year`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {graduationInfo && (
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Expected Graduation Year
              </Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-lg font-semibold">{graduationInfo.expectedGraduationYear}</span>
                <Badge variant="secondary" className="text-xs">
                  {graduationInfo.remainingYears > 0 
                    ? `${graduationInfo.remainingYears} year${graduationInfo.remainingYears > 1 ? 's' : ''} remaining` 
                    : 'Final Year'}
                </Badge>
              </div>
            </div>
          )}
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

      {/* Permanent Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Permanent Address
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyCurrentToPermanent}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Current Address
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="permanentAddress">Address <span className="text-destructive">*</span></Label>
            <Input
              id="permanentAddress"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="permanentCountry">Country <span className="text-destructive">*</span></Label>
            <Select value={permanentCountry} onValueChange={(value) => { setPermanentCountry(value); setPermanentState(''); }}>
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
            <Label htmlFor="permanentState">State <span className="text-destructive">*</span></Label>
            {permanentCountry === 'India' ? (
              <Select value={permanentState} onValueChange={setPermanentState}>
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
                id="permanentState"
                placeholder="Enter your state"
                value={permanentState}
                onChange={(e) => setPermanentState(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="permanentCity">City <span className="text-destructive">*</span></Label>
            <Input
              id="permanentCity"
              placeholder="Enter your city"
              value={permanentCity}
              onChange={(e) => setPermanentCity(e.target.value)}
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
              {domain && domain !== 'Other' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggested for {domain}
                </span>
              )}
            </div>
            {domain && domain !== 'Other' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Recommended skills for your domain:</p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedSkillsForDepartment(domain).map((skill) => (
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
              {domain && domain !== 'Other' && <p className="text-xs text-muted-foreground">Other skills:</p>}
              <div className="flex flex-wrap gap-2">
                {ALL_SKILL_OPTIONS.filter(skill => !domain || domain === 'Other' || !getSuggestedSkillsForDepartment(domain).includes(skill)).map((skill) => (
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
              {domain && domain !== 'Other' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggested for {domain}
                </span>
              )}
            </div>
            {domain && domain !== 'Other' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Recommended domains for your field:</p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedDomainsForDepartment(domain).map((d) => (
                    <Badge
                      key={d}
                      variant={interestedDomains.includes(d) ? "default" : "secondary"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleDomain(d)}
                    >
                      {d}
                      {interestedDomains.includes(d) && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {domain && domain !== 'Other' && <p className="text-xs text-muted-foreground">Other domains:</p>}
              <div className="flex flex-wrap gap-2">
                {ALL_DOMAIN_OPTIONS.filter(d => !domain || domain === 'Other' || !getSuggestedDomainsForDepartment(domain).includes(d)).map((d) => (
                  <Badge
                    key={d}
                    variant={interestedDomains.includes(d) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleDomain(d)}
                  >
                    {d}
                    {interestedDomains.includes(d) && <X className="h-3 w-3 ml-1" />}
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
