import * as XLSX from 'xlsx';

export interface ExcelColumn {
  key: string;
  header: string;
  sample?: string;
}

export interface ExcelRow {
  [key: string]: any;
}

export interface ExcelData {
  columns: ExcelColumn[];
  rows: ExcelRow[];
  fileName: string;
  sheets: string[];
  selectedSheet: string;
  headerRow: number;
  previewRows: any[][];
}

export interface MappingConfig {
  [excelColumn: string]: string; // maps excel column to database field
}

export const parseExcelFile = async (file: File, selectedSheet?: string, headerRow?: number): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('El archivo Excel no contiene hojas válidas');
        }
        
        // If no sheet selected, return basic info for sheet selection
        if (!selectedSheet) {
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          resolve({
            columns: [],
            rows: [],
            fileName: file.name,
            sheets: workbook.SheetNames,
            selectedSheet: firstSheet,
            headerRow: 1,
            previewRows: jsonData.slice(0, 10) // First 10 rows for preview
          });
          return;
        }
        
        const worksheet = workbook.Sheets[selectedSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) {
          throw new Error('La hoja seleccionada está vacía');
        }
        
        const actualHeaderRow = (headerRow || 1) - 1; // Convert to 0-based index
        
        if (actualHeaderRow >= jsonData.length) {
          throw new Error('La fila de encabezados especificada no existe');
        }
        
        // Extract headers from specified row
        const headers = jsonData[actualHeaderRow] as string[];
        const dataRows = jsonData.slice(actualHeaderRow + 1);
        
        // Create columns with sample data
        const columns: ExcelColumn[] = headers.map((header, index) => ({
          key: `col_${index}`,
          header: header || `Columna ${index + 1}`,
          sample: dataRows[0]?.[index]?.toString() || ''
        }));
        
        // Convert rows to objects
        const rows: ExcelRow[] = dataRows.map(row => {
          const obj: ExcelRow = {};
          headers.forEach((header, index) => {
            obj[`col_${index}`] = row[index] || '';
          });
          return obj;
        });
        
        resolve({
          columns,
          rows,
          fileName: file.name,
          sheets: workbook.SheetNames,
          selectedSheet,
          headerRow: headerRow || 1,
          previewRows: jsonData.slice(0, 10)
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
};

export const validateMappedData = (
  data: ExcelData, 
  mapping: MappingConfig,
  requiredFields: string[]
): { valid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if all required fields are mapped (allow 'fecha_hora_programada' to satisfy 'fecha_programada')
  const mappedFields = Object.values(mapping).filter(field => field !== '');
  const effectiveMapped = new Set(mappedFields);
  if (effectiveMapped.has('fecha_hora_programada')) {
    effectiveMapped.add('fecha_programada');
  }
  const missingFields = requiredFields.filter(field => !effectiveMapped.has(field));
  if (missingFields.length > 0) {
    errors.push(`Campos requeridos sin mapear: ${missingFields.join(', ')}`);
  }
  
  // Check for duplicate mappings
  const duplicateFields = mappedFields.filter((field, index) => 
    mappedFields.indexOf(field) !== index
  );
  
  if (duplicateFields.length > 0) {
    errors.push(`Campos duplicados: ${duplicateFields.join(', ')}`);
  }
  
  // Validate data quality
  const sampleSize = Math.min(10, data.rows.length);
  const sampleRows = data.rows.slice(0, sampleSize);
  
  // Check for empty required fields in sample data
  requiredFields.forEach(field => {
    const excelColumn = Object.keys(mapping).find(col => mapping[col] === field);
    if (excelColumn) {
      const emptyCount = sampleRows.filter(row => !row[excelColumn] || row[excelColumn].toString().trim() === '').length;
      if (emptyCount > 0) {
        warnings.push(`${field}: ${emptyCount} de ${sampleSize} registros vacíos en la muestra`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export const transformDataForImport = (
  data: ExcelData,
  mapping: MappingConfig
): any[] => {
  // Helper to parse Excel serial numbers and common string formats (incl. DD-MM-YYYY HH:MM)
  const parseExcelDateTime = (value: any): { date: string; time: string; dateTime: string } | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const fromDate = (d: Date) => {
      if (isNaN(d.getTime())) return undefined;
      const yyyy = d.getFullYear();
      const mm = pad2(d.getMonth() + 1);
      const dd = pad2(d.getDate());
      const hh = pad2(d.getHours());
      const mi = pad2(d.getMinutes());
      const date = `${yyyy}-${mm}-${dd}`;
      const time = `${hh}:${mi}`;
      return { date, time, dateTime: `${date} ${time}` };
    };
    try {
      if (typeof value === 'number') {
        // Excel serial date (days since 1899-12-30)
        const ms = Math.round((value - 25569) * 86400 * 1000);
        return fromDate(new Date(ms));
      }
      if (typeof value === 'string') {
        const s = value.trim().replace(/\s+/g, ' ');
        // Match DD-MM-YYYY or DD/MM/YYYY with optional time HH:MM[:SS]
        const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
        if (m) {
          const day = parseInt(m[1], 10);
          const month = parseInt(m[2], 10);
          const yearRaw = parseInt(m[3], 10);
          const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
          const hh = m[4] ? parseInt(m[4], 10) : 0;
          const mi = m[5] ? parseInt(m[5], 10) : 0;
          // Ignore seconds for DB compatibility (YYYY-MM-DD HH:MM)
          const date = `${year}-${pad2(month)}-${pad2(day)}`;
          const time = `${pad2(hh)}:${pad2(mi)}`;
          return { date, time, dateTime: `${date} ${time}` };
        }
      }
      const d = new Date(value);
      return fromDate(d);
    } catch {
      return undefined;
    }
  };

  const hasTimeComponent = (value: any): boolean => {
    if (typeof value === 'number') return value % 1 !== 0;
    if (typeof value === 'string') return /\d{1,2}:\d{2}/.test(value);
    return false;
  };

  return data.rows.map(row => {
    const transformedRow: any = {};
    
    Object.keys(mapping).forEach(excelColumn => {
      const dbField = mapping[excelColumn];
      if (dbField && row[excelColumn] !== undefined) {
        let value = row[excelColumn];
        
        // Datetime fields (store as 'YYYY-MM-DD HH:MM' without seconds)
        if ((dbField === 'fecha_hora_programada' || dbField === 'fecha_hora_recepcion_servicio' || dbField.includes('fecha_hora')) && value) {
          const parsed = parseExcelDateTime(value);
          if (parsed) {
            if (dbField === 'fecha_hora_programada') {
              transformedRow['fecha_programada'] = parsed.date;
              transformedRow['hora_programacion'] = parsed.time;
            } else {
              transformedRow[dbField] = parsed.dateTime;
            }
          }
        } else if (dbField.includes('fecha') && value) {
          // Date-only fields (but accept combined datetime too)
          const parsed = parseExcelDateTime(value);
          if (parsed) {
            transformedRow[dbField] = parsed.date;
            // If the source included time, also fill hora_programacion when not already mapped
            if (parsed.time && !transformedRow['hora_programacion']) {
              transformedRow['hora_programacion'] = parsed.time;
            }
          }
        } else if ((dbField.includes('lat') || dbField.includes('lng') || dbField.includes('prioridad')) && value !== '') {
          // Parse numbers
          const num = parseFloat(value);
          if (!isNaN(num)) {
            transformedRow[dbField] = num;
          }
        } else if (dbField.includes('hora') && value) {
          // Normalize time to HH:MM
          let hhmm = value.toString().trim();
          if (typeof value === 'number' && value >= 0 && value < 1) {
            // Excel time fraction
            const totalMinutes = Math.round(value * 24 * 60);
            const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
            const mm = String(totalMinutes % 60).padStart(2, '0');
            hhmm = `${hh}:${mm}`;
          } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(hhmm)) {
            // ISO datetime
            hhmm = hhmm.split('T')[1].slice(0,5);
          } else if (/\d{1,2}:\d{2}/.test(hhmm)) {
            const [h, m] = hhmm.split(':');
            hhmm = `${h.padStart(2,'0')}:${m}`;
          } else {
            // Try DD-MM-YYYY HH:MM
            const m = hhmm.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})[ T](\d{1,2}):(\d{2})/);
            if (m) {
              const h = m[4].padStart(2,'0');
              const mi = m[5];
              hhmm = `${h}:${mi}`;
            }
          }
          transformedRow[dbField] = hhmm;
        } else if (dbField === 'requiere_gadgets') {
          // Parse boolean
          transformedRow[dbField] = ['true', '1', 'si', 'sí', 'yes'].includes(value.toString().toLowerCase());
        } else {
          // Keep as string
          transformedRow[dbField] = value.toString().trim();
        }
      }
    });
    
    return transformedRow;
  });
};

export const getDefaultMapping = (columns: ExcelColumn[]): MappingConfig => {
  const mapping: MappingConfig = {};
  
  columns.forEach(col => {
    const header = col.header.toLowerCase();
    const h = header.replace(/\s+/g, ' ');

    // Try to auto-match common field names (more specific first)
    if (h.includes('folio')) {
      mapping[col.key] = 'folio';
    } else if (h.includes('recepcion') || (h.includes('fecha') && h.includes('hora') && (h.includes('solicitud') || h.includes('recepción')))) {
      mapping[col.key] = 'fecha_hora_recepcion_servicio';
    } else if (h.includes('fecha') && h.includes('hora')) {
      mapping[col.key] = 'fecha_hora_programada';
    } else if ((h.includes('cliente') && h.includes('id')) || h.includes('cliente_id')) {
      mapping[col.key] = 'cliente_id';
    } else if (h.includes('cliente')) {
      mapping[col.key] = 'cliente';
    } else if (h.includes('fecha') && !h.includes('hora')) {
      mapping[col.key] = 'fecha_programada';
    } else if (h.includes('hora')) {
      mapping[col.key] = 'hora_programacion';
    } else if (h.includes('origen')) {
      mapping[col.key] = 'origen_texto';
    } else if (h.includes('destino')) {
      mapping[col.key] = 'destino_texto';
    } else if (h.includes('custodio') && (h.includes('id') || h.includes('codigo') || h.includes('código'))) {
      mapping[col.key] = 'custodio_asignado_id';
    } else if (h.includes('tipo')) {
      mapping[col.key] = 'tipo_servicio';
    } else if (h.includes('gadget')) {
      mapping[col.key] = 'requiere_gadgets';
    } else if (h.includes('nota') || h.includes('comentario')) {
      mapping[col.key] = 'notas_especiales';
    } else if (h.includes('valor') || h.includes('precio')) {
      mapping[col.key] = 'valor_estimado';
    } else if (h.includes('prioridad')) {
      mapping[col.key] = 'prioridad';
    } else {
      mapping[col.key] = ''; // No mapping by default
    }
  });
  
  return mapping;
};

// Default mapping specifically for price matrix
export const getPriceMatrixDefaultMapping = (columns: ExcelColumn[]): MappingConfig => {
  const mapping: MappingConfig = {};
  
  columns.forEach(col => {
    const header = col.header.toLowerCase();
    const h = header.replace(/\s+/g, ' ').trim();

    // Try to auto-match price matrix field names
    if (h === 'cliente' || h.includes('cliente')) {
      mapping[col.key] = 'cliente_nombre';
    } else if (h === 'clave' || h.includes('clave')) {
      mapping[col.key] = 'clave';
    } else if (h === 'tipo' && !h.includes('viaje')) {
      mapping[col.key] = 'tipo_servicio';
    } else if (h === 'origen' || h.includes('origen')) {
      mapping[col.key] = 'origen_texto';
    } else if (h === 'destino' || h.includes('destino')) {
      mapping[col.key] = 'destino_texto';
    } else if (h === 'tipo de viaje' || h === 'tipo viaje' || (h.includes('tipo') && h.includes('viaje'))) {
      mapping[col.key] = 'tipo_viaje';
    } else if (h === 'precio a cliente' || h === 'precio al cliente' || h.includes('precio cliente')) {
      mapping[col.key] = 'valor_bruto';
    } else if (h === 'costo custodio' || (h.includes('costo') && h.includes('custodio') && !h.includes('pago'))) {
      mapping[col.key] = 'costo_custodio';
    } else if (h === 'costo maximo en casetas' || h === 'costo máximo en casetas' || (h.includes('casetas') && h.includes('máximo'))) {
      mapping[col.key] = 'costo_maximo_casetas';
    } else if (h === 'pago custodio sin arma' || (h.includes('pago') && h.includes('sin') && h.includes('arma'))) {
      mapping[col.key] = 'pago_custodio_sin_arma';
    } else if (h === 'dias operacion' || h === 'días operacion' || (h.includes('dias') && h.includes('operacion')) || (h.includes('días') && h.includes('operacion'))) {
      mapping[col.key] = 'dias_operacion';
    } else if (h === 'valor bruto' || (h.includes('valor') && h.includes('bruto'))) {
      mapping[col.key] = 'valor_bruto';
    } else if (h === 'precio custodio' || h === 'precio a custodio' || (h.includes('precio') && h.includes('custodio') && !h.includes('cliente'))) {
      mapping[col.key] = 'precio_custodio';
    } else if (h === 'costo operativo' || (h.includes('costo') && h.includes('operativo'))) {
      mapping[col.key] = 'costo_operativo';
    } else if (h === 'no de kms' || h === 'distancia km' || h === 'distancia (km)' || (h.includes('distancia') && h.includes('km')) || h === 'kms') {
      mapping[col.key] = 'distancia_km';
    } else if (h === 'precio desde casa' || h.includes('desde') && h.includes('casa')) {
      mapping[col.key] = 'precio_desde_casa';
    } else if (h === 'precio historico 2022' || h.includes('histórico') || h.includes('historico')) {
      mapping[col.key] = 'precio_historico_2022';
    } else if (h === 'precio operativo logistico' || h.includes('logístico') || h.includes('logistico')) {
      mapping[col.key] = 'precio_operativo_logistico';
    } else {
      mapping[col.key] = ''; // No mapping by default
    }
  });
  
  return mapping;
};

// Transform data specifically for price matrix
export const transformPriceMatrixDataForImport = (
  data: ExcelData,
  mapping: MappingConfig
): any[] => {
  return data.rows.map(row => {
    const transformedRow: any = {};
    
    Object.keys(mapping).forEach(excelColumn => {
      const dbField = mapping[excelColumn];
      if (dbField && row[excelColumn] !== undefined) {
        let value = row[excelColumn];
        
        // Handle numeric fields
        if (['valor_bruto', 'precio_custodio', 'costo_operativo', 'distancia_km', 
             'precio_desde_casa', 'precio_historico_2022', 'precio_operativo_logistico'].includes(dbField)) {
          const num = parseFloat(value);
          transformedRow[dbField] = !isNaN(num) ? num : 0;
        } else {
          // Handle text fields
          transformedRow[dbField] = value.toString().trim();
        }
      }
    });
    
    // Set default active status
    transformedRow.activo = true;
    
    return transformedRow;
  });
};

// Validate price matrix data
export const validatePriceMatrixData = (
  data: ExcelData, 
  mapping: MappingConfig
): { valid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const requiredFields = ['cliente_nombre', 'destino_texto', 'precio_custodio'];
  
  // Check if all required fields are mapped
  const mappedFields = Object.values(mapping).filter(field => field !== '');
  const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
  
  if (missingFields.length > 0) {
    errors.push(`Campos requeridos sin mapear: ${missingFields.join(', ')}`);
  }
  
  // Check for duplicate mappings
  const duplicateFields = mappedFields.filter((field, index) => 
    mappedFields.indexOf(field) !== index
  );
  
  if (duplicateFields.length > 0) {
    errors.push(`Campos duplicados: ${duplicateFields.join(', ')}`);
  }
  
  // Validate data quality on sample
  const sampleSize = Math.min(10, data.rows.length);
  const sampleRows = data.rows.slice(0, sampleSize);
  
  // Check for empty required fields in sample data
  requiredFields.forEach(field => {
    const excelColumn = Object.keys(mapping).find(col => mapping[col] === field);
    if (excelColumn) {
      const emptyCount = sampleRows.filter(row => 
        !row[excelColumn] || row[excelColumn].toString().trim() === ''
      ).length;
      if (emptyCount > 0) {
        warnings.push(`${field}: ${emptyCount} de ${sampleSize} registros vacíos en la muestra`);
      }
    }
  });
  
  // Check for invalid numeric values
  const numericFields = [
    'valor_bruto', 
    'precio_custodio', 
    'costo_custodio', 
    'costo_operativo', 
    'costo_maximo_casetas', 
    'pago_custodio_sin_arma', 
    'distancia_km'
  ];
  numericFields.forEach(field => {
    const excelColumn = Object.keys(mapping).find(col => mapping[col] === field);
    if (excelColumn) {
      const invalidCount = sampleRows.filter(row => {
        const value = row[excelColumn];
        return value && isNaN(parseFloat(value));
      }).length;
      if (invalidCount > 0) {
        warnings.push(`${field}: ${invalidCount} de ${sampleSize} valores no numéricos en la muestra`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};
