import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReglaEstadia {
  id: string;
  cliente_id: string;
  tipo_servicio: string | null;
  ruta_patron: string | null;
  horas_cortesia: number;
  tarifa_hora_excedente: number;
  tarifa_pernocta: number;
  cobra_pernocta: boolean;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = 'reglas-estadias';

export function useReglasEstadias(clienteId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, clienteId],
    queryFn: async () => {
      let query = supabase
        .from('reglas_estadias_cliente')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ReglaEstadia[];
    },
    staleTime: 120_000,
  });
}

export function useCreateReglaEstadia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ReglaEstadia, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('reglas_estadias_cliente')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Regla de estadía creada');
    },
    onError: () => toast.error('Error al crear regla'),
  });
}

export function useUpdateReglaEstadia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ReglaEstadia> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('reglas_estadias_cliente')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Regla actualizada');
    },
    onError: () => toast.error('Error al actualizar regla'),
  });
}

export function useDeleteReglaEstadia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reglas_estadias_cliente')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Regla eliminada');
    },
    onError: () => toast.error('Error al eliminar regla'),
  });
}

/**
 * Resolves the most specific courtesy rule for a client + service type + route.
 * Priority: route-specific > type-specific > client default
 */
export function resolveReglaEstadia(
  reglas: ReglaEstadia[],
  tipoServicio?: string,
  ruta?: string
): ReglaEstadia | null {
  // 1. Exact match: tipo + ruta
  if (tipoServicio && ruta) {
    const exact = reglas.find(r => r.tipo_servicio === tipoServicio && r.ruta_patron === ruta);
    if (exact) return exact;
  }
  // 2. Type match only
  if (tipoServicio) {
    const typeMatch = reglas.find(r => r.tipo_servicio === tipoServicio && !r.ruta_patron);
    if (typeMatch) return typeMatch;
  }
  // 3. Client default (no tipo, no ruta)
  const defaultRule = reglas.find(r => !r.tipo_servicio && !r.ruta_patron);
  return defaultRule || null;
}
