import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Referencia {
  id: string;
  candidato_id: string;
  validador_id: string | null;
  tipo_referencia: 'laboral' | 'personal';
  nombre_referencia: string;
  relacion: string | null;
  empresa_institucion: string | null;
  cargo_referencia: string | null;
  telefono: string | null;
  email: string | null;
  contactado: boolean;
  fecha_contacto: string | null;
  resultado: 'positiva' | 'negativa' | 'no_contactado' | 'invalida' | 'pendiente';
  comentarios_referencia: string | null;
  red_flags: string[] | null;
  calificacion: number | null;
  tiempo_conocido: string | null;
  notas_validador: string | null;
  created_at: string;
  updated_at: string;
  validador?: { display_name: string };
}

export interface CreateReferenciaData {
  candidato_id: string;
  tipo_referencia: 'laboral' | 'personal';
  nombre_referencia: string;
  relacion?: string;
  empresa_institucion?: string;
  cargo_referencia?: string;
  telefono?: string;
  email?: string;
  tiempo_conocido?: string;
}

export interface ValidateReferenciaData {
  id: string;
  resultado: 'positiva' | 'negativa' | 'no_contactado' | 'invalida';
  comentarios_referencia?: string;
  red_flags?: string[];
  calificacion?: number;
  notas_validador?: string;
}

export const useReferencias = (candidatoId: string) => {
  return useQuery({
    queryKey: ['referencias', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referencias_candidato')
        .select(`
          *,
          validador:validador_id(display_name)
        `)
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Referencia[];
    },
    enabled: !!candidatoId,
  });
};

export const useReferenciasProgress = (candidatoId: string) => {
  return useQuery({
    queryKey: ['referencias-progress', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referencias_candidato')
        .select('tipo_referencia, resultado')
        .eq('candidato_id', candidatoId);

      if (error) throw error;

      const laboralesOk = data?.filter(r => r.tipo_referencia === 'laboral' && r.resultado === 'positiva').length || 0;
      const personalesOk = data?.filter(r => r.tipo_referencia === 'personal' && r.resultado === 'positiva').length || 0;
      const totalRefs = data?.length || 0;
      const totalOk = laboralesOk + personalesOk;

      return {
        laboralesOk,
        personalesOk,
        totalRefs,
        totalOk,
        isComplete: laboralesOk >= 2 && personalesOk >= 2,
      };
    },
    enabled: !!candidatoId,
  });
};

export const useCreateReferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReferenciaData) => {
      const { data: result, error } = await supabase
        .from('referencias_candidato')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['referencias', variables.candidato_id] });
      queryClient.invalidateQueries({ queryKey: ['referencias-progress', variables.candidato_id] });
      toast.success('Referencia agregada');
    },
    onError: (error) => {
      console.error('Error creating referencia:', error);
      toast.error('Error al agregar referencia');
    },
  });
};

export const useValidateReferencia = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ValidateReferenciaData) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { data: result, error } = await supabase
        .from('referencias_candidato')
        .update({
          ...data,
          validador_id: user.id,
          contactado: true,
          fecha_contacto: new Date().toISOString(),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referencias'] });
      queryClient.invalidateQueries({ queryKey: ['referencias-progress'] });
      toast.success('Referencia validada');
    },
    onError: (error) => {
      console.error('Error validating referencia:', error);
      toast.error('Error al validar referencia');
    },
  });
};

export const useDeleteReferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('referencias_candidato')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referencias'] });
      queryClient.invalidateQueries({ queryKey: ['referencias-progress'] });
      toast.success('Referencia eliminada');
    },
    onError: (error) => {
      console.error('Error deleting referencia:', error);
      toast.error('Error al eliminar referencia');
    },
  });
};
