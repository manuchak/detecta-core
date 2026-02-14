import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMemo } from 'react';

export interface CSATSurvey {
  id: string;
  cliente_id: string;
  score: number;
  contexto: string;
  comentario: string | null;
  servicio_id: number | null;
  canal: string;
  created_by: string | null;
  created_at: string;
  cliente?: { nombre: string; razon_social: string } | null;
}

export type CSATInsert = {
  cliente_id: string;
  score: number;
  contexto?: string;
  comentario?: string;
  servicio_id?: number;
  canal?: string;
};

export function useCSCSATSurveys(filters?: { contexto?: string }) {
  return useQuery({
    queryKey: ['cs-csat-surveys', filters],
    queryFn: async () => {
      let query = supabase
        .from('cs_csat_surveys' as any)
        .select('*, cliente:pc_clientes(nombre, razon_social)')
        .order('created_at', { ascending: false });

      if (filters?.contexto) query = query.eq('contexto', filters.contexto);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CSATSurvey[];
    },
  });
}

export function useCreateCSAT() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CSATInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('cs_csat_surveys' as any)
        .insert({ ...input, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-csat-surveys'] });
      toast.success('Encuesta CSAT registrada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useCSATStats() {
  const { data: surveys } = useCSCSATSurveys();

  return useMemo(() => {
    if (!surveys || surveys.length === 0) {
      return { promedio: null, total: 0, distribución: [0, 0, 0, 0, 0] };
    }
    const total = surveys.length;
    const promedio = surveys.reduce((s, e) => s + e.score, 0) / total;
    const distribución = [1, 2, 3, 4, 5].map(n => surveys.filter(e => e.score === n).length);
    return { promedio: Math.round(promedio * 10) / 10, total, distribución };
  }, [surveys]);
}
