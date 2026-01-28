// Course duration in years mapping
const COURSE_DURATION: Record<string, number> = {
  // Management
  'B.Com': 3,
  'BBA': 3,
  'M.Com': 2,
  'BHM': 4,
  'PGDM': 2,
  'E-MBA': 2,
  'MBA (1st Year)': 2,
  'MBA (2nd Year)': 2,
  
  // Engineering
  'B.Tech': 4,
  'M.Tech': 2,
  'BCA': 3,
  'MCA': 2,
  'MLM': 2,
  'Diploma in Engineering': 3,
  
  // Arts & Science
  'B.Sc': 3,
  'M.Sc': 2,
  'BA': 3,
  'MA': 2,
  'B.Arch': 5,
  'M.Arch': 2,
  
  // Law
  'LLB': 3,
  'LLM': 2,
  'BA LLB': 5,
  'BBA LLB': 5,
};

// Default duration if course not found
const DEFAULT_DURATION = 4;

// Calculate semesters per year (most courses have 2 semesters per year)
const SEMESTERS_PER_YEAR = 2;

export interface GraduationInfo {
  expectedGraduationYear: number;
  remainingYears: number;
  courseDuration: number;
  yearOfStudy: number;
}

/**
 * Calculate expected graduation year based on course, semester, and year of study
 */
export function calculateGraduationYear(
  course: string,
  semester: number,
  yearOfStudy?: number
): GraduationInfo {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  
  // Get course duration
  const courseDuration = COURSE_DURATION[course] || DEFAULT_DURATION;
  
  // Calculate year of study from semester if not provided
  const calculatedYearOfStudy = yearOfStudy || Math.ceil(semester / SEMESTERS_PER_YEAR);
  
  // Calculate remaining years
  const remainingYears = courseDuration - calculatedYearOfStudy;
  
  // Academic year typically ends around May-June
  // If we're past June, the next academic year starts
  const academicYearAdjustment = currentMonth >= 6 ? 1 : 0;
  
  // Expected graduation year
  const expectedGraduationYear = currentYear + remainingYears + academicYearAdjustment;
  
  return {
    expectedGraduationYear,
    remainingYears: Math.max(0, remainingYears),
    courseDuration,
    yearOfStudy: calculatedYearOfStudy,
  };
}

/**
 * Get the year of study based on semester
 */
export function getYearOfStudyFromSemester(semester: number): number {
  return Math.ceil(semester / SEMESTERS_PER_YEAR);
}

/**
 * Get year of study options based on course duration
 */
export function getYearOfStudyOptions(course: string): number[] {
  const duration = COURSE_DURATION[course] || DEFAULT_DURATION;
  return Array.from({ length: duration }, (_, i) => i + 1);
}
