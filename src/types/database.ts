export type AppRole = 'admin' | 'company' | 'student' | 'university' | 'college_coordinator';
export type InternshipType = 'free' | 'paid' | 'stipended';
export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'offer_released' | 'rejected' | 'withdrawn';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  short_description: string | null;
  long_description: string | null;
  about_company: string | null;
  employee_count: string | null;
  founded_year: number | null;
  is_verified: boolean;
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  university: string | null;
  degree: string | null;
  graduation_year: number | null;
  skills: string[] | null;
  resume_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  college_id: string | null;
  usn: string | null;
  department: string | null;
  dob: string | null;
  semester: number | null;
  gender: string | null;
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  college: string | null;
  college_id_url: string | null;
  interested_domains: string[] | null;
  accuracy_confirmation: boolean;
  terms_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Internship {
  id: string;
  company_id: string;
  title: string;
  description: string;
  short_description: string | null;
  domain: string | null;
  skills: string[] | null;
  location: string | null;
  internship_type: InternshipType;
  work_mode: WorkMode;
  duration: string | null;
  stipend: number | null;
  is_paid: boolean;
  fees: number | null;
  start_date: string | null;
  application_deadline: string | null;
  positions_available: number;
  is_active: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Application {
  id: string;
  internship_id: string;
  student_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  resume_url: string | null;
  applied_at: string;
  updated_at: string;
  internship?: Internship;
  student?: Student;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  target_role: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  type: string;
  created_at: string;
}

export interface InternshipDiary {
  id: string;
  student_id: string;
  application_id: string;
  entry_date: string;
  title: string;
  content: string;
  hours_worked: number | null;
  skills_learned: string[] | null;
  is_approved: boolean | null;
  approved_by: string | null;
  approved_at: string | null;
  coordinator_remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface University {
  id: string;
  user_id: string;
  name: string;
  email: string;
  logo_url: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  contact_person_designation: string | null;
  address: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UniversityUser {
  id: string;
  university_id: string;
  user_id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface College {
  id: string;
  university_id: string;
  name: string;
  email: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  contact_person_designation: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  university?: University;
}

export interface CollegeCoordinator {
  id: string;
  user_id: string;
  college_id: string | null;
  university_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  address: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  college?: College;
  university?: University;
}

export interface LoginLog {
  id: string;
  user_id: string;
  user_email: string;
  role: string;
  ip_address: string | null;
  user_agent: string | null;
  login_at: string;
}