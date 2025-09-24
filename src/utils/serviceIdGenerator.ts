import { format } from 'date-fns';

/**
 * Genera un ID único para servicios basado en la fecha y un sufijo aleatorio
 */
export function generateServiceId(): string {
  const today = format(new Date(), 'yyyyMMdd');
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SRV-${today}-${randomSuffix}`;
}

/**
 * Valida que un ID de servicio tenga el formato correcto
 */
export function isValidServiceId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Permitir diferentes formatos: SRV-YYYYMMDD-XXXX, o cualquier string alfanumérico
  const validPatterns = [
    /^SRV-\d{8}-[A-Z0-9]{6}$/,  // SRV-20241225-ABC123
    /^[a-zA-Z0-9_-]+$/           // Formato libre alfanumérico
  ];
  
  return validPatterns.some(pattern => pattern.test(id));
}

/**
 * Sugiere un ID de servicio único si el proporcionado ya existe
 */
export function suggestAlternativeServiceId(originalId: string): string {
  const timestamp = Date.now().toString(36).substring(-4).toUpperCase();
  
  // Si es un formato SRV estándar, reemplazar el sufijo
  if (originalId.startsWith('SRV-')) {
    const parts = originalId.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}-${timestamp}`;
    }
  }
  
  // Para otros formatos, agregar un sufijo
  return `${originalId}-${timestamp}`;
}