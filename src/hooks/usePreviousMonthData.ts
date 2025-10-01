import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

interface PreviousMonthData {
  month: string;
  gmv: number;
  services: number;
  loading: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const usePreviousMonthData = (): PreviousMonthData => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // Calculate previous month
  let previousMonth = currentMonth - 1;
  let previousYear = currentYear;
  
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = currentYear - 1;
  }

  const { data, isLoading } = useAuthenticatedQuery(
    ['previous-month-data', previousMonth.toString(), previousYear.toString()],
    async () => {
      const { data: historicalData, error } = await supabase.rpc('get_historical_monthly_data');
      
      if (error) throw error;
      
      // Find data for the previous month
      const previousMonthData = historicalData?.find(
        (item: any) => item.month === previousMonth && item.year === previousYear
      );
      
      return {
        month: MONTH_NAMES[previousMonth - 1],
        gmv: previousMonthData?.gmv || 0,
        services: previousMonthData?.services || 0
      };
    },
    { config: 'standard' }
  );

  return {
    month: data?.month || MONTH_NAMES[previousMonth - 1],
    gmv: data?.gmv || 0,
    services: data?.services || 0,
    loading: isLoading
  };
};