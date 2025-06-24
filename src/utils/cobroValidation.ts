
// Función ultra-permisiva para validar cobro_cliente
export const isValidCobroUltraPermissive = (cobro: any): boolean => {
  // Rechazar solo casos muy específicos
  if (cobro === null || cobro === undefined) {
    return false;
  }
  
  // Aceptar string vacío como 0
  if (cobro === '') {
    return true;
  }
  
  // Aceptar cualquier número (incluyendo 0)
  if (typeof cobro === 'number') {
    return !isNaN(cobro) && isFinite(cobro);
  }
  
  // Aceptar strings que pueden convertirse a número
  if (typeof cobro === 'string') {
    const trimmed = cobro.trim();
    if (trimmed === '') return true; // string vacío = 0
    const numericValue = Number(trimmed);
    return !isNaN(numericValue) && isFinite(numericValue);
  }
  
  return false;
};

// Función ultra-permisiva para convertir cobro a número
export const parseCobroUltraPermissive = (cobro: any): number => {
  if (cobro === null || cobro === undefined) {
    return 0;
  }
  
  if (cobro === '') {
    return 0;
  }
  
  if (typeof cobro === 'number') {
    return isNaN(cobro) ? 0 : cobro;
  }
  
  if (typeof cobro === 'string') {
    const trimmed = cobro.trim();
    if (trimmed === '' || trimmed === '0') return 0;
    const numericValue = Number(trimmed);
    return isNaN(numericValue) ? 0 : numericValue;
  }
  
  return 0;
};
