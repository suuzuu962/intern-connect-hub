import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { reportType, dateFrom, dateTo, format } = body

    if (!reportType) {
      return new Response(JSON.stringify({ error: 'reportType is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let reportData: any = {}

    switch (reportType) {
      case 'platform_overview': {
        const [students, companies, internships, applications, universities] = await Promise.all([
          supabaseAdmin.from('students').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('companies').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('internships').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('universities').select('id', { count: 'exact', head: true }),
        ])

        reportData = {
          title: 'Platform Overview Report',
          generatedAt: new Date().toISOString(),
          summary: {
            totalStudents: students.count || 0,
            totalCompanies: companies.count || 0,
            totalInternships: internships.count || 0,
            totalApplications: applications.count || 0,
            totalUniversities: universities.count || 0,
          }
        }
        break
      }

      case 'application_analytics': {
        const query = supabaseAdmin.from('applications').select('status, applied_at')
        if (dateFrom) query.gte('applied_at', dateFrom)
        if (dateTo) query.lte('applied_at', dateTo)
        const { data: apps } = await query

        const statusBreakdown: Record<string, number> = {}
        const monthlyTrend: Record<string, number> = {}

        for (const app of (apps || [])) {
          statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1
          const month = app.applied_at?.substring(0, 7) || 'unknown'
          monthlyTrend[month] = (monthlyTrend[month] || 0) + 1
        }

        reportData = {
          title: 'Application Analytics Report',
          generatedAt: new Date().toISOString(),
          dateRange: { from: dateFrom, to: dateTo },
          totalApplications: (apps || []).length,
          statusBreakdown,
          monthlyTrend,
        }
        break
      }

      case 'company_performance': {
        const { data: companies } = await supabaseAdmin
          .from('companies')
          .select('id, name, is_verified, created_at')

        const { data: internships } = await supabaseAdmin
          .from('internships')
          .select('company_id, is_active')

        const companyStats = (companies || []).map(c => {
          const companyInternships = (internships || []).filter(i => i.company_id === c.id)
          return {
            name: c.name,
            isVerified: c.is_verified,
            totalInternships: companyInternships.length,
            activeInternships: companyInternships.filter(i => i.is_active).length,
          }
        })

        reportData = {
          title: 'Company Performance Report',
          generatedAt: new Date().toISOString(),
          totalCompanies: (companies || []).length,
          verifiedCompanies: (companies || []).filter(c => c.is_verified).length,
          companyStats: companyStats.sort((a, b) => b.totalInternships - a.totalInternships).slice(0, 50),
        }
        break
      }

      case 'student_engagement': {
        const { data: students } = await supabaseAdmin
          .from('students')
          .select('id, department, college, graduation_year, created_at')

        const { data: apps } = await supabaseAdmin
          .from('applications')
          .select('student_id, status')

        const deptBreakdown: Record<string, number> = {}
        const yearBreakdown: Record<string, number> = {}

        for (const s of (students || [])) {
          if (s.department) deptBreakdown[s.department] = (deptBreakdown[s.department] || 0) + 1
          if (s.graduation_year) yearBreakdown[String(s.graduation_year)] = (yearBreakdown[String(s.graduation_year)] || 0) + 1
        }

        const studentAppCounts: Record<string, number> = {}
        for (const app of (apps || [])) {
          studentAppCounts[app.student_id] = (studentAppCounts[app.student_id] || 0) + 1
        }

        const avgApps = Object.values(studentAppCounts).length > 0
          ? Object.values(studentAppCounts).reduce((a, b) => a + b, 0) / Object.values(studentAppCounts).length
          : 0

        reportData = {
          title: 'Student Engagement Report',
          generatedAt: new Date().toISOString(),
          totalStudents: (students || []).length,
          departmentBreakdown: deptBreakdown,
          graduationYearBreakdown: yearBreakdown,
          averageApplicationsPerStudent: Math.round(avgApps * 100) / 100,
          studentsWithApplications: Object.keys(studentAppCounts).length,
        }
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown report type: ${reportType}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    // If CSV format requested, convert to CSV
    if (format === 'csv') {
      let csv = ''
      if (reportData.summary) {
        csv = Object.entries(reportData.summary).map(([k, v]) => `${k},${v}`).join('\n')
        csv = 'Metric,Value\n' + csv
      } else if (reportData.companyStats) {
        csv = 'Name,Verified,Total Internships,Active Internships\n'
        csv += reportData.companyStats.map((c: any) => 
          `"${c.name}",${c.isVerified},${c.totalInternships},${c.activeInternships}`
        ).join('\n')
      } else if (reportData.statusBreakdown) {
        csv = 'Status,Count\n'
        csv += Object.entries(reportData.statusBreakdown).map(([k, v]) => `${k},${v}`).join('\n')
      }

      return new Response(csv, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.csv"`,
        }
      })
    }

    return new Response(JSON.stringify(reportData), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
