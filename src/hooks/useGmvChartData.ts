
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = (clientFilter: string = "all") => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data', clientFilter],
    queryFn: async () => {
      try {
        console.log("🔄 Obteniendo datos históricos completos para gráfico GMV...");
        
        // Usar la función RPC para obtener TODOS los datos históricos
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 50000 // Aumentar límite para asegurar datos completos
        });

        if (error) {
          console.error('❌ Error al obtener datos GMV:', error);
          throw error;
        }

        console.log(`📊 Total de registros obtenidos: ${data?.length || 0}`);
        
        let filteredData = data || [];
        
        // Aplicar filtro de cliente si está seleccionado
        if (clientFilter !== 'all') {
          filteredData = filteredData.filter(service => 
            service.nombre_cliente === clientFilter
          );
          console.log(`🔍 Filtro cliente "${clientFilter}" aplicado: ${filteredData.length} registros`);
        }
        
        // Análisis detallado de distribución de años
        const yearDistribution: { [key: number]: number } = {};
        const yearRevenue: { [key: number]: { total: number, validPayments: number } } = {};
        
        filteredData.forEach(item => {
          if (item.fecha_hora_cita) {
            try {
              const date = new Date(item.fecha_hora_cita);
              const year = date.getFullYear();
              const cobro = parseFloat(String(item.cobro_cliente)) || 0;
              const estado = (item.estado || '').trim();
              
              yearDistribution[year] = (yearDistribution[year] || 0) + 1;
              
              if (!yearRevenue[year]) {
                yearRevenue[year] = { total: 0, validPayments: 0 };
              }
              
              // Solo contar servicios finalizados con cobro válido (auditoría forense)
              if (estado === 'Finalizado' && cobro > 0) {
                yearRevenue[year].total += cobro;
                yearRevenue[year].validPayments += 1;
              }
            } catch (e) {
              console.warn('⚠️ Error procesando fecha:', e, item.fecha_hora_cita);
            }
          }
        });
        
        console.log('📅 Distribución por años (registros totales):', yearDistribution);
        console.log('💰 Distribución de ingresos por año:', yearRevenue);
        
        // Procesar datos por mes para TODOS los años desde 2023
        const monthlyTotals: { [key: string]: { current: number, previous: number } } = {};
        const currentYear = new Date().getFullYear(); // 2025
        
        // Inicializar todos los meses
        const monthOrder = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        monthOrder.forEach(month => {
          monthlyTotals[month] = { current: 0, previous: 0 };
        });
        
        // Procesar SOLO servicios finalizados con cobro válido
        const serviciosFinalizados = filteredData.filter(item => {
          const estado = (item.estado || '').trim();
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          return estado === 'Finalizado' && cobro > 0;
        });
        
        console.log(`✅ Servicios finalizados con cobro válido: ${serviciosFinalizados.length}`);
        
        serviciosFinalizados.forEach(item => {
          if (item.fecha_hora_cita) {
            try {
              const date = new Date(item.fecha_hora_cita);
              const year = date.getFullYear();
              const month = date.getMonth();
              
              // Convertir número de mes a nombre corto en español
              const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
              const monthKey = monthNames[month];
              const amount = parseFloat(String(item.cobro_cliente)) || 0;
              
              // Solo procesar años desde 2023
              if (year >= 2023 && amount > 0) {
                if (year === currentYear) {
                  // Datos del año actual (2025)
                  monthlyTotals[monthKey].current += amount;
                } else {
                  // Datos de años anteriores (2024, 2023, etc.)
                  monthlyTotals[monthKey].previous += amount;
                }
              }
            } catch (e) {
              console.warn('⚠️ Error procesando item GMV:', e, item);
            }
          }
        });
        
        console.log('📈 Totales mensuales calculados:', monthlyTotals);
        
        // Verificar si tenemos datos históricos
        const hasCurrentYearData = Object.values(monthlyTotals).some(month => month.current > 0);
        const hasPreviousYearData = Object.values(monthlyTotals).some(month => month.previous > 0);
        
        console.log(`📊 Datos año actual (${currentYear}):`, hasCurrentYearData);
        console.log('📊 Datos años anteriores:', hasPreviousYearData);
        
        // Convertir a formato de gráfico
        const result: MonthlyGmvData[] = monthOrder.map(month => ({
          name: month,
          value: monthlyTotals[month]?.current || 0,
          previousYear: monthlyTotals[month]?.previous || 0
        }));
        
        console.log('📋 Resultado final para gráfico:', result);
        
        // Verificación final
        const totalCurrentYear = result.reduce((sum, month) => sum + month.value, 0);
        const totalPreviousYears = result.reduce((sum, month) => sum + month.previousYear, 0);
        
        console.log(`💰 Total ${currentYear}: $${totalCurrentYear.toLocaleString()}`);
        console.log(`💰 Total años anteriores: $${totalPreviousYears.toLocaleString()}`);
        
        return result;
        
      } catch (err) {
        console.error('❌ Error en consulta GMV chart:', err);
        throw err;
      }
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutos para datos más frescos
    retry: 3
  });

  // Obtener lista de clientes únicos usando la misma función
  const { data: clientsList = [] } = useQuery({
    queryKey: ['clients-list-gmv'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 50000
        });

        if (error) throw error;

        const uniqueClients = new Set(
          data
            ?.filter(service => service.nombre_cliente && service.nombre_cliente.trim() !== '' && service.nombre_cliente !== '#N/A')
            .map(service => service.nombre_cliente.trim())
        );
        
        console.log(`👥 Clientes únicos encontrados: ${uniqueClients.size}`);
        return Array.from(uniqueClients).sort();
      } catch (err) {
        console.error('❌ Error obteniendo lista de clientes:', err);
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
