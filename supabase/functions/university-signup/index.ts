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
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parse request body
    const { email, password, fullName, role, phoneNumber, institutionName } = await req.json()

    console.log('Received signup request for:', email, 'role:', role)

    // Validate role is university or college_coordinator only
    if (role !== 'university' && role !== 'college_coordinator') {
      return new Response(JSON.stringify({ error: 'Invalid role. Only university or college_coordinator allowed.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!email || !password || !fullName || !role || !institutionName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some(u => u.email === email)
    
    if (userExists) {
      return new Response(JSON.stringify({ error: 'An account with this email already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create user with email confirmed (no verification needed)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: fullName,
        phone_number: phoneNumber,
        institution_name: institutionName,
      }
    })

    if (createError) {
      console.error('User creation error:', createError)
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = userData.user.id
    console.log('User created with ID:', userId)

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        email,
        full_name: fullName,
        phone_number: phoneNumber,
      }, { onConflict: 'user_id' })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    // Create user role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
      })

    if (roleInsertError) {
      console.error('Role creation error:', roleInsertError)
    }

    // Create role-specific record
    if (role === 'university') {
      const { error: universityError } = await supabaseAdmin
        .from('universities')
        .insert({
          user_id: userId,
          name: institutionName,
          email: email,
          contact_person_name: fullName,
          contact_person_email: email,
          contact_person_phone: phoneNumber,
        })

      if (universityError) {
        console.error('University creation error:', universityError)
      }
    } else if (role === 'college_coordinator') {
      const { error: coordinatorError } = await supabaseAdmin
        .from('college_coordinators')
        .insert({
          user_id: userId,
          name: fullName,
          email: email,
          phone: phoneNumber,
          is_approved: false,
        })

      if (coordinatorError) {
        console.error('Coordinator creation error:', coordinatorError)
      }
    }

    console.log('Signup completed successfully for:', email)

    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
