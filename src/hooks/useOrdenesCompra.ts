import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface OrdenCompra {
  id: string;
  numero_orden: string;
  proveedor_id?: string;
  estado: string;
  fecha_orden: string;
  fecha_entrega_esperada?: string;
  fecha_entrega_real?: string;
  subtotal: number;
  impuestos: number;
  total: number;
  notas?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  moneda?: string;
  proveedor?: {
    id: string;
    nombre: string;
    email?: string;
    telefono?: string;
    contacto_principal?: string;
  };
  detalles?: any[];
}

export const useOrdenesCompra = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const { data: ordenes, isLoading, error } = useQuery({
    queryKey: ['ordenes-compra'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching ordenes compra...');
        
        // Verificar sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Usuario no autenticado');
        }
        
        const { data, error } = await supabase
          .from('ordenes_compra')
          .select(`
            *,
            proveedor:proveedores(
              id,
              nombre,
              email,
              telefono
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Ordenes compra query error:', error);
          throw error;
        }
        
        console.log('✅ Ordenes compra fetched successfully:', data?.length || 0, 'records');
        return data as OrdenCompra[];
      } catch (err) {
        console.error('❌ Ordenes compra fetch error:', err);
        throw err;
      }
    },
    enabled: !!user && !authLoading, // Solo ejecutar si hay usuario autenticado
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const createOrden = useMutation({
    mutationFn: async (ordenData: any) => {
      // Generar número de orden automático
      const { count } = await supabase
        .from('ordenes_compra')
        .select('*', { count: 'exact', head: true });
      
      const numeroOrden = `OC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

      // Preparar datos para inserción usando solo campos válidos
      const dataToInsert = {
        numero_orden: numeroOrden,
        proveedor_id: ordenData.proveedor_id,
        estado: ordenData.estado || 'borrador',
        fecha_orden: ordenData.fecha_orden,
        fecha_entrega_esperada: ordenData.fecha_entrega_esperada,
        subtotal: ordenData.subtotal || 0,
        impuestos: ordenData.impuestos || 0,
        total: ordenData.total || 0,
        notas: ordenData.notas,
        created_by: ordenData.created_by
      };

      const { data, error } = await supabase
        .from('ordenes_compra')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      toast({
        title: "Orden de compra creada",
        description: "La orden ha sido registrada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error creating orden:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden de compra.",
        variant: "destructive",
      });
    }
  });

  const updateOrden = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('ordenes_compra')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      toast({
        title: "Orden actualizada",
        description: "Los cambios han sido guardados.",
      });
    }
  });

  const recibirOrden = useMutation({
    mutationFn: async ({ ordenId, detallesRecepcion }: { 
      ordenId: string; 
      detallesRecepcion: any[] 
    }) => {
      // Actualizar estado de la orden
      const { error: ordenError } = await supabase
        .from('ordenes_compra')
        .update({ 
          estado: 'recibida_completa',
          fecha_entrega_real: new Date().toISOString().split('T')[0]
        })
        .eq('id', ordenId);

      if (ordenError) throw ordenError;
      return { ordenId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      toast({
        title: "Recepción procesada",
        description: "La mercancía ha sido recibida.",
      });
    }
  });

  return {
    ordenes,
    isLoading: authLoading || isLoading,
    error,
    createOrden,
    updateOrden,
    recibirOrden
  };
};