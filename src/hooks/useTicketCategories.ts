import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TicketCategoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string;
  color: string;
  departamento_responsable: string;
  sla_horas_respuesta: number;
  sla_horas_resolucion: number;
  requiere_monto: boolean;
  requiere_servicio: boolean;
  activo: boolean;
  orden: number;
}

export interface TicketSubcategoria {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  plantilla_respuesta: string | null;
  activo: boolean;
  orden: number;
}

export const useTicketCategories = () => {
  const [categorias, setCategorias] = useState<TicketCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<TicketSubcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      const [categoriasRes, subcategoriasRes] = await Promise.all([
        supabase
          .from('ticket_categorias_custodio')
          .select('*')
          .eq('activo', true)
          .order('orden'),
        supabase
          .from('ticket_subcategorias_custodio')
          .select('*')
          .eq('activo', true)
          .order('orden')
      ]);

      if (categoriasRes.error) throw categoriasRes.error;
      if (subcategoriasRes.error) throw subcategoriasRes.error;

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
    } catch (error) {
      console.error('Error loading ticket categories:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubcategoriasByCategoria = (categoriaId: string) => {
    return subcategorias.filter(sub => sub.categoria_id === categoriaId);
  };

  const getCategoriaById = (id: string) => {
    return categorias.find(cat => cat.id === id);
  };

  const getSubcategoriaById = (id: string) => {
    return subcategorias.find(sub => sub.id === id);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categorias,
    subcategorias,
    loading,
    getSubcategoriasByCategoria,
    getCategoriaById,
    getSubcategoriaById,
    refetch: loadCategories
  };
};
