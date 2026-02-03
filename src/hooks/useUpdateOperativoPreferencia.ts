/**
 * Hook for updating operative service type preference
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PreferenciaTipoServicio = 'local' | 'foraneo' | 'indistinto';

interface UpdatePreferenciaParams {
  operativoId: string;
  operativoTipo: 'custodio' | 'armado';
  nuevaPreferencia: PreferenciaTipoServicio;
}

export function useUpdateOperativoPreferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ operativoId, operativoTipo, nuevaPreferencia }: UpdatePreferenciaParams) => {
      const tableName = operativoTipo === 'custodio' 
        ? 'custodios_operativos' 
        : 'armados_operativos';

      const { error } = await supabase
        .from(tableName)
        .update({ 
          preferencia_tipo_servicio: nuevaPreferencia,
          updated_at: new Date().toISOString()
        })
        .eq('id', operativoId);

      if (error) {
        throw error;
      }

      return { operativoId, nuevaPreferencia };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['armados'] });
      queryClient.invalidateQueries({ queryKey: ['operative-profile'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });
      
      const preferenciaLabel = {
        local: 'Local',
        foraneo: 'Foráneo',
        indistinto: 'Indistinto'
      }[data.nuevaPreferencia];
      
      toast.success(`Preferencia actualizada a: ${preferenciaLabel}`);
    },
    onError: (error) => {
      console.error('Error updating preference:', error);
      toast.error('Error al actualizar la preferencia');
    },
  });
}

/**
 * Bulk update preferences for multiple operatives
 */
export function useBulkUpdatePreferencias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdatePreferenciaParams[]) => {
      const results = await Promise.allSettled(
        updates.map(async ({ operativoId, operativoTipo, nuevaPreferencia }) => {
          const tableName = operativoTipo === 'custodio' 
            ? 'custodios_operativos' 
            : 'armados_operativos';

          const { error } = await supabase
            .from(tableName)
            .update({ 
              preferencia_tipo_servicio: nuevaPreferencia,
              updated_at: new Date().toISOString()
            })
            .eq('id', operativoId);

          if (error) throw error;
          return operativoId;
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { successful, failed, total: updates.length };
    },
    onSuccess: ({ successful, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['armados'] });
      
      if (failed === 0) {
        toast.success(`${successful} preferencias actualizadas`);
      } else {
        toast.warning(`${successful}/${total} actualizadas. ${failed} fallaron.`);
      }
    },
    onError: (error) => {
      console.error('Error in bulk update:', error);
      toast.error('Error al actualizar preferencias');
    },
  });
}
