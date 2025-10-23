import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BaseProveedor {
  id: string;
  proveedor_id: string;
  nombre_base: string;
  ciudad: string;
  direccion_completa: string;
  codigo_postal?: string;
  coordenadas_lat?: number;
  coordenadas_lng?: number;
  contacto_base?: string;
  telefono_base?: string;
  horario_operacion?: string;
  capacidad_armados: number;
  es_base_principal: boolean;
  activa: boolean;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBaseData {
  proveedor_id: string;
  nombre_base: string;
  ciudad: string;
  direccion_completa: string;
  codigo_postal?: string;
  coordenadas_lat?: number;
  coordenadas_lng?: number;
  contacto_base?: string;
  telefono_base?: string;
  horario_operacion?: string;
  capacidad_armados?: number;
  es_base_principal?: boolean;
  observaciones?: string;
}

export function useBasesProveedores(proveedorId?: string) {
  const [bases, setBases] = useState<BaseProveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBases = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('bases_proveedores_armados')
        .select('*')
        .order('ciudad', { ascending: true })
        .order('nombre_base', { ascending: true });

      if (proveedorId) {
        query = query.eq('proveedor_id', proveedorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading bases:', error);
        throw error;
      }

      setBases(data || []);
    } catch (error: any) {
      console.error('Error in useBasesProveedores:', error);
      setError(error.message || 'Error al cargar bases');
      toast.error('Error al cargar bases de proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBases();
  }, [proveedorId]);

  const createBase = async (baseData: CreateBaseData) => {
    try {
      const { data, error } = await supabase
        .from('bases_proveedores_armados')
        .insert({
          ...baseData,
          activa: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating base:', error);
        throw error;
      }

      toast.success('Base creada exitosamente');
      await loadBases();
      return data;
    } catch (error: any) {
      console.error('Error in createBase:', error);
      toast.error('Error al crear base');
      throw error;
    }
  };

  const updateBase = async (id: string, updates: Partial<BaseProveedor>) => {
    try {
      const { data, error } = await supabase
        .from('bases_proveedores_armados')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating base:', error);
        throw error;
      }

      toast.success('Base actualizada exitosamente');
      await loadBases();
      return data;
    } catch (error: any) {
      console.error('Error in updateBase:', error);
      toast.error('Error al actualizar base');
      throw error;
    }
  };

  const deleteBase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bases_proveedores_armados')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting base:', error);
        throw error;
      }

      toast.success('Base eliminada exitosamente');
      await loadBases();
      return true;
    } catch (error: any) {
      console.error('Error in deleteBase:', error);
      toast.error('Error al eliminar base');
      return false;
    }
  };

  const toggleBaseStatus = async (id: string, activa: boolean) => {
    try {
      await updateBase(id, { activa });
      toast.success(`Base ${activa ? 'activada' : 'desactivada'} exitosamente`);
    } catch (error: any) {
      console.error('Error toggling base status:', error);
      toast.error('Error al cambiar estado de la base');
    }
  };

  const setBasePrincipal = async (proveedorId: string, baseId: string) => {
    try {
      // Primero, desmarcar todas las bases principales del proveedor
      await supabase
        .from('bases_proveedores_armados')
        .update({ es_base_principal: false })
        .eq('proveedor_id', proveedorId);

      // Luego marcar la nueva base como principal
      await updateBase(baseId, { es_base_principal: true });
      
      toast.success('Base principal actualizada');
    } catch (error: any) {
      console.error('Error setting base principal:', error);
      toast.error('Error al establecer base principal');
    }
  };

  return {
    bases,
    loading,
    error,
    createBase,
    updateBase,
    deleteBase,
    toggleBaseStatus,
    setBasePrincipal,
    refetch: loadBases
  };
}

export default useBasesProveedores;
