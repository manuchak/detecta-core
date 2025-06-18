
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Instalador, CreateInstaladorData } from '@/types/instaladores';

export const useInstaladores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todos los instaladores
  const { data: instaladores, isLoading: isLoadingInstaladores } = useQuery({
    queryKey: ['instaladores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instaladores')
        .select('*')
        .order('calificacion_promedio', { ascending: false });

      if (error) throw error;
      return data as Instalador[];
    }
  });

  // Obtener instaladores activos
  const { data: instaladoresActivos } = useQuery({
    queryKey: ['instaladores-activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instaladores')
        .select('*')
        .eq('estado_afiliacion', 'activo')
        .eq('documentacion_completa', true)
        .order('calificacion_promedio', { ascending: false });

      if (error) throw error;
      return data as Instalador[];
    }
  });

  // Crear nuevo instalador
  const createInstalador = useMutation({
    mutationFn: async (data: CreateInstaladorData) => {
      const { data: result, error } = await supabase
        .from('instaladores')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instaladores'] });
      queryClient.invalidateQueries({ queryKey: ['instaladores-activos'] });
      toast({
        title: "Instalador registrado",
        description: "El instalador ha sido registrado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el instalador.",
        variant: "destructive",
      });
      console.error('Error creating installer:', error);
    }
  });

  // Actualizar instalador
  const updateInstalador = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Instalador> }) => {
      const { data: result, error } = await supabase
        .from('instaladores')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instaladores'] });
      queryClient.invalidateQueries({ queryKey: ['instaladores-activos'] });
      toast({
        title: "Instalador actualizado",
        description: "Los datos del instalador han sido actualizados.",
      });
    }
  });

  // Cambiar estado de afiliación
  const cambiarEstadoAfiliacion = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { data, error } = await supabase
        .from('instaladores')
        .update({ estado_afiliacion: estado })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instaladores'] });
      queryClient.invalidateQueries({ queryKey: ['instaladores-activos'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del instalador ha sido actualizado.",
      });
    }
  });

  return {
    instaladores,
    instaladoresActivos,
    isLoadingInstaladores,
    createInstalador,
    updateInstalador,
    cambiarEstadoAfiliacion
  };
};
