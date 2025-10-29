import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PersonalProveedorArmado {
  id: string;
  proveedor_id: string;
  nombre_completo: string;
  cedula_rfc?: string;
  telefono_personal?: string;
  email_personal?: string;
  licencia_portacion?: string;
  vigencia_licencia?: string;
  documento_identidad?: string;
  foto_perfil_url?: string;
  estado_verificacion: 'pendiente' | 'verificado' | 'rechazado';
  fecha_ultima_verificacion?: string;
  activo: boolean;
  disponible_para_servicios: boolean;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificacionLicencia {
  valida: boolean;
  dias_vencimiento?: number;
  nivel_alerta?: 'baja' | 'media' | 'alta' | 'critica' | 'vencida';
  fecha_vencimiento?: string;
  nombre_completo?: string;
  licencia_portacion?: string;
  error?: string;
}

export interface CreatePersonalData {
  proveedor_id: string;
  nombre_completo: string;
  cedula_rfc?: string;
  telefono_personal?: string;
  email_personal?: string;
  licencia_portacion?: string;
  vigencia_licencia?: string;
  documento_identidad?: string;
  observaciones?: string;
  estado_verificacion?: 'pendiente' | 'verificado' | 'rechazado';
  disponible_para_servicios?: boolean;
  activo?: boolean;
}

export function usePersonalProveedorArmados() {
  const [personal, setPersonal] = useState<PersonalProveedorArmado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPersonal = async (proveedorId?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('personal_proveedor_armados')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (proveedorId) {
        query = query.eq('proveedor_id', proveedorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading personal:', error);
        throw error;
      }

      setPersonal(data || []);
    } catch (error: any) {
      console.error('Error in usePersonalProveedorArmados:', error);
      setError(error.message || 'Error al cargar personal');
      toast.error('Error al cargar personal del proveedor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonal();
  }, []);

  const createPersonal = async (personalData: CreatePersonalData) => {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const dataToInsert = {
        ...personalData,
        estado_verificacion: personalData.estado_verificacion || 'verificado',
        disponible_para_servicios: personalData.disponible_para_servicios ?? true,
        activo: personalData.activo ?? true,
        observaciones: personalData.observaciones || 'Personal de proveedor externo',
        created_by: user.id,
        updated_by: user.id
      };

      const { data, error } = await supabase
        .from('personal_proveedor_armados')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating personal:', error);
        throw error;
      }

      // Registrar en auditoría
      await supabase.from('asignacion_personal_externo_audit').insert({
        personal_id: data.id,
        proveedor_id: personalData.proveedor_id,
        accion: 'creado',
        nombre_completo: personalData.nombre_completo,
        realizado_por: user.id,
        metadata: {
          observaciones: personalData.observaciones
        }
      });

      toast.success('Personal agregado exitosamente');
      await loadPersonal();
      return data;
    } catch (error: any) {
      console.error('Error in createPersonal:', error);
      
      // Manejar error específico de permisos
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        toast.error('No tienes permisos para agregar personal. Se requiere rol de Planificador.');
      } else {
        toast.error('Error al agregar personal');
      }
      throw error;
    }
  };

  const updatePersonal = async (id: string, updates: Partial<PersonalProveedorArmado>) => {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const dataToUpdate = {
        ...updates,
        updated_by: user.id
      };

      const { data, error } = await supabase
        .from('personal_proveedor_armados')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating personal:', error);
        throw error;
      }

      // Registrar en auditoría
      await supabase.from('asignacion_personal_externo_audit').insert({
        personal_id: id,
        proveedor_id: data.proveedor_id,
        accion: 'actualizado',
        nombre_completo: data.nombre_completo,
        realizado_por: user.id,
        metadata: {
          cambios: updates
        }
      });

      toast.success('Personal actualizado exitosamente');
      await loadPersonal();
      return data;
    } catch (error: any) {
      console.error('Error in updatePersonal:', error);
      
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        toast.error('No tienes permisos para actualizar personal. Se requiere rol de Planificador.');
      } else {
        toast.error('Error al actualizar personal');
      }
      throw error;
    }
  };

  const verificarLicencia = async (personalId: string): Promise<VerificacionLicencia> => {
    try {
      const { data, error } = await supabase.rpc('verificar_licencia_vigente', {
        p_personal_id: personalId
      });

      if (error) {
        console.error('Error verifying license:', error);
        throw error;
      }

      return data as VerificacionLicencia;
    } catch (error: any) {
      console.error('Error in verificarLicencia:', error);
      return {
        valida: false,
        error: error.message || 'Error al verificar licencia'
      };
    }
  };

  const getPersonalByProveedor = (proveedorId: string) => {
    return personal.filter(p => p.proveedor_id === proveedorId && p.activo);
  };

  const getPersonalDisponible = (proveedorId: string) => {
    return personal.filter(p => 
      p.proveedor_id === proveedorId && 
      p.activo && 
      p.disponible_para_servicios &&
      p.estado_verificacion === 'verificado'
    );
  };

  const getAlertasLicencias = () => {
    return personal.filter(p => {
      if (!p.vigencia_licencia || !p.activo) return false;
      const diasVencimiento = Math.ceil(
        (new Date(p.vigencia_licencia).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return diasVencimiento <= 30;
    });
  };

  return {
    personal,
    loading,
    error,
    createPersonal,
    updatePersonal,
    verificarLicencia,
    getPersonalByProveedor,
    getPersonalDisponible,
    getAlertasLicencias,
    refetch: loadPersonal
  };
}

export default usePersonalProveedorArmados;