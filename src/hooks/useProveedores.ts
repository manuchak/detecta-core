// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Proveedor {
  id: string;
  nombre: string;
  razon_social?: string;
  rfc?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  contacto_principal?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  terminos_pago?: string;
  descuento_general?: number;
  dias_credito?: number;
  limite_credito?: number;
  calificacion?: number;
  notas?: string;
  activo?: boolean;
  created_at: string;
  updated_at: string;
}

export const useProveedores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proveedores, isLoading, error } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el proveedor.",
        variant: "destructive",
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

  const deleteProveedor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado del sistema.",
      });
    }
  });

  return {
    proveedores,
    isLoading,
    error,
    createProveedor,
    updateProveedor,
    deleteProveedor
  };
};