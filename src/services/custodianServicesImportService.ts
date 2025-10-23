import { supabase } from '@/integrations/supabase/client';
import { parseRobustDate, formatDateParsingResult } from '@/utils/dateUtils';

// Helper function to determine if a value is valid and should be included in updates
const hasValidValue = (value: any, type: 'string' | 'number' | 'date' = 'string'): boolean => {
  if (value === null || value === undefined) return false;
  
  switch (type) {
    case 'string':
      if (typeof value !== 'string') return false;
      const trimmed = value.trim();
      return trimmed !== '' && trimmed !== 'N/A' && trimmed !== '#N/A' && trimmed !== 'null' && trimmed !== 'undefined';
    
    case 'number':
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === 'N/A' || trimmed === '#N/A') return false;
        const parsed = parseFloat(trimmed);
        return !isNaN(parsed) && isFinite(parsed);
      }
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    
    case 'date':
      if (!value) return false;
      const dateResult = parseRobustDate(value);
      return dateResult.success;
    
    default:
      return false;
  }
};

// Build data object for updating existing records (only include valid CSV values)
const buildUpdateData = (item: any, fechaCitaResult: any, createdAtResult: any, fechaContratacionResult: any) => {
  // Normalize id_servicio - trim whitespace
  const idNormalizado = typeof item.id_servicio === 'string' 
    ? item.id_servicio.trim() 
    : String(item.id_servicio || '').trim();
  
  const updateData: any = {
    id_servicio: idNormalizado, // Always include normalized ID for WHERE clause
    updated_time: new Date().toISOString() // Always update timestamp
  };

  // Only include fields that have valid values in the CSV
  if (hasValidValue(item.nombre_cliente, 'string')) {
    updateData.nombre_cliente = item.nombre_cliente;
  }
  if (hasValidValue(item.telefono, 'string')) {
    updateData.telefono = item.telefono;
  }
  if (hasValidValue(item.telefono_operador, 'string')) {
    updateData.telefono_operador = item.telefono_operador;
  }
  if (hasValidValue(item.origen, 'string')) {
    updateData.origen = item.origen;
  }
  if (hasValidValue(item.destino, 'string')) {
    updateData.destino = item.destino;
  }
  if (fechaCitaResult.success && fechaCitaResult.isoString) {
    updateData.fecha_hora_cita = fechaCitaResult.isoString;
  }
  if (fechaContratacionResult.success && fechaContratacionResult.isoString) {
    updateData.fecha_contratacion = fechaContratacionResult.isoString;
  }
  // ALWAYS include estado if present in CSV - critical for update-only imports
  if (item.estado !== undefined && item.estado !== null) {
    const estadoNormalizado = typeof item.estado === 'string' 
      ? item.estado.trim()
      : String(item.estado).trim();
    
    // ALWAYS include estado field for updates, even if empty
    updateData.estado = estadoNormalizado || 'Pendiente';
    console.log(`✅ Estado incluido en update: "${estadoNormalizado}" -> "${updateData.estado}"`);
  }
  if (hasValidValue(item.tipo_servicio, 'string')) {
    updateData.tipo_servicio = item.tipo_servicio;
  }
  if (hasValidValue(item.nombre_custodio, 'string')) {
    updateData.nombre_custodio = item.nombre_custodio;
  }
  if (hasValidValue(item.km_recorridos, 'number')) {
    updateData.km_recorridos = parseFloat(item.km_recorridos);
  }
  if (hasValidValue(item.cobro_cliente, 'number')) {
    updateData.cobro_cliente = parseFloat(item.cobro_cliente);
  }
  if (hasValidValue(item.tiempo_retraso, 'number')) {
    updateData.tiempo_retraso = parseInt(item.tiempo_retraso);
  }
  if (hasValidValue(item.comentarios_adicionales, 'string')) {
    updateData.comentarios_adicionales = item.comentarios_adicionales;
  }
  if (createdAtResult.success && createdAtResult.isoString) {
    updateData.created_at = createdAtResult.isoString;
  }

  return updateData;
};

