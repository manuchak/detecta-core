/**
 * Utility functions for robust date parsing and validation
 * Handles multiple date formats commonly found in Excel imports
 */

export interface DateParsingResult {
  success: boolean;
  parsedDate?: Date;
  isoString?: string;
  originalValue: any;
  format?: string;
  error?: string;
  warning?: string;
}

/**
 * Robust date parsing function that handles multiple formats
 * @param value - The date value to parse (string, number, or Date)
 * @returns DateParsingResult with parsing details
 */
export const parseRobustDate = (value: any): DateParsingResult => {
  const result: DateParsingResult = {
    success: false,
    originalValue: value
  };

  if (!value || value === '' || value === 'N/A' || value === null || value === undefined) {
    result.success = true; // Empty values are valid (optional fields)
    return result;
  }

  try {
    // If it's already a valid ISO string, return it
    if (typeof value === 'string' && value.includes('T') && (value.includes('Z') || value.includes('+'))) {
      const date = new Date(value);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1980) {
        result.success = true;
        result.parsedDate = date;
        result.isoString = date.toISOString();
        result.format = 'ISO String';
        return result;
      }
    }

    // Handle "YYYY-MM-DD HH:MM" format (most common from Excel parser)
    if (typeof value === 'string') {
      const dateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
      if (dateTimeMatch) {
        const [, year, month, day, hour, minute, second] = dateTimeMatch;
        const date = new Date(
          parseInt(year), 
          parseInt(month) - 1, 
          parseInt(day), 
          parseInt(hour), 
          parseInt(minute),
          parseInt(second || '0')
        );
        
        if (!isNaN(date.getTime()) && date.getFullYear() > 1980) {
          result.success = true;
          result.parsedDate = date;
          result.isoString = date.toISOString();
          result.format = 'YYYY-MM-DD HH:MM';
          return result;
        }
      }

      // Handle "YYYY-MM-DD" format (date only)
      const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(date.getTime()) && date.getFullYear() > 1980) {
          result.success = true;
          result.parsedDate = date;
          result.isoString = date.toISOString();
          result.format = 'YYYY-MM-DD';
          return result;
        }
      }

      // Handle "DD-MM-YYYY HH:MM" format
      const ddmmyyyyMatch = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year, hour, minute] = ddmmyyyyMatch;
        const date = new Date(
          parseInt(year), 
          parseInt(month) - 1, 
          parseInt(day), 
          parseInt(hour), 
          parseInt(minute)
        );
        
        if (!isNaN(date.getTime()) && date.getFullYear() > 1980) {
          result.success = true;
          result.parsedDate = date;
          result.isoString = date.toISOString();
          result.format = 'DD-MM-YYYY HH:MM';
          return result;
        }
      }

      // Handle "DD/MM/YYYY" format
      const ddslashmmyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddslashmmyyyyMatch) {
        const [, day, month, year] = ddslashmmyyyyMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(date.getTime()) && date.getFullYear() > 1980) {
          result.success = true;
          result.parsedDate = date;
          result.isoString = date.toISOString();
          result.format = 'DD/MM/YYYY';
          return result;
        }
      }

      // Handle "DD/MM/YYYY HH:MM" format  
      const ddslashmmyyyyTimeMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (ddslashmmyyyyTimeMatch) {
        const [, day, month, year, hour, minute, second] = ddslashmmyyyyTimeMatch;
        const date = new Date(
          parseInt(year), 
          parseInt(month) - 1, 
          parseInt(day), 
          parseInt(hour), 
          parseInt(minute),
          parseInt(second || '0')
        );
        
        if (!isNaN(date.getTime()) && date.getFullYear() > 1980) {
          result.success = true;
          result.parsedDate = date;
          result.isoString = date.toISOString();
          result.format = 'DD/MM/YYYY HH:MM';
          return result;
        }
      }
    }

    // Handle Excel serial numbers
    if (typeof value === 'number' && value > 25569) { // Excel dates after 1970
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1980) {
        result.success = true;
        result.parsedDate = date;
        result.isoString = date.toISOString();
        result.format = 'Excel Serial Number';
        return result;
      }
    }

    // Last resort: try direct Date parsing
    const date = new Date(value);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1980) {
      result.success = true;
      result.parsedDate = date;
      result.isoString = date.toISOString();
      result.format = 'Direct Date Parse';
      
      // Add warning for dates that might be misinterpreted
      if (date.getFullYear() < 2000 || date.getFullYear() > 2030) {
        result.warning = `Fecha en rango inusual: ${date.getFullYear()}`;
      }
      
      return result;
    }

    // If we get here, parsing failed
    result.error = `Formato de fecha no reconocido: "${value}" (tipo: ${typeof value})`;
    return result;

  } catch (error) {
    result.error = `Error al parsear fecha: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    return result;
  }
};

/**
 * Validates an array of date values and returns a summary
 * @param values - Array of date values to validate
 * @returns Summary of validation results
 */
export const validateDateArray = (values: any[]) => {
  const results = values.map(parseRobustDate);
  
  const summary = {
    total: values.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    withWarnings: results.filter(r => r.warning).length,
    formats: {} as Record<string, number>,
    errors: results.filter(r => r.error).map(r => r.error),
    warnings: results.filter(r => r.warning).map(r => r.warning)
  };

  // Count formats
  results.forEach(result => {
    if (result.format) {
      summary.formats[result.format] = (summary.formats[result.format] || 0) + 1;
    }
  });

  return { summary, results };
};

/**
 * Helper function to check if a date parsing result indicates a problematic date (like year 1970)
 * @param result - DateParsingResult to check
 * @returns true if the date seems problematic
 */
export const isProblematicDate = (result: DateParsingResult): boolean => {
  if (!result.success || !result.parsedDate) return false;
  
  const year = result.parsedDate.getFullYear();
  return year < 1980 || year > 2030;
};

/**
 * Format a date parsing result for logging
 * @param result - DateParsingResult to format
 * @returns Formatted string for logging
 */
export const formatDateParsingResult = (result: DateParsingResult): string => {
  if (!result.success) {
    return `❌ Failed: "${result.originalValue}" -> ${result.error}`;
  }
  
  let message = `✅ Success: "${result.originalValue}" -> ${result.isoString} (${result.format})`;
  
  if (result.warning) {
    message += ` ⚠️ ${result.warning}`;
  }
  
  if (isProblematicDate(result)) {
    message += ` 🚨 PROBLEMATIC DATE`;
  }
  
  return message;
};