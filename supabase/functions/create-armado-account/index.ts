import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const VERSION = "v1.0.0";

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

    console.log(`[create-armado-account] ${VERSION} Processing: ${email}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validate invitation
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from('armado_invitations')
      .select('*')
      .eq('token', invitationToken)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (invErr || !invitation) {
      return new Response(JSON.stringify({ error: "Invitación inválida o expirada" }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Check existing user
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = listData?.users?.find((u: any) => u.email === email) || null;
    console.log(`[create-armado-account] Email check: ${existingUser ? 'EXISTS' : 'available'}`);

    // ===== RESCUE PATH =====
    if (existingUser) {
      const userId = existingUser.id;

      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roleList = (roles || []).map((r: { role: string }) => r.role);
      console.log(`[create-armado-account] Existing user roles: ${roleList.join(', ')}`);

      if (roleList.includes('armado')) {
        return new Response(JSON.stringify({ 
          error: "Ya tienes una cuenta activa como armado. Por favor inicia sesión." 
        }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      console.log(`[create-armado-account] RESCUE PATH: upgrading user ${userId} to armado`);

      await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'armado' });
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId).eq('role', 'pending');

      await supabaseAdmin.from('armado_invitations')
        .update({ status: 'used', used_at: new Date().toISOString(), used_by: userId })
        .eq('token', invitationToken);

      await supabaseAdmin.from('profiles').upsert({
        id: userId, email, display_name: nombre, phone: telefono || 'Sin telefono'
      });

      await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });

      console.log(`[create-armado-account] ${VERSION} RESCUE complete for ${email}`);

      return new Response(JSON.stringify({ 
        success: true, message: "Cuenta activada como armado exitosamente",
        userId, autoLogin: true, rescued: true, _version: VERSION
      }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // ===== NORMAL PATH =====
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { display_name: nombre, invitation_token: invitationToken, phone: telefono || '' }
    });

    if (createErr) {
      console.error(`[create-armado-account] Create error:`, createErr);
      return new Response(JSON.stringify({ error: createErr.message || "Error creando cuenta" }), 
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log(`[create-armado-account] User created: ${userData.user.id}`);

    await supabaseAdmin.from('armado_invitations')
      .update({ status: 'used', used_at: new Date().toISOString(), used_by: userData.user.id })
      .eq('token', invitationToken);

    const { error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userData.user.id, role: 'armado' });

    if (!roleErr) {
      await supabaseAdmin.from('user_roles').delete()
        .eq('user_id', userData.user.id).eq('role', 'pending');
    }

    await supabaseAdmin.from('profiles').upsert({
      id: userData.user.id, email, display_name: nombre, phone: telefono || 'Sin telefono'
    });

    console.log(`[create-armado-account] ${VERSION} Account ready for ${email}`);

    return new Response(JSON.stringify({ 
      success: true, message: "Cuenta creada exitosamente",
      userId: userData.user.id, autoLogin: true, _version: VERSION
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[create-armado-account] Error:`, errorMsg);
    return new Response(JSON.stringify({ 
      error: "Error interno del servidor. Por favor intenta de nuevo o contacta a soporte.",
      code: "INTERNAL_ERROR"
    }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
