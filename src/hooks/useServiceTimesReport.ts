import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'America/Mexico_City';

export type EventoTipo = 'combustible' | 'baño' | 'descanso' | 'pernocta' | 'incidencia' | 'trafico';

const SPECIAL_EVENTS: EventoTipo[] = ['combustible', 'baño', 'descanso', 'pernocta', 'incidencia', 'trafico'];

export interface ServiceTimeRow {
  id: string;
  folio: string;
  cliente: string;
  custodio: string;
  citaPlaneacion: string | null;      // fecha_hora_cita
  inicioMonitoreo: string | null;     // evento inicio_servicio
  llegadaDestino: string | null;      // evento llegada_destino
  liberacion: string | null;          // evento liberacion_custodio
  // Special event durations in seconds
  combustible: number;
  baño: number;
  descanso: number;
  pernocta: number;
  incidencia: number;
  // Calculated deltas in minutes
  deltaOrigen: number | null;
  deltaDestino: number | null;
  deltaTotal: number | null;
  // For detail view
  origen: string;
  destino: string;
  totalEventos: number;
}

interface UseServiceTimesOptions {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  cliente?: string;
}

async function fetchServiceTimes({ dateFrom, dateTo, cliente }: UseServiceTimesOptions): Promise<ServiceTimeRow[]> {
  const startUTC = `${dateFrom}T00:00:00-06:00`;
  const endUTC = `${dateTo}T23:59:59-06:00`;

  // 1. Fetch planned services
  let query = (supabase as any)
    .from('servicios_planificados')
    .select('id, id_servicio, nombre_cliente, custodio_asignado, fecha_hora_cita, hora_inicio_real, origen, destino')
    .gte('fecha_hora_cita', startUTC)
    .lte('fecha_hora_cita', endUTC)
    .is('fecha_cancelacion', null)
    .order('fecha_hora_cita', { ascending: true });

  if (cliente) {
    query = query.ilike('nombre_cliente', `%${cliente}%`);
  }

  const { data: servicios, error: e1 } = await query;
  if (e1) throw e1;
  if (!servicios || servicios.length === 0) return [];

  const servicioIds = servicios.map((s: any) => s.id_servicio);

  // 2. Fetch all route events for these services
  const { data: eventos, error: e2 } = await (supabase as any)
    .from('servicio_eventos_ruta')
    .select('servicio_id, tipo_evento, hora_inicio, hora_fin, duracion_segundos')
    .in('servicio_id', servicioIds);

  if (e2) throw e2;

  // 3. Group events by service
  const eventMap = new Map<string, any[]>();
  for (const ev of (eventos || [])) {
    const list = eventMap.get(ev.servicio_id) || [];
    list.push(ev);
    eventMap.set(ev.servicio_id, list);
  }

  // 4. Build rows
  return servicios.map((svc: any) => {
    const evts = eventMap.get(svc.id_servicio) || [];

    const findTs = (tipo: string) => {
      const found = evts.find((e: any) => e.tipo_evento === tipo);
      return found?.hora_inicio || null;
    };

    const sumDuration = (tipo: string) =>
      evts
        .filter((e: any) => e.tipo_evento === tipo)
        .reduce((acc: number, e: any) => acc + (e.duracion_segundos || 0), 0);

    const inicioMonitoreo = findTs('inicio_servicio');
    const llegadaDestino = findTs('llegada_destino');
    const liberacion = findTs('liberacion_custodio');
    const citaPlaneacion = svc.fecha_hora_cita;

    // Delta calculations in minutes
    let deltaOrigen: number | null = null;
    if (citaPlaneacion && inicioMonitoreo) {
      deltaOrigen = Math.round((new Date(inicioMonitoreo).getTime() - new Date(citaPlaneacion).getTime()) / 60000);
    }

    let deltaDestino: number | null = null;
    if (llegadaDestino && liberacion) {
      deltaDestino = Math.round((new Date(liberacion).getTime() - new Date(llegadaDestino).getTime()) / 60000);
    }

    const deltaTotal = deltaOrigen !== null && deltaDestino !== null ? deltaOrigen + deltaDestino : null;

    return {
      id: svc.id,
      folio: svc.id_servicio,
      cliente: svc.nombre_cliente || '',
      custodio: svc.custodio_asignado || 'Sin asignar',
      citaPlaneacion,
      inicioMonitoreo,
      llegadaDestino,
      liberacion,
      combustible: sumDuration('combustible'),
      baño: sumDuration('baño'),
      descanso: sumDuration('descanso'),
      pernocta: sumDuration('pernocta'),
      incidencia: sumDuration('incidencia'),
      deltaOrigen,
      deltaDestino,
      deltaTotal,
      origen: svc.origen || '',
      destino: svc.destino || '',
      totalEventos: evts.length,
    } as ServiceTimeRow;
  });
}

export function useServiceTimesReport(options: UseServiceTimesOptions) {
  return useQuery({
    queryKey: ['service-times-report', options.dateFrom, options.dateTo, options.cliente],
    queryFn: () => fetchServiceTimes(options),
    staleTime: 2 * 60_000,
  });
}
