/**
 * Hook for bulk reactivation of operatives (rollback for mass deactivation errors)
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OperativoReactivar {
  id: string;
  tipo_personal: 'custodio' | 'armado';
  nombre: string;
}

interface ReactivacionMasivaParams {
  operativos: OperativoReactivar[];
  motivo: string;
  notas?: string;
}

interface ReactivacionMasivaResult {
  success: boolean;
  processed: number;
  failed: number;
}

export function useReactivacionMasiva() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const reactivarMasivo = async (params: ReactivacionMasivaParams): Promise<ReactivacionMasivaResult> => {
    const { operativos, motivo, notas } = params;
    
    if (operativos.length === 0) {
      return { success: false, processed: 0, failed: 0 };
    }

    setIsLoading(true);
    let processed = 0;
    let failed = 0;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Error de autenticación');
        return { success: false, processed: 0, failed: operativos.length };
      }

      // Group operatives by type for batch updates
      const custodios = operativos.filter(o => o.tipo_personal === 'custodio');
      const armados = operativos.filter(o => o.tipo_personal === 'armado');

      const updateData = {
        estado: 'activo',
        fecha_inactivacion: null,
        motivo_inactivacion: null,
        tipo_inactivacion: null,
        fecha_reactivacion_programada: null,
        updated_at: new Date().toISOString(),
      };

      // Update custodios
      if (custodios.length > 0) {
        const { error } = await supabase
          .from('custodios_operativos')
          .update(updateData)
          .in('id', custodios.map(c => c.id));

        if (error) {
          console.error('Error reactivating custodios:', error);
          failed += custodios.length;
        } else {
          processed += custodios.length;
        }
      }

      // Update armados
      if (armados.length > 0) {
        const { error } = await supabase
          .from('armados_operativos')
          .update(updateData)
          .in('id', armados.map(a => a.id));

        if (error) {
          console.error('Error reactivating armados:', error);
          failed += armados.length;
        } else {
          processed += armados.length;
        }
      }

      // Record history for all operatives
      const historyRecords = operativos.map(op => ({
        operativo_id: op.id,
        operativo_tipo: op.tipo_personal,
        estatus_anterior: 'inactivo',
        estatus_nuevo: 'activo',
        tipo_cambio: 'reactivacion',
        motivo,
        notas: notas || 'Reactivación masiva (rollback)',
        creado_por: user.id,
      }));

      const { error: historyError } = await supabase
        .from('operativo_estatus_historial')
        .insert(historyRecords);

      if (historyError) {
        console.warn('History not fully recorded:', historyError);
      }

      // Force refetch of operative profiles to ensure immediate UI sync
      await queryClient.refetchQueries({ queryKey: ['operative-profiles'] });
      
      // Also invalidate other related queries
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['armados'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });

      if (processed > 0) {
        toast.success(`${processed} operativo${processed > 1 ? 's' : ''} reactivado${processed > 1 ? 's' : ''} exitosamente`);
      }
      if (failed > 0) {
        toast.error(`${failed} operativo${failed > 1 ? 's' : ''} no pudo${failed > 1 ? 'ieron' : ''} ser reactivado${failed > 1 ? 's' : ''}`);
      }

      return { success: processed > 0, processed, failed };

    } catch (error) {
      console.error('Error in reactivarMasivo:', error);
      toast.error('Error inesperado al procesar la reactivación');
      return { success: false, processed, failed: operativos.length - processed };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reactivarMasivo,
    isLoading,
  };
}
