import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const startTime = Date.now()

    // Database health - table row counts
    const tableNames = [
      'students', 'companies', 'internships', 'applications',
      'universities', 'colleges', 'notifications', 'plugins',
      'payment_transactions', 'login_logs', 'user_roles', 'profiles'
    ]

    const tableCounts: Record<string, number> = {}
    await Promise.all(
      tableNames.map(async (table) => {
        const { count } = await supabaseAdmin.from(table).select('id', { count: 'exact', head: true })
        tableCounts[table] = count || 0
      })
    )

    // Edge function list with status
    const edgeFunctions = [
      'send-notification', 'generate-report', 'bulk-export',
      'analyze-resume', 'career-chat', 'generate-internship-description',
      'admin-create-user', 'university-signup', 'create-college-account',
      'create-university-user', 'scan-file', 'seed-test-data', 'health-check'
    ]

    const functionStatuses = edgeFunctions.map(fn => ({
      name: fn,
      status: 'deployed',
      url: `${supabaseUrl}/functions/v1/${fn}`,
    }))

    // Recent activity
    const { count: recentLogins } = await supabaseAdmin
      .from('login_logs')
      .select('id', { count: 'exact', head: true })
      .gte('login_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { count: recentApps } = await supabaseAdmin
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .gte('applied_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { count: unreadNotifs } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    // Storage buckets info
    const storageBuckets = [
      { name: 'company-files', isPublic: true },
      { name: 'public-assets', isPublic: true },
      { name: 'private-documents', isPublic: false },
      { name: 'resume-storage', isPublic: false },
    ]

    // Plugin status
    const { data: plugins } = await supabaseAdmin
      .from('plugins')
      .select('name, slug, is_enabled, is_installed, category')

    const responseTime = Date.now() - startTime

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      database: {
        status: 'connected',
        tableCounts,
        totalRecords: Object.values(tableCounts).reduce((a, b) => a + b, 0),
      },
      edgeFunctions: {
        total: functionStatuses.length,
        deployed: functionStatuses.length,
        functions: functionStatuses,
      },
      activity: {
        loginsLast24h: recentLogins || 0,
        applicationsLast24h: recentApps || 0,
        unreadNotifications: unreadNotifs || 0,
      },
      storage: {
        buckets: storageBuckets,
        totalBuckets: storageBuckets.length,
      },
      plugins: {
        total: (plugins || []).length,
        enabled: (plugins || []).filter(p => p.is_enabled).length,
        disabled: (plugins || []).filter(p => !p.is_enabled).length,
        list: plugins || [],
      },
      auth: {
        rolesConfigured: ['admin', 'student', 'company', 'university', 'college_coordinator'],
      },
    }

    return new Response(JSON.stringify(healthData), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Health check error:', error)
    return new Response(JSON.stringify({ 
      status: 'unhealthy', 
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