// Build data object for inserting new records (with defaults for empty fields)
const buildInsertData = (item: any, fechaCitaResult: any, createdAtResult: any, fechaContratacionResult: any) => {
  return {
    id_servicio: item.id_servicio,
    nombre_cliente: item.nombre_cliente || '',
    telefono: item.telefono || '',
    telefono_operador: item.telefono_operador || '',
    origen: item.origen || '',
    destino: item.destino || '',
    fecha_hora_cita: fechaCitaResult.isoString || null,
    fecha_contratacion: fechaContratacionResult.isoString || null,
    estado: item.estado || 'pendiente',
    tipo_servicio: item.tipo_servicio || 'traslado',
    nombre_custodio: item.nombre_custodio || '',
    km_recorridos: item.km_recorridos ? parseFloat(item.km_recorridos) : null,
    cobro_cliente: item.cobro_cliente ? parseFloat(item.cobro_cliente) : null,
    tiempo_retraso: item.tiempo_retraso ? parseInt(item.tiempo_retraso) : null,
    comentarios_adicionales: item.comentarios_adicionales || '',
    created_at: createdAtResult.isoString || null,
    updated_time: new Date().toISOString()
  };
};

export interface CustodianServiceImportResult {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
  warnings: string[];
  suggestedAction?: 'switch_to_update' | 'switch_to_create';
}

export interface CustodianServiceImportProgress {
  current: number;
  total: number;
  status: 'processing' | 'completed' | 'error';
  message?: string;
}

