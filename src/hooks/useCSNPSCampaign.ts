import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCSCartera } from './useCSCartera';
import { useCSNPS } from './useCSNPS';
import { useMemo } from 'react';
import { DEFAULT_NPS_RULES_CONFIG, type NPSRulesConfig } from './useCSConfig';

export { type NPSRulesConfig } from './useCSConfig';
export const DEFAULT_NPS_RULES = DEFAULT_NPS_RULES_CONFIG;

export interface NPSSend {
  id: string;
  periodo: string;
  cliente_id: string;
  estado: string;
  canal_envio: string;
  enviado_at: string | null;
  respondido_at: string | null;
  nps_response_id: string | null;
  enviado_por: string | null;
  notas: string | null;
  created_at: string;
  cliente?: { nombre: string; razon_social: string } | null;
}

// Fetch sends for a given period
export function useNPSSends(periodo?: string) {
  return useQuery({
    queryKey: ['cs-nps-sends', periodo],
    queryFn: async () => {
      let query = supabase
        .from('cs_nps_sends' as any)
        .select('*, cliente:pc_clientes(nombre, razon_social)')
        .order('created_at', { ascending: false });

      if (periodo) query = query.eq('periodo', periodo);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as NPSSend[];
    },
  });
}

// Generate a campaign: select eligible clients based on rules
export function useGenerateNPSCampaign() {
  const qc = useQueryClient();
  const { data: cartera } = useCSCartera();
  const { data: npsEntries } = useCSNPS();

  return useMutation({
    mutationFn: async ({ periodo, rules }: { periodo: string; rules: NPSRulesConfig }) => {
      if (!cartera) throw new Error('Cartera no disponible');

      const now = new Date();
      const activeClients = cartera.filter(c => {
        if (rules.criterios.solo_activos && !c.activo) return false;
        // Antiguedad check skipped - CarteraCliente doesn't track months yet
        return true;
      });

      // Exclude clients who have a recent NPS
      const diasExcl = rules.exclusiones.dias_desde_ultimo_nps;
      const eligible = activeClients.filter(client => {
        if (!npsEntries) return true;
        const latestNPS = npsEntries
          .filter(e => e.cliente_id === client.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        if (!latestNPS) return true;
        const daysSince = Math.floor((now.getTime() - new Date(latestNPS.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= diasExcl;
      });

      if (eligible.length === 0) throw new Error('No hay clientes elegibles con los criterios actuales');

      // Check existing sends for this period to avoid duplicates
      const { data: existingSends } = await supabase
        .from('cs_nps_sends' as any)
        .select('cliente_id')
        .eq('periodo', periodo);

      const existingIds = new Set((existingSends || []).map((s: any) => s.cliente_id));
      const newClients = eligible.filter(c => !existingIds.has(c.id));

      if (newClients.length === 0) throw new Error('Todos los clientes elegibles ya están en esta campaña');

      const { data: userData } = await supabase.auth.getUser();

      const rows = newClients.map(c => ({
        periodo,
        cliente_id: c.id,
        estado: 'pendiente',
        canal_envio: rules.canal_default,
        enviado_por: userData?.user?.id,
      }));

      const { error } = await supabase
        .from('cs_nps_sends' as any)
        .insert(rows);

      if (error) throw error;
      return { generated: newClients.length, total: eligible.length };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['cs-nps-sends'] });
      toast.success(`Campaña generada: ${result.generated} clientes agregados`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Update send status
export function useUpdateNPSSend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('cs_nps_sends' as any)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-nps-sends'] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Campaign stats for a period
export function useNPSCampaignStats(periodo?: string) {
  const { data: sends } = useNPSSends(periodo);

  return useMemo(() => {
    if (!sends || sends.length === 0) return { total: 0, pendientes: 0, enviados: 0, respondidos: 0, tasaRespuesta: 0 };
    const pendientes = sends.filter(s => s.estado === 'pendiente').length;
    const enviados = sends.filter(s => s.estado === 'enviado').length;
    const respondidos = sends.filter(s => s.estado === 'respondido').length;
    const tasaRespuesta = sends.length > 0 ? Math.round((respondidos / sends.length) * 100) : 0;
    return { total: sends.length, pendientes, enviados, respondidos, tasaRespuesta };
  }, [sends]);
}
