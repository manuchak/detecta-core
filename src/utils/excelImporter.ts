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
}

export interface MappingConfig {
  [excelColumn: string]: string; // maps excel column to database field
}

export const parseExcelFile = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) {
          throw new Error('El archivo Excel está vacío');
        }
        
        // Extract headers from first row
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);
        
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
          fileName: file.name
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
  return data.rows.map(row => {
    const transformedRow: any = {};
    
    Object.keys(mapping).forEach(excelColumn => {
      const dbField = mapping[excelColumn];
      if (dbField && row[excelColumn] !== undefined) {
        let value = row[excelColumn];
        
        // Apply transformations based on field type
        if (dbField.includes('fecha') && value) {
          // Try to parse dates
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            transformedRow[dbField] = date.toISOString().split('T')[0];
          }
        } else if (dbField.includes('lat') || dbField.includes('lng') || dbField.includes('prioridad')) {
          // Parse numbers
          const num = parseFloat(value);
          if (!isNaN(num)) {
            transformedRow[dbField] = num;
          }
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
    
    // Try to auto-match common field names
    if (header.includes('cliente')) {
      mapping[col.key] = 'cliente_id';
    } else if (header.includes('fecha')) {
      mapping[col.key] = 'fecha_programada';
    } else if (header.includes('origen')) {
      mapping[col.key] = 'origen_texto';
    } else if (header.includes('destino')) {
      mapping[col.key] = 'destino_texto';
    } else if (header.includes('tipo')) {
      mapping[col.key] = 'tipo_servicio';
    } else if (header.includes('gadget')) {
      mapping[col.key] = 'requiere_gadgets';
    } else if (header.includes('nota') || header.includes('comentario')) {
      mapping[col.key] = 'notas_especiales';
    } else if (header.includes('valor') || header.includes('precio')) {
      mapping[col.key] = 'valor_estimado';
    } else if (header.includes('prioridad')) {
      mapping[col.key] = 'prioridad';
    } else {
      mapping[col.key] = ''; // No mapping by default
    }
  });
  
  return mapping;
};
