import { supabase } from '@/integrations/supabase/client';
import { parseRobustDate, parseRobustDateCDMX, formatDateParsingResult } from '@/utils/dateUtils';

// Helper function to parse interval strings (HH:MM:SS, HH:MM, or minutes as number)
const parseInterval = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  
  const str = String(value).trim();
  if (str === '' || str === 'N/A' || str === '#N/A' || str === 'null' || str === 'undefined') return null;
  
  // Si ya está en formato HH:MM:SS, es válido
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  
  // Si está en formato HH:MM, agregar segundos
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    return str + ':00';
  }
  
  // Si es un número, asumirlo como minutos
  const num = parseFloat(str);
  if (!isNaN(num) && isFinite(num)) {
    const hours = Math.floor(num / 60);
    const mins = Math.floor(num % 60);
    const secs = Math.floor((num % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Intentar extraer números del formato "X hours Y minutes"
  const hoursMatch = str.match(/(\d+)\s*h/i);
  const minsMatch = str.match(/(\d+)\s*m/i);
  if (hoursMatch || minsMatch) {
    const h = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const m = minsMatch ? parseInt(minsMatch[1]) : 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  }
  
  return null; // No se pudo parsear
};

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

  // --- FINANCIAL FIELDS ---
  if (hasValidValue(item.costo_custodio, 'number')) {
    updateData.costo_custodio = parseFloat(item.costo_custodio);
  }
  if (hasValidValue(item.casetas, 'number')) {
    updateData.casetas = parseFloat(item.casetas);
  }
  if (hasValidValue(item.km_teorico, 'number')) {
    updateData.km_teorico = parseFloat(item.km_teorico);
  }
  if (hasValidValue(item.km_extras, 'number')) {
    updateData.km_extras = parseFloat(item.km_extras);
  }

  // --- DATE FIELDS ---
  if (hasValidValue(item.fecha_primer_servicio, 'date')) {
    const fechaPrimerResult = parseRobustDate(item.fecha_primer_servicio);
    if (fechaPrimerResult.success && fechaPrimerResult.isoString) {
      updateData.fecha_primer_servicio = fechaPrimerResult.isoString.split('T')[0]; // Solo fecha
    }
  }

  // --- TRANSPORT/VEHICLE FIELDS ---
  if (hasValidValue(item.placa, 'string')) {
    updateData.placa = item.placa;
  }
  if (hasValidValue(item.auto, 'string')) {
    updateData.auto = item.auto;
  }

  // --- GADGET FIELDS ---
  if (hasValidValue(item.gadget, 'string')) {
    updateData.gadget = item.gadget;
  }
  if (hasValidValue(item.tipo_gadget, 'string')) {
    updateData.tipo_gadget = item.tipo_gadget;
  }
  if (hasValidValue(item.gadget_solicitado, 'string')) {
    updateData.gadget_solicitado = item.gadget_solicitado;
  }

  // --- TIME TRACKING FIELDS (todos son tipo DATE/TIMESTAMP en la BD) ---
  
  // presentacion (string: "A tiempo", "Retrasado", etc.)
  if (hasValidValue(item.presentacion, 'string')) {
    updateData.presentacion = item.presentacion;
  }
  
   // hora_presentacion (TIMESTAMPTZ - CDMX operational time)
  if (hasValidValue(item.hora_presentacion, 'date')) {
    const horaPresentacionResult = parseRobustDateCDMX(item.hora_presentacion);
    if (horaPresentacionResult.success && horaPresentacionResult.isoString) {
      updateData.hora_presentacion = horaPresentacionResult.isoString;
    }
  }
  
  // hora_finalizacion (TIMESTAMPTZ - CDMX operational time)
  if (hasValidValue(item.hora_finalizacion, 'date')) {
    const horaFinalizacionResult = parseRobustDateCDMX(item.hora_finalizacion);
    if (horaFinalizacionResult.success && horaFinalizacionResult.isoString) {
      updateData.hora_finalizacion = horaFinalizacionResult.isoString;
    }
  }
  
  // hora_arribo (TIMESTAMPTZ - CDMX operational time)
  if (hasValidValue(item.hora_arribo, 'date')) {
    const horaArriboResult = parseRobustDateCDMX(item.hora_arribo);
    if (horaArriboResult.success && horaArriboResult.isoString) {
      updateData.hora_arribo = horaArriboResult.isoString;
    }
  }
  
  // hora_inicio_custodia (TIMESTAMPTZ - CDMX operational time)
  if (hasValidValue(item.hora_inicio_custodia, 'date')) {
    const horaInicioResult = parseRobustDateCDMX(item.hora_inicio_custodia);
    if (horaInicioResult.success && horaInicioResult.isoString) {
      updateData.hora_inicio_custodia = horaInicioResult.isoString;
    }
  }
  
  // tiempo_punto_origen (string)
  if (hasValidValue(item.tiempo_punto_origen, 'string')) {
    updateData.tiempo_punto_origen = item.tiempo_punto_origen;
  }

  // --- OTHER FIELDS ---
  if (hasValidValue(item.local_foraneo, 'string')) {
    updateData.local_foraneo = item.local_foraneo;
  }
  if (hasValidValue(item.ruta, 'string')) {
    updateData.ruta = item.ruta;
  }
  if (hasValidValue(item.proveedor, 'string')) {
    updateData.proveedor = item.proveedor;
  }
  if (hasValidValue(item.armado, 'string')) {
    updateData.armado = item.armado;
  }
  if (hasValidValue(item.nombre_armado, 'string')) {
    updateData.nombre_armado = item.nombre_armado;
  }

  // --- INTERVAL FIELDS ---
  
  // duracion_servicio (INTERVAL - requiere formato especial)
  if (item.duracion_servicio !== undefined && item.duracion_servicio !== null) {
    const duracionParsed = parseInterval(item.duracion_servicio);
    if (duracionParsed) {
      updateData.duracion_servicio = duracionParsed;
    }
  }
  
  // duracion_estimada (también es INTERVAL)
  if (item.duracion_estimada !== undefined && item.duracion_estimada !== null) {
    const duracionEstParsed = parseInterval(item.duracion_estimada);
    if (duracionEstParsed) {
      updateData.duracion_estimada = duracionEstParsed;
    }
  }

  return updateData;
};

// Build data object for inserting new records (with defaults for empty fields)
const buildInsertData = (item: any, fechaCitaResult: any, createdAtResult: any, fechaContratacionResult: any) => {
  // Parse fecha_primer_servicio for inserts
  const fechaPrimerResult = parseRobustDate(item.fecha_primer_servicio);
  
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
    updated_time: new Date().toISOString(),
    // --- NEW FIELDS ---
    costo_custodio: item.costo_custodio ? parseFloat(item.costo_custodio) : null,
    casetas: item.casetas ? parseFloat(item.casetas) : null,
    km_teorico: item.km_teorico ? parseFloat(item.km_teorico) : null,
    km_extras: item.km_extras ? parseFloat(item.km_extras) : null,
    fecha_primer_servicio: fechaPrimerResult.success && fechaPrimerResult.isoString 
      ? fechaPrimerResult.isoString.split('T')[0] 
      : null,
    placa: item.placa || null,
    auto: item.auto || null,
    gadget: item.gadget || null,
    tipo_gadget: item.tipo_gadget || null,
    gadget_solicitado: item.gadget_solicitado || null,
    // --- TIME TRACKING FIELDS (with proper date parsing) ---
    presentacion: item.presentacion || null,
    hora_presentacion: (() => {
      const result = parseRobustDateCDMX(item.hora_presentacion);
      return result.success && result.isoString ? result.isoString : null;
    })(),
    hora_finalizacion: (() => {
      const result = parseRobustDateCDMX(item.hora_finalizacion);
      return result.success && result.isoString ? result.isoString : null;
    })(),
    hora_arribo: (() => {
      const result = parseRobustDateCDMX(item.hora_arribo);
      return result.success && result.isoString ? result.isoString : null;
    })(),
    hora_inicio_custodia: (() => {
      const result = parseRobustDateCDMX(item.hora_inicio_custodia);
      return result.success && result.isoString ? result.isoString : null;
    })(),
    tiempo_punto_origen: item.tiempo_punto_origen || null,
    // --- OTHER FIELDS ---
    local_foraneo: item.local_foraneo || null,
    ruta: item.ruta || null,
    proveedor: item.proveedor || null,
    armado: item.armado || null,
    nombre_armado: item.nombre_armado || null,
    // --- INTERVAL FIELDS ---
    duracion_servicio: parseInterval(item.duracion_servicio),
    duracion_estimada: parseInterval(item.duracion_estimada)
  };
};

