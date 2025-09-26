import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ArmedIndisponibilidad {
  id: string;
  armado_id: string;
  tipo: string;
  motivo?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
  created_at: string;
  
  // Computed fields
  armado_nombre?: string;
  dias_restantes?: number;
  esta_activa?: boolean;
}

export interface CreateArmedIndisponibilidadData {
  armado_id: string;
  tipo: 'temporal' | 'indefinida' | 'medica' | 'personal' | 'administrativa';
  motivo?: string;
  fecha_inicio: string;
  fecha_fin?: string;
}

export function useArmedIndisponibilidades() {
  const [indisponibilidades, setIndisponibilidades] = useState<ArmedIndisponibilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIndisponibilidades = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading armed indisponibilidades...');

      const { data, error: queryError } = await supabase
        .from('armados_indisponibilidades')
        .select(`
          *,
          armados_operativos(nombre)
        `)
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error loading armed indisponibilidades:', queryError);
        throw queryError;
      }

      // Process data and compute fields
      const processedData = (data || []).map(item => {
        const fechaInicio = new Date(item.fecha_inicio);
        const fechaFin = item.fecha_fin ? new Date(item.fecha_fin) : null;
        const hoy = new Date();
        
        // Calculate remaining days
        const diasRestantes = fechaFin ? 
          Math.max(0, Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))) : 
          null;

        // Check if currently active
        const estaActiva = item.activo && 
          fechaInicio <= hoy && 
          (!fechaFin || fechaFin >= hoy);

        return {
          ...item,
          armado_nombre: (item.armados_operativos as any)?.nombre || 'Sin nombre',
          dias_restantes: diasRestantes,
          esta_activa: estaActiva
        };
      });

      console.log(`Loaded ${processedData.length} armed indisponibilidades`);
      setIndisponibilidades(processedData);

    } catch (error: any) {
      console.error('Error in useArmedIndisponibilidades:', error);
      setError(error.message || 'Error al cargar indisponibilidades');
      toast.error('Error al cargar indisponibilidades de armados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndisponibilidades();
  }, []);

  const createIndisponibilidad = async (data: CreateArmedIndisponibilidadData) => {
    try {
      console.log('Creating armed indisponibilidad:', data);

      const { error: insertError } = await supabase
        .from('armados_indisponibilidades')
        .insert({
          armado_id: data.armado_id,
          tipo: data.tipo,
          motivo: data.motivo,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          activo: true
        });

      if (insertError) {
        console.error('Error creating armed indisponibilidad:', insertError);
        throw insertError;
      }

      toast.success('Indisponibilidad registrada correctamente');
      await loadIndisponibilidades(); // Refresh list

      return true;
    } catch (error: any) {
      console.error('Error creating armed indisponibilidad:', error);
      toast.error('Error al registrar indisponibilidad');
      return false;
    }
  };

  const updateIndisponibilidad = async (id: string, updates: Partial<ArmedIndisponibilidad>) => {
    try {
      console.log('Updating armed indisponibilidad:', id, updates);

      const { error: updateError } = await supabase
        .from('armados_indisponibilidades')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating armed indisponibilidad:', updateError);
        throw updateError;
      }

      toast.success('Indisponibilidad actualizada correctamente');
      await loadIndisponibilidades(); // Refresh list

      return true;
    } catch (error: any) {
      console.error('Error updating armed indisponibilidad:', error);
      toast.error('Error al actualizar indisponibilidad');
      return false;
    }
  };

  const deactivateIndisponibilidad = async (id: string) => {
    return updateIndisponibilidad(id, { activo: false });
  };

  const reactivateIndisponibilidad = async (id: string) => {
    return updateIndisponibilidad(id, { activo: true });
  };

  const deleteIndisponibilidad = async (id: string) => {
    try {
      console.log('Deleting armed indisponibilidad:', id);

      const { error: deleteError } = await supabase
        .from('armados_indisponibilidades')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting armed indisponibilidad:', deleteError);
        throw deleteError;
      }

      toast.success('Indisponibilidad eliminada correctamente');
      await loadIndisponibilidades(); // Refresh list

      return true;
    } catch (error: any) {
      console.error('Error deleting armed indisponibilidad:', error);
      toast.error('Error al eliminar indisponibilidad');
      return false;
    }
  };

  // Utility function to check if an armed guard is currently unavailable
  const isArmedCurrentlyUnavailable = (armadoId: string): boolean => {
    return indisponibilidades.some(indis => 
      indis.armado_id === armadoId && indis.esta_activa
    );
  };

  // Get active indisponibilidades for a specific armed guard
  const getActiveIndisponibilidadesForArmed = (armadoId: string): ArmedIndisponibilidad[] => {
    return indisponibilidades.filter(indis => 
      indis.armado_id === armadoId && indis.esta_activa
    );
  };

  // Get all currently active indisponibilidades
  const activeIndisponibilidades = indisponibilidades.filter(indis => indis.esta_activa);

  // Get indisponibilidades expiring soon (next 3 days)
  const expiringSoonIndisponibilidades = indisponibilidades.filter(indis => 
    indis.esta_activa && 
    indis.dias_restantes !== null && 
    indis.dias_restantes <= 3
  );

  return {
    indisponibilidades,
    activeIndisponibilidades,
    expiringSoonIndisponibilidades,
    loading,
    error,
    createIndisponibilidad,
    updateIndisponibilidad,
    deactivateIndisponibilidad,
    reactivateIndisponibilidad,
    deleteIndisponibilidad,
    isArmedCurrentlyUnavailable,
    getActiveIndisponibilidadesForArmed,
    refetch: loadIndisponibilidades
  };
}