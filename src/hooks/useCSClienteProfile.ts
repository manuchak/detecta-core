import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CSClienteProfileData {
  id: string;
  nombre: string;
  razon_social: string;
  es_embajador: boolean;
  notas_fidelidad: string | null;
  lifetime_servicios: number;
  gmv_total: number;
  primer_servicio: string | null;
  tendencia_gmv: { mes: string; gmv: number; servicios: number }[];
  quejas: { id: string; numero_queja: string; estado: string; tipo: string; created_at: string }[];
  touchpoints: { id: string; tipo: string; resumen: string; created_at: string }[];
  capas: { id: string; numero_capa: string; estado: string; tipo: string }[];
}

export function useCSClienteProfile(clienteId: string | null) {
  return useQuery({
    queryKey: ['cs-cliente-profile', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      if (!clienteId) throw new Error('No client ID');

      const { data: cliente, error: cErr } = await supabase
        .from('pc_clientes')
        .select('id, nombre, razon_social, es_embajador, notas_fidelidad')
        .eq('id', clienteId)
        .single();
      if (cErr) throw cErr;

      // Services
      const { data: servicios, error: sErr } = await supabase
        .from('servicios_custodia')
        .select('cobro_cliente, fecha_hora_cita')
        .ilike('nombre_cliente', cliente.nombre);
      if (sErr) throw sErr;

      const lifetime_servicios = servicios?.length || 0;
      const gmv_total = (servicios || []).reduce((s, sv) => s + (Number(sv.cobro_cliente) || 0), 0);
      const fechas = (servicios || []).map(s => s.fecha_hora_cita).filter(Boolean).sort();
      const primer_servicio = fechas[0] || null;

      // GMV by month (last 12)
      const gmvByMonth: Record<string, { gmv: number; servicios: number }> = {};
      (servicios || []).forEach(s => {
        if (!s.fecha_hora_cita) return;
        const key = s.fecha_hora_cita.substring(0, 7); // YYYY-MM
        if (!gmvByMonth[key]) gmvByMonth[key] = { gmv: 0, servicios: 0 };
        gmvByMonth[key].gmv += Number(s.cobro_cliente) || 0;
        gmvByMonth[key].servicios += 1;
      });
      const tendencia_gmv = Object.entries(gmvByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([mes, data]) => ({ mes, ...data }));

      // Quejas
      const { data: quejas, error: qErr } = await supabase
        .from('cs_quejas')
        .select('id, numero_queja, estado, tipo, created_at')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (qErr) throw qErr;

      // Touchpoints
      const { data: touchpoints, error: tErr } = await supabase
        .from('cs_touchpoints')
        .select('id, tipo, resumen, created_at')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (tErr) throw tErr;

      // CAPAs
      const { data: capas, error: caErr } = await supabase
        .from('cs_capa')
        .select('id, numero_capa, estado, tipo')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      if (caErr) throw caErr;

      return {
        ...cliente,
        es_embajador: cliente.es_embajador || false,
        notas_fidelidad: cliente.notas_fidelidad || null,
        lifetime_servicios,
        gmv_total,
        primer_servicio,
        tendencia_gmv,
        quejas: quejas || [],
        touchpoints: touchpoints || [],
        capas: capas || [],
      } as CSClienteProfileData;
    },
  });
}
