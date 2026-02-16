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
  estado: string;
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

export function useOverdueTouchpoints() {
  return useQuery({
    queryKey: ['cs-touchpoints-overdue'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('cs_touchpoints')
        .select('id, cliente_id, siguiente_accion, fecha_siguiente_accion')
        .eq('estado', 'pendiente')
        .lt('fecha_siguiente_accion', today)
        .not('fecha_siguiente_accion', 'is', null);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateCSTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CSTouchpointInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      // If there's a next action, set estado to pendiente
      const estado = input.siguiente_accion ? 'pendiente' : 'completado';
      const { data, error } = await supabase
        .from('cs_touchpoints')
        .insert({ ...input, estado, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-touchpoints'] });
      qc.invalidateQueries({ queryKey: ['cs-touchpoints-overdue'] });
      qc.invalidateQueries({ queryKey: ['cs-cartera'] });
      toast.success('Touchpoint registrado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useCompleteTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cs_touchpoints')
        .update({ estado: 'completado' } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-touchpoints'] });
      qc.invalidateQueries({ queryKey: ['cs-touchpoints-overdue'] });
      toast.success('Touchpoint completado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useRescheduleTouchpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fecha }: { id: string; fecha: string }) => {
      const { error } = await supabase
        .from('cs_touchpoints')
        .update({ fecha_siguiente_accion: fecha, estado: 'pendiente' } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cs-touchpoints'] });
      qc.invalidateQueries({ queryKey: ['cs-touchpoints-overdue'] });
      toast.success('Seguimiento reprogramado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
