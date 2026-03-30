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

    // Verify the requesting user is authenticated
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

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { type, title, message, targetRole, userIds, channel } = body

    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'Title and message are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results: any = { inApp: 0, sms: 0, email: 0 }

    // Determine target users
    let targetUsers: string[] = []

    if (userIds && userIds.length > 0) {
      targetUsers = userIds
    } else if (targetRole) {
      const { data: roleUsers } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', targetRole)
      targetUsers = (roleUsers || []).map((r: any) => r.user_id)
    }

    // Send in-app notifications
    if (!channel || channel === 'in_app' || channel === 'all') {
      const notifications = targetUsers.map(userId => ({
        user_id: userId,
        title,
        message,
        type: type || 'system',
        target_role: targetRole || null,
        sender_id: user.id,
      }))

      if (notifications.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications)

        if (!insertError) {
          results.inApp = notifications.length
        } else {
          console.error('Notification insert error:', insertError)
        }
      }
    }

    // SMS channel - check if Twilio is configured
    if (channel === 'sms' || channel === 'all') {
      const twilioApiKey = Deno.env.get('TWILIO_API_KEY')
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

      if (twilioApiKey && lovableApiKey) {
        // Get phone numbers for target users
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('user_id, phone_number')
          .in('user_id', targetUsers)
          .not('phone_number', 'is', null)

        const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio'

        for (const profile of (profiles || [])) {
          if (!profile.phone_number) continue
          try {
            const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'X-Connection-Api-Key': twilioApiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: profile.phone_number,
                From: Deno.env.get('TWILIO_FROM_NUMBER') || '+10000000000',
                Body: `${title}: ${message}`,
              }),
            })
            if (response.ok) results.sms++
            await response.text()
          } catch (err) {
            console.error('SMS send error:', err)
          }
        }
      } else {
        console.log('Twilio not configured, skipping SMS')
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sent: results,
      totalTargeted: targetUsers.length 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
