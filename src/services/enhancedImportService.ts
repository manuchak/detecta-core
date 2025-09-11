import { supabase } from '@/integrations/supabase/client';
import { parseRobustDate, formatDateParsingResult } from '@/utils/dateUtils';
import { validateTableSchema, SchemaValidationResult } from './schemaValidationService';
import { CircuitBreaker } from './circuitBreakerService';

export interface EnhancedImportResult {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
  warnings: string[];
  circuitBreakerTriggered: boolean;
  rollbackAvailable: boolean;
  rollbackIds?: number[];
  errorsByType: Record<string, number>;
  validationResult: SchemaValidationResult;
}

export interface EnhancedImportProgress {
  current: number;
  total: number;
  status: 'validating' | 'processing' | 'completed' | 'error' | 'circuit_open' | 'rolling_back';
  message?: string;
  phaseProgress?: {
    phase: string;
    progress: number;
  };
}

export interface EnhancedImportConfig {
  testMode?: boolean;
  testRecords?: number;
  enableCircuitBreaker?: boolean;
  enableRollback?: boolean;
  maxConsecutiveErrors?: number;
  maxFailureRate?: number;
  batchSize?: number;
}

export const importCustodianServicesEnhanced = async (
  data: any[],
  onProgress?: (progress: EnhancedImportProgress) => void,
  config: EnhancedImportConfig = {}
): Promise<EnhancedImportResult> => {
  const {
    testMode = false,
    testRecords = 10,
    enableCircuitBreaker = true,
    enableRollback = true,
    maxConsecutiveErrors = 10,
    maxFailureRate = 20,
    batchSize = 25
  } = config;

  const result: EnhancedImportResult = {
    success: false,
    imported: 0,
    updated: 0,
    failed: 0,
    errors: [],
    warnings: [],
    circuitBreakerTriggered: false,
    rollbackAvailable: false,
    rollbackIds: [],
    errorsByType: {},
    validationResult: {
      isValid: true,
      errors: [],
      warnings: [],
      missingColumns: [],
      availableColumns: []
    }
  };

  // Initialize circuit breaker if enabled
  const circuitBreaker = enableCircuitBreaker 
    ? new CircuitBreaker({
        maxConsecutiveFailures: maxConsecutiveErrors,
        maxFailureRate,
        sampleSize: Math.min(50, Math.ceil(data.length * 0.1))
      })
    : null;

  const insertedIds: number[] = [];
  let processedData = testMode ? data.slice(0, testRecords) : data;
  const total = processedData.length;
  let current = 0;

  try {
    // Phase 1: Schema Validation
    onProgress?.({
      current: 0,
      total,
      status: 'validating',
      message: 'Validando esquema de base de datos...',
      phaseProgress: { phase: 'Validación de Esquema', progress: 0 }
    });

    const requiredColumns = [
      'id_servicio', 'nombre_cliente', 'telefono', 'origen', 'destino',
      'fecha_hora_cita', 'estado', 'nombre_custodio', 'updated_time', 'created_at'
    ];

    const schemaValidation = await validateTableSchema('servicios_custodia', requiredColumns);
    result.validationResult = schemaValidation;

    if (!schemaValidation.isValid) {
      result.errors.push(...schemaValidation.errors);
      onProgress?.({
        current: 0,
        total,
        status: 'error',
        message: 'Error de validación de esquema'
      });
      return result;
    }

    if (schemaValidation.warnings.length > 0) {
      result.warnings.push(...schemaValidation.warnings);
    }

    onProgress?.({
      current: 0,
      total,
      status: 'validating',
      message: 'Esquema validado correctamente',
      phaseProgress: { phase: 'Validación de Esquema', progress: 100 }
    });

    // Phase 2: Test Mode Validation (if enabled)
    if (testMode) {
      onProgress?.({
        current: 0,
        total,
        status: 'validating',
        message: `Modo de prueba: procesando ${testRecords} registros...`,
        phaseProgress: { phase: 'Modo de Prueba', progress: 0 }
      });
    }

    // Phase 3: Main Import Process
    onProgress?.({
      current: 0,
      total,
      status: 'processing',
      message: 'Iniciando importación...',
      phaseProgress: { phase: 'Importación', progress: 0 }
    });

    // Process in batches
    const batches = [];
    for (let i = 0; i < processedData.length; i += batchSize) {
      batches.push(processedData.slice(i, i + batchSize));
    }

    for (const [batchIndex, batch] of batches.entries()) {
      // Check circuit breaker before each batch
      if (circuitBreaker?.isCircuitOpen()) {
        result.circuitBreakerTriggered = true;
        result.errors.push(`Circuit breaker activado: ${circuitBreaker.getErrorReport()}`);
        
        onProgress?.({
          current,
          total,
          status: 'circuit_open',
          message: 'Importación detenida por circuit breaker'
        });
        
        break;
      }

      // Process each item in the batch
      for (const item of batch) {
        current++;
        
        onProgress?.({
          current,
          total,
          status: 'processing',
          message: `Procesando registro ${current} de ${total}`,
          phaseProgress: { 
            phase: 'Importación', 
            progress: Math.round((current / total) * 100) 
          }
        });

        try {
          // Validate required fields
          if (!item.id_servicio) {
            const errorType = 'missing_required_field';
            result.failed++;
            result.errors.push(`Registro ${current}: ID de servicio es requerido`);
            result.errorsByType[errorType] = (result.errorsByType[errorType] || 0) + 1;
            
            const circuitOpened = circuitBreaker?.recordFailure(errorType);
            if (circuitOpened) break;
            continue;
          }

          // Parse dates
          const fechaCitaResult = parseRobustDate(item.fecha_hora_cita);
          const createdAtResult = parseRobustDate(item.created_at);
          
          // Add date warnings
          if (item.fecha_hora_cita && !fechaCitaResult.success) {
            result.warnings.push(`Registro ${current}: ${fechaCitaResult.error}`);
          }

          // Prepare data for upsert
          const servicioData = {
            id_servicio: item.id_servicio,
            nombre_cliente: item.nombre_cliente || '',
            telefono: item.telefono || '',
            telefono_operador: item.telefono_operador || '',
            origen: item.origen || '',
            destino: item.destino || '',
            fecha_hora_cita: fechaCitaResult.isoString || null,
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

          // Check if record exists
          const { data: existingRecord } = await supabase
            .from('servicios_custodia')
            .select('id')
            .eq('id_servicio', servicioData.id_servicio)
            .maybeSingle();

          let upsertError = null;
          let recordId = null;

          if (existingRecord) {
            // Update existing record
            const { error } = await supabase
              .from('servicios_custodia')
              .update(servicioData)
              .eq('id_servicio', servicioData.id_servicio);
            upsertError = error;
            if (!error) {
              result.updated++;
              recordId = existingRecord.id;
            }
          } else {
            // Insert new record
            const { data: insertData, error } = await supabase
              .from('servicios_custodia')
              .insert(servicioData)
              .select('id');
            upsertError = error;
            if (!error && insertData?.[0]) {
              result.imported++;
              recordId = insertData[0].id;
              if (enableRollback) {
                insertedIds.push(recordId);
              }
            }
          }

          if (upsertError) {
            const errorType = categorizeError(upsertError.message);
            result.failed++;
            result.errors.push(`Registro ${current}: ${upsertError.message}`);
            result.errorsByType[errorType] = (result.errorsByType[errorType] || 0) + 1;
            
            const circuitOpened = circuitBreaker?.recordFailure(errorType);
            if (circuitOpened) break;
          } else {
            circuitBreaker?.recordSuccess();
          }

        } catch (itemError) {
          const errorType = 'processing_error';
          result.failed++;
          result.errors.push(`Registro ${current}: ${itemError instanceof Error ? itemError.message : 'Error desconocido'}`);
          result.errorsByType[errorType] = (result.errorsByType[errorType] || 0) + 1;
          
          const circuitOpened = circuitBreaker?.recordFailure(errorType);
          if (circuitOpened) break;
        }
      }

      // Check if circuit breaker was triggered during batch
      if (circuitBreaker?.isCircuitOpen()) {
        break;
      }

      // Small delay between batches
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Final status determination
    result.success = !result.circuitBreakerTriggered && (result.failed === 0 || (result.imported + result.updated) > 0);
    result.rollbackAvailable = enableRollback && insertedIds.length > 0;
    result.rollbackIds = insertedIds;
    
    const finalMessage = result.success 
      ? `Importación completada: ${result.imported} nuevos, ${result.updated} actualizados`
      : result.circuitBreakerTriggered
      ? `Importación detenida por circuit breaker: ${result.imported} nuevos, ${result.updated} actualizados, ${result.failed} fallidos`
      : `Importación con errores: ${result.imported} nuevos, ${result.updated} actualizados, ${result.failed} fallidos`;

    onProgress?.({
      current: total,
      total,
      status: result.success ? 'completed' : result.circuitBreakerTriggered ? 'circuit_open' : 'error',
      message: finalMessage
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

export const rollbackImport = async (recordIds: number[]): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from('servicios_custodia')
      .delete()
      .in('id', recordIds);

    if (error) {
      return { success: false, message: `Error en rollback: ${error.message}` };
    }

    return { 
      success: true, 
      message: `Rollback exitoso: ${recordIds.length} registros eliminados` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error en rollback: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    };
  }
};

function categorizeError(errorMessage: string): string {
  const msg = errorMessage.toLowerCase();
  
  if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('constraint')) {
    return 'duplicate_key';
  }
  if (msg.includes('column') && (msg.includes('does not exist') || msg.includes('unknown'))) {
    return 'column_not_found';
  }
  if (msg.includes('invalid') && msg.includes('date')) {
    return 'invalid_date';
  }
  if (msg.includes('invalid') && (msg.includes('number') || msg.includes('numeric'))) {
    return 'invalid_number';
  }
  if (msg.includes('null') || msg.includes('not null')) {
    return 'null_constraint';
  }
  if (msg.includes('permission') || msg.includes('access')) {
    return 'permission_error';
  }
  if (msg.includes('timeout') || msg.includes('connection')) {
    return 'connection_error';
  }
  
  return 'unknown_error';
}