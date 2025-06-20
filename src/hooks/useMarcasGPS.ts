
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MarcaGPS } from '@/types/wms';

export const useMarcasGPS = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: marcas, isLoading, error } = useQuery({
    queryKey: ['marcas-gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcas_gps')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as MarcaGPS[];
    }
  });

  const createMarca = useMutation({
    mutationFn: async (marca: Omit<MarcaGPS, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('marcas_gps')
        .insert(marca)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas-gps'] });
      toast({
        title: "Marca creada",
        description: "La marca de GPS ha sido registrada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la marca.",
        variant: "destructive",
      });
    }
  });

  const updateMarca = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarcaGPS> & { id: string }) => {
      const { data, error } = await supabase
        .from('marcas_gps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas-gps'] });
      toast({
        title: "Marca actualizada",
        description: "Los cambios han sido guardados.",
      });
    }
  });

  return {
    marcas,
    isLoading,
    error,
    createMarca,
    updateMarca
  };
};
