import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

// Email template function to keep main handler cleaner
function getEmailHtml(nombre: string, confirmationLink: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:sans-serif;background:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#1e3a5f,#2d5a87);padding:32px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">🛡️ DETECTA</h1>
<p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Sistema de Custodios</p>
</td></tr>
<tr><td style="padding:40px 32px;">
<h2 style="color:#1e3a5f;margin:0 0 16px;font-size:24px;">¡Hola ${nombre}! 👋</h2>
<p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">Tu cuenta ha sido creada. <strong>Confirma tu correo</strong> para activarla:</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:16px 0;">
<a href="${confirmationLink}" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:18px;font-weight:600;">✅ Confirmar cuenta</a>
</td></tr>
</table>
<p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;">Si el botón no funciona: ${confirmationLink}</p>
<div style="margin-top:24px;background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:0 8px 8px 0;">
<p style="color:#92400e;font-size:14px;margin:0;">⚠️ Enlace válido por 24 horas.</p>
</div>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
<p style="color:#94a3b8;font-size:12px;margin:0;">© 2025 Detecta</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
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

    // Create user
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { display_name: nombre, invitation_token: invitationToken, phone: telefono || '' }
    });

    if (createErr) {
      console.error(`[create-custodian-account] Create error:`, createErr);
      return new Response(JSON.stringify({ error: createErr.message || "Error creando cuenta" }), 
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log(`[create-custodian-account] User created: ${userData.user.id}`);

    // Generate confirmation link
    const origin = Deno.env.get("SITE_URL") || "https://detecta.app";
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo: `${origin}/auth/email-confirmation?invitation=${invitationToken}` },
    });

    if (linkErr || !linkData.properties?.action_link) {
      console.error(`[create-custodian-account] Link error:`, linkErr);
      return new Response(JSON.stringify({ success: true, warning: "Cuenta creada sin email", userId: userData.user.id }), 
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Send email via Resend
    const { error: emailErr } = await resend.emails.send({
      from: "Detecta <notificaciones@detecta.app>",
      to: [email],
      subject: "📧 Confirma tu cuenta - Detecta",
      html: getEmailHtml(nombre, linkData.properties.action_link),
    });

    if (emailErr) {
      console.error(`[create-custodian-account] Email error:`, emailErr);
      return new Response(JSON.stringify({ success: true, warning: "Cuenta creada, email falló", userId: userData.user.id }), 
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log(`[create-custodian-account] Email sent to ${email}`);
    return new Response(JSON.stringify({ success: true, message: "Cuenta creada. Revisa tu correo.", userId: userData.user.id }), 
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error) {
    console.error(`[create-custodian-account] Error:`, error);
    return new Response(JSON.stringify({ error: "Error interno" }), 
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
