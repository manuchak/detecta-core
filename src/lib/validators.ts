/**
 * Validation utilities for Planeación module
 */

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value);
}

/**
 * Validates a service operation before executing
 * Returns validation result with error message if invalid
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateServiceOperation(
  serviceId: string | null | undefined,
  operationType: 'cancel' | 'update_status' | 'reassign' | 'edit'
): ValidationResult {
  if (!serviceId) {
    return {
      isValid: false,
      error: `No se puede ejecutar ${operationType}: ID de servicio no proporcionado`
    };
  }

  if (!isValidUUID(serviceId)) {
    return {
      isValid: false,
      error: `No se puede ejecutar ${operationType}: ID de servicio inválido (${serviceId})`
    };
  }

  return { isValid: true };
}

/**
 * Normalizes custodian name from string or object format
 */
export function normalizeCustodioName(
  custodio: string | { nombre: string } | null | undefined
): string | null {
  if (!custodio) return null;
  
  if (typeof custodio === 'string') {
    return custodio.trim() || null;
  }
  
  if (typeof custodio === 'object' && 'nombre' in custodio) {
    return custodio.nombre?.trim() || null;
  }
  
  return null;
}

/**
 * Validates search input for service queries
 */
export function validateSearchInput(
  input: string,
  minLength: number = 1,
  maxLength: number = 100
): ValidationResult {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: 'El campo de búsqueda no puede estar vacío'
    };
  }
  
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `Mínimo ${minLength} caracteres requeridos`
    };
  }
  
  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Máximo ${maxLength} caracteres permitidos`
    };
  }
  
  return { isValid: true };
}