export interface FailedRecord {
  rowIndex: number;
  originalData: Record<string, any>;
  error: string;
}

export interface CustodianServiceImportResult {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
  warnings: string[];
  failedRecords: FailedRecord[];
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
    warnings: [],
    failedRecords: []
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
                result.failedRecords.push({
                  rowIndex: current,
                  originalData: item,
                  error: 'ID de servicio es requerido'
                });
                console.log('Missing id_servicio for item:', item);
                continue;
              }

              console.log(`Processing record ${current}:`, item);

            // Parse and validate dates using robust parsing
            const fechaCitaResult = parseRobustDateCDMX(item.fecha_hora_cita);
            const createdAtResult = parseRobustDate(item.created_at); // Technical timestamp, not operational
            const fechaContratacionResult = parseRobustDateCDMX(item.fecha_contratacion);
            
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
              result.failedRecords.push({
                rowIndex: current,
                originalData: item,
                error: errorMessage
              });
            } else {
              console.log(`Successfully processed ${item.id_servicio}`);
            }

          } catch (itemError) {
            const errorMsg = itemError instanceof Error ? itemError.message : 'Error desconocido';
            result.failed++;
            result.errors.push(`Registro ${current}: ${errorMsg}`);
            result.failedRecords.push({
              rowIndex: current,
              originalData: item,
              error: errorMsg
            });
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
    'contratacion': 'fecha_contratacion',
    // --- NEW MAPPINGS ---
    'costo_custodio': 'costo_custodio',
    'Costo Custodio': 'costo_custodio',
    'COSTO_CUSTODIO': 'costo_custodio',
    'costo': 'costo_custodio',
    'pago_custodio': 'costo_custodio',
    'Pago Custodio': 'costo_custodio',
    'casetas': 'casetas',
    'Casetas': 'casetas',
    'CASETAS': 'casetas',
    'km_teorico': 'km_teorico',
    'KM Teorico': 'km_teorico',
    'KM_TEORICO': 'km_teorico',
    'km_extras': 'km_extras',
    'KM Extras': 'km_extras',
    'KM_EXTRAS': 'km_extras',
    'fecha_primer_servicio': 'fecha_primer_servicio',
    'Fecha Primer Servicio': 'fecha_primer_servicio',
    'FECHA_PRIMER_SERVICIO': 'fecha_primer_servicio',
    'primer_servicio': 'fecha_primer_servicio',
    'placa': 'placa',
    'Placa': 'placa',
    'PLACA': 'placa',
    'placas': 'placa',
    'auto': 'auto',
    'Auto': 'auto',
    'AUTO': 'auto',
    'vehiculo': 'auto',
    'Vehiculo': 'auto',
    'gadget': 'gadget',
    'Gadget': 'gadget',
    'GADGET': 'gadget',
    'tipo_gadget': 'tipo_gadget',
    'Tipo Gadget': 'tipo_gadget',
    'TIPO_GADGET': 'tipo_gadget',
    'gadget_solicitado': 'gadget_solicitado',
    'Gadget Solicitado': 'gadget_solicitado',
    'hora_presentacion': 'hora_presentacion',
    'Hora Presentacion': 'hora_presentacion',
    'HORA_PRESENTACION': 'hora_presentacion',
    'hora_finalizacion': 'hora_finalizacion',
    'Hora Finalizacion': 'hora_finalizacion',
    'HORA_FINALIZACION': 'hora_finalizacion',
    // --- NEW TIME TRACKING MAPPINGS ---
    'presentacion': 'presentacion',
    'Presentacion': 'presentacion',
    'PRESENTACION': 'presentacion',
    'hora_arribo': 'hora_arribo',
    'Hora Arribo': 'hora_arribo',
    'HORA_ARRIBO': 'hora_arribo',
    'arribo': 'hora_arribo',
    'hora_inicio_custodia': 'hora_inicio_custodia',
    'Hora Inicio Custodia': 'hora_inicio_custodia',
    'HORA_INICIO_CUSTODIA': 'hora_inicio_custodia',
    'inicio_custodia': 'hora_inicio_custodia',
    'tiempo_punto_origen': 'tiempo_punto_origen',
    'Tiempo Punto Origen': 'tiempo_punto_origen',
    'TIEMPO_PUNTO_ORIGEN': 'tiempo_punto_origen',
    // --- OTHER MAPPINGS ---
    'local_foraneo': 'local_foraneo',
    'Local Foraneo': 'local_foraneo',
    'LOCAL_FORANEO': 'local_foraneo',
    'ruta': 'ruta',
    'Ruta': 'ruta',
    'RUTA': 'ruta',
    'proveedor': 'proveedor',
    'Proveedor': 'proveedor',
    'PROVEEDOR': 'proveedor',
    'armado': 'armado',
    'Armado': 'armado',
    'ARMADO': 'armado',
    'nombre_armado': 'nombre_armado',
    'Nombre Armado': 'nombre_armado',
    'NOMBRE_ARMADO': 'nombre_armado',
    // --- DURATION/INTERVAL MAPPINGS ---
    'duracion_servicio': 'duracion_servicio',
    'Duracion Servicio': 'duracion_servicio',
    'DURACION_SERVICIO': 'duracion_servicio',
    'duracion': 'duracion_servicio',
    'Duracion': 'duracion_servicio',
    'DURACION': 'duracion_servicio',
    'tiempo_total': 'duracion_servicio',
    'Tiempo Total': 'duracion_servicio',
    'duracion_estimada': 'duracion_estimada',
    'Duracion Estimada': 'duracion_estimada',
    'DURACION_ESTIMADA': 'duracion_estimada',
    'tiempo_estimado': 'duracion_estimada',
    'Tiempo Estimado': 'duracion_estimada'
  };
};