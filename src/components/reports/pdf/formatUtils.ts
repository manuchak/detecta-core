/**
 * Shared formatting utilities for Historical Report PDF sections.
 */

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('es-MX').format(value);

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;
