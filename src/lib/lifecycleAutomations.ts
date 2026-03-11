/**
 * Automatizaciones de ciclo de vida — Fase Dev 7
 * Envío automático de templates WhatsApp en momentos clave del servicio.
 */
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone } from '@/lib/phoneUtils';

interface LifecycleTemplateParams {
  servicioId: string;        // id_servicio (text key)
  serviceUUID: string;       // UUID PK
  templateName: string;
  commChannel: string;       // 'sistema'
  /** If provided, skip contact resolution and send to these phones */
  overridePhones?: string[];
}

/**
 * Guard anti-duplicado: verifica que no exista un mensaje con el mismo
 * templateName + servicio_id + comm_channel='sistema' en los últimos 5 min.
 */
async function isDuplicate(servicioId: string, templateName: string): Promise<boolean> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('whatsapp_messages')
    .select('id')
    .eq('servicio_id', servicioId)
    .eq('comm_channel', 'sistema')
    .ilike('message_text', `%${templateName}%`)
    .gte('created_at', fiveMinAgo)
    .limit(1);
  return (data && data.length > 0) || false;
}

/**
 * Resuelve los teléfonos de contacto del cliente para un servicio.
 * Fuentes: servicios_planificados.telefono_cliente + pc_clientes_contactos.
 */
async function resolveClientPhones(serviceUUID: string): Promise<string[]> {
  // 1. Get telefono_cliente from the service
  const { data: svc } = await supabase
    .from('servicios_planificados')
    .select('telefono_cliente, nombre_cliente')
    .eq('id', serviceUUID)
    .single();

  const phones = new Set<string>();

  if (svc?.telefono_cliente) {
    const norm = normalizePhone(svc.telefono_cliente);
    if (norm.length >= 10) phones.add(norm);
  }

  // 2. Try to find additional contacts via pc_clientes
  if (svc?.nombre_cliente) {
    const { data: cliente } = await supabase
      .from('pc_clientes')
      .select('id, contacto_whatsapp')
      .ilike('nombre', `%${svc.nombre_cliente}%`)
      .limit(1);

    if (cliente && cliente.length > 0) {
      if (cliente[0].contacto_whatsapp) {
        const norm = normalizePhone(cliente[0].contacto_whatsapp);
        if (norm.length >= 10) phones.add(norm);
      }

      const { data: contactos } = await supabase
        .from('pc_clientes_contactos')
        .select('telefono')
        .eq('cliente_id', cliente[0].id)
        .eq('activo', true);

      (contactos || []).forEach((c: any) => {
        if (c.telefono) {
          const norm = normalizePhone(c.telefono);
          if (norm.length >= 10) phones.add(norm);
        }
      });
    }
  }

  return Array.from(phones);
}

/**
 * Envía un template de ciclo de vida a todos los contactos del cliente,
 * con guard anti-duplicado de 5 min.
 */
export async function sendLifecycleTemplate(params: LifecycleTemplateParams): Promise<void> {
  const { servicioId, serviceUUID, templateName, commChannel, overridePhones } = params;

  // Guard anti-duplicado
  if (await isDuplicate(servicioId, templateName)) {
    console.log(`[Lifecycle] Template "${templateName}" ya enviado en últimos 5min para ${servicioId}, skip.`);
    return;
  }

  const phones = overridePhones || await resolveClientPhones(serviceUUID);
  if (phones.length === 0) {
    console.warn(`[Lifecycle] No client phones found for service ${servicioId}`);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Send to each contact individually
  const results = await Promise.allSettled(
    phones.map(phone => {
      const to = phone.length === 10 ? `52${phone}` : phone;
      return supabase.functions.invoke('kapso-send-template', {
        body: {
          to,
          templateName,
          servicioId,
          userId: user?.id,
          context: {
            comm_channel: commChannel,
            comm_phase: 'en_servicio',
            sender_type: 'sistema',
          },
        },
      });
    })
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`[Lifecycle] ${failed.length}/${phones.length} sends failed for ${templateName}`);
  } else {
    console.log(`[Lifecycle] ${templateName} sent to ${phones.length} contact(s) for ${servicioId}`);
  }
}

/**
 * Envía template de posicionamiento al cliente cuando Planeación marca "En Sitio".
 */
export function sendPositioningNotification(servicioId: string, serviceUUID: string) {
  // Fire-and-forget (no bloquear el flujo principal)
  sendLifecycleTemplate({
    servicioId,
    serviceUUID,
    templateName: 'posicionamiento_cliente',
    commChannel: 'sistema',
  }).catch(err => console.error('[Lifecycle] posicionamiento_cliente error:', err));
}

/**
 * Envía template de cierre al cliente y al custodio cuando C4 completa el servicio.
 */
export function sendCompletionNotifications(
  servicioId: string,
  serviceUUID: string,
  custodioTelefono?: string | null,
) {
  // 1. Cierre al cliente
  sendLifecycleTemplate({
    servicioId,
    serviceUUID,
    templateName: 'cierre_servicio_cliente',
    commChannel: 'sistema',
  }).catch(err => console.error('[Lifecycle] cierre_servicio_cliente error:', err));

  // 2. Servicio completado al custodio
  if (custodioTelefono) {
    const norm = normalizePhone(custodioTelefono);
    const to = norm.length === 10 ? `52${norm}` : norm;
    sendLifecycleTemplate({
      servicioId,
      serviceUUID,
      templateName: 'servicio_completado',
      commChannel: 'sistema',
      overridePhones: [to],
    }).catch(err => console.error('[Lifecycle] servicio_completado error:', err));
  }
}
