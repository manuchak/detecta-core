import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const VERSION = "v3.1.0"; // Fix getUserByEmail + improved error catalog

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

    console.log(`[create-custodian-account] ${VERSION} Processing: ${email}`);

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

    // Check existing user by listing users with email filter
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = listData?.users?.find((u: any) => u.email === email) || null;
    console.log(`[create-custodian-account] Email check: ${existingUser ? 'EXISTS' : 'available'}`);

    // ===== RESCUE PATH: User already exists =====
    if (existingUser) {
      const userId = existingUser.id;

      // Check current roles
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roleList = (roles || []).map((r: { role: string }) => r.role);
      console.log(`[create-custodian-account] Existing user roles: ${roleList.join(', ')}`);

      // If already custodio, tell them to log in
      if (roleList.includes('custodio')) {
        return new Response(JSON.stringify({ 
          error: "Ya tienes una cuenta activa como custodio. Por favor inicia sesión." 
        }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      // RESCUE: User exists with pending (or no custodio role) + valid invitation
      console.log(`[create-custodian-account] RESCUE PATH: upgrading user ${userId} to custodio`);

      // Assign custodio role
      const { error: roleErr } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'custodio' });

      if (roleErr) {
        console.error(`[create-custodian-account] Error assigning custodio role:`, roleErr);
      }

      // Remove pending role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'pending');

      // Mark invitation as used
      await supabaseAdmin
        .from('custodian_invitations')
        .update({ used_at: new Date().toISOString(), used_by: userId })
        .eq('token', invitationToken);

      // Update profile with name/phone if missing
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          display_name: nombre,
          phone: telefono || 'Sin telefono'
        });

      // Update password to what they provided
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });

      console.log(`[create-custodian-account] ${VERSION} RESCUE complete for ${email}`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Cuenta activada como custodio exitosamente",
        userId: userId,
        autoLogin: true,
        rescued: true,
        _version: VERSION
      }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // ===== NORMAL PATH: Create new user =====
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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

    // Assign custodio role
    const { error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userData.user.id, role: 'custodio' });

    if (roleErr) {
      console.error(`[create-custodian-account] Error assigning role:`, roleErr);
    } else {
      // Clean up pending role if it exists
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('role', 'pending');
      console.log(`[create-custodian-account] Cleaned up pending role for ${email}`);
    }

    // Create/update profile
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: email,
        display_name: nombre,
        phone: telefono || 'Sin telefono'
      });

    if (profileErr) {
      console.error(`[create-custodian-account] Error creating profile:`, profileErr);
    }

    console.log(`[create-custodian-account] ${VERSION} Account ready for ${email}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cuenta creada exitosamente", 
      userId: userData.user.id,
      autoLogin: true,
      _version: VERSION
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[create-custodian-account] Error:`, errorMsg);
    return new Response(JSON.stringify({ 
      error: "Error interno del servidor. Por favor intenta de nuevo o contacta a soporte.",
      code: "INTERNAL_ERROR"
    }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
