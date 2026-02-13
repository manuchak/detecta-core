import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CSHealthScore {
  id: string;
  cliente_id: string;
  periodo: string;
  score: number;
  quejas_abiertas: number;
  quejas_cerradas_mes: number;
  csat_promedio: number | null;
  servicios_mes: number;
  touchpoints_mes: number;
  riesgo_churn: string;
  notas: string | null;
  created_at: string;
  cliente?: { nombre_comercial: string; razon_social: string } | null;
}

export function useCSHealthScores() {
  return useQuery({
    queryKey: ['cs-health-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cs_health_scores')
        .select('*, cliente:pc_clientes(nombre_comercial, razon_social)')
        .order('periodo', { ascending: false });
      if (error) throw error;
      return data as CSHealthScore[];
    },
  });
}

export function useCSClientesConQuejas() {
  return useQuery({
    queryKey: ['cs-clientes-con-quejas'],
    queryFn: async () => {
      // Get all clients with their complaint counts
      const { data: clientes, error: cErr } = await supabase
        .from('pc_clientes')
        .select('id, nombre_comercial, razon_social')
        .eq('activo', true)
        .order('nombre_comercial');
      if (cErr) throw cErr;

      const { data: quejas, error: qErr } = await supabase
        .from('cs_quejas')
        .select('cliente_id, estado, calificacion_cierre');
      if (qErr) throw qErr;

      const { data: touchpoints, error: tErr } = await supabase
        .from('cs_touchpoints')
        .select('cliente_id, created_at');
      if (tErr) throw tErr;

      return (clientes || []).map(c => {
        const cQuejas = (quejas || []).filter(q => q.cliente_id === c.id);
        const abiertas = cQuejas.filter(q => q.estado !== 'cerrada').length;
        const conCsat = cQuejas.filter(q => q.calificacion_cierre);
        const csat = conCsat.length
          ? conCsat.reduce((s, q) => s + (q.calificacion_cierre || 0), 0) / conCsat.length
          : null;
        const cTouchpoints = (touchpoints || []).filter(t => t.cliente_id === c.id);
        const lastContact = cTouchpoints.length
          ? cTouchpoints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        const diasSinContacto = lastContact
          ? Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        let riesgo: string = 'bajo';
        if (abiertas >= 3 || diasSinContacto > 60) riesgo = 'critico';
        else if (abiertas >= 2 || diasSinContacto > 30) riesgo = 'alto';
        else if (abiertas >= 1 || diasSinContacto > 14) riesgo = 'medio';

        return {
          ...c,
          quejas_abiertas: abiertas,
          total_quejas: cQuejas.length,
          csat,
          diasSinContacto,
          riesgo,
          ultimo_contacto: lastContact,
        };
      });
    },
  });
}
