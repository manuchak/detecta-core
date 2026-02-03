import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUuid } from '@/utils/uuidHelpers';

interface ConvertirParams {
  operativoId: string;
  direccion: 'custodio_a_armado' | 'armado_a_custodio';
  motivo: string;
  tipoArmado?: string;
  ejecutadoPor: string;
}

interface ConversionResult {
  nuevoId: string;
  success: boolean;
}

export function useConvertirTipoOperativo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ConvertirParams): Promise<ConversionResult> => {
      const { operativoId, direccion, motivo, tipoArmado, ejecutadoPor } = params;

      if (direccion === 'custodio_a_armado') {
        if (!tipoArmado) {
          throw new Error('El tipo de armado es requerido para la conversión');
        }

        // 1. Fetch custodio data
        const { data: custodio, error: fetchError } = await supabase
          .from('custodios_operativos')
          .select('*')
          .eq('id', operativoId)
          .single();

        if (fetchError || !custodio) {
          throw new Error('No se encontró el custodio a convertir');
        }

        const nuevoId = generateUuid();

        // 2. Insert into armados_operativos with mapped fields
        const { error: insertError } = await supabase
          .from('armados_operativos')
          .insert({
            id: nuevoId,
            nombre: custodio.nombre,
            telefono: custodio.telefono,
            email: custodio.email,
            zona_base: custodio.zona_base,
            estado: custodio.estado,
            disponibilidad: custodio.disponibilidad,
            numero_servicios: custodio.numero_servicios,
            rating_promedio: custodio.rating_promedio,
            tasa_respuesta: custodio.tasa_respuesta,
            tasa_confiabilidad: custodio.tasa_confiabilidad,
            score_total: custodio.score_total,
            tipo_armado: tipoArmado,
            licencia_portacion: null,
            experiencia_anos: null,
            fecha_vencimiento_licencia: null,
            equipamiento_disponible: null,
            fuente: 'manual',
            origen: 'interno',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting armado:', insertError);
          throw new Error('Error al crear el registro de armado');
        }

        // 3. Delete from custodios_operativos
        const { error: deleteError } = await supabase
          .from('custodios_operativos')
          .delete()
          .eq('id', operativoId);

        if (deleteError) {
          // Rollback: delete the armado we just created
          await supabase.from('armados_operativos').delete().eq('id', nuevoId);
          console.error('Error deleting custodio:', deleteError);
          throw new Error('Error al eliminar el registro de custodio');
        }

        // 4. Log to historial
        await supabase.from('operativo_estatus_historial').insert({
          operativo_id: nuevoId,
          tipo_personal: 'armado',
          tipo_cambio: 'conversion_tipo',
          estado_anterior: 'custodio',
          estado_nuevo: 'armado',
          motivo: motivo,
          notas: `Convertido desde custodio (ID original: ${operativoId}). Tipo armado: ${tipoArmado}`,
          ejecutado_por: ejecutadoPor
        });

        return { nuevoId, success: true };
      } else {
        // armado_a_custodio - similar logic but reversed
        throw new Error('La conversión de armado a custodio no está implementada');
      }
    },
    onSuccess: (result, params) => {
      toast.success('Conversión completada', {
        description: `El operativo ha sido convertido exitosamente`
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['operative-profile'] });
      queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos'] });
      queryClient.invalidateQueries({ queryKey: ['armados-operativos'] });
    },
    onError: (error: Error) => {
      toast.error('Error en la conversión', {
        description: error.message
      });
    }
  });
}
