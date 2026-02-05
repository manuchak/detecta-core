import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  email: string;
  password: string;
  nombre: string;
  invitationToken: string;
  telefono?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, nombre, invitationToken, telefono }: CreateAccountRequest = await req.json();

    if (!email || !password || !nombre || !invitationToken) {
      return new Response(JSON.stringify({ error: "Campos requeridos faltantes" }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Contraseña debe tener mínimo 6 caracteres" }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log(`[create-custodian-account] Processing: ${email}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validate invitation
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from('custodian_invitations')
      .select('*')
      .eq('token', invitationToken)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (invErr || !invitation) {
      return new Response(JSON.stringify({ error: "Invitación inválida o expirada" }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Check existing user
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    if (users?.users?.some(u => u.email === email)) {
      return new Response(JSON.stringify({ error: "Email ya registrado" }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Create user with AUTO-CONFIRM (no email verification needed)
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm - invitation token already validates the user
      user_metadata: { display_name: nombre, invitation_token: invitationToken, phone: telefono || '' }
    });

    if (createErr) {
      console.error(`[create-custodian-account] Create error:`, createErr);
      return new Response(JSON.stringify({ error: createErr.message || "Error creando cuenta" }), 
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log(`[create-custodian-account] User created: ${userData.user.id}`);

    // Mark invitation as used
    const { error: updateInvErr } = await supabaseAdmin
      .from('custodian_invitations')
      .update({ 
        used_at: new Date().toISOString(), 
        used_by: userData.user.id 
      })
      .eq('token', invitationToken);

    if (updateInvErr) {
      console.error(`[create-custodian-account] Error marking invitation as used:`, updateInvErr);
    }

    // Assign custodio role in user_roles table (security best practice)
    const { error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'custodio'
      });

    if (roleErr) {
      console.error(`[create-custodian-account] Error assigning role:`, roleErr);
      // Don't fail the whole operation - the user is created
    }

    // Create/update profile
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: email,
        display_name: nombre,
        telefono: telefono || null
      });

    if (profileErr) {
      console.error(`[create-custodian-account] Error creating profile:`, profileErr);
    }

    console.log(`[create-custodian-account] Account ready for ${email} - autoLogin enabled`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cuenta creada exitosamente", 
      userId: userData.user.id,
      autoLogin: true // Signal frontend to auto-login
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error) {
    console.error(`[create-custodian-account] Error:`, error);
    return new Response(JSON.stringify({ error: "Error interno" }), 
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
