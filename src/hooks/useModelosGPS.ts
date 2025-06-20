
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ModeloGPS } from '@/types/wms';

export const useModelosGPS = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modelos, isLoading, error } = useQuery({
    queryKey: ['modelos-gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .select(`
          *,
          marca:marcas_gps(*)
        `)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as ModeloGPS[];
    }
  });

  const getModelosByMarca = useQuery({
    queryKey: ['modelos-gps-by-marca'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .select(`
          *,
          marca:marcas_gps(*)
        `)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      
      // Agrupar por marca
      const modelosPorMarca: Record<string, ModeloGPS[]> = {};
      (data as ModeloGPS[]).forEach(modelo => {
        const marcaId = modelo.marca_id;
        if (!modelosPorMarca[marcaId]) {
          modelosPorMarca[marcaId] = [];
        }
        modelosPorMarca[marcaId].push(modelo);
      });
      
      return modelosPorMarca;
    }
  });

  const createModelo = useMutation({
    mutationFn: async (modelo: Omit<ModeloGPS, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .insert(modelo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-gps'] });
      queryClient.invalidateQueries({ queryKey: ['modelos-gps-by-marca'] });
      toast({
        title: "Modelo creado",
        description: "El modelo de GPS ha sido registrado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el modelo.",
        variant: "destructive",
      });
    }
  });

  const updateModelo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ModeloGPS> & { id: string }) => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-gps'] });
      queryClient.invalidateQueries({ queryKey: ['modelos-gps-by-marca'] });
      toast({
        title: "Modelo actualizado",
        description: "Los cambios han sido guardados.",
      });
    }
  });

  return {
    modelos,
    modelosPorMarca: getModelosByMarca.data,
    isLoading,
    error,
    createModelo,
    updateModelo
  };
};
