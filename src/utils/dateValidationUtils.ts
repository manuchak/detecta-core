/**
 * Enhanced date validation utilities for CSV import with user-friendly feedback
 */

import { parseRobustDate, DateParsingResult } from './dateUtils';

export interface DateValidationInfo {
  isValid: boolean;
  originalValue: any;
  transformedValue?: string;
  formatDetected?: string;
  message: string;
  messageType: 'success' | 'warning' | 'error';
  willBeTransformed: boolean;
}

/**
 * Validates a date value and provides user-friendly feedback about transformation
 */
export const validateDateWithFeedback = (value: any): DateValidationInfo => {
  // Handle empty values
  if (!value || value === '' || value === 'N/A' || value === null || value === undefined) {
    return {
      isValid: true,
      originalValue: value,
      message: 'Campo opcional (vacío)',
      messageType: 'success',
      willBeTransformed: false
    };
  }

  const parseResult = parseRobustDate(value);
  
  if (parseResult.success) {
    // Determine if transformation is happening
    const willBeTransformed = parseResult.format !== 'ISO String' && parseResult.format !== 'YYYY-MM-DD HH:MM';
    
    let message = '';
    let messageType: 'success' | 'warning' | 'error' = 'success';
    
    if (willBeTransformed) {
      switch (parseResult.format) {
        case 'DD/MM/YYYY':
          message = `✓ Será convertido de DD/MM/YYYY a YYYY-MM-DD`;
          messageType = 'success';
          break;
        case 'DD-MM-YYYY HH:MM':
          message = `✓ Será convertido de DD-MM-YYYY HH:MM a YYYY-MM-DD HH:MM`;
          messageType = 'success';
          break;
        case 'YYYY-MM-DD':
          message = `✓ Será convertido de YYYY-MM-DD a YYYY-MM-DD HH:MM`;
          messageType = 'success';
          break;
        case 'Excel Serial Number':
          message = `✓ Número de Excel será convertido a YYYY-MM-DD HH:MM`;
          messageType = 'success';
          break;
        case 'Direct Date Parse':
          message = `✓ Formato detectado automáticamente`;
          messageType = 'warning';
          break;
        default:
          message = `✓ Será convertido usando formato: ${parseResult.format}`;
          messageType = 'success';
      }
    } else {
      message = `✓ Formato correcto: ${parseResult.format}`;
      messageType = 'success';
    }

    // Add warning if date seems problematic
    if (parseResult.warning) {
      message += ` ⚠️ ${parseResult.warning}`;
      messageType = 'warning';
    }

    return {
      isValid: true,
      originalValue: value,
      transformedValue: parseResult.isoString,
      formatDetected: parseResult.format,
      message,
      messageType,
      willBeTransformed
    };
  } else {
    return {
      isValid: false,
      originalValue: value,
      message: `❌ ${parseResult.error || 'Formato no reconocido'}`,
      messageType: 'error',
      willBeTransformed: false
    };
  }
};

/**
 * Validates an array of date values and provides a summary with examples
 */
export const validateDateArrayWithFeedback = (values: any[]) => {
  const validations = values.slice(0, 100).map(validateDateWithFeedback); // Sample first 100
  
  const summary = {
    total: values.length,
    sampled: validations.length,
    valid: validations.filter(v => v.isValid).length,
    invalid: validations.filter(v => !v.isValid).length,
    willBeTransformed: validations.filter(v => v.willBeTransformed).length,
    formatsDetected: {} as Record<string, number>,
    examples: {
      valid: [] as DateValidationInfo[],
      invalid: [] as DateValidationInfo[],
      transformed: [] as DateValidationInfo[]
    }
  };

  // Count formats
  validations.forEach(validation => {
    if (validation.formatDetected) {
      summary.formatsDetected[validation.formatDetected] = 
        (summary.formatsDetected[validation.formatDetected] || 0) + 1;
    }
  });

  // Get examples
  summary.examples.valid = validations
    .filter(v => v.isValid && !v.willBeTransformed)
    .slice(0, 3);
  
  summary.examples.invalid = validations
    .filter(v => !v.isValid)
    .slice(0, 3);
    
  summary.examples.transformed = validations
    .filter(v => v.isValid && v.willBeTransformed)
    .slice(0, 3);

  return { summary, validations };
};

/**
 * Get supported date formats with examples
 */
export const getSupportedDateFormats = () => [
  {
    format: 'YYYY-MM-DD HH:MM',
    example: '2024-12-15 14:30',
    description: 'Formato preferido (sin conversión)'
  },
  {
    format: 'YYYY-MM-DD',
    example: '2024-12-15',
    description: 'Solo fecha (se agrega 00:00)'
  },
  {
    format: 'DD/MM/YYYY',
    example: '15/12/2024',
    description: 'Formato europeo (se convierte)'
  },
  {
    format: 'DD-MM-YYYY HH:MM',
    example: '15-12-2024 14:30',
    description: 'Europeo con hora (se convierte)'
  },
  {
    format: 'ISO String',
    example: '2024-12-15T14:30:00.000Z',
    description: 'Formato ISO estándar'
  },
  {
    format: 'Excel Serial',
    example: '45000',
    description: 'Número de serie de Excel'
  }
];