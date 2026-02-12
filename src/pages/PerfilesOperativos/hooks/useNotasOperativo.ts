import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

export interface NotaOperativo {
  id: string;
  operativo_id: string;
  operativo_tipo: string;
  contenido: string;
  categoria: 'general' | 'incidencia' | 'acuerdo' | 'seguimiento';
  prioridad: 'baja' | 'media' | 'alta';
  autor_id: string;
  autor_nombre: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type NotaCategoria = NotaOperativo['categoria'];
export type NotaPrioridad = NotaOperativo['prioridad'];

interface CreateNotaInput {
  contenido: string;
  categoria: NotaCategoria;
  prioridad: NotaPrioridad;
}

interface UpdateNotaInput {
  id: string;
  contenido: string;
  categoria: NotaCategoria;
  prioridad: NotaPrioridad;
}

export function useNotasOperativo(operativoId: string, operativoTipo: string) {
  const queryClient = useQueryClient();
  const { user } = useStableAuth();
  const queryKey = ['notas-operativo', operativoId, operativoTipo];

  const notasQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas_operativos')
        .select('*')
        .eq('operativo_id', operativoId)
        .eq('operativo_tipo', operativoTipo)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NotaOperativo[];
    },
    enabled: !!operativoId,
  });

  const crearNota = useMutation({
    mutationFn: async (input: CreateNotaInput) => {
      const autorNombre = user?.user_metadata?.display_name || user?.email || 'Usuario';
      const { data, error } = await supabase
        .from('notas_operativos')
        .insert({
          operativo_id: operativoId,
          operativo_tipo: operativoTipo,
          contenido: input.contenido,
          categoria: input.categoria,
          prioridad: input.prioridad,
          autor_id: user!.id,
          autor_nombre: autorNombre,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const editarNota = useMutation({
    mutationFn: async (input: UpdateNotaInput) => {
      const { data, error } = await supabase
        .from('notas_operativos')
        .update({
          contenido: input.contenido,
          categoria: input.categoria,
          prioridad: input.prioridad,
        })
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const eliminarNota = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notas_operativos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('notas_operativos')
        .update({ is_pinned: !is_pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    notas: notasQuery.data || [],
    isLoading: notasQuery.isLoading,
    crearNota,
    editarNota,
    eliminarNota,
    togglePin,
  };
}
