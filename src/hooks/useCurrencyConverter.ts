import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyConfig {
  id: string;
  moneda_base: string;
  moneda_destino: string;
  tipo_cambio: number;
  fecha_actualizacion: string;
  activo: boolean;
}

interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  wasConverted: boolean;
}

export const useCurrencyConverter = () => {
  const { data: currencyConfig, isLoading } = useQuery({
    queryKey: ['currency-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracion_moneda')
        .select('*')
        .eq('activo', true)
        .eq('moneda_base', 'USD')
        .eq('moneda_destino', 'MXN')
        .single();

      if (error) throw error;
      return data as CurrencyConfig;
    },
    staleTime: 0 // Force fresh data
  });

  // Convert USD to MXN if needed
  const convertCurrency = (
    amount: number, 
    fromCurrency: 'USD' | 'MXN' = 'USD'
  ): ConversionResult => {
    const exchangeRate = currencyConfig?.tipo_cambio || 20.0;
    
    if (fromCurrency === 'USD') {
      return {
        originalAmount: amount,
        originalCurrency: 'USD',
        convertedAmount: amount * exchangeRate,
        convertedCurrency: 'MXN',
        exchangeRate,
        wasConverted: true
      };
    }
    
    // If already in MXN, no conversion needed
    return {
      originalAmount: amount,
      originalCurrency: 'MXN',
      convertedAmount: amount,
      convertedCurrency: 'MXN',
      exchangeRate: 1,
      wasConverted: false
    };
  };

  // Auto-detect currency based on amount range (USD prices typically lower)
  const autoConvertToMXN = (amount: number): ConversionResult => {
    // Heuristic: if amount is less than 1000, assume it's USD
    // Most GPS devices cost $50-800 USD, but would be 1000-16000+ MXN
    if (amount > 0 && amount < 1000) {
      return convertCurrency(amount, 'USD');
    }
    return convertCurrency(amount, 'MXN');
  };

  return {
    currencyConfig,
    isLoading,
    convertCurrency,
    autoConvertToMXN,
    exchangeRate: currencyConfig?.tipo_cambio || 20.0
  };
};