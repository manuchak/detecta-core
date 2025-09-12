import { parseRobustDate } from '@/utils/dateUtils';
export interface ValidationResult {
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
}

export const validateCustodianServicesData = (
  data: any[], 
  mapping: Record<string, string>
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicateIds: string[] = [];
  const invalidData: Array<{
    row: number;
    field: string;
    value: any;
    reason: string;
  }> = [];

  // Verificar que existe mapeo para id_servicio (campo requerido)
  const idServicioField = Object.keys(mapping).find(key => mapping[key] === 'id_servicio');
  if (!idServicioField) {
    errors.push('El campo "id_servicio" es obligatorio y debe estar mapeado');
  }

  // Verificar duplicados de ID
  const seenIds = new Set<string>();
  const duplicatedIds = new Set<string>();
  
  data.forEach((row, index) => {
    if (idServicioField && row[idServicioField]) {
      const id = String(row[idServicioField]).trim();
      if (seenIds.has(id)) {
        duplicatedIds.add(id);
      }
      seenIds.add(id);
    }
  });

  duplicateIds.push(...Array.from(duplicatedIds));

  // Count of dates that will be auto-converted (valid but not in preferred format)
  let convertibleDates = 0;

  // Validaciones específicas por fila
  data.forEach((row, index) => {
    const rowNum = index + 1;

    // Validar ID de servicio
    if (idServicioField) {
      const idValue = row[idServicioField];
      if (!idValue || String(idValue).trim() === '') {
        invalidData.push({
          row: rowNum,
          field: 'id_servicio',
          value: idValue,
          reason: 'ID de servicio vacío o nulo'
        });
      }
    }

    // Validar fechas
    Object.keys(mapping).forEach(csvField => {
      const dbField = mapping[csvField];
      const value = row[csvField];
      
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        // Validar fechas
        if (dbField && (dbField.includes('fecha') || dbField.includes('hora'))) {
          const parsed = parseRobustDate(value);
          if (!parsed.success) {
            invalidData.push({
              row: rowNum,
              field: dbField,
              value,
              reason: parsed.error || 'Formato de fecha inválido'
            });
          } else {
            if (parsed.format && parsed.format !== 'ISO String' && parsed.format !== 'YYYY-MM-DD HH:MM') {
              convertibleDates++;
            }
          }
        }

        // Validar números
        if (['km_recorridos', 'km_teorico', 'cobro_cliente'].includes(dbField)) {
          const numValue = Number(value);
          if (isNaN(numValue) && String(value) !== 'NaN' && String(value).trim() !== '') {
            invalidData.push({
              row: rowNum,
              field: dbField,
              value: value,
              reason: 'Valor numérico inválido'
            });
          }
        }
      }
    });
  });

  // Generar resumen de advertencias
  if (duplicateIds.length > 0) {
    warnings.push(`Se encontraron ${duplicateIds.length} IDs duplicados`);
  }

  if (invalidData.length > 0) {
    warnings.push(`Se encontraron ${invalidData.length} campos con datos inválidos`);
  }

  if (convertibleDates > 0) {
    warnings.push(`Se detectaron ${convertibleDates} fechas en formato no preferido; se convertirán automáticamente`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    duplicateIds,
    invalidData
  };
};

export const getQuickValidationSample = (data: any[], sampleSize = 10): any[] => {
  if (data.length <= sampleSize) {
    return data;
  }
  
  const step = Math.floor(data.length / sampleSize);
  const sample: any[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    sample.push(data[i]);
    if (sample.length >= sampleSize) break;
  }
  
  return sample;
};