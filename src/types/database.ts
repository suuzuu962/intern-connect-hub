export type AppRole = 'admin' | 'company' | 'student';
export type InternshipType = 'full_time' | 'part_time' | 'contract';
export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

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
  employee_count: string | null;
  founded_year: number | null;
  is_verified: boolean;
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
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}