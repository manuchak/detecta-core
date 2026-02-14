import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, subDays } from 'date-fns';
import { useCSConfig, DEFAULT_LOYALTY_CONFIG, type LoyaltyConfig } from './useCSConfig';

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
}, cfg: LoyaltyConfig): LoyaltyStage {
  const riesgo = cfg.en_riesgo;
  const sinActividadReciente = client.dias_sin_contacto > riesgo.dias_inactividad;
  if (client.quejas_abiertas >= riesgo.quejas_minimas || (sinActividadReciente && client.servicios_90d <= riesgo.servicios_90d_minimo)) {
    return 'en_riesgo';
  }

  const emb = cfg.embajador;
  if (
    client.es_embajador &&
    client.meses_activo >= emb.meses_minimos &&
    client.quejas_abiertas === 0 &&
    (client.csat_promedio === null || client.csat_promedio >= emb.csat_minimo) &&
    client.capas_pendientes === 0 &&
    client.dias_sin_contacto <= emb.dias_contacto_maximo
  ) return 'embajador';

  const prom = cfg.promotor;
  if (
    client.meses_activo >= prom.meses_minimos &&
    client.quejas_abiertas === 0 &&
    (client.csat_promedio === null || client.csat_promedio >= prom.csat_minimo) &&
    client.capas_pendientes === 0 &&
    client.dias_sin_contacto <= prom.dias_contacto_maximo
  ) return 'promotor';

  const leal = cfg.leal;
  if (
    client.meses_activo >= leal.meses_minimos &&
    client.quejas_abiertas === 0 &&
    client.dias_sin_contacto <= leal.dias_contacto_maximo
  ) return 'leal';

  if (client.meses_activo < cfg.nuevo.meses_maximo) return 'nuevo';

  return 'activo';
}

export function useCSLoyaltyFunnel() {
  const { config: loyaltyConfig } = useCSConfig<LoyaltyConfig>('loyalty_funnel');

  return useQuery({
    queryKey: ['cs-loyalty-funnel', loyaltyConfig],
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

      // Fetch services from both tables + quejas, touchpoints, capas in parallel
      const [legacyRes, planRes, quejasRes, touchpointsRes, capasRes, npsRes] = await Promise.all([
        supabase.from('servicios_custodia').select('nombre_cliente, cobro_cliente, fecha_hora_cita'),
        supabase.from('servicios_planificados').select('nombre_cliente, cobro_posicionamiento, fecha_hora_cita'),
        supabase.from('cs_quejas').select('cliente_id, estado, calificacion_cierre'),
        supabase.from('cs_touchpoints').select('cliente_id, created_at'),
        supabase.from('cs_capa').select('cliente_id, estado'),
        supabase.from('cs_nps_campaigns').select('cliente_id, score'),
      ]);
      if (legacyRes.error) throw legacyRes.error;
      if (planRes.error) throw planRes.error;
      if (quejasRes.error) throw quejasRes.error;
      if (touchpointsRes.error) throw touchpointsRes.error;
      if (capasRes.error) throw capasRes.error;
      if (npsRes.error) throw npsRes.error;

      const planData = (planRes.data || []).map(s => ({
        nombre_cliente: s.nombre_cliente,
        cobro_cliente: s.cobro_posicionamiento,
        fecha_hora_cita: s.fecha_hora_cita,
      }));
      const allServicios = [...(legacyRes.data || []), ...planData];
      const seen = new Set<string>();
      const servicios = allServicios.filter(s => {
        const key = `${s.nombre_cliente?.toLowerCase().trim()}|${s.fecha_hora_cita}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const quejas = quejasRes.data || [];
      const touchpoints = touchpointsRes.data || [];
      const capas = capasRes.data || [];
      const npsEntries = npsRes.data || [];
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

        // NPS for this client
        const cNps = npsEntries.filter(n => n.cliente_id === c.id);
        const nps_promedio = cNps.length
          ? cNps.reduce((s, n) => s + n.score, 0) / cNps.length
          : null;
        
        // Combine CSAT and NPS: use NPS (scaled to 5) if no CSAT, or average both
        let satisfaccion: number | null = csat_promedio;
        if (nps_promedio !== null) {
          const npsScaled = (nps_promedio / 10) * 5; // scale 0-10 to 0-5
          satisfaccion = csat_promedio !== null ? (csat_promedio + npsScaled) / 2 : npsScaled;
        }

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
          csat_promedio: satisfaccion,
          dias_sin_contacto,
          capas_pendientes,
          meses_activo,
          servicios_90d,
        }, loyaltyConfig);

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
