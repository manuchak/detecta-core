import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE_CDMX = 'America/Mexico_City';

export interface MonthlyTrendData {
  mes: string;
  mesLabel: string;
  serviciosAsignados: number;
  serviciosConfirmados: number;
  serviciosCancelados: number;
  kmRecorridos: number;
  ingresos: number;
  tasaCumplimiento: number;
  // New dimensions
  puntualidadATiempo: number;
  puntualidadRetrasoLeve: number;
  puntualidadRetrasoGrave: number;
  puntualidadTotal: number;
  scorePuntualidad: number;
  rechazos: number;
  checklistsCompletados: number;
  serviciosFinalizados: number;
  scoreChecklist: number;
}

function getMonthKey(isoString: string): string {
  return formatInTimeZone(isoString, TIMEZONE_CDMX, 'yyyy-MM');
}

export function useProfileTrends(
  custodioId: string | undefined,
  nombre: string | undefined,
  telefono?: string | null
) {
  return useQuery({
    queryKey: ['profile-trends', custodioId, nombre, telefono],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));
      const rangeStart = sixMonthsAgo.toISOString();
      const rangeEnd = endOfMonth(now).toISOString();

      // Build month buckets
      const months: { key: string; label: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const label = format(d, 'MMM', { locale: es });
        months.push({
          key: format(d, 'yyyy-MM'),
          label: label.charAt(0).toUpperCase() + label.slice(1),
        });
      }

      // Initialize trend map
      const trendMap = new Map<string, MonthlyTrendData>();
      for (const m of months) {
        trendMap.set(m.key, {
          mes: m.key,
          mesLabel: m.label,
          serviciosAsignados: 0,
          serviciosConfirmados: 0,
          serviciosCancelados: 0,
          kmRecorridos: 0,
          ingresos: 0,
          tasaCumplimiento: 0,
          puntualidadATiempo: 0,
          puntualidadRetrasoLeve: 0,
          puntualidadRetrasoGrave: 0,
          puntualidadTotal: 0,
          scorePuntualidad: 0,
          rechazos: 0,
          checklistsCompletados: 0,
          serviciosFinalizados: 0,
          scoreChecklist: 0,
        });
      }

      // 1. Servicios planificados (existing)
      const fallbackPuntualidad = new Map<string, string>();
      if (custodioId) {
        const { data: planificados } = await supabase
          .from('servicios_planificados')
          .select('id, estado_planeacion, fecha_hora_cita, hora_inicio_real, id_servicio')
          .eq('custodio_id', custodioId)
          .gte('fecha_hora_cita', rangeStart)
          .lte('fecha_hora_cita', rangeEnd);

        if (planificados) {
          for (const s of planificados) {
            if (!s.fecha_hora_cita) continue;
            const mk = getMonthKey(s.fecha_hora_cita);
            const bucket = trendMap.get(mk);
            if (!bucket) continue;
            bucket.serviciosAsignados++;
            if (s.estado_planeacion === 'confirmado') bucket.serviciosConfirmados++;
            if (s.estado_planeacion === 'cancelado') bucket.serviciosCancelados++;
            // Build fallback map
            if (s.id_servicio && s.hora_inicio_real) {
              fallbackPuntualidad.set(s.id_servicio, s.hora_inicio_real);
            }
          }
        }
      }

      // 2. Servicios custodia (existing + punctuality with fallback)
      if (nombre) {
        const { data: ejecutados } = await supabase
          .from('servicios_custodia')
          .select('id, id_servicio, km_recorridos, km_teorico, costo_custodio, fecha_hora_cita, hora_presentacion, estado')
          .ilike('nombre_custodio', `%${nombre}%`)
          .gte('fecha_hora_cita', rangeStart)
          .lte('fecha_hora_cita', rangeEnd);

        if (ejecutados) {
          for (const s of ejecutados) {
            if (!s.fecha_hora_cita) continue;
            const mk = getMonthKey(s.fecha_hora_cita);
            const bucket = trendMap.get(mk);
            if (!bucket) continue;

            bucket.kmRecorridos += (s.km_recorridos || s.km_teorico || 0);
            bucket.ingresos += (s.costo_custodio || 0);

            if (s.estado?.toLowerCase() === 'finalizado') {
              bucket.serviciosFinalizados++;
            }

            // Punctuality: primary = hora_presentacion, fallback = hora_inicio_real from planificados
            const arrivalTime = s.hora_presentacion || (s.id_servicio ? fallbackPuntualidad.get(s.id_servicio) : null);
            if (arrivalTime && s.fecha_hora_cita) {
              const cita = new Date(s.fecha_hora_cita).getTime();
              const presentacion = new Date(arrivalTime).getTime();
              const diffMin = (presentacion - cita) / 60000;
              bucket.puntualidadTotal++;
              if (diffMin <= 0) {
                bucket.puntualidadATiempo++;
              } else if (diffMin <= 15) {
                bucket.puntualidadRetrasoLeve++;
              } else {
                bucket.puntualidadRetrasoGrave++;
              }
            }
          }
        }
      }

      // 3. Rechazos
      if (custodioId) {
        const { data: rechazos } = await supabase
          .from('custodio_rechazos')
          .select('id, fecha_rechazo')
          .eq('custodio_id', custodioId)
          .gte('fecha_rechazo', rangeStart)
          .lte('fecha_rechazo', rangeEnd);

        if (rechazos) {
          for (const r of rechazos) {
            if (!r.fecha_rechazo) continue;
            const mk = getMonthKey(r.fecha_rechazo);
            const bucket = trendMap.get(mk);
            if (bucket) bucket.rechazos++;
          }
        }
      }

      // 4. Checklists
      if (telefono) {
        const cleanPhone = telefono.replace(/\D/g, '').slice(-10);
        const { data: checklists } = await supabase
          .from('checklist_servicio')
          .select('id, created_at')
          .eq('custodio_telefono', cleanPhone)
          .gte('created_at', rangeStart)
          .lte('created_at', rangeEnd);

        if (checklists) {
          for (const c of checklists) {
            if (!c.created_at) continue;
            const mk = getMonthKey(c.created_at);
            const bucket = trendMap.get(mk);
            if (bucket) bucket.checklistsCompletados++;
          }
        }
      }

      // Calculate derived scores
      const trends: MonthlyTrendData[] = months.map(m => {
        const bucket = trendMap.get(m.key)!;
        bucket.kmRecorridos = Math.round(bucket.kmRecorridos);
        bucket.ingresos = Math.round(bucket.ingresos);
        bucket.tasaCumplimiento = bucket.serviciosAsignados > 0
          ? Math.round((bucket.serviciosConfirmados / bucket.serviciosAsignados) * 100)
          : 0;
        bucket.scorePuntualidad = bucket.puntualidadTotal > 0
          ? Math.round((bucket.puntualidadATiempo / bucket.puntualidadTotal) * 100)
          : 0;
        bucket.scoreChecklist = bucket.serviciosFinalizados > 0
          ? Math.round((bucket.checklistsCompletados / bucket.serviciosFinalizados) * 100)
          : 0;
        return bucket;
      });

      return trends;
    },
    enabled: !!(custodioId || nombre),
  });
}
