/**
 * Hook for changing operative status with audit trail
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CambioEstatusParams {
  operativoId: string;
  operativoTipo: 'custodio' | 'armado';
  operativoNombre: string;
  estatusAnterior: string;
  estatusNuevo: 'activo' | 'inactivo';
  tipoCambio: 'temporal' | 'permanente' | 'reactivacion';
  motivo: string;
  fechaReactivacion?: Date;
  notas?: string;
}

export function useCambioEstatusOperativo() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const cambiarEstatus = async (params: CambioEstatusParams): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const {
        operativoId,
        operativoTipo,
        operativoNombre,
        estatusAnterior,
        estatusNuevo,
        tipoCambio,
        motivo,
        fechaReactivacion,
        notas,
      } = params;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Error de autenticación');
        return false;
      }

      // Determine table name
      const tableName = operativoTipo === 'custodio' 
        ? 'custodios_operativos' 
        : 'armados_operativos';

      // Update operative status
      const updateData: Record<string, any> = {
        estado: estatusNuevo,
        updated_at: new Date().toISOString(),
      };

      if (estatusNuevo === 'inactivo') {
        updateData.fecha_inactivacion = new Date().toISOString().split('T')[0];
        updateData.motivo_inactivacion = motivo;
        updateData.tipo_inactivacion = tipoCambio;
        updateData.fecha_reactivacion_programada = fechaReactivacion 
          ? fechaReactivacion.toISOString().split('T')[0] 
          : null;
      } else {
        // Reactivating - clear inactivation fields
        updateData.fecha_inactivacion = null;
        updateData.motivo_inactivacion = null;
        updateData.tipo_inactivacion = null;
        updateData.fecha_reactivacion_programada = null;
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', operativoId);

      if (updateError) {
        console.error('Error updating operative status:', updateError);
        toast.error('Error al actualizar el estatus');
        return false;
      }

      // Verificar que el cambio se persistió realmente
      const { data: verificacion } = await supabase
        .from(tableName)
        .select('estado')
        .eq('id', operativoId)
        .single();

      if (verificacion?.estado !== estatusNuevo) {
        console.error('❌ El cambio de estatus no se persistió:', {
          esperado: estatusNuevo,
          actual: verificacion?.estado,
          operativoId,
          tableName,
        });
        toast.error('El cambio no se guardó correctamente', {
          description: 'Posible restricción de permisos. Contacte al administrador.',
        });
        return false;
      }

      // Record in history table
      const { error: historyError } = await supabase
        .from('operativo_estatus_historial')
        .insert({
          operativo_id: operativoId,
          operativo_tipo: operativoTipo,
          estatus_anterior: estatusAnterior,
          estatus_nuevo: estatusNuevo,
          tipo_cambio: tipoCambio,
          motivo,
          fecha_reactivacion: fechaReactivacion 
            ? fechaReactivacion.toISOString().split('T')[0] 
            : null,
          notas,
          creado_por: user.id,
        });

      if (historyError) {
        console.error('Error recording status history:', historyError);
        // Don't fail the operation, just log the warning
        console.warn('Status changed but history not recorded');
      }

      // Force refetch of operative profiles to ensure immediate UI sync
      await queryClient.refetchQueries({ queryKey: ['operative-profiles'] });
      
      // Also invalidate other related queries
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['armados'] });
      queryClient.invalidateQueries({ queryKey: ['operative-profile'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad-equitativo'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });

      // Refresh materialized view so it reflects the status change
      supabase.rpc('refresh_custodios_operativos_disponibles').then(({ error }) => {
        if (error) console.warn('Error refreshing materialized view:', error);
      });

      toast.success(
        estatusNuevo === 'activo'
          ? `${operativoNombre} ha sido reactivado`
          : `${operativoNombre} ha sido dado de baja${tipoCambio === 'temporal' ? ' temporalmente' : ''}`
      );

      return true;
    } catch (error) {
      console.error('Error in cambiarEstatus:', error);
      toast.error('Error inesperado al cambiar el estatus');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cambiarEstatus,
    isLoading,
  };
}

/**
 * Hook to get status history for an operative
 */
export function useEstatusHistorial(operativoId: string | undefined) {
  return useQueryClient().fetchQuery({
    queryKey: ['estatus-historial', operativoId],
    queryFn: async () => {
      if (!operativoId) return [];
      
      const { data, error } = await supabase
        .from('operativo_estatus_historial')
        .select('*')
        .eq('operativo_id', operativoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching status history:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
