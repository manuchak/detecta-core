
// Utility hooks for formatting data in the dashboard

export const useFormatters = () => {
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(value);
  };

  return {
    formatCurrency
  };
};
