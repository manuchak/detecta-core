import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CSTouchpoint {
  id: string;
  queja_id: string | null;
  cliente_id: string;
  tipo: string;
  direccion: string;
  resumen: string;
  contacto_nombre: string | null;
  duracion_minutos: number | null;
  siguiente_accion: string | null;
  fecha_siguiente_accion: string | null;
  created_by: string | null;
  created_at: string;
}

export type CSTouchpointInsert = {
  queja_id?: string;
  cliente_id: string;
  tipo: string;
  direccion: string;
  resumen: string;
  contacto_nombre?: string;
  duracion_minutos?: number;
  siguiente_accion?: string;
  fecha_siguiente_accion?: string;
};

export function useCSTouchpoints(filters?: { queja_id?: string; cliente_id?: string }) {
  return useQuery({
    queryKey: ['cs-touchpoints', filters],
    queryFn: async () => {
      let query = supabase
        .from('cs_touchpoints')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.queja_id) query = query.eq('queja_id', filters.queja_id);
      if (filters?.cliente_id) query = query.eq('cliente_id', filters.cliente_id);

      const { data, error } = await query;
      if (error) throw error;
      return data as CSTouchpoint[];
    },
  });
}

export function useCreateCSTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CSTouchpointInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('cs_touchpoints')
        .insert({ ...input, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-touchpoints'] });
      toast.success('Touchpoint registrado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
