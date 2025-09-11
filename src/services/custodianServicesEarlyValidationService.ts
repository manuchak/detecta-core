import { supabase } from '@/integrations/supabase/client';
import { parseRobustDate, isProblematicDate } from '@/utils/dateUtils';

export interface EarlyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duplicateIds: string[];
  invalidData: Array<{
    row: number;
    field: string;
    value: any;
    reason: string;
  }>;
  estimatedTime: number; // in seconds
}

export const validateDataBeforeImport = async (
  data: any[],
  mapping: Record<string, string>
): Promise<EarlyValidationResult> => {
  const result: EarlyValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    duplicateIds: [],
    invalidData: [],
    estimatedTime: Math.ceil(data.length / 25) * 2 // Estimated time based on batch processing
  };

  console.log('🔍 Starting early validation for', data.length, 'records');

  // 1. Check required field mapping
  if (!mapping['id_servicio']) {
    result.errors.push('El campo "id_servicio" es obligatorio y debe estar mapeado');
    result.isValid = false;
  }

  // 2. Check for duplicate id_servicio in the import data
  const idServicioField = mapping['id_servicio'];
  if (idServicioField) {
    const seenIds = new Set<string>();
    const duplicates = new Set<string>();
    
    data.forEach((row, index) => {
      const idServicio = row[idServicioField];
      if (idServicio) {
        if (seenIds.has(idServicio)) {
          duplicates.add(idServicio);
        } else {
          seenIds.add(idServicio);
        }
      }
    });
    
    if (duplicates.size > 0) {
      result.duplicateIds = Array.from(duplicates);
      result.warnings.push(`Se encontraron ${duplicates.size} IDs de servicio duplicados en el archivo`);
    }
  }

  // 3. Check for empty required fields
  data.forEach((row, index) => {
    const idServicio = row[mapping['id_servicio']];
    if (!idServicio || idServicio.trim() === '') {
      result.invalidData.push({
        row: index + 1,
        field: 'id_servicio',
        value: idServicio,
        reason: 'Campo requerido vacío'
      });
    }
  });

  // 4. Sample check for existing records in database (check first 100 to estimate conflicts)
  if (mapping['id_servicio']) {
    const sampleSize = Math.min(100, data.length);
    const sampleIds = data.slice(0, sampleSize)
      .map(row => row[mapping['id_servicio']])
      .filter(id => id && id.trim() !== '');

    if (sampleIds.length > 0) {
      try {
        const { data: existingRecords, error } = await supabase
          .from('servicios_custodia')
          .select('id_servicio')
          .in('id_servicio', sampleIds);

        if (error) {
          result.warnings.push(`No se pudo verificar duplicados en la base de datos: ${error.message}`);
        } else if (existingRecords && existingRecords.length > 0) {
          const existingCount = existingRecords.length;
          const estimatedTotalExisting = Math.round((existingCount / sampleSize) * data.length);
          result.warnings.push(
            `Se encontraron ${existingCount} registros existentes en la muestra de ${sampleSize}. ` +
            `Estimado: ${estimatedTotalExisting} registros serán actualizados.`
          );
        }
      } catch (error) {
        result.warnings.push('Error al verificar duplicados en la base de datos');
      }
    }
  }

  // 5. Enhanced date format validation using robust parsing
  const dateFields = ['fecha_hora_cita', 'created_at'];
  dateFields.forEach(dbField => {
    const csvField = Object.keys(mapping).find(key => mapping[key] === dbField);
    if (csvField) {
      data.forEach((row, index) => {
        const dateValue = row[csvField];
        if (dateValue && dateValue !== '' && dateValue !== 'N/A') {
          const parseResult = parseRobustDate(dateValue);
          
          if (!parseResult.success) {
            result.invalidData.push({
              row: index + 1,
              field: dbField,
              value: dateValue,
              reason: `Fecha inválida: ${parseResult.error}`
            });
          } else if (parseResult.parsedDate && isProblematicDate(parseResult)) {
            result.warnings.push(
              `Fila ${index + 1}, campo ${dbField}: Fecha sospechosa "${dateValue}" parseada como ${parseResult.isoString} - revisar formato`
            );
          }
        }
      });
    }
  });

  // 6. Validate numeric fields
  const numericFields = ['km_recorridos', 'km_teorico', 'cobro_cliente', 'tiempo_retraso'];
  numericFields.forEach(dbField => {
    const csvField = Object.keys(mapping).find(key => mapping[key] === dbField);
    if (csvField) {
      data.forEach((row, index) => {
        const numValue = row[csvField];
        if (numValue && numValue !== '' && numValue !== 'N/A') {
          const parsed = parseFloat(numValue);
          if (isNaN(parsed)) {
            result.invalidData.push({
              row: index + 1,
              field: dbField,
              value: numValue,
              reason: 'Valor numérico inválido'
            });
          }
        }
      });
    }
  });

  // Determine if validation passed
  if (result.errors.length > 0 || result.invalidData.length > data.length * 0.1) {
    result.isValid = false;
    if (result.invalidData.length > data.length * 0.1) {
      result.errors.push(`Demasiados datos inválidos: ${result.invalidData.length} errores de ${data.length} registros`);
    }
  }

  console.log('✅ Early validation completed:', {
    isValid: result.isValid,
    errors: result.errors.length,
    warnings: result.warnings.length,
    invalidData: result.invalidData.length
  });

  return result;
};

export const getValidationSummary = (result: EarlyValidationResult) => {
  return {
    canProceed: result.isValid,
    totalIssues: result.errors.length + result.invalidData.length,
    criticalIssues: result.errors.length,
    warnings: result.warnings.length,
    estimatedDuration: `${Math.floor(result.estimatedTime / 60)}:${(result.estimatedTime % 60).toString().padStart(2, '0')}`
  };
};