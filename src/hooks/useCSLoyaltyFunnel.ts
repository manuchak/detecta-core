import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, subDays } from 'date-fns';

export type LoyaltyStage = 'nuevo' | 'activo' | 'leal' | 'promotor' | 'embajador' | 'en_riesgo';

export interface ClienteLoyalty {
  id: string;
  nombre: string;
  razon_social: string;
  es_embajador: boolean;
  notas_fidelidad: string | null;
  stage: LoyaltyStage;
  total_servicios: number;
  primer_servicio: string | null;
  ultimo_servicio: string | null;
  quejas_abiertas: number;
  csat_promedio: number | null;
  dias_sin_contacto: number;
  capas_pendientes: number;
  gmv_total: number;
  servicios_90d: number;
}

export interface LoyaltyFunnelData {
  stage: LoyaltyStage;
  label: string;
  count: number;
  percentage: number;
  clients: ClienteLoyalty[];
}

const STAGE_LABELS: Record<LoyaltyStage, string> = {
  nuevo: 'Nuevo',
  activo: 'Activo',
  leal: 'Leal',
  promotor: 'Promotor',
  embajador: 'Embajador',
  en_riesgo: 'En Riesgo',
};

function calculateStage(client: {
  es_embajador: boolean;
  primer_servicio: string | null;
  ultimo_servicio: string | null;
  quejas_abiertas: number;
  csat_promedio: number | null;
  dias_sin_contacto: number;
  capas_pendientes: number;
  meses_activo: number;
  servicios_90d: number;
}): LoyaltyStage {
  // En Riesgo: quejas >= 2 OR (sin contacto > 60 AND sin servicio > 60)
  const sinActividadReciente = client.dias_sin_contacto > 60;
  if (client.quejas_abiertas >= 2 || (sinActividadReciente && !client.ultimo_servicio)) {
    return 'en_riesgo';
  }
  // Also at risk if literally no activity in 60+ days
  if (sinActividadReciente) return 'en_riesgo';

  // Embajador: manual flag + all promotor criteria
  if (
    client.es_embajador &&
    client.meses_activo >= 6 &&
    client.quejas_abiertas === 0 &&
    (client.csat_promedio === null || client.csat_promedio >= 4.5) &&
    client.capas_pendientes === 0 &&
    client.dias_sin_contacto <= 30
  ) return 'embajador';

  // Promotor: leal + CSAT >= 4.5 (when exists) + 0 CAPAs
  if (
    client.meses_activo >= 6 &&
    client.quejas_abiertas === 0 &&
    (client.csat_promedio === null || client.csat_promedio >= 4.5) &&
    client.capas_pendientes === 0 &&
    client.dias_sin_contacto <= 30
  ) return 'promotor';

  // Leal: >= 6 meses, 0 quejas, servicio o contacto en 30 días
  if (
    client.meses_activo >= 6 &&
    client.quejas_abiertas === 0 &&
    client.dias_sin_contacto <= 30
  ) return 'leal';

  // Nuevo: primer servicio < 2 meses
  if (client.meses_activo < 2) return 'nuevo';

  // Activo: default (tiene servicios en 60d, sin quejas graves)
  return 'activo';
}

