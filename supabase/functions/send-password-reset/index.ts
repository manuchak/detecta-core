import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-password-reset] Processing reset request for: ${email}`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate password reset link
    const origin = redirectTo || Deno.env.get("SITE_URL") || "https://detecta.app";
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${origin}/reset-password`,
      },
    });

    if (linkError) {
      console.error(`[send-password-reset] Error generating link:`, linkError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "Si el correo existe, recibirás un enlace de recuperación" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = linkData.properties?.action_link;
    
    if (!resetLink) {
      console.error(`[send-password-reset] No action_link generated`);
      return new Response(
        JSON.stringify({ error: "Error generando enlace de recuperación" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-password-reset] Reset link generated successfully`);

    // Send email via Resend with branded template
    const { error: emailError } = await resend.emails.send({
      from: "Detecta <notificaciones@detecta.app>",
      to: [email],
      subject: "🔐 Recupera tu contraseña - Detecta",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                        🔐 Detecta
                      </h1>
                      <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">
                        Sistema de Gestión de Seguridad
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">
                        Recuperación de Contraseña
                      </h2>
                      
                      <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
                        Haz clic en el botón de abajo para crear una nueva contraseña.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 16px 0;">
                            <a href="${resetLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);">
                              Restablecer Contraseña
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.6;">
                        Este enlace expirará en <strong>1 hora</strong> por seguridad.
                      </p>
                      
                      <p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px; line-height: 1.6;">
                        Si no solicitaste este cambio, puedes ignorar este correo de forma segura. 
                        Tu contraseña permanecerá sin cambios.
                      </p>
                      
                      <!-- Fallback link -->
                      <div style="margin-top: 32px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 12px;">
                          Si el botón no funciona, copia y pega este enlace en tu navegador:
                        </p>
                        <p style="color: #3b82f6; margin: 0; font-size: 12px; word-break: break-all;">
                          ${resetLink}
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; margin: 0; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Detecta. Todos los derechos reservados.
                      </p>
                      <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px; text-align: center;">
                        Este es un correo automático, por favor no respondas a este mensaje.
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
      console.error(`[send-password-reset] Resend error:`, emailError);
      return new Response(
        JSON.stringify({ error: "Error enviando correo" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-password-reset] Email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Correo de recuperación enviado" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error(`[send-password-reset] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
