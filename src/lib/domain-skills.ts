// Domain to Skills mapping for company profiles
export const domainSkillsMap: Record<string, string[]> = {
  'Software Development': [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'Node.js', 'React', 'Angular', 'Vue.js', 'Django', 'Spring Boot', 'Git',
    'Docker', 'Kubernetes', 'CI/CD', 'Agile', 'REST APIs', 'GraphQL'
  ],
  'Web Development': [
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
    'Next.js', 'Tailwind CSS', 'Bootstrap', 'SASS', 'Webpack', 'Git',
    'Responsive Design', 'SEO', 'Performance Optimization', 'Accessibility'
  ],
  'Mobile Development': [
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'Java', 'Objective-C',
    'iOS Development', 'Android Development', 'Firebase', 'REST APIs',
    'Push Notifications', 'App Store Optimization', 'Cross-platform Development'
  ],
  'Data Science': [
    'Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow',
    'PyTorch', 'Data Visualization', 'Tableau', 'Power BI', 'Statistics',
    'Machine Learning', 'Data Mining', 'Big Data', 'Spark', 'Hadoop'
  ],
  'Machine Learning': [
    'Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'Deep Learning',
    'NLP', 'Computer Vision', 'Neural Networks', 'Model Deployment', 'MLOps',
    'Data Preprocessing', 'Feature Engineering', 'A/B Testing', 'Statistics'
  ],
  'Cloud Computing': [
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
    'Serverless', 'Lambda', 'EC2', 'S3', 'Cloud Architecture', 'DevOps',
    'Linux', 'Networking', 'Security', 'Load Balancing', 'Auto-scaling'
  ],
  'DevOps': [
    'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'Terraform',
    'Ansible', 'AWS', 'Azure', 'Linux', 'Bash Scripting', 'Python',
    'Monitoring', 'Prometheus', 'Grafana', 'ELK Stack', 'CI/CD'
  ],
  'Cybersecurity': [
    'Network Security', 'Penetration Testing', 'Vulnerability Assessment',
    'SIEM', 'Firewalls', 'Encryption', 'Identity Management', 'Compliance',
    'Incident Response', 'Security Auditing', 'Python', 'Linux', 'Ethical Hacking'
  ],
  'UI/UX Design': [
    'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Prototyping', 'Wireframing',
    'User Research', 'Usability Testing', 'Design Systems', 'Typography',
    'Color Theory', 'Responsive Design', 'Accessibility', 'HTML/CSS'
  ],
  'Digital Marketing': [
    'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Social Media Marketing',
    'Content Marketing', 'Email Marketing', 'Analytics', 'Google Analytics',
    'Copywriting', 'A/B Testing', 'Marketing Automation', 'HubSpot'
  ],
  'Content Writing': [
    'Copywriting', 'Blog Writing', 'Technical Writing', 'SEO Writing',
    'Social Media Content', 'Editing', 'Proofreading', 'Research',
    'Content Strategy', 'Storytelling', 'Grammar', 'CMS', 'WordPress'
  ],
  'Business Development': [
    'Sales', 'Lead Generation', 'CRM', 'Salesforce', 'Negotiation',
    'Market Research', 'Client Relations', 'Networking', 'Presentations',
    'Strategic Planning', 'Partnership Development', 'B2B Sales', 'Proposal Writing'
  ],
  'Finance': [
    'Financial Analysis', 'Excel', 'Financial Modeling', 'Accounting',
    'Tally', 'SAP', 'Budgeting', 'Forecasting', 'Investment Analysis',
    'Risk Management', 'Taxation', 'Auditing', 'GST', 'Compliance'
  ],
  'Human Resources': [
    'Recruitment', 'HRIS', 'Employee Relations', 'Payroll', 'Training',
    'Performance Management', 'HR Policies', 'Compliance', 'Onboarding',
    'Talent Acquisition', 'Interviewing', 'HR Analytics', 'Succession Planning'
  ],
  'Operations': [
    'Project Management', 'Process Improvement', 'Supply Chain', 'Logistics',
    'Inventory Management', 'Quality Control', 'Lean Six Sigma', 'ERP',
    'Vendor Management', 'Procurement', 'Data Analysis', 'Excel', 'Reporting'
  ],
  'Research': [
    'Research Methodology', 'Data Collection', 'Data Analysis', 'SPSS',
    'Literature Review', 'Academic Writing', 'Statistics', 'Survey Design',
    'Qualitative Research', 'Quantitative Research', 'Report Writing', 'R'
  ],
  'Other': [
    'Communication', 'Problem Solving', 'Critical Thinking', 'Teamwork',
    'Time Management', 'Leadership', 'Adaptability', 'Creativity',
    'Attention to Detail', 'Microsoft Office', 'Presentation Skills'
  ]
};

// All available domains
export const internshipDomains = Object.keys(domainSkillsMap);

// Get all unique skills
export const getAllSkills = (): string[] => {
  const allSkills = new Set<string>();
  Object.values(domainSkillsMap).forEach(skills => {
    skills.forEach(skill => allSkills.add(skill));
  });
  return Array.from(allSkills).sort();
};

// Get suggested skills for selected domains
export const getSuggestedSkills = (domains: string[]): string[] => {
  const skills = new Set<string>();
  domains.forEach(domain => {
    const domainSkills = domainSkillsMap[domain];
    if (domainSkills) {
      domainSkills.forEach(skill => skills.add(skill));
    }
  });
  return Array.from(skills).sort();
};
