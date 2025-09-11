import { supabase } from '@/integrations/supabase/client';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingColumns: string[];
  availableColumns: string[];
}

export const validateTableSchema = async (
  tableName: 'servicios_custodia',
  requiredColumns: string[]
): Promise<SchemaValidationResult> => {
  const result: SchemaValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missingColumns: [],
    availableColumns: []
  };

  try {
    // For servicios_custodia table, we know it exists, so let's validate directly
    if (tableName !== 'servicios_custodia') {
      result.isValid = false;
      result.errors.push(`Tabla no soportada: '${tableName}'`);
      return result;
    }

    // Try to get column information by attempting to select each required column
    const columnChecks = await Promise.all(
      requiredColumns.map(async (column) => {
        try {
          const { error } = await supabase
            .from('servicios_custodia')
            .select(column)
            .limit(0);
          
          return { column, exists: !error };
        } catch {
          return { column, exists: false };
        }
      })
    );

    const missingColumns = columnChecks
      .filter(check => !check.exists)
      .map(check => check.column);

    const existingColumns = columnChecks
      .filter(check => check.exists)
      .map(check => check.column);

    result.availableColumns = existingColumns;
    result.missingColumns = missingColumns;

    if (missingColumns.length > 0) {
      result.isValid = false;
      result.errors.push(
        `Las siguientes columnas no existen en la tabla '${tableName}': ${missingColumns.join(', ')}`
      );
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Error al validar esquema: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  return result;
};

export const getTableColumns = async (tableName: 'servicios_custodia'): Promise<string[]> => {
  try {
    // Get a sample record to inspect available columns for servicios_custodia
    const { data, error } = await supabase
      .from('servicios_custodia')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(`Could not fetch sample from ${tableName}:`, error);
      return [];
    }

    return data ? Object.keys(data) : [];
  } catch (error) {
    console.error(`Error getting columns for ${tableName}:`, error);
    return [];
  }
};