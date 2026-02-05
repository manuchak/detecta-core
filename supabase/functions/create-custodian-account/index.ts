import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@4.0.0";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, nombre, invitationToken, telefono }: CreateAccountRequest = await req.json();

    // Validate required fields
    if (!email || !password || !nombre || !invitationToken) {
      return new Response(
        JSON.stringify({ error: "Todos los campos son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "La contraseña debe tener al menos 6 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[create-custodian-account] Processing registration for: ${email}`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('custodian_invitations')
      .select('*')
      .eq('token', invitationToken)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      console.error(`[create-custodian-account] Invalid invitation:`, invitationError);
      return new Response(
        JSON.stringify({ error: "La invitación no es válida o ha expirado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[create-custodian-account] Invitation validated for: ${invitation.nombre}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);
    
    if (userExists) {
      return new Response(
        JSON.stringify({ error: "Este email ya está registrado. Intenta iniciar sesión." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create user WITHOUT sending automatic email
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Don't auto-confirm
      user_metadata: {
        display_name: nombre,
        invitation_token: invitationToken,
        phone: telefono || invitation.telefono || '',
      }
    });

    if (createError) {
      console.error(`[create-custodian-account] Error creating user:`, createError);
      return new Response(
        JSON.stringify({ error: createError.message || "Error al crear la cuenta" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[create-custodian-account] User created: ${userData.user.id}`);

    // Generate confirmation link
    const origin = Deno.env.get("SITE_URL") || "https://detecta.app";
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: email,
      options: {
        redirectTo: `${origin}/auth/email-confirmation?invitation=${invitationToken}`,
      },
    });

    if (linkError) {
      console.error(`[create-custodian-account] Error generating link:`, linkError);
      // User was created but link failed - still return success with warning
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "Cuenta creada pero hubo un problema enviando el email. Contacta a soporte.",
          userId: userData.user.id 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const confirmationLink = linkData.properties?.action_link;
    
    if (!confirmationLink) {
      console.error(`[create-custodian-account] No action_link generated`);
      return new Response(
        JSON.stringify({ error: "Error generando enlace de confirmación" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[create-custodian-account] Confirmation link generated`);

    // Send confirmation email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Detecta <notificaciones@detecta.app>",
      to: [email],
      subject: "📧 Confirma tu cuenta - Detecta",
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 32px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🛡️ DETECTA</h1>
                      <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Sistema de Custodios</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #1e3a5f; margin: 0 0 16px 0; font-size: 24px;">¡Hola ${nombre}! 👋</h2>
                      
                      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        Tu cuenta ha sido creada exitosamente. Solo falta un paso: 
                        <strong>confirmar tu dirección de correo electrónico.</strong>
                      </p>
                      
                      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                        Haz clic en el botón de abajo para activar tu cuenta y comenzar a usar el portal de custodios:
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 16px 0;">
                            <a href="${confirmationLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">
                              ✅ Confirmar mi cuenta
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Fallback Link -->
                      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
                        Si el botón no funciona, copia y pega este enlace en tu navegador:
                      </p>
                      <p style="color: #2d5a87; font-size: 12px; word-break: break-all; margin: 8px 0 0 0; text-align: center;">
                        ${confirmationLink}
                      </p>
                      
                      <!-- Warning -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                        <tr>
                          <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0;">
                            <p style="color: #92400e; font-size: 14px; margin: 0;">
                              ⚠️ <strong>Importante:</strong> Este enlace expira en 24 horas. 
                              Si no solicitaste esta cuenta, puedes ignorar este correo.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
                      <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; text-align: center;">
                        ¿Tienes dudas? Contacta a tu coordinador o escríbenos a:
                      </p>
                      <p style="margin: 0; text-align: center;">
                        <a href="mailto:soporte@detecta.app" style="color: #2d5a87; text-decoration: none; font-weight: 500;">
                          soporte@detecta.app
                        </a>
                      </p>
                      <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
                        © ${new Date().getFullYear()} Detecta. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error(`[create-custodian-account] Resend error:`, emailError);
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: "Cuenta creada pero el email no pudo enviarse. Intenta reenviar desde el login.",
          userId: userData.user.id 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[create-custodian-account] Confirmation email sent to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Cuenta creada. Revisa tu correo para confirmar.",
        userId: userData.user.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error(`[create-custodian-account] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
