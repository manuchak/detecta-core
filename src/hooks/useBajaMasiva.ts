/**
 * Hook for bulk deactivation of operatives (custodios/armados)
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BajaMasivaParams {
  operativoIds: string[];
  operativoTipo: 'custodio' | 'armado';
  motivo: string;
  notas?: string;
}

interface BajaMasivaResult {
  success: boolean;
  processed: number;
  failed: number;
}

export function useBajaMasiva() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const darDeBajaMasiva = async (params: BajaMasivaParams): Promise<BajaMasivaResult> => {
    const { operativoIds, operativoTipo, motivo, notas } = params;
    
    if (operativoIds.length === 0) {
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
        return { success: false, processed: 0, failed: operativoIds.length };
      }

      const tableName = operativoTipo === 'custodio' 
        ? 'custodios_operativos' 
        : 'armados_operativos';

      const fechaInactivacion = new Date().toISOString().split('T')[0];

      // Batch update all operatives
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          estado: 'inactivo',
          fecha_inactivacion: fechaInactivacion,
          motivo_inactivacion: motivo,
          tipo_inactivacion: 'permanente',
          fecha_reactivacion_programada: null,
          updated_at: new Date().toISOString(),
        })
        .in('id', operativoIds);

      if (updateError) {
        console.error('Error in bulk update:', updateError);
        toast.error('Error al procesar la baja masiva');
        return { success: false, processed: 0, failed: operativoIds.length };
      }

      processed = operativoIds.length;

      // Record history for each operative
      const historyRecords = operativoIds.map(id => ({
        operativo_id: id,
        operativo_tipo: operativoTipo,
        estatus_anterior: 'activo',
        estatus_nuevo: 'inactivo',
        tipo_cambio: 'permanente',
        motivo,
        notas: notas || 'Baja masiva por inactividad',
        creado_por: user.id,
      }));

      const { error: historyError } = await supabase
        .from('operativo_estatus_historial')
        .insert(historyRecords);

      if (historyError) {
        console.warn('History not fully recorded:', historyError);
        // Don't fail the operation, just log the warning
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['armados'] });
      queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });

      toast.success(`${processed} ${operativoTipo === 'custodio' ? 'custodios' : 'armados'} dados de baja exitosamente`);

      return { success: true, processed, failed };

    } catch (error) {
      console.error('Error in darDeBajaMasiva:', error);
      toast.error('Error inesperado al procesar la baja masiva');
      return { success: false, processed, failed: operativoIds.length - processed };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    darDeBajaMasiva,
    isLoading,
  };
}
