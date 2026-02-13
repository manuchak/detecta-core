import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  quejas_abiertas: number;
  csat_promedio: number | null;
  dias_sin_contacto: number;
  capas_pendientes: number;
  meses_activo: number;
}): LoyaltyStage {
  // En Riesgo: quejas abiertas >=2 OR sin contacto >60 días
  if (client.quejas_abiertas >= 2 || client.dias_sin_contacto > 60) return 'en_riesgo';

  // Embajador: manual flag + all promotor criteria
  if (
    client.es_embajador &&
    client.meses_activo >= 6 &&
    client.quejas_abiertas === 0 &&
    (client.csat_promedio === null || client.csat_promedio >= 4.5) &&
    client.capas_pendientes === 0
  ) return 'embajador';

  // Promotor: leal + CSAT >=4.5 + 0 CAPAs pendientes
  if (
    client.meses_activo >= 6 &&
    client.quejas_abiertas === 0 &&
    client.csat_promedio !== null &&
    client.csat_promedio >= 4.5 &&
    client.capas_pendientes === 0 &&
    client.dias_sin_contacto <= 30
  ) return 'promotor';

  // Leal: >6 meses, 0 quejas abiertas, contacto en 30 días
  if (
    client.meses_activo >= 6 &&
    client.quejas_abiertas === 0 &&
    client.dias_sin_contacto <= 30
  ) return 'leal';

  // Nuevo: primer servicio < 60 días
  if (client.meses_activo < 2) return 'nuevo';

  // Activo: default
  return 'activo';
}

export function useCSLoyaltyFunnel() {
  return useQuery({
    queryKey: ['cs-loyalty-funnel'],
    queryFn: async () => {
      // Fetch all active clients
      const { data: clientes, error: cErr } = await supabase
        .from('pc_clientes')
        .select('id, nombre, razon_social, es_embajador, notas_fidelidad')
        .eq('activo', true)
        .order('nombre');
      if (cErr) throw cErr;

      // Fetch services summary per client (using nombre_cliente match)
      const { data: servicios, error: sErr } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente, cobro_cliente, fecha_servicio');
      if (sErr) throw sErr;

      // Fetch quejas
      const { data: quejas, error: qErr } = await supabase
        .from('cs_quejas')
        .select('cliente_id, estado, calificacion_cierre');
      if (qErr) throw qErr;

      // Fetch touchpoints
      const { data: touchpoints, error: tErr } = await supabase
        .from('cs_touchpoints')
        .select('cliente_id, created_at');
      if (tErr) throw tErr;

      // Fetch CAPAs
      const { data: capas, error: caErr } = await supabase
        .from('cs_capa')
        .select('cliente_id, estado');
      if (caErr) throw caErr;

      const now = Date.now();

      const clientesLoyalty: ClienteLoyalty[] = (clientes || []).map(c => {
        // Match services by nombre
        const cServicios = (servicios || []).filter(
          s => s.nombre_cliente?.toLowerCase().trim() === c.nombre?.toLowerCase().trim()
        );
        const total_servicios = cServicios.length;
        const fechas = cServicios
          .map(s => s.fecha_servicio)
          .filter(Boolean)
          .sort();
        const primer_servicio = fechas[0] || null;
        const ultimo_servicio = fechas[fechas.length - 1] || null;
        const gmv_total = cServicios.reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);

        // Quejas
        const cQuejas = (quejas || []).filter(q => q.cliente_id === c.id);
        const quejas_abiertas = cQuejas.filter(q => q.estado !== 'cerrada').length;
        const conCsat = cQuejas.filter(q => q.calificacion_cierre);
        const csat_promedio = conCsat.length
          ? conCsat.reduce((s, q) => s + (q.calificacion_cierre || 0), 0) / conCsat.length
          : null;

        // Touchpoints
        const cTouchpoints = (touchpoints || []).filter(t => t.cliente_id === c.id);
        const lastContact = cTouchpoints.length
          ? cTouchpoints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        const dias_sin_contacto = lastContact
          ? Math.floor((now - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // CAPAs
        const cCapas = (capas || []).filter(ca => ca.cliente_id === c.id);
        const capas_pendientes = cCapas.filter(ca => !['cerrado', 'verificado'].includes(ca.estado)).length;

        // Meses activo
        const meses_activo = primer_servicio
          ? Math.floor((now - new Date(primer_servicio).getTime()) / (1000 * 60 * 60 * 24 * 30))
          : 0;

        const stage = calculateStage({
          es_embajador: c.es_embajador || false,
          primer_servicio,
          quejas_abiertas,
          csat_promedio,
          dias_sin_contacto,
          capas_pendientes,
          meses_activo,
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
