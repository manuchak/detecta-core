
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = (clientFilter: string = "all") => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data', clientFilter],
    queryFn: async () => {
      try {
        console.log("Fetching GMV chart data using secure RPC function...");
        
        // Usar la nueva función RPC específica para el dashboard
        const { data, error } = await supabase.rpc('get_gmv_chart_data_secure', {
          max_records: 10000
        });

        if (error) {
          console.error('Error fetching GMV chart data:', error);
          throw error;
        }

        console.log('GMV chart data fetched successfully:', data?.length || 0);
        
        let filteredData = data || [];
        
        // Aplicar filtro de cliente si está seleccionado
        if (clientFilter !== 'all') {
          filteredData = filteredData.filter(service => 
            service.nombre_cliente === clientFilter
          );
          console.log(`Applied client filter: ${clientFilter}, remaining records: ${filteredData.length}`);
        }
        
        // Procesar datos por mes - incluir TODOS los datos históricos desde 2023
        const monthlyTotals: { [key: string]: { current: number, previous: number } } = {};
        const currentYear = new Date().getFullYear(); // 2025
        
        // Inicializar todos los meses en cero
        const monthOrder = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        monthOrder.forEach(month => {
          monthlyTotals[month] = { current: 0, previous: 0 };
        });
        
        // Analizar distribución de años para debugging
        const yearDistribution: { [key: number]: number } = {};
        const yearRevenue: { [key: number]: number } = {};
        
        // Procesar todos los datos disponibles
        filteredData.forEach(item => {
          if (item.fecha_hora_cita && item.cobro_cliente) {
            try {
              const date = new Date(item.fecha_hora_cita);
              const year = date.getFullYear();
              const month = date.getMonth();
              const monthKey = new Date(2025, month).toLocaleDateString('es-ES', { month: 'short' });
              const amount = parseFloat(String(item.cobro_cliente)) || 0;
              
              // Contar para estadísticas
              yearDistribution[year] = (yearDistribution[year] || 0) + 1;
              yearRevenue[year] = (yearRevenue[year] || 0) + amount;
              
              // Solo incluir datos válidos con montos positivos desde 2023
              if (year >= 2023 && amount > 0) {
                if (year === currentYear) {
                  // Datos del año actual (2025) van en la línea "current"
                  monthlyTotals[monthKey].current += amount;
                } else {
                  // Datos de años anteriores (2024, 2023, etc.) van en la línea "previous"
                  monthlyTotals[monthKey].previous += amount;
                }
              }
            } catch (e) {
              console.warn('Error processing GMV data item:', e, item);
            }
          }
        });
        
        // Logs para debugging
        console.log('Year distribution (record count):', yearDistribution);
        console.log('Year revenue distribution:', yearRevenue);
        console.log('Available years in data:', Object.keys(yearDistribution).map(y => parseInt(y)).sort());
        console.log('Total records processed:', filteredData.length);
        
        // Convertir a formato de gráfico
        const result: MonthlyGmvData[] = monthOrder.map(month => ({
          name: month,
          value: monthlyTotals[month]?.current || 0,
          previousYear: monthlyTotals[month]?.previous || 0
        }));
        
        console.log('Processed GMV data by month:', result);
        console.log('Monthly totals object:', monthlyTotals);
        
        // Verificar si tenemos datos de años anteriores
        const hasHistoricalData = Object.values(monthlyTotals).some(month => month.previous > 0);
        console.log('Has historical data (2023-2024):', hasHistoricalData);
        
        return result;
        
      } catch (err) {
        console.error('Error in GMV chart query:', err);
        throw err;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  // Obtener lista de clientes únicos para el filtro usando la misma función RPC
  const { data: clientsList = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_gmv_chart_data_secure', {
          max_records: 10000
        });

        if (error) throw error;

        const uniqueClients = new Set(
          data
            ?.map(service => service.nombre_cliente)
            .filter(name => name && name.trim() !== '' && name !== '#N/A')
        );
        
        return Array.from(uniqueClients).sort();
      } catch (err) {
        console.error('Error fetching clients list:', err);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    gmvData,
    clientsList,
    isLoading,
    error
  };
};
