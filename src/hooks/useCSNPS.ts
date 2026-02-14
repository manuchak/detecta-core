import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CSNPSEntry {
  id: string;
  cliente_id: string;
  periodo: string;
  score: number;
  comentario: string | null;
  canal: string;
  created_by: string | null;
  created_at: string;
  cliente?: { nombre: string; razon_social: string } | null;
}

export type CSNPSInsert = {
  cliente_id: string;
  periodo: string;
  score: number;
  comentario?: string;
  canal?: string;
};

export function useCSNPS(filters?: { periodo?: string }) {
  return useQuery({
    queryKey: ['cs-nps', filters],
    queryFn: async () => {
      let query = supabase
        .from('cs_nps_campaigns')
        .select('*, cliente:pc_clientes(nombre, razon_social)')
        .order('created_at', { ascending: false });

      if (filters?.periodo) query = query.eq('periodo', filters.periodo);

      const { data, error } = await query;
      if (error) throw error;
      return data as CSNPSEntry[];
    },
  });
}

export function useCreateCSNPS() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CSNPSInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('cs_nps_campaigns')
        .insert({ ...input, created_by: user?.id })
        .select('*, cliente:pc_clientes(nombre, razon_social)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-nps'] });
      toast.success('Encuesta NPS registrada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useNPSStats() {
  const { data: entries } = useCSNPS();
  
  if (!entries || entries.length === 0) {
    return { promotores: 0, pasivos: 0, detractores: 0, nps: null, total: 0 };
  }

  const promotores = entries.filter(e => e.score >= 9).length;
  const pasivos = entries.filter(e => e.score >= 7 && e.score <= 8).length;
  const detractores = entries.filter(e => e.score <= 6).length;
  const total = entries.length;
  const nps = Math.round(((promotores - detractores) / total) * 100);

  return { promotores, pasivos, detractores, nps, total };
}
