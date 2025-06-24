
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Proveedor } from '@/types/wms';

export const useProveedores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proveedores, isLoading, error } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as Proveedor[];
    }
  });

  const createProveedor = useMutation({
    mutationFn: async (proveedor: Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('proveedores')
        .insert(proveedor)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast({
        title: "Proveedor creado",
        description: "El proveedor ha sido registrado exitosamente.",
      });
    }
  });

  const updateProveedor = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proveedor> & { id: string }) => {
      const { data, error } = await supabase
        .from('proveedores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast({
        title: "Proveedor actualizado",
        description: "Los cambios han sido guardados.",
      });
    }
  });

  return {
    proveedores,
    isLoading,
    error,
    createProveedor,
    updateProveedor
  };
};
