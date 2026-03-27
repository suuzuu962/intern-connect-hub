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
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { action } = body

    // ── ACTION: SUBMIT REQUEST (university owner) ──
    if (action === 'submit_request') {
      const { email, fullName, universityId, role, permissions } = body

      if (!email || !fullName || !universityId || !role) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verify requesting user owns the university
      const { data: university } = await supabaseAdmin
        .from('universities')
        .select('id')
        .eq('user_id', requestingUser.id)
        .eq('id', universityId)
        .single()

      if (!university) {
        return new Response(JSON.stringify({ error: 'Forbidden: University owner access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check manager limit
      if (role === 'manager') {
        const { count } = await supabaseAdmin
          .from('university_user_requests')
          .select('*', { count: 'exact', head: true })
          .eq('university_id', universityId)
          .eq('role', 'manager')
          .in('status', ['pending', 'approved'])

        const { count: existingCount } = await supabaseAdmin
          .from('university_users')
          .select('*', { count: 'exact', head: true })
          .eq('university_id', universityId)
          .eq('role', 'manager')

        if (((count ?? 0) + (existingCount ?? 0)) >= 5) {
          return new Response(JSON.stringify({ error: 'Manager limit reached (max 5 including pending requests)' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // Insert request
      const { data: request, error: insertErr } = await supabaseAdmin
        .from('university_user_requests')
        .insert({
          university_id: universityId,
          requested_by: requestingUser.id,
          name: fullName,
          email,
          role,
          permissions: permissions || {},
          status: 'pending',
        })
        .select('id')
        .single()

      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Notify all admins
      const { data: admins } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const { data: uniData } = await supabaseAdmin
          .from('universities')
          .select('name')
          .eq('id', universityId)
          .single()

        const notifications = admins.map((admin: any) => ({
          user_id: admin.user_id,
          title: 'New University User Request',
          message: `${uniData?.name || 'A university'} requested to add a ${role}: ${fullName} (${email})`,
          type: 'system',
          link: '/admin/dashboard?tab=university-user-requests',
          sender_id: requestingUser.id,
        }))

        await supabaseAdmin.from('notifications').insert(notifications)
      }

      return new Response(JSON.stringify({ success: true, requestId: request.id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── ACTION: APPROVE REQUEST (admin only) ──
    if (action === 'approve_request') {
      const { requestId, password } = body

      if (!requestId || !password) {
        return new Response(JSON.stringify({ error: 'Missing requestId or password' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verify admin
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', requestingUser.id)
        .eq('role', 'admin')
        .single()

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get request
      const { data: request, error: reqErr } = await supabaseAdmin
        .from('university_user_requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending')
        .single()

      if (reqErr || !request) {
        return new Response(JSON.stringify({ error: 'Request not found or already processed' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create auth user
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: request.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: request.name },
      })

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const userId = userData.user.id

      // Insert into university_users
      await supabaseAdmin.from('university_users').insert({
        university_id: request.university_id,
        user_id: userId,
        email: request.email,
        name: request.name,
        role: request.role,
        permissions: request.permissions,
      })

      // Assign university role
      await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'university' })

      // Update request status
      await supabaseAdmin
        .from('university_user_requests')
        .update({ status: 'approved', approved_by: requestingUser.id, approved_at: new Date().toISOString() })
        .eq('id', requestId)

      // Notify university owner
      await supabaseAdmin.from('notifications').insert({
        user_id: request.requested_by,
        title: 'User Request Approved',
        message: `Your request to add ${request.name} as ${request.role} has been approved.`,
        type: 'system',
        sender_id: requestingUser.id,
      })

      return new Response(JSON.stringify({ success: true, userId }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── ACTION: REJECT REQUEST (admin only) ──
    if (action === 'reject_request') {
      const { requestId, notes } = body

      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', requestingUser.id)
        .eq('role', 'admin')
        .single()

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabaseAdmin
        .from('university_user_requests')
        .update({ status: 'rejected', admin_notes: notes || null, approved_by: requestingUser.id, approved_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('status', 'pending')

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get request to notify
      const { data: request } = await supabaseAdmin
        .from('university_user_requests')
        .select('requested_by, name, role')
        .eq('id', requestId)
        .single()

      if (request) {
        await supabaseAdmin.from('notifications').insert({
          user_id: request.requested_by,
          title: 'User Request Rejected',
          message: `Your request to add ${request.name} as ${request.role} was rejected.${notes ? ' Reason: ' + notes : ''}`,
          type: 'system',
          sender_id: requestingUser.id,
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
