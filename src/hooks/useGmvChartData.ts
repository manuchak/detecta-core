
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = (clientFilter: string = "all") => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data', clientFilter],
    queryFn: async () => {
      try {
        console.log("Fetching GMV chart data (all historical data)...");
        
        // Usar función RPC para obtener todos los servicios históricos
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 25000
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
        
        // Procesar datos por mes - incluir TODOS los datos históricos
        const monthlyTotals: { [key: string]: { current: number, previous: number } } = {};
        const currentYear = new Date().getFullYear(); // 2025
        const previousYear = currentYear - 1; // 2024
        
        // Inicializar todos los meses en cero
        const monthOrder = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        monthOrder.forEach(month => {
          monthlyTotals[month] = { current: 0, previous: 0 };
        });
        
        // Procesar todos los datos disponibles (incluyendo datos históricos desde 2023)
        filteredData.forEach(item => {
          if (item.fecha_hora_cita && item.cobro_cliente) {
            try {
              const date = new Date(item.fecha_hora_cita);
              const year = date.getFullYear();
              const month = date.getMonth();
              const monthKey = new Date(2025, month).toLocaleDateString('es-ES', { month: 'short' });
              const amount = parseFloat(String(item.cobro_cliente)) || 0;
              
              // Solo incluir datos válidos (desde 2020 en adelante)
              if (year >= 2020 && amount > 0) {
                if (year === currentYear) {
                  // Datos del año actual (2025) van en la línea "current"
                  monthlyTotals[monthKey].current += amount;
                } else if (year === previousYear) {
                  // Datos del año anterior (2024) van en la línea "previous"
                  monthlyTotals[monthKey].previous += amount;
                } else {
                  // Datos históricos (2023 y anteriores) también van en "previous" para comparación
                  monthlyTotals[monthKey].previous += amount;
                }
              }
            } catch (e) {
              console.warn('Error processing GMV data item:', e);
            }
          }
        });
        
        // Convertir a formato de gráfico
        const result: MonthlyGmvData[] = monthOrder.map(month => ({
          name: month,
          value: monthlyTotals[month]?.current || 0,
          previousYear: monthlyTotals[month]?.previous || 0
        }));
        
        console.log('Processed GMV data by month:', result);
        console.log('Monthly totals object:', monthlyTotals);
        console.log('Total records processed:', filteredData.length);
        
        // Log para verificar distribución de datos por año
        const yearDistribution: { [key: number]: number } = {};
        const yearRevenue: { [key: number]: number } = {};
        filteredData.forEach(item => {
          if (item.fecha_hora_cita && item.cobro_cliente) {
            const year = new Date(item.fecha_hora_cita).getFullYear();
            const amount = parseFloat(String(item.cobro_cliente)) || 0;
            yearDistribution[year] = (yearDistribution[year] || 0) + 1;
            yearRevenue[year] = (yearRevenue[year] || 0) + amount;
          }
        });
        console.log('Year distribution (record count):', yearDistribution);
        console.log('Year revenue distribution:', yearRevenue);
        
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

  // Obtener lista de clientes únicos para el filtro
  const { data: clientsList = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 25000
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
