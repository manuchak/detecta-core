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
  const parseExcelDateTime = (value: any): string | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    try {
      if (typeof value === 'number') {
        // Excel serial date (days since 1899-12-30)
        const ms = Math.round((value - 25569) * 86400 * 1000);
        const d = new Date(ms);
        return isNaN(d.getTime()) ? undefined : d.toISOString();
      }
      if (typeof value === 'string') {
        const s = value.trim().replace(/\s+/g, ' ');
        // Match DD-MM-YYYY or DD/MM/YYYY with optional time HH:MM[:SS]
        const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
        if (m) {
          const day = parseInt(m[1], 10);
          const month = parseInt(m[2], 10) - 1;
          const yearRaw = parseInt(m[3], 10);
          const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
          const hh = m[4] ? parseInt(m[4], 10) : 0;
          const mm = m[5] ? parseInt(m[5], 10) : 0;
          const ss = m[6] ? parseInt(m[6], 10) : 0;
          const d = new Date(year, month, day, hh, mm, ss);
          return isNaN(d.getTime()) ? undefined : d.toISOString();
        }
      }
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
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
        
        // Datetime fields (keep full timestamp)
        if ((dbField === 'fecha_hora_programada' || dbField === 'fecha_hora_recepcion_servicio' || dbField.includes('fecha_hora')) && value) {
          const iso = parseExcelDateTime(value);
          if (iso) {
            if (dbField === 'fecha_hora_programada') {
              // Split into fecha_programada and hora_programacion
              const [dPart, tPart] = iso.split('T');
              transformedRow['fecha_programada'] = dPart;
              transformedRow['hora_programacion'] = tPart.slice(0,5);
            } else {
              transformedRow[dbField] = iso;
            }
          }
        } else if (dbField.includes('fecha') && value) {
          // Date-only fields (but accept combined datetime too)
          const iso = parseExcelDateTime(value);
          if (iso) {
            const [dPart, tPart] = iso.split('T');
            transformedRow[dbField] = dPart;
            // If the source included time, also fill hora_programacion when not already mapped
            if (hasTimeComponent(value) && !transformedRow['hora_programacion']) {
              transformedRow['hora_programacion'] = tPart.slice(0,5);
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
