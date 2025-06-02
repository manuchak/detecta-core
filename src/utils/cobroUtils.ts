
export const parseCobroCliente = (cobro: unknown): number | null => {
  if (cobro === null || cobro === undefined) return null;
  if (typeof cobro === 'string' && cobro === '') return null;
  
  const cobroNumerico = Number(cobro);
  return isNaN(cobroNumerico) ? null : cobroNumerico;
};

export const isValidCobro = (cobro: unknown): boolean => {
  const parsed = parseCobroCliente(cobro);
  return parsed !== null && parsed > 0;
};
