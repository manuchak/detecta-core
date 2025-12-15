import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  nombre: string;
  telefono?: string;
  invitationLink: string;
  invitationId?: string; // For tracking
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nombre, invitationLink, invitationId }: InvitationEmailRequest = await req.json();

    console.log(`Sending invitation email to: ${email} for custodian: ${nombre}`);

    if (!email) {
      throw new Error("Email es requerido para enviar la invitación");
    }

    const emailResponse = await resend.emails.send({
      from: "Detecta <notificaciones@detecta.app>",
      to: [email],
      subject: "🎉 ¡Bienvenido al equipo de Detecta! - Activa tu cuenta",
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
                      <h2 style="color: #1e3a5f; margin: 0 0 16px 0; font-size: 24px;">¡Hola ${nombre}! 🎉</h2>
                      
                      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        <strong>¡Felicidades!</strong> Ya eres parte del equipo de custodios de Detecta.
                      </p>
                      
                      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                        Para acceder a tu portal personal donde podrás ver tus servicios asignados, 
                        reportar incidencias, gestionar tu vehículo y más, necesitas crear tu cuenta:
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 16px 0;">
                            <a href="${invitationLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">
                              📱 Registrarme en el Portal
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Fallback Link -->
                      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
                        Si el botón no funciona, copia y pega este enlace en tu navegador:
                      </p>
                      <p style="color: #2d5a87; font-size: 12px; word-break: break-all; margin: 8px 0 0 0; text-align: center;">
                        ${invitationLink}
                      </p>
                      
                      <!-- Warning -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                        <tr>
                          <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0;">
                            <p style="color: #92400e; font-size: 14px; margin: 0;">
                              ⚠️ <strong>Importante:</strong> Este enlace es personal y expira en 30 días. 
                              No lo compartas con nadie.
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

    console.log("Email sent successfully:", emailResponse);

    // Update invitation record with email tracking data
    if (invitationId && emailResponse.data?.id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from('custodian_invitations')
          .update({
            resend_email_id: emailResponse.data.id,
            email_sent_at: new Date().toISOString(),
            delivery_status: 'sent',
            delivery_updated_at: new Date().toISOString(),
          })
          .eq('id', invitationId);

        console.log(`Updated invitation ${invitationId} with email tracking data`);
      } catch (dbError) {
        console.error('Error updating invitation record:', dbError);
        // Don't throw - email was sent successfully
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Invitación enviada a ${email}`,
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-custodian-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
