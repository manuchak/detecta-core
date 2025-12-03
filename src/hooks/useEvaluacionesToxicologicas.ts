import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EvaluacionToxicologica {
  id: string;
  candidato_id: string;
  registrado_por: string;
  resultado: 'negativo' | 'positivo';
  laboratorio: string | null;
  fecha_muestra: string | null;
  fecha_resultados: string | null;
  sustancias_detectadas: string[] | null;
  archivo_url: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  registrador?: { display_name: string };
}

export interface CreateToxicologiaData {
  candidato_id: string;
  resultado: 'negativo' | 'positivo';
  laboratorio?: string;
  fecha_muestra?: string;
  fecha_resultados?: string;
  sustancias_detectadas?: string[];
  archivo_url?: string;
  notas?: string;
}

export const useEvaluacionesToxicologicas = (candidatoId: string) => {
  return useQuery({
    queryKey: ['evaluaciones-toxicologicas', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluaciones_toxicologicas')
        .select(`
          *,
          registrador:registrado_por(display_name)
        `)
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EvaluacionToxicologica[];
    },
    enabled: !!candidatoId,
  });
};

export const useLatestToxicologia = (candidatoId: string) => {
  return useQuery({
    queryKey: ['toxicologia-latest', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluaciones_toxicologicas')
        .select(`
          *,
          registrador:registrado_por(display_name)
        `)
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EvaluacionToxicologica | null;
    },
    enabled: !!candidatoId,
  });
};

export const useCreateToxicologia = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateToxicologiaData) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { data: result, error } = await supabase
        .from('evaluaciones_toxicologicas')
        .insert({
          ...data,
          registrado_por: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluaciones-toxicologicas', variables.candidato_id] });
      queryClient.invalidateQueries({ queryKey: ['toxicologia-latest', variables.candidato_id] });
      toast.success('Resultado toxicológico registrado');
    },
    onError: (error) => {
      console.error('Error creating toxicologia:', error);
      toast.error('Error al registrar resultado');
    },
  });
};
