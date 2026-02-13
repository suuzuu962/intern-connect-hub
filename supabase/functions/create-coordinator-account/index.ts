import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCoordinatorRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  designation?: string;
  address?: string;
  college_id: string;
  university_id: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateCoordinatorRequest = await req.json();
    console.log("Creating coordinator account for:", body.email);

    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.college_id || !body.university_id) {
      return new Response(
        JSON.stringify({ error: "Name, email, password, college_id, and university_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization: check if user is a university owner OR a college coordinator for this college
    let authorized = false;

    // Check 1: University owner
    const { data: universityData } = await supabaseAdmin
      .from("universities")
      .select("id")
      .eq("user_id", requestingUser.id)
      .single();

    if (universityData && universityData.id === body.university_id) {
      authorized = true;
    }

    // Check 2: College coordinator for the same college
    if (!authorized) {
      const { data: coordinatorData } = await supabaseAdmin
        .from("college_coordinators")
        .select("id, college_id, university_id")
        .eq("user_id", requestingUser.id)
        .eq("college_id", body.college_id)
        .eq("is_approved", true)
        .eq("is_active", true)
        .single();

      if (coordinatorData && coordinatorData.university_id === body.university_id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Only university owners or approved college coordinators can create coordinator accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the college belongs to the university
    const { data: collegeData, error: collegeError } = await supabaseAdmin
      .from("colleges")
      .select("id, university_id")
      .eq("id", body.college_id)
      .single();

    if (collegeError || !collegeData) {
      return new Response(
        JSON.stringify({ error: "College not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (collegeData.university_id !== body.university_id) {
      return new Response(
        JSON.stringify({ error: "This college does not belong to the specified university" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.name },
    });

    if (createUserError) {
      console.error("Error creating auth user:", createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user!.id;
    console.log("Auth user created with ID:", userId);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Create user role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "college_coordinator",
    });

    if (roleError) {
      console.error("Error creating user role:", roleError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Failed to create user role: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create college_coordinator record
    const { data: coordinatorData, error: coordinatorError } = await supabaseAdmin
      .from("college_coordinators")
      .insert({
        user_id: userId,
        college_id: body.college_id,
        university_id: body.university_id,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        designation: body.designation || null,
        address: body.address || null,
        is_approved: true,
        is_active: true,
      })
      .select()
      .single();

    if (coordinatorError) {
      console.error("Error creating coordinator:", coordinatorError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Failed to create coordinator: " + coordinatorError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Coordinator account created successfully:", coordinatorData.id);

    return new Response(
      JSON.stringify({
        success: true,
        coordinator: coordinatorData,
        message: "Coordinator account created successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-coordinator-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
