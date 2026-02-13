/**
 * Utilidad centralizada para normalización de teléfonos.
 * Elimina todos los caracteres no numéricos y retorna los últimos 10 dígitos.
 * Esto garantiza compatibilidad entre profiles.phone (formato humano)
 * y las tablas operativas (formato limpio de 10 dígitos).
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}
