import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProveedorArmado } from './useArmedGuardsOperativos';

export interface CreateProveedorData {
  nombre_empresa: string;
  rfc?: string;
  contacto_principal: string;
  telefono_contacto: string;
  email_contacto: string;
  zonas_cobertura: string[];
  servicios_disponibles: string[];
  capacidad_maxima: number;
  disponibilidad_24h: boolean;
  tiempo_respuesta_promedio?: number;
  observaciones?: string;
}

export interface UpdateProveedorData extends Partial<CreateProveedorData> {
  id: string;
  activo?: boolean;
  licencias_vigentes?: boolean;
  documentos_completos?: boolean;
  documentacion_legal?: string[];
}

export function useProveedoresArmados() {
  const [proveedores, setProveedores] = useState<ProveedorArmado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProveedores = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('proveedores_armados')
        .select('*')
        .order('nombre_empresa', { ascending: true });

      if (error) {
        console.error('Error loading providers:', error);
        throw error;
      }

      setProveedores(data || []);
    } catch (error: any) {
      console.error('Error in useProveedoresArmados:', error);
      setError(error.message || 'Error al cargar proveedores');
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  const createProveedor = async (proveedorData: CreateProveedorData) => {
    try {
      const { data, error } = await supabase
        .from('proveedores_armados')
        .insert({
          ...proveedorData,
          rating_proveedor: 0,
          tasa_confirmacion_empresa: 0,
          numero_servicios_empresa: 0,
          capacidad_actual: 0,
          activo: true,
          licencias_vigentes: true,
          documentos_completos: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating provider:', error);
        throw error;
      }

      toast.success('Proveedor creado exitosamente');
      await loadProveedores();
      return data;
    } catch (error: any) {
      console.error('Error in createProveedor:', error);
      toast.error('Error al crear proveedor');
      throw error;
    }
  };

  const updateProveedor = async (proveedorData: UpdateProveedorData) => {
    try {
      const { id, ...updateData } = proveedorData;
      
      const { data, error } = await supabase
        .from('proveedores_armados')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating provider:', error);
        throw error;
      }

      toast.success('Proveedor actualizado exitosamente');
      await loadProveedores();
      return data;
    } catch (error: any) {
      console.error('Error in updateProveedor:', error);
      toast.error('Error al actualizar proveedor');
      throw error;
    }
  };

  const deleteProveedor = async (id: string) => {
    try {
      // Check if provider has active guards assigned
      const { data: activeGuards, error: checkError } = await supabase
        .from('armados_operativos')
        .select('id')
        .eq('proveedor_id', id)
        .eq('estado', 'activo')
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (activeGuards && activeGuards.length > 0) {
        toast.error('No se puede eliminar el proveedor porque tiene armados activos asignados');
        return false;
      }

      const { error } = await supabase
        .from('proveedores_armados')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting provider:', error);
        throw error;
      }

      toast.success('Proveedor eliminado exitosamente');
      await loadProveedores();
      return true;
    } catch (error: any) {
      console.error('Error in deleteProveedor:', error);
      toast.error('Error al eliminar proveedor');
      return false;
    }
  };

  const toggleProveedorStatus = async (id: string, activo: boolean) => {
    try {
      await updateProveedor({ id, activo });
      toast.success(`Proveedor ${activo ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error: any) {
      console.error('Error toggling provider status:', error);
      toast.error('Error al cambiar estado del proveedor');
    }
  };

  const updateProveedorDocumentStatus = async (
    id: string, 
    licencias_vigentes: boolean, 
    documentos_completos: boolean,
    documentacion_legal?: string[]
  ) => {
    try {
      await updateProveedor({ 
        id, 
        licencias_vigentes, 
        documentos_completos, 
        documentacion_legal 
      });
      toast.success('Estado de documentación actualizado');
    } catch (error: any) {
      console.error('Error updating document status:', error);
      toast.error('Error al actualizar documentación');
    }
  };

  const getProveedorFinancialMetrics = async (proveedorId: string) => {
    try {
      const { data: asignaciones, error } = await supabase
        .from('asignacion_armados')
        .select('tarifa_acordada, estado_pago, moneda')
        .eq('proveedor_armado_id', proveedorId)
        .eq('tipo_asignacion', 'proveedor')
        .eq('estado_asignacion', 'completado');

      if (error) {
        console.error('Error fetching financial metrics:', error);
        throw error;
      }

      const total_servicios = asignaciones?.length || 0;
      const monto_total_pendiente = asignaciones
        ?.filter(a => a.estado_pago === 'pendiente')
        .reduce((sum, a) => sum + (Number(a.tarifa_acordada) || 0), 0) || 0;
      const monto_total_pagado = asignaciones
        ?.filter(a => a.estado_pago === 'pagado')
        .reduce((sum, a) => sum + (Number(a.tarifa_acordada) || 0), 0) || 0;
      const monto_en_proceso = asignaciones
        ?.filter(a => a.estado_pago === 'en_proceso')
        .reduce((sum, a) => sum + (Number(a.tarifa_acordada) || 0), 0) || 0;

      return {
        total_servicios,
        monto_total_pendiente,
        monto_total_pagado,
        monto_en_proceso,
      };
    } catch (error: any) {
      console.error('Error in getProveedorFinancialMetrics:', error);
      return {
        total_servicios: 0,
        monto_total_pendiente: 0,
        monto_total_pagado: 0,
        monto_en_proceso: 0,
      };
    }
  };

  return {
    proveedores,
    loading,
    error,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    toggleProveedorStatus,
    updateProveedorDocumentStatus,
    getProveedorFinancialMetrics,
    refetch: loadProveedores
  };
}

export default useProveedoresArmados;