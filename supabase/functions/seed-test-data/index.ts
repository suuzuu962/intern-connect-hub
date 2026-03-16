import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const COMPANY_NAMES = ['Nexus','Apex','Vortex','Zenith','Pulse','Echo','Forge','Nova','Prism','Quasar','Helix','Orbit','Cipher','Vertex','Axiom','Stellar','Catalyst','Momentum','Synapse','Pinnacle','Nimbus','Aether','Cortex','Dynamo','Evolve','Fathom','Ignite','Kinetic','Lumen','Matrix','Optic','Radiant','Summit','Tensor','Unity','Vivid','Wavelength','Xeno','Yield','Zephyr','Alpine','Beacon','Compass','Delta','Ember','Flint','Granite','Horizon','Indigo','Jade'];
const SUFFIXES = ['Technologies','Solutions','Systems','Labs','Digital','Software','Analytics','Innovations','Services','Corp'];
const INDUSTRIES = ['Technology','Healthcare','Finance','Education','Manufacturing','Retail','Media','Consulting','Energy','Automotive','AI/ML','Cybersecurity','Cloud Computing','Data Science','IoT'];
const CITIES = ['Bangalore','Mumbai','Delhi','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad','Jaipur','Noida'];
const STATES = ['Karnataka','Maharashtra','Delhi','Telangana','Tamil Nadu','Maharashtra','West Bengal','Gujarat','Rajasthan','Uttar Pradesh'];
const DOMAINS = ['Web Development','Mobile Development','Data Science','Machine Learning','Cloud Computing','Cybersecurity','DevOps','UI/UX Design','Backend Development','Frontend Development','Full Stack','Blockchain','IoT','AI Research','Digital Marketing'];
const SKILLS_LIST = ['JavaScript','Python','React','Node.js','TypeScript','Java','C++','SQL','MongoDB','AWS','Docker','Kubernetes','Git','HTML/CSS','Angular','Vue.js','Django','Flask','TensorFlow','PyTorch','Figma','Adobe XD','Rust','Go','Swift'];
const DEPARTMENTS = ['Computer Science','Information Technology','Electronics','Mechanical','Civil','Electrical','Chemical','Biotechnology','Data Science','Artificial Intelligence'];
const FIRST_NAMES = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan','Ananya','Diya','Myra','Sara','Aanya','Aadhya','Isha','Pari','Riya','Kavya','Rohan','Karan','Amit','Priya','Neha','Rahul','Pooja','Deepak','Sunita','Vikram'];
const LAST_NAMES = ['Sharma','Patel','Kumar','Singh','Reddy','Iyer','Gupta','Verma','Nair','Desai','Joshi','Mehta','Rao','Das','Pillai','Agarwal','Mishra','Chatterjee','Banerjee','Mukherjee'];
const INTERNSHIP_TITLES = ['Software Developer Intern','Data Analyst Intern','Frontend Developer Intern','Backend Developer Intern','Full Stack Developer Intern','ML Engineer Intern','UI/UX Design Intern','DevOps Intern','Cloud Computing Intern','Mobile App Developer Intern','QA Engineer Intern','Product Management Intern','Business Analyst Intern','Cybersecurity Intern','Data Engineering Intern'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSkills(count: number): string[] {
  const shuffled = [...SKILLS_LIST].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { type, batchStart = 1, batchSize = 50 } = await req.json();
    const results: any = { created: 0, errors: [] };

    if (type === 'companies') {
      for (let i = batchStart; i < batchStart + batchSize && i <= 50; i++) {
        const email = `testcompany${i}@seedtest.com`;
        const password = 'TestPass123!';
        const companyName = `${COMPANY_NAMES[i-1] || 'Company'+i} ${SUFFIXES[i % SUFFIXES.length]}`;

        try {
          const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { full_name: companyName }
          });
          if (createErr) { results.errors.push(`Company ${i}: ${createErr.message}`); continue; }

          const userId = userData.user.id;

          await supabaseAdmin.from('profiles').upsert({ user_id: userId, email, full_name: companyName }, { onConflict: 'user_id' });
          await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'company' });

          const { error: compErr } = await supabaseAdmin.from('companies').insert({
            user_id: userId,
            name: companyName,
            industry: INDUSTRIES[i % INDUSTRIES.length],
            location: CITIES[i % CITIES.length],
            city: CITIES[i % CITIES.length],
            state: STATES[i % STATES.length],
            country: 'India',
            description: `${companyName} is a leading company in ${INDUSTRIES[i % INDUSTRIES.length]} providing innovative solutions and services.`,
            short_description: `Innovative ${INDUSTRIES[i % INDUSTRIES.length]} company`,
            is_verified: i % 3 === 0,
            employee_count: ['1-10','11-50','51-200','201-500','501-1000','1000+'][i % 6],
            website: `https://${COMPANY_NAMES[i-1]?.toLowerCase() || 'company'+i}.example.com`,
          });
          if (compErr) results.errors.push(`Company record ${i}: ${compErr.message}`);
          else results.created++;
        } catch (e) { results.errors.push(`Company ${i}: ${e.message}`); }
      }
    }

    else if (type === 'internships') {
      const { data: companies } = await supabaseAdmin.from('companies').select('id').limit(50);
      if (!companies?.length) {
        return new Response(JSON.stringify({ error: 'No companies found. Seed companies first.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      for (let i = batchStart; i < batchStart + batchSize && i <= 100; i++) {
        const company = companies[(i - 1) % companies.length];
        const title = INTERNSHIP_TITLES[i % INTERNSHIP_TITLES.length];
        const domain = DOMAINS[i % DOMAINS.length];
        const skills = randomSkills(3 + (i % 4));
        const types: ('free' | 'paid' | 'stipended')[] = ['free', 'paid', 'stipended'];
        const modes: ('remote' | 'onsite' | 'hybrid')[] = ['remote', 'onsite', 'hybrid'];

        const { error } = await supabaseAdmin.from('internships').insert({
          company_id: company.id,
          title: `${title} - ${domain}`,
          description: `We are looking for a passionate ${title.replace(' Intern', '')} to join our team. You will work on ${domain} projects, collaborate with senior engineers, and gain hands-on experience. Requirements: ${skills.join(', ')}. Duration: ${['1 Month','2 Months','3 Months','6 Months'][i % 4]}.`,
          short_description: `Exciting ${domain} internship opportunity`,
          domain,
          skills,
          location: CITIES[i % CITIES.length],
          internship_type: types[i % 3],
          work_mode: modes[i % 3],
          duration: ['1 Month','2 Months','3 Months','6 Months'][i % 4],
          stipend: i % 3 === 0 ? 0 : (5000 + (i * 500)),
          is_active: true,
          positions_available: 1 + (i % 10),
          start_date: new Date(Date.now() + i * 86400000 * 3).toISOString().split('T')[0],
          application_deadline: new Date(Date.now() + i * 86400000 * 2 + 30 * 86400000).toISOString().split('T')[0],
        });
        if (error) results.errors.push(`Internship ${i}: ${error.message}`);
        else results.created++;
      }
    }

    else if (type === 'students') {
      // Get colleges to assign students
      const { data: colleges } = await supabaseAdmin.from('colleges').select('id').limit(50);

      for (let i = batchStart; i < batchStart + batchSize && i <= 300; i++) {
        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = LAST_NAMES[i % LAST_NAMES.length];
        const fullName = `${firstName} ${lastName}`;
        const email = `teststudent${i}@seedtest.com`;
        const password = 'TestPass123!';

        try {
          const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { full_name: fullName }
          });
          if (createErr) { results.errors.push(`Student ${i}: ${createErr.message}`); continue; }

          const userId = userData.user.id;
          await supabaseAdmin.from('profiles').upsert({ user_id: userId, email, full_name: fullName }, { onConflict: 'user_id' });
          await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'student' });

          const dept = DEPARTMENTS[i % DEPARTMENTS.length];
          const { error: studErr } = await supabaseAdmin.from('students').insert({
            user_id: userId,
            college: `Test College ${1 + (i % 20)}`,
            college_id: colleges?.length ? colleges[i % colleges.length].id : null,
            department: dept,
            city: CITIES[i % CITIES.length],
            state: STATES[i % STATES.length],
            country: 'India',
            graduation_year: 2025 + (i % 3),
            semester: 1 + (i % 8),
            skills: randomSkills(3 + (i % 5)),
            interested_domains: [DOMAINS[i % DOMAINS.length], DOMAINS[(i + 3) % DOMAINS.length]],
            degree: ['B.Tech','B.E.','M.Tech','BCA','MCA','B.Sc','M.Sc'][i % 7],
            gender: i % 3 === 0 ? 'Male' : i % 3 === 1 ? 'Female' : 'Other',
            bio: `Aspiring ${dept} professional passionate about ${DOMAINS[i % DOMAINS.length]}.`,
            usn: `USN${String(i).padStart(4, '0')}`,
          });
          if (studErr) results.errors.push(`Student record ${i}: ${studErr.message}`);
          else results.created++;
        } catch (e) { results.errors.push(`Student ${i}: ${e.message}`); }
      }
    }

    else if (type === 'colleges') {
      const { data: universities } = await supabaseAdmin.from('universities').select('id').limit(10);
      if (!universities?.length) {
        return new Response(JSON.stringify({ error: 'No universities. Seed universities first.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      for (let i = 1; i <= 20; i++) {
        const uni = universities[(i - 1) % universities.length];
        const { error } = await supabaseAdmin.from('colleges').insert({
          university_id: uni.id,
          name: `College of ${['Engineering','Science','Arts','Commerce','Technology','Management','Medicine','Law','Architecture','Education'][i % 10]} - Campus ${i}`,
          email: `college${i}@test.edu.in`,
          contact_person_name: `Prof. ${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
          contact_person_email: `prof${i}@test.edu.in`,
          contact_person_phone: `+91${9000000000 + i * 111111}`,
          is_active: true,
        });
        if (error) results.errors.push(`College ${i}: ${error.message}`);
        else results.created++;
      }
    }

    else {
      return new Response(JSON.stringify({ error: 'Invalid type. Use: colleges, companies, internships, students' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, type, ...results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
