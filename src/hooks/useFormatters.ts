
// Utility hooks for formatting data in the dashboard
import { useCurrencyConverter } from './useCurrencyConverter';

export const useFormatters = () => {
  const { autoConvertToMXN } = useCurrencyConverter();

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format currency with automatic USD to MXN conversion
  const formatCurrencyWithConversion = (value: number, showConversionInfo: boolean = false) => {
    const conversion = autoConvertToMXN(value);
    const formatted = formatCurrency(conversion.convertedAmount);
    
    if (showConversionInfo && conversion.wasConverted) {
      return `${formatted} (≈ $${conversion.originalAmount.toFixed(2)} USD)`;
    }
    
    return formatted;
  };

  // Format date in Spanish
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  };

  // Format time (HH:MM)
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(dateObj);
  };

  return {
    formatCurrency,
    formatCurrencyWithConversion,
    formatDate,
    formatTime
  };
};