export const importCustodianServices = async (
  data: any[],
  onProgress?: (progress: CustodianServiceImportProgress) => void,
  mode: 'create' | 'update' | 'auto' = 'auto'
): Promise<CustodianServiceImportResult> => {
  console.log(`🚀 Import started in ${mode.toUpperCase()} mode with ${data.length} records`);
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

            // Parse and validate dates using robust parsing
            const fechaCitaResult = parseRobustDate(item.fecha_hora_cita);
            const createdAtResult = parseRobustDate(item.created_at);
            const fechaContratacionResult = parseRobustDate(item.fecha_contratacion);
            
            // Log date parsing results for debugging
            if (item.fecha_hora_cita) {
              console.log(`Date parsing for record ${current} (fecha_hora_cita):`, formatDateParsingResult(fechaCitaResult));
              
              // Add warning if date parsing failed or resulted in problematic date
              if (!fechaCitaResult.success) {
                result.warnings.push(`Registro ${current}: ${fechaCitaResult.error}`);
              } else if (fechaCitaResult.warning) {
                result.warnings.push(`Registro ${current}: ${fechaCitaResult.warning}`);
              }
            }
            
            if (item.created_at) {
              console.log(`Date parsing for record ${current} (created_at):`, formatDateParsingResult(createdAtResult));
              
              if (!createdAtResult.success) {
                result.warnings.push(`Registro ${current}: Error en created_at - ${createdAtResult.error}`);
              }
            }

            if (item.fecha_contratacion) {
              console.log(`Date parsing for record ${current} (fecha_contratacion):`, formatDateParsingResult(fechaContratacionResult));
              
              if (!fechaContratacionResult.success) {
                result.warnings.push(`Registro ${current}: Error en fecha_contratacion - ${fechaContratacionResult.error}`);
              }
            }

            let upsertError = null;
            let servicioData: any;

            if (mode === 'update') {
              // UPDATE MODE: Use RPC to bypass RLS for all updates
              servicioData = buildUpdateData(item, fechaCitaResult, createdAtResult, fechaContratacionResult);
              const idServicio = servicioData.id_servicio; // Already normalized in buildUpdateData
              
              // Remove id_servicio from updates object (it's used in WHERE clause)
              const { id_servicio, updated_time, ...updates } = servicioData;
              
              const updatedFields = Object.keys(updates);
              console.log(`🔄 UPDATE MODE - Record ${current} (${idServicio}): fields [${updatedFields.join(', ')}]`);
              
              // Use general RPC for all updates (bypasses RLS via SECURITY DEFINER)
              console.log(`🎯 Using RPC update_servicio_completo for "${idServicio}" (len: ${idServicio.length})`);
              
              const { data, error } = await supabase.rpc('update_servicio_completo', {
                p_id_servicio: idServicio,
                p_updates: updates
              });
              
              upsertError = error;
              const rowsUpdated = data ?? 0;
              
              if (!error && rowsUpdated > 0) {
                result.updated++;
                console.log(`✅ Successfully updated via RPC: ${idServicio} (${rowsUpdated} rows, ${updatedFields.length} fields)`);
              } else if (!error && rowsUpdated === 0) {
                // No rows updated - ID doesn't exist
                upsertError = { message: `ID no encontrado en la base de datos: ${idServicio}` };
                console.error(`❌ RPC found 0 rows for ${idServicio}`);
                if (result.failed < 3) { // Log details for first 3 failures
                  console.error(`   Normalized ID: "${idServicio}", length: ${idServicio.length}`);
                }
              } else {
                console.error(`❌ RPC error for ${idServicio}:`, error);
              }
            } else if (mode === 'create') {
              // CREATE MODE: Only insert new records
              servicioData = buildInsertData(item, fechaCitaResult, createdAtResult, fechaContratacionResult);
              console.log(`➕ CREATE MODE - Record ${current} (${item.id_servicio}): creating new record`);
              
              const { error } = await supabase
                .from('servicios_custodia')
                .insert(servicioData);
              
              upsertError = error;
              if (!error) {
                result.imported++;
                console.log(`✅ Successfully created ${item.id_servicio}`);
              }
            } else {
              // AUTO MODE: Check if record exists first (original behavior)
              const { data: existingRecord } = await supabase
                .from('servicios_custodia')
                .select('id')
                .eq('id_servicio', item.id_servicio)
                .maybeSingle();

              const isUpdate = !!existingRecord;
              servicioData = isUpdate 
                ? buildUpdateData(item, fechaCitaResult, createdAtResult, fechaContratacionResult)
                : buildInsertData(item, fechaCitaResult, createdAtResult, fechaContratacionResult);

              if (isUpdate) {
                const updatedFields = Object.keys(servicioData).filter(key => key !== 'id_servicio' && key !== 'updated_time');
                console.log(`🔄 AUTO UPDATE - Record ${current} (${item.id_servicio}): fields [${updatedFields.join(', ')}]`);
                
                const { error } = await supabase
                  .from('servicios_custodia')
                  .update(servicioData)
                  .eq('id_servicio', servicioData.id_servicio);
                
                upsertError = error;
                if (!error) result.updated++;
              } else {
                console.log(`➕ AUTO INSERT - Record ${current} (${item.id_servicio}): creating new record`);
                
                const { error } = await supabase
                  .from('servicios_custodia')
                  .insert(servicioData);
                
                upsertError = error;
                if (!error) result.imported++;
              }
            }

            if (upsertError) {
              const idServicio = typeof item.id_servicio === 'string' 
                ? item.id_servicio.trim() 
                : String(item.id_servicio || '').trim();
              console.error(`Database error for ${idServicio}:`, upsertError);
              
              // Detect specific errors and provide actionable messages
              let errorMessage = upsertError.message || 'Error desconocido';
              
              // Detect RPC errors and ID not found
              if (errorMessage.includes('ID no encontrado')) {
                errorMessage = `El servicio "${idServicio}" no existe en la base de datos`;
              } else if (errorMessage.includes('update_servicio_estado') || errorMessage.includes('No rows found')) {
                errorMessage = `Error al actualizar estado: El servicio ${idServicio} no existe en la base de datos`;
              } else if (upsertError.code === '42501' || errorMessage.includes('row-level security')) {
                errorMessage = `Permisos insuficientes (RLS). Verifica que tu usuario tenga rol de administrador.`;
              } else if (upsertError.code === '23502') {
                errorMessage = `Campo requerido faltante: ${upsertError.details || 'desconocido'}`;
              } else if (upsertError.code === '22P02') {
                errorMessage = `Error de formato en los datos: ${upsertError.details || 'verifica fechas y números'}`;
              }
              
              result.failed++;
              result.errors.push(`Registro ${current} (${idServicio}): ${errorMessage}`);
            } else {
              console.log(`Successfully processed ${item.id_servicio}`);
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
    'notas': 'comentarios_adicionales',
    'fecha_contratacion': 'fecha_contratacion',
    'Fecha Contratación': 'fecha_contratacion',
    'FECHA_CONTRATACION': 'fecha_contratacion',
    'contratacion': 'fecha_contratacion'
  };
};