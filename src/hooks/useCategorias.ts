
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CategoriaProducto } from '@/types/wms';

export const useCategorias = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categorias, isLoading, error } = useQuery({
    queryKey: ['categorias-productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as CategoriaProducto[];
    }
  });

  const createCategoria = useMutation({
    mutationFn: async (categoria: Omit<CategoriaProducto, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('categorias_productos')
        .insert(categoria)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-productos'] });
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido registrada exitosamente.",
      });
    }
  });

  return {
    categorias,
    isLoading,
    error,
    createCategoria
  };
};
