import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TimelineEventType = 
  | 'servicio_completado'
  | 'servicio_asignado'
  | 'servicio_confirmado'
  | 'servicio_rechazado'
  | 'servicio_cancelado'
  | 'ticket_creado'
  | 'ticket_resuelto'
  | 'adelanto' // pendiente
  | 'nota' // pendiente
  | 'estado_cambio'; // pendiente

export interface TimelineEvent {
  id: string;
  tipo: TimelineEventType;
  titulo: string;
  descripcion: string;
  fecha: string;
  metadata: Record<string, any>;
  fuente: 'servicios_custodia' | 'servicios_planificados' | 'tickets' | 'adelantos' | 'notas' | 'estados';
}

export interface TimelineStats {
  serviciosCompletados: number;
  serviciosRechazados: number;
  serviciosCancelados: number;
  ticketsCreados: number;
  ticketsResueltos: number;
  csatPromedio: number | null;
}

function normalizarNombre(nombre: string): string {
  return nombre.trim().toUpperCase();
}

export function useProfileTimeline(
  custodioId: string | undefined,
  nombre: string | undefined,
  telefono: string | undefined,
  filtros?: {
    tipos?: TimelineEventType[];
    fechaDesde?: Date;
    fechaHasta?: Date;
    limite?: number;
  }
) {
  return useQuery({
    queryKey: ['profile-timeline', custodioId, nombre, telefono, filtros],
    queryFn: async (): Promise<{ events: TimelineEvent[]; stats: TimelineStats }> => {
      if (!nombre && !custodioId) throw new Error('Nombre o ID requerido');
      
      const eventos: TimelineEvent[] = [];
      const limite = filtros?.limite || 100;
      const fechaDesde = filtros?.fechaDesde?.toISOString();
      const fechaHasta = filtros?.fechaHasta?.toISOString();
      
      // Stats counters
      let serviciosCompletados = 0;
      let serviciosRechazados = 0;
      let serviciosCancelados = 0;
      let ticketsCreados = 0;
      let ticketsResueltos = 0;
      let csatTotal = 0;
      let csatCount = 0;

      // 1. Servicios ejecutados (servicios_custodia) - por nombre
      if (nombre) {
        const nombreNormalizado = normalizarNombre(nombre);
        let query = supabase
          .from('servicios_custodia')
          .select('id, fecha_hora_cita, cliente, origen, destino, estado, costo_custodio, km_recorridos')
          .ilike('nombre_custodio', nombreNormalizado)
          .eq('estado', 'Finalizado')
          .order('fecha_hora_cita', { ascending: false })
          .limit(limite);
        
        if (fechaDesde) query = query.gte('fecha_hora_cita', fechaDesde);
        if (fechaHasta) query = query.lte('fecha_hora_cita', fechaHasta);
        
        const { data: serviciosEjecutados } = await query;
        
        (serviciosEjecutados || []).forEach(s => {
          serviciosCompletados++;
          eventos.push({
            id: `custodia-${s.id}`,
            tipo: 'servicio_completado',
            titulo: 'Servicio Completado',
            descripcion: `${s.origen || 'Origen'} → ${s.destino || 'Destino'}`,
            fecha: s.fecha_hora_cita,
            metadata: {
              servicioId: s.id,
              cliente: s.cliente,
              origen: s.origen,
              destino: s.destino,
              costo: s.costo_custodio,
              km: s.km_recorridos
            },
            fuente: 'servicios_custodia'
          });
        });
      }

      // 2. Servicios planificados (asignaciones, confirmaciones, rechazos) - por custodio_id
      if (custodioId) {
        let query = supabase
          .from('servicios_planificados')
          .select('id, id_servicio, fecha_hora_cita, cliente, origen, destino, estado_planeacion, created_at')
          .eq('custodio_id', custodioId)
          .order('fecha_hora_cita', { ascending: false })
          .limit(limite);
        
        if (fechaDesde) query = query.gte('fecha_hora_cita', fechaDesde);
        if (fechaHasta) query = query.lte('fecha_hora_cita', fechaHasta);
        
        const { data: serviciosPlanificados } = await query;
        
        (serviciosPlanificados || []).forEach(s => {
          let tipo: TimelineEventType = 'servicio_asignado';
          let titulo = 'Servicio Asignado';
          
          switch (s.estado_planeacion) {
            case 'confirmado':
              tipo = 'servicio_confirmado';
              titulo = 'Servicio Confirmado';
              break;
            case 'rechazado':
              tipo = 'servicio_rechazado';
              titulo = 'Servicio Rechazado';
              serviciosRechazados++;
              break;
            case 'cancelado':
              tipo = 'servicio_cancelado';
              titulo = 'Servicio Cancelado';
              serviciosCancelados++;
              break;
            case 'planificado':
              tipo = 'servicio_asignado';
              titulo = 'Servicio Asignado';
              break;
          }
          
          eventos.push({
            id: `planificado-${s.id}`,
            tipo,
            titulo,
            descripcion: `${s.origen || 'Origen'} → ${s.destino || 'Destino'}`,
            fecha: s.fecha_hora_cita || s.created_at,
            metadata: {
              servicioId: s.id_servicio || s.id,
              cliente: s.cliente,
              origen: s.origen,
              destino: s.destino,
              estado: s.estado_planeacion
            },
            fuente: 'servicios_planificados'
          });
        });
      }

      // 3. Tickets - por custodio_id o custodio_telefono
      if (custodioId || telefono) {
        let query = supabase
          .from('tickets')
          .select(`
            id,
            ticket_number,
            subject,
            status,
            category,
            priority,
            monto_reclamado,
            created_at,
            resolved_at,
            calificacion_csat,
            ticket_categorias_custodio(nombre, color, icono)
          `)
          .order('created_at', { ascending: false })
          .limit(limite);
        
        if (custodioId) {
          query = query.eq('custodio_id', custodioId);
        } else if (telefono) {
          query = query.eq('custodio_telefono', telefono);
        }
        
        if (fechaDesde) query = query.gte('created_at', fechaDesde);
        if (fechaHasta) query = query.lte('created_at', fechaHasta);
        
        const { data: tickets } = await query;
        
        (tickets || []).forEach(t => {
          ticketsCreados++;
          
          // Evento de creación
          eventos.push({
            id: `ticket-created-${t.id}`,
            tipo: 'ticket_creado',
            titulo: 'Ticket Creado',
            descripcion: t.subject || 'Sin asunto',
            fecha: t.created_at,
            metadata: {
              ticketId: t.id,
              ticketNumber: t.ticket_number,
              status: t.status,
              priority: t.priority,
              monto: t.monto_reclamado,
              categoria: t.ticket_categorias_custodio,
              csat: t.calificacion_csat
            },
            fuente: 'tickets'
          });
          
          // Evento de resolución si existe
          if (t.resolved_at && (t.status === 'resuelto' || t.status === 'cerrado')) {
            ticketsResueltos++;
            if (t.calificacion_csat) {
              csatTotal += t.calificacion_csat;
              csatCount++;
            }
            
            eventos.push({
              id: `ticket-resolved-${t.id}`,
              tipo: 'ticket_resuelto',
              titulo: 'Ticket Resuelto',
              descripcion: t.subject || 'Sin asunto',
              fecha: t.resolved_at,
              metadata: {
                ticketId: t.id,
                ticketNumber: t.ticket_number,
                csat: t.calificacion_csat
              },
              fuente: 'tickets'
            });
          }
        });
      }

      // Ordenar todos los eventos por fecha descendente
      eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      // Aplicar filtro por tipos si existe
      let eventosFiltrados = eventos;
      if (filtros?.tipos && filtros.tipos.length > 0) {
        eventosFiltrados = eventos.filter(e => filtros.tipos!.includes(e.tipo));
      }

      return {
        events: eventosFiltrados.slice(0, limite),
        stats: {
          serviciosCompletados,
          serviciosRechazados,
          serviciosCancelados,
          ticketsCreados,
          ticketsResueltos,
          csatPromedio: csatCount > 0 ? csatTotal / csatCount : null
        }
      };
    },
    enabled: !!(nombre || custodioId)
  });
}
