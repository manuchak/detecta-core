/**
 * Format number with thousands separator
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX').format(Math.round(value));
};

/**
 * Format currency in millions with M suffix
 */
export const formatGMV = (value: number): string => {
  return `$${(value / 1_000_000).toFixed(1)}M`;
};

/**
 * Format currency without millions
 */
export const formatCurrency = (value: number): string => {
  return `$${formatNumber(value)}`;
};

/**
 * Format percentage with sign
 */
export const formatPercent = (value: number, showSign: boolean = true): string => {
  const formatted = value.toFixed(1);
  return showSign && value > 0 ? `+${formatted}%` : `${formatted}%`;
};
