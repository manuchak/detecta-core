import { supabase } from '@/integrations/supabase/client';
import { parseRobustDate, isProblematicDate } from '@/utils/dateUtils';
import { validateTableSchema } from './schemaValidationService';

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

  // 1. Schema validation first
  const requiredColumns = [
    'id_servicio', 'nombre_cliente', 'telefono', 'origen', 'destino',
    'fecha_hora_cita', 'estado', 'nombre_custodio', 'updated_time', 'created_at'
  ];

  const schemaValidation = await validateTableSchema('servicios_custodia', requiredColumns);
  if (!schemaValidation.isValid) {
    result.errors.push(...schemaValidation.errors);
    result.isValid = false;
  }
  if (schemaValidation.warnings.length > 0) {
    result.warnings.push(...schemaValidation.warnings);
  }

  // 2. Check required field mapping
  if (!mapping['id_servicio']) {
    result.errors.push('El campo "id_servicio" es obligatorio y debe estar mapeado');
    result.isValid = false;
  }

  // 3. Check for duplicate id_servicio in the import data
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

  // 4. Check for empty required fields
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

  // 5. ✅ FASE 3: Sampling eliminado - validación de duplicados movida al import
  // La validación de IDs existentes ahora se hace en validateMultipleIds (hook) o durante el import

  // 6. ✅ FASE 3: Validación de fechas simplificada - validación completa movida al import
  // Solo verificamos formato básico aquí, la validación detallada ocurre durante el import
  const dateFields = ['fecha_hora_cita', 'created_at', 'fecha_contratacion'];
  let invalidDateCount = 0;
  dateFields.forEach(dbField => {
    const csvField = Object.keys(mapping).find(key => mapping[key] === dbField);
    if (csvField) {
      data.forEach((row, index) => {
        const dateValue = row[csvField];
        if (dateValue && dateValue !== '' && dateValue !== 'N/A') {
          const parseResult = parseRobustDate(dateValue);
          
          // Solo reportar fechas completamente inválidas (errores críticos)
          if (!parseResult.success) {
            invalidDateCount++;
            if (invalidDateCount <= 5) { // Limitar mensajes a primeros 5 errores
              result.invalidData.push({
                row: index + 1,
                field: dbField,
                value: dateValue,
                reason: `Fecha inválida: ${parseResult.error}`
              });
            }
          }
        }
      });
    }
  });
  
  if (invalidDateCount > 5) {
    result.warnings.push(`${invalidDateCount - 5} fechas inválidas adicionales no mostradas`);
  }

  // 7. Validate numeric fields
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