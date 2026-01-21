// Department/Branch to Skills and Domains mapping
export const departmentSkillsMap: Record<string, { skills: string[], domains: string[] }> = {
  'Computer Science': {
    skills: ['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL', 'Git', 'Data Structures', 'Algorithms', 'Machine Learning', 'Docker'],
    domains: ['Software Development', 'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity']
  },
  'Computer Science and Engineering': {
    skills: ['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL', 'Git', 'Data Structures', 'Algorithms', 'Machine Learning', 'Docker'],
    domains: ['Software Development', 'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity']
  },
  'Information Technology': {
    skills: ['JavaScript', 'Python', 'Java', 'SQL', 'React', 'Node.js', 'Git', 'Networking', 'Linux', 'Cloud Services', 'Docker', 'AWS'],
    domains: ['Software Development', 'Web Development', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'Data Science']
  },
  'Information Science': {
    skills: ['JavaScript', 'Python', 'Java', 'SQL', 'React', 'Data Analysis', 'Git', 'Machine Learning', 'Statistics'],
    domains: ['Software Development', 'Web Development', 'Data Science', 'Machine Learning', 'Research']
  },
  'Electronics and Communication': {
    skills: ['C', 'C++', 'Python', 'MATLAB', 'Embedded Systems', 'VHDL', 'Arduino', 'IoT', 'Signal Processing', 'PCB Design'],
    domains: ['Software Development', 'Research', 'Other']
  },
  'Electrical Engineering': {
    skills: ['C', 'C++', 'MATLAB', 'Python', 'AutoCAD', 'PLC Programming', 'Power Systems', 'Circuit Design', 'Simulation'],
    domains: ['Research', 'Operations', 'Other']
  },
  'Electrical and Electronics': {
    skills: ['C', 'C++', 'MATLAB', 'Python', 'AutoCAD', 'PLC Programming', 'Embedded Systems', 'Circuit Design'],
    domains: ['Software Development', 'Research', 'Operations', 'Other']
  },
  'Mechanical Engineering': {
    skills: ['AutoCAD', 'SolidWorks', 'CATIA', 'MATLAB', 'ANSYS', 'CNC Programming', 'CAD/CAM', '3D Modeling', 'Manufacturing'],
    domains: ['Operations', 'Research', 'Other']
  },
  'Civil Engineering': {
    skills: ['AutoCAD', 'STAAD Pro', 'Revit', 'Project Management', 'Surveying', 'Structural Analysis', 'Construction Management'],
    domains: ['Operations', 'Research', 'Other']
  },
  'Chemical Engineering': {
    skills: ['MATLAB', 'Process Simulation', 'ChemCAD', 'Aspen Plus', 'Quality Control', 'Data Analysis', 'Research'],
    domains: ['Research', 'Operations', 'Other']
  },
  'Biotechnology': {
    skills: ['Python', 'R', 'Bioinformatics', 'Laboratory Techniques', 'Research', 'Data Analysis', 'Statistics', 'Molecular Biology'],
    domains: ['Research', 'Data Science', 'Other']
  },
  'Aerospace Engineering': {
    skills: ['MATLAB', 'CAD', 'Aerodynamics', 'Simulation', 'CFD', 'Python', 'C++', 'Control Systems'],
    domains: ['Research', 'Software Development', 'Other']
  },
  'Artificial Intelligence': {
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Analysis', 'Statistics'],
    domains: ['Machine Learning', 'Data Science', 'Software Development', 'Research']
  },
  'Artificial Intelligence and Machine Learning': {
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Analysis', 'Statistics'],
    domains: ['Machine Learning', 'Data Science', 'Software Development', 'Research']
  },
  'Data Science': {
    skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Data Visualization', 'Pandas', 'NumPy', 'Tableau', 'Power BI'],
    domains: ['Data Science', 'Machine Learning', 'Software Development', 'Research']
  },
  'Business Administration': {
    skills: ['Excel', 'Financial Analysis', 'Marketing', 'Project Management', 'Presentation Skills', 'Communication', 'CRM', 'Sales'],
    domains: ['Business Development', 'Finance', 'Human Resources', 'Digital Marketing', 'Operations']
  },
  'MBA': {
    skills: ['Excel', 'Financial Analysis', 'Marketing', 'Project Management', 'Leadership', 'Strategic Planning', 'CRM', 'Sales', 'Analytics'],
    domains: ['Business Development', 'Finance', 'Human Resources', 'Digital Marketing', 'Operations']
  },
  'Commerce': {
    skills: ['Excel', 'Tally', 'Accounting', 'Financial Analysis', 'Taxation', 'GST', 'Auditing', 'Banking'],
    domains: ['Finance', 'Business Development', 'Operations']
  },
  'BCA': {
    skills: ['JavaScript', 'Python', 'Java', 'SQL', 'HTML', 'CSS', 'React', 'Node.js', 'Git'],
    domains: ['Software Development', 'Web Development', 'Mobile Development', 'Data Science']
  },
  'MCA': {
    skills: ['JavaScript', 'Python', 'Java', 'SQL', 'React', 'Node.js', 'Git', 'Docker', 'Cloud Services', 'Machine Learning'],
    domains: ['Software Development', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'DevOps']
  },
  'Design': {
    skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX Design', 'Prototyping', 'Typography', 'Branding'],
    domains: ['UI/UX Design', 'Content Writing', 'Digital Marketing']
  },
  'Mass Communication': {
    skills: ['Content Writing', 'Video Editing', 'Photography', 'Social Media', 'Copywriting', 'Journalism', 'Public Relations'],
    domains: ['Content Writing', 'Digital Marketing', 'Other']
  },
  'Psychology': {
    skills: ['Research', 'Data Analysis', 'Communication', 'Counseling', 'Report Writing', 'SPSS'],
    domains: ['Human Resources', 'Research', 'Other']
  },
  'Other': {
    skills: ['Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Microsoft Office', 'Presentation Skills'],
    domains: ['Other']
  }
};

// All available departments
export const departments = Object.keys(departmentSkillsMap);

// Get suggested skills for a department
export const getSuggestedSkillsForDepartment = (department: string): string[] => {
  return departmentSkillsMap[department]?.skills || departmentSkillsMap['Other'].skills;
};

// Get suggested domains for a department
export const getSuggestedDomainsForDepartment = (department: string): string[] => {
  return departmentSkillsMap[department]?.domains || departmentSkillsMap['Other'].domains;
};
