// Domain options for student profile
export const DOMAIN_OPTIONS = [
  'Management',
  'Engineering',
  'Arts & Science',
  'Law',
  'Other'
] as const;

export type DomainType = typeof DOMAIN_OPTIONS[number];

// Course options based on domain
export const DOMAIN_COURSES: Record<string, string[]> = {
  'Management': [
    'B.Com',
    'BBA',
    'M.Com',
    'BHM',
    'PGDM',
    'E-MBA',
    'MBA (1st Year)',
    'MBA (2nd Year)',
    'Other'
  ],
  'Engineering': [
    'B.Tech',
    'M.Tech',
    'BCA',
    'MCA',
    'MLM',
    'Diploma in Engineering',
    'Other'
  ],
  'Arts & Science': [
    'B.Sc',
    'M.Sc',
    'BA',
    'MA',
    'B.Arch',
    'M.Arch',
    'Other'
  ],
  'Law': [
    'LLB',
    'LLM',
    'Other'
  ],
  'Other': []
};

// Specialization options based on course
export const COURSE_SPECIALIZATIONS: Record<string, string[]> = {
  // Management courses
  'B.Com': ['Accounting', 'Finance', 'Taxation', 'Banking', 'E-Commerce', 'Computer Applications', 'Other'],
  'BBA': ['Finance', 'Marketing', 'Human Resources', 'International Business', 'Operations', 'Entrepreneurship', 'Other'],
  'M.Com': ['Accounting', 'Finance', 'Taxation', 'Banking', 'Business Analytics', 'Other'],
  'BHM': ['Hotel Management', 'Hospitality Management', 'Culinary Arts', 'Event Management', 'Other'],
  'PGDM': ['Marketing', 'Finance', 'Human Resources', 'Operations', 'Business Analytics', 'Digital Marketing', 'Other'],
  'E-MBA': ['General Management', 'Finance', 'Marketing', 'Operations', 'Human Resources', 'Other'],
  'MBA (1st Year)': ['Marketing', 'Finance', 'Human Resources', 'Operations', 'International Business', 'Business Analytics', 'Information Technology', 'Healthcare Management', 'Other'],
  'MBA (2nd Year)': ['Marketing', 'Finance', 'Human Resources', 'Operations', 'International Business', 'Business Analytics', 'Information Technology', 'Healthcare Management', 'Other'],
  
  // Engineering courses
  'B.Tech': [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Aerospace Engineering',
    'Automobile Engineering',
    'Artificial Intelligence & ML',
    'Data Science',
    'Cyber Security',
    'Other'
  ],
  'M.Tech': [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Aerospace Engineering',
    'VLSI Design',
    'Power Systems',
    'Structural Engineering',
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Other'
  ],
  'BCA': ['General', 'Cloud Computing', 'Data Science', 'Cyber Security', 'Web Development', 'Other'],
  'MCA': ['General', 'Cloud Computing', 'Data Science', 'Cyber Security', 'Web Development', 'Software Development', 'Other'],
  'MLM': ['Information Technology', 'Library Science', 'Digital Libraries', 'Other'],
  'Diploma in Engineering': [
    'Computer Science',
    'Electronics',
    'Electrical',
    'Mechanical',
    'Civil',
    'Automobile',
    'Other'
  ],
  
  // Arts & Science courses
  'B.Sc': [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'Computer Science',
    'Information Technology',
    'Biotechnology',
    'Microbiology',
    'Zoology',
    'Botany',
    'Statistics',
    'Environmental Science',
    'Other'
  ],
  'M.Sc': [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'Computer Science',
    'Information Technology',
    'Biotechnology',
    'Microbiology',
    'Zoology',
    'Botany',
    'Statistics',
    'Environmental Science',
    'Data Science',
    'Other'
  ],
  'BA': [
    'English',
    'Hindi',
    'History',
    'Political Science',
    'Economics',
    'Sociology',
    'Psychology',
    'Geography',
    'Philosophy',
    'Journalism',
    'Mass Communication',
    'Other'
  ],
  'MA': [
    'English',
    'Hindi',
    'History',
    'Political Science',
    'Economics',
    'Sociology',
    'Psychology',
    'Geography',
    'Philosophy',
    'Journalism',
    'Mass Communication',
    'Public Administration',
    'Other'
  ],
  'B.Arch': ['Architecture', 'Interior Design', 'Landscape Architecture', 'Urban Planning', 'Other'],
  'M.Arch': ['Architecture', 'Urban Design', 'Landscape Architecture', 'Sustainable Architecture', 'Housing', 'Other'],
  
  // Law courses
  'LLB': ['General', 'Corporate Law', 'Criminal Law', 'Constitutional Law', 'Intellectual Property', 'International Law', 'Other'],
  'LLM': ['Corporate Law', 'Criminal Law', 'Constitutional Law', 'Intellectual Property', 'International Law', 'Human Rights', 'Tax Law', 'Other'],
  
  'Other': []
};

export const getCoursesForDomain = (domain: string): string[] => {
  return DOMAIN_COURSES[domain] || [];
};

export const getSpecializationsForCourse = (course: string): string[] => {
  return COURSE_SPECIALIZATIONS[course] || [];
};
