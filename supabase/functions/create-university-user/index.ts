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
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify requesting user owns a university
    const { data: university, error: uniError } = await supabaseAdmin
      .from('universities')
      .select('id')
      .eq('user_id', requestingUser.id)
      .single()

    if (uniError || !university) {
      return new Response(JSON.stringify({ error: 'Forbidden: University owner access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, password, fullName, universityId, role, permissions } = await req.json()

    if (!email || !password || !fullName || !universityId || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Ensure the universityId matches the requesting user's university
    if (university.id !== universityId) {
      return new Response(JSON.stringify({ error: 'Forbidden: Cannot add users to another university' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check manager limit (max 5)
    if (role === 'manager') {
      const { count } = await supabaseAdmin
        .from('university_users')
        .select('*', { count: 'exact', head: true })
        .eq('university_id', universityId)
        .eq('role', 'manager')

      if ((count ?? 0) >= 5) {
        return new Response(JSON.stringify({ error: 'Manager limit reached (max 5)' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Create user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = userData.user.id

    // Insert into university_users
    const { error: uuError } = await supabaseAdmin
      .from('university_users')
      .insert({
        university_id: universityId,
        user_id: userId,
        email,
        name: fullName,
        role,
        permissions: permissions || {},
      })

    if (uuError) {
      console.error('University user insert error:', uuError)
      return new Response(JSON.stringify({ error: uuError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Assign university role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'university' })

    if (roleError) {
      console.error('Role insert error:', roleError)
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
