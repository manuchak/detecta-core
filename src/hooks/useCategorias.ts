
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CategoriaProducto } from '@/types/wms';

// Categorías predefinidas para el sistema
const categoriasDefault: Omit<CategoriaProducto, 'id' | 'created_at'>[] = [
  { nombre: 'GPS Tracking', descripcion: 'Dispositivos GPS para rastreo vehicular', codigo: 'GPS', activo: true },
  { nombre: 'GPS Personal', descripcion: 'Dispositivos GPS para rastreo personal', codigo: 'GPS-PER', activo: true },
  { nombre: 'GPS Industrial', descripcion: 'Dispositivos GPS para uso industrial', codigo: 'GPS-IND', activo: true },
  { nombre: 'Accesorios GPS', descripcion: 'Accesorios y complementos para GPS', codigo: 'ACC-GPS', activo: true },
  { nombre: 'Sensores', descripcion: 'Sensores diversos para monitoreo', codigo: 'SENS', activo: true },
  { nombre: 'Antenas', descripcion: 'Antenas para dispositivos GPS', codigo: 'ANT', activo: true },
  { nombre: 'Cables y Conectores', descripcion: 'Cables y conectores para instalación', codigo: 'CAB', activo: true },
  { nombre: 'Herramientas', descripcion: 'Herramientas para instalación', codigo: 'HER', activo: true },
  { nombre: 'Software', descripcion: 'Licencias y software de monitoreo', codigo: 'SW', activo: true },
  { nombre: 'Servicios', descripcion: 'Servicios de instalación y mantenimiento', codigo: 'SRV', activo: true }
];

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

  const initializeCategorias = useMutation({
    mutationFn: async () => {
      // Verificar si ya hay categorías
      const { data: existingCategorias } = await supabase
        .from('categorias_productos')
        .select('id')
        .limit(1);

      if (!existingCategorias || existingCategorias.length === 0) {
        const { data, error } = await supabase
          .from('categorias_productos')
          .insert(categoriasDefault)
          .select();

        if (error) throw error;
        return data;
      }
      return existingCategorias;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-productos'] });
      toast({
        title: "Categorías inicializadas",
        description: "Las categorías han sido cargadas en la base de datos.",
      });
    }
  });

  return {
    categorias,
    isLoading,
    error,
    createCategoria,
    initializeCategorias
  };
};
