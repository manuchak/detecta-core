import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InstalacionCandidato {
  id: string;
  candidato_id: string;
  tipo_contexto: 'custodio';
  instalador_id?: string;
  fecha_programada: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado: 'pendiente' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada';
  direccion_instalacion?: string;
  notas?: string;
  fecha_completada?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  instalador?: {
    id: string;
    nombre: string;
    telefono?: string;
  };
  candidato?: {
    id: string;
    nombre: string;
    telefono?: string;
  };
}

export const useProgramacionInstalacionesCandidato = (candidatoId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch instalaciones del candidato
  const { data: instalaciones, isLoading } = useQuery({
    queryKey: ['instalaciones-candidato', candidatoId],
    queryFn: async () => {
      if (!candidatoId) return [];

      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .select(`
          *,
          instalador:instaladores(id, nombre, telefono),
          candidato:candidatos_custodios(id, nombre, telefono)
        `)
        .eq('candidato_id', candidatoId)
        .eq('tipo_contexto', 'custodio')
        .order('fecha_programada', { ascending: false });

      if (error) throw error;
      return data as InstalacionCandidato[];
    },
    enabled: !!candidatoId
  });

  // Crear instalación para candidato
  const createInstalacion = useMutation({
    mutationFn: async (data: {
      candidato_id: string;
      instalador_id?: string;
      fecha_programada: string;
      hora_inicio?: string;
      hora_fin?: string;
      direccion_instalacion?: string;
      notas?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('programacion_instalaciones')
        .insert({
          ...data,
          tipo_contexto: 'custodio',
          estado: 'pendiente'
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalaciones-candidato', candidatoId] });
      toast({ title: 'Instalación programada', description: 'Se ha agendado la instalación correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Actualizar estado de instalación
  const updateEstado = useMutation({
    mutationFn: async ({ 
      instalacionId, 
      estado,
      fecha_completada
    }: { 
      instalacionId: string; 
      estado: InstalacionCandidato['estado'];
      fecha_completada?: string;
    }) => {
      const updates: Record<string, unknown> = { estado };
      if (fecha_completada) updates.fecha_completada = fecha_completada;

      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .update(updates)
        .eq('id', instalacionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['instalaciones-candidato', candidatoId] });
      queryClient.invalidateQueries({ queryKey: ['custodio-liberacion'] });
      
      if (variables.estado === 'completada') {
        toast({ 
          title: 'Instalación completada', 
          description: 'El estado de liberación se actualizará automáticamente' 
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Obtener última instalación
  const ultimaInstalacion = instalaciones?.[0];
  const instalacionCompletada = ultimaInstalacion?.estado === 'completada';

  return {
    instalaciones,
    isLoading,
    createInstalacion,
    updateEstado,
    ultimaInstalacion,
    instalacionCompletada
  };
};
