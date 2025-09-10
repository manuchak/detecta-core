import { supabase } from '@/integrations/supabase/client';

export interface CustodianServiceImportResult {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

export interface CustodianServiceImportProgress {
  current: number;
  total: number;
  status: 'processing' | 'completed' | 'error';
  message?: string;
}

export const importCustodianServices = async (
  data: any[],
  onProgress?: (progress: CustodianServiceImportProgress) => void
): Promise<CustodianServiceImportResult> => {
  const result: CustodianServiceImportResult = {
    success: false,
    imported: 0,
    updated: 0,
    failed: 0,
    errors: [],
    warnings: []
  };

  const total = data.length;
  let current = 0;

  try {
    // Process in batches to avoid overwhelming the database
    const batchSize = 25;
    const batches = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      try {
        // Process each item in the batch
        for (const item of batch) {
          current++;
          
          onProgress?.({
            current,
            total,
            status: 'processing',
            message: `Procesando registro ${current} de ${total}`
          });

            try {
              // Validate required fields for custodian services
              if (!item.id_servicio) {
                result.failed++;
                result.errors.push(`Registro ${current}: ID de servicio es requerido`);
                console.log('Missing id_servicio for item:', item);
                continue;
              }

              console.log(`Processing record ${current}:`, item);

            // Prepare data for upsert (removing internal id field)
            const servicioData = {
              id_servicio: item.id_servicio,
              nombre_cliente: item.nombre_cliente || '',
              telefono: item.telefono || '',
              telefono_operador: item.telefono_operador || '',
              origen: item.origen || '',
              destino: item.destino || '',
              fecha_hora_cita: item.fecha_hora_cita ? new Date(item.fecha_hora_cita).toISOString() : null,
              estado: item.estado || 'pendiente',
              tipo_servicio: item.tipo_servicio || 'traslado',
              nombre_custodio: item.nombre_custodio || '',
              km_recorridos: item.km_recorridos ? parseFloat(item.km_recorridos) : null,
              cobro_cliente: item.cobro_cliente ? parseFloat(item.cobro_cliente) : null,
              tiempo_retraso: item.tiempo_retraso ? parseInt(item.tiempo_retraso) : null,
              comentarios_adicionales: item.comentarios_adicionales || '',
              created_at: item.created_at ? new Date(item.created_at).toISOString() : null,
              updated_time: new Date().toISOString()
            };

            console.log(`Processing record ${current}:`, servicioData);

            // Use native Supabase upsert instead of manual SELECT + INSERT/UPDATE
            const { error: upsertError, count } = await supabase
              .from('servicios_custodia')
              .upsert(servicioData, { 
                onConflict: 'id_servicio',
                count: 'exact'
              });

            if (upsertError) {
              console.error(`Upsert error for ${item.id_servicio}:`, upsertError);
              result.failed++;
              result.errors.push(`Registro ${current}: Error en upsert - ${upsertError.message}`);
            } else {
              console.log(`Successfully processed ${item.id_servicio}`);
              // For upsert, we can't easily distinguish between insert/update without additional queries
              // So we'll count all successful operations as "imported" for now
              result.imported++;
            }

          } catch (itemError) {
            result.failed++;
            result.errors.push(`Registro ${current}: ${itemError instanceof Error ? itemError.message : 'Error desconocido'}`);
          }
        }

        // Small delay between batches to prevent overwhelming the server
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (batchError) {
        result.failed += batch.length;
        result.errors.push(`Error en lote: ${batchError instanceof Error ? batchError.message : 'Error desconocido'}`);
      }
    }

    result.success = result.failed === 0 || (result.imported + result.updated) > 0;
    
    onProgress?.({
      current: total,
      total,
      status: result.success ? 'completed' : 'error',
      message: result.success 
        ? `Importación completada: ${result.imported} nuevos, ${result.updated} actualizados`
        : `Importación con errores: ${result.imported} nuevos, ${result.updated} actualizados, ${result.failed} fallidos`
    });

  } catch (error) {
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    
    onProgress?.({
      current,
      total,
      status: 'error',
      message: 'Error durante la importación'
    });
  }

  return result;
};

// Default mapping configuration for custodian services CSV
export const getCustodianServicesDefaultMapping = (): Record<string, string> => {
  return {
    'id_servicio': 'id_servicio',
    'ID Servicio': 'id_servicio',
    'ID_SERVICIO': 'id_servicio',
    'nombre_cliente': 'nombre_cliente',
    'Nombre Cliente': 'nombre_cliente',
    'NOMBRE_CLIENTE': 'nombre_cliente',
    'cliente': 'nombre_cliente',
    'telefono': 'telefono',
    'Teléfono': 'telefono',
    'TELEFONO': 'telefono',
    'tel': 'telefono',
    'telefono_operador': 'telefono_operador',
    'Teléfono Operador': 'telefono_operador',
    'TELEFONO_OPERADOR': 'telefono_operador',
    'origen': 'origen',
    'Origen': 'origen',
    'ORIGEN': 'origen',
    'destino': 'destino',
    'Destino': 'destino',
    'DESTINO': 'destino',
    'fecha_hora_cita': 'fecha_hora_cita',
    'Fecha Hora Cita': 'fecha_hora_cita',
    'FECHA_HORA_CITA': 'fecha_hora_cita',
    'fecha_cita': 'fecha_hora_cita',
    'estado': 'estado',
    'Estado': 'estado',
    'ESTADO': 'estado',
    'tipo_servicio': 'tipo_servicio',
    'Tipo Servicio': 'tipo_servicio',
    'TIPO_SERVICIO': 'tipo_servicio',
    'nombre_custodio': 'nombre_custodio',
    'Nombre Custodio': 'nombre_custodio',
    'NOMBRE_CUSTODIO': 'nombre_custodio',
    'custodio': 'nombre_custodio',
    'Custodio': 'nombre_custodio',
    'km_recorridos': 'km_recorridos',
    'KM Recorridos': 'km_recorridos',
    'KM_RECORRIDOS': 'km_recorridos',
    'km': 'km_recorridos',
    'cobro_cliente': 'cobro_cliente',
    'Cobro Cliente': 'cobro_cliente',
    'COBRO_CLIENTE': 'cobro_cliente',
    'cobro': 'cobro_cliente',
    'monto': 'cobro_cliente',
    'tiempo_retraso': 'tiempo_retraso',
    'Tiempo Retraso': 'tiempo_retraso',
    'TIEMPO_RETRASO': 'tiempo_retraso',
    'retraso': 'tiempo_retraso',
    'comentarios_adicionales': 'comentarios_adicionales',
    'Comentarios': 'comentarios_adicionales',
    'COMENTARIOS_ADICIONALES': 'comentarios_adicionales',
    'observaciones': 'comentarios_adicionales',
    'notas': 'comentarios_adicionales'
  };
};