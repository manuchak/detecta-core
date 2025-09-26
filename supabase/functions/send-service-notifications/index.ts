import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  service_id: string;
  custodio_telefono?: string;
  custodio_nombre?: string;
  cliente_telefono?: string;
  cliente_nombre?: string;
  service_details: {
    origen: string;
    destino: string;
    fecha_hora_cita: string;
    vehiculo_info?: string;
    armado_asignado?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { service_id, custodio_telefono, custodio_nombre, cliente_telefono, cliente_nombre, service_details }: NotificationRequest = await req.json();

    console.log('📞 Enviando notificaciones para servicio:', service_id);

    const notifications: any[] = [];

    // Formatear fecha para mostrar
    const fechaFormateada = new Date(service_details.fecha_hora_cita).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Mensaje para el custodio
    if (custodio_telefono && custodio_nombre) {
      const custodioMessage = `🚗 SERVICIO ASIGNADO

Hola ${custodio_nombre},

Se te ha asignado un nuevo servicio:

📋 ID: ${service_id}
👤 Cliente: ${cliente_nombre || 'Cliente'}
📅 Fecha: ${fechaFormateada}
📍 Origen: ${service_details.origen}
📍 Destino: ${service_details.destino}
${service_details.vehiculo_info ? `🚙 Vehículo: ${service_details.vehiculo_info}` : ''}
${service_details.armado_asignado ? `🛡️ Armado: ${service_details.armado_asignado}` : ''}

Por favor confirma tu disponibilidad.

Gracias,
Equipo de Planeación`;

      // Registrar notificación del custodio
      const { error: custodioError } = await supabaseClient
        .from('service_notifications')
        .insert({
          service_id,
          recipient_type: 'custodian',
          recipient_phone: custodio_telefono,
          recipient_name: custodio_nombre,
          message_content: custodioMessage,
          status: 'pending'
        });

      if (custodioError) {
        console.error('Error registrando notificación de custodio:', custodioError);
      } else {
        notifications.push({ type: 'custodian', phone: custodio_telefono, status: 'queued' });
      }
    }

    // Mensaje para el cliente
    if (cliente_telefono && cliente_nombre) {
      const clienteMessage = `✅ SERVICIO CONFIRMADO

Estimado/a ${cliente_nombre},

Su servicio de custodia ha sido confirmado:

📋 ID: ${service_id}
👤 Custodio: ${custodio_nombre || 'Por asignar'}
📅 Fecha: ${fechaFormateada}
📍 Origen: ${service_details.origen}
📍 Destino: ${service_details.destino}
${service_details.vehiculo_info ? `🚙 Vehículo: ${service_details.vehiculo_info}` : ''}

El custodio se pondrá en contacto con usted para coordinar los detalles.

Saludos,
Equipo de Custodia`;

      // Registrar notificación del cliente
      const { error: clienteError } = await supabaseClient
        .from('service_notifications')
        .insert({
          service_id,
          recipient_type: 'customer',
          recipient_phone: cliente_telefono,
          recipient_name: cliente_nombre,
          message_content: clienteMessage,
          status: 'pending'
        });

      if (clienteError) {
        console.error('Error registrando notificación de cliente:', clienteError);
      } else {
        notifications.push({ type: 'customer', phone: cliente_telefono, status: 'queued' });
      }
    }

    console.log(`✅ ${notifications.length} notificaciones registradas para servicio ${service_id}`);

    return new Response(JSON.stringify({
      success: true,
      service_id,
      notifications_sent: notifications.length,
      notifications
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en send-service-notifications:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});