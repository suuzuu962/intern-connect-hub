import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonToCsv(data: any[], columns?: string[]): string {
  if (!data || data.length === 0) return ''
  const cols = columns || Object.keys(data[0])
  const header = cols.join(',')
  const rows = data.map(row =>
    cols.map(col => {
      const val = row[col]
      if (val === null || val === undefined) return ''
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      if (Array.isArray(val)) return `"${val.join('; ')}"`
      return String(val)
    }).join(',')
  )
  return [header, ...rows].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!roleData || !['admin', 'university'].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { entity, format, filters } = body

    if (!entity) {
      return new Response(JSON.stringify({ error: 'entity is required (students, companies, internships, applications, universities, colleges)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let data: any[] = []
    let filename = ''

    switch (entity) {
      case 'students': {
        const query = supabaseAdmin.from('students').select(`
          id, user_id, college, department, course, specialization, graduation_year,
          semester, usn, gender, city, state, country, skills, interested_domains,
          linkedin_url, github_url, created_at
        `)
        if (filters?.college_id) query.eq('college_id', filters.college_id)
        if (filters?.department) query.eq('department', filters.department)
        const { data: students } = await query
        
        // Get profiles for names
        const userIds = (students || []).map(s => s.user_id)
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('user_id, full_name, email, phone_number')
          .in('user_id', userIds)
        
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]))

        data = (students || []).map(s => ({
          Name: profileMap[s.user_id]?.full_name || '',
          Email: profileMap[s.user_id]?.email || '',
          Phone: profileMap[s.user_id]?.phone_number || '',
          USN: s.usn || '',
          College: s.college || '',
          Department: s.department || '',
          Course: s.course || '',
          Specialization: s.specialization || '',
          Graduation_Year: s.graduation_year || '',
          Semester: s.semester || '',
          Gender: s.gender || '',
          City: s.city || '',
          State: s.state || '',
          Skills: (s.skills || []).join('; '),
          Domains: (s.interested_domains || []).join('; '),
          LinkedIn: s.linkedin_url || '',
          GitHub: s.github_url || '',
          Registered: s.created_at?.split('T')[0] || '',
        }))
        filename = 'students_export'
        break
      }

      case 'companies': {
        const { data: companies } = await supabaseAdmin
          .from('companies')
          .select('id, name, industry, location, website, employee_count, is_verified, city, state, country, created_at, contact_person_name, contact_person_email, contact_person_phone')

        data = (companies || []).map(c => ({
          Name: c.name,
          Industry: c.industry || '',
          Location: c.location || '',
          Website: c.website || '',
          Employees: c.employee_count || '',
          Verified: c.is_verified ? 'Yes' : 'No',
          City: c.city || '',
          State: c.state || '',
          Country: c.country || '',
          Contact_Name: c.contact_person_name || '',
          Contact_Email: c.contact_person_email || '',
          Contact_Phone: c.contact_person_phone || '',
          Registered: c.created_at?.split('T')[0] || '',
        }))
        filename = 'companies_export'
        break
      }

      case 'internships': {
        const { data: internships } = await supabaseAdmin
          .from('internships')
          .select('*, companies(name)')

        data = (internships || []).map((i: any) => ({
          Title: i.title,
          Company: i.companies?.name || '',
          Domain: i.domain || '',
          Location: i.location || '',
          Type: i.internship_type,
          Mode: i.work_mode,
          Duration: i.duration || '',
          Stipend: i.stipend || 0,
          Positions: i.positions_available || 0,
          Active: i.is_active ? 'Yes' : 'No',
          Views: i.views_count || 0,
          Deadline: i.application_deadline || '',
          Created: i.created_at?.split('T')[0] || '',
        }))
        filename = 'internships_export'
        break
      }

      case 'applications': {
        const { data: apps } = await supabaseAdmin
          .from('applications')
          .select('*, internships(title, companies(name)), students(usn, college, department)')

        data = (apps || []).map((a: any) => ({
          Internship: a.internships?.title || '',
          Company: a.internships?.companies?.name || '',
          Student_USN: a.students?.usn || '',
          College: a.students?.college || '',
          Department: a.students?.department || '',
          Status: a.status,
          Applied_At: a.applied_at?.split('T')[0] || '',
        }))
        filename = 'applications_export'
        break
      }

      case 'universities': {
        const { data: unis } = await supabaseAdmin
          .from('universities')
          .select('*')

        data = (unis || []).map(u => ({
          Name: u.name,
          Email: u.email,
          Address: u.address || '',
          Contact_Person: u.contact_person_name || '',
          Contact_Email: u.contact_person_email || '',
          Contact_Phone: u.contact_person_phone || '',
          Verified: u.is_verified ? 'Yes' : 'No',
          Active: u.is_active ? 'Yes' : 'No',
          Created: u.created_at?.split('T')[0] || '',
        }))
        filename = 'universities_export'
        break
      }

      case 'colleges': {
        const { data: colleges } = await supabaseAdmin
          .from('colleges')
          .select('*, universities(name)')

        data = (colleges || []).map((c: any) => ({
          Name: c.name,
          University: c.universities?.name || '',
          Email: c.email || '',
          Contact_Person: c.contact_person_name || '',
          Contact_Email: c.contact_person_email || '',
          Contact_Phone: c.contact_person_phone || '',
          Active: c.is_active ? 'Yes' : 'No',
          Address: c.address || '',
          Created: c.created_at?.split('T')[0] || '',
        }))
        filename = 'colleges_export'
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown entity: ${entity}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    if (format === 'json') {
      return new Response(JSON.stringify({ data, count: data.length }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default: CSV
    const csv = jsonToCsv(data)
    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`,
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