export function useCSLoyaltyFunnel() {
  return useQuery({
    queryKey: ['cs-loyalty-funnel'],
    queryFn: async () => {
      const now = Date.now();
      const cutoff90d = format(subDays(new Date(), 90), 'yyyy-MM-dd');

      // Fetch all active clients
      const { data: clientes, error: cErr } = await supabase
        .from('pc_clientes')
        .select('id, nombre, razon_social, es_embajador, notas_fidelidad')
        .eq('activo', true)
        .order('nombre');
      if (cErr) throw cErr;

      // Fetch services (all time for GMV/history)
      const { data: servicios, error: sErr } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente, cobro_cliente, fecha_hora_cita');
      if (sErr) throw sErr;

      // Fetch quejas, touchpoints, capas in parallel
      const [quejasRes, touchpointsRes, capasRes] = await Promise.all([
        supabase.from('cs_quejas').select('cliente_id, estado, calificacion_cierre'),
        supabase.from('cs_touchpoints').select('cliente_id, created_at'),
        supabase.from('cs_capa').select('cliente_id, estado'),
      ]);
      if (quejasRes.error) throw quejasRes.error;
      if (touchpointsRes.error) throw touchpointsRes.error;
      if (capasRes.error) throw capasRes.error;

      const quejas = quejasRes.data || [];
      const touchpoints = touchpointsRes.data || [];
      const capas = capasRes.data || [];

      const clientesLoyalty: ClienteLoyalty[] = (clientes || []).map(c => {
        const nombreNorm = c.nombre?.toLowerCase().trim();

        // Match services by nombre
        const cServicios = (servicios || []).filter(
          s => s.nombre_cliente?.toLowerCase().trim() === nombreNorm
        );
        const total_servicios = cServicios.length;
        const fechas = cServicios.map(s => s.fecha_hora_cita).filter(Boolean).sort();
        const primer_servicio = fechas[0] || null;
        const ultimo_servicio = fechas[fechas.length - 1] || null;
        const gmv_total = cServicios.reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);

        // Servicios en últimos 90 días
        const servicios_90d = cServicios.filter(
          s => s.fecha_hora_cita && s.fecha_hora_cita >= cutoff90d
        ).length;

        // Quejas
        const cQuejas = quejas.filter(q => q.cliente_id === c.id);
        const quejas_abiertas = cQuejas.filter(q => q.estado !== 'cerrada').length;
        const conCsat = cQuejas.filter(q => q.calificacion_cierre);
        const csat_promedio = conCsat.length
          ? conCsat.reduce((s, q) => s + (q.calificacion_cierre || 0), 0) / conCsat.length
          : null;

        // Último contacto = MAX(ultimo_servicio, ultimo_touchpoint)
        const cTouchpoints = touchpoints.filter(t => t.cliente_id === c.id);
        const lastTouchpoint = cTouchpoints.length
          ? cTouchpoints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        // Determine most recent contact from either source
        let lastContactDate: number | null = null;
        if (ultimo_servicio) lastContactDate = new Date(ultimo_servicio).getTime();
        if (lastTouchpoint) {
          const tpTime = new Date(lastTouchpoint).getTime();
          lastContactDate = lastContactDate ? Math.max(lastContactDate, tpTime) : tpTime;
        }

        const dias_sin_contacto = lastContactDate
          ? Math.floor((now - lastContactDate) / (1000 * 60 * 60 * 24))
          : 999;

        // CAPAs
        const cCapas = capas.filter(ca => ca.cliente_id === c.id);
        const capas_pendientes = cCapas.filter(ca => !['cerrado', 'verificado'].includes(ca.estado)).length;

        // Meses activo
        const meses_activo = primer_servicio
          ? Math.floor((now - new Date(primer_servicio).getTime()) / (1000 * 60 * 60 * 24 * 30))
          : 0;

        const stage = calculateStage({
          es_embajador: c.es_embajador || false,
          primer_servicio,
          ultimo_servicio,
          quejas_abiertas,
          csat_promedio,
          dias_sin_contacto,
          capas_pendientes,
          meses_activo,
          servicios_90d,
        });

        return {
          id: c.id,
          nombre: c.nombre,
          razon_social: c.razon_social,
          es_embajador: c.es_embajador || false,
          notas_fidelidad: c.notas_fidelidad || null,
          stage,
          total_servicios,
          primer_servicio,
          ultimo_servicio,
          quejas_abiertas,
          csat_promedio,
          dias_sin_contacto,
          capas_pendientes,
          gmv_total,
          servicios_90d,
        };
      });

      const stages: LoyaltyStage[] = ['nuevo', 'activo', 'leal', 'promotor', 'embajador', 'en_riesgo'];
      const total = clientesLoyalty.length || 1;

      const funnel: LoyaltyFunnelData[] = stages.map(stage => {
        const clients = clientesLoyalty.filter(c => c.stage === stage);
        return {
          stage,
          label: STAGE_LABELS[stage],
          count: clients.length,
          percentage: Math.round((clients.length / total) * 100),
          clients,
        };
      });

      return { funnel, clients: clientesLoyalty, total: clientesLoyalty.length };
    },
  });
}
