
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = (clientFilter: string = "all") => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data', clientFilter],
    queryFn: async () => {
      try {
        console.log("🔄 Obteniendo datos históricos GMV con criterios forenses...");
        
        // Usar la función RPC para obtener TODOS los datos históricos
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 50000
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
        
        // Aplicar EXACTAMENTE los mismos criterios que la auditoría forense
        const serviciosValidosForenses = filteredData.filter(item => {
          // 1. Debe tener fecha válida
          if (!item.fecha_hora_cita) return false;
          
          // 2. Debe tener ID de servicio válido
          if (!item.id_servicio || item.id_servicio.trim() === '') return false;
          
          // 3. Debe estar finalizado EXACTAMENTE como en auditoría forense
          const estado = (item.estado || '').trim();
          if (estado !== 'Finalizado') return false;
          
          // 4. Debe tener cobro válido (mayor a 0)
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          if (cobro <= 0) return false;
          
          return true;
        });
        
        console.log(`✅ Servicios válidos según criterios forenses: ${serviciosValidosForenses.length}`);
        
        // Análisis de distribución por años (para debug)
        const yearDistribution: { [key: number]: { count: number, revenue: number } } = {};
        
        serviciosValidosForenses.forEach(item => {
          const date = new Date(item.fecha_hora_cita);
          const year = date.getFullYear();
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          
          if (!yearDistribution[year]) {
            yearDistribution[year] = { count: 0, revenue: 0 };
          }
          
          yearDistribution[year].count += 1;
          yearDistribution[year].revenue += cobro;
        });
        
        console.log('📅 Distribución por años (criterios forenses):', yearDistribution);
        
        // Procesar datos mensuales para TODOS los años disponibles
        const monthlyTotals: { [key: string]: { current: number, previous: number } } = {};
        const currentYear = new Date().getFullYear(); // 2025
        
        // Inicializar todos los meses
        const monthOrder = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        monthOrder.forEach(month => {
          monthlyTotals[month] = { current: 0, previous: 0 };
        });
        
        // Eliminar duplicados por ID de servicio (como en auditoría forense)
        const serviciosUnicos = new Map();
        serviciosValidosForenses.forEach(item => {
          const id = item.id_servicio;
          if (!serviciosUnicos.has(id)) {
            serviciosUnicos.set(id, item);
          }
        });
        
        const serviciosUnicosArray = Array.from(serviciosUnicos.values());
        console.log(`🎯 Servicios únicos finales: ${serviciosUnicosArray.length}`);
        
        // Procesar cada servicio único
        serviciosUnicosArray.forEach(item => {
          const date = new Date(item.fecha_hora_cita);
          const year = date.getFullYear();
          const month = date.getMonth();
          
          // Convertir número de mes a nombre corto en español
          const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
          const monthKey = monthNames[month];
          const amount = parseFloat(String(item.cobro_cliente)) || 0;
          
          if (year === currentYear) {
            // Datos del año actual (2025)
            monthlyTotals[monthKey].current += amount;
          } else {
            // Datos de años anteriores (acumulados como "previous")
            monthlyTotals[monthKey].previous += amount;
          }
        });
        
        console.log('📈 Totales mensuales calculados (criterios forenses):', monthlyTotals);
        
        // Verificar totales
        const totalCurrentYear = Object.values(monthlyTotals).reduce((sum, month) => sum + month.current, 0);
        const totalPreviousYears = Object.values(monthlyTotals).reduce((sum, month) => sum + month.previous, 0);
        const totalGeneral = totalCurrentYear + totalPreviousYears;
        
        console.log(`💰 Total ${currentYear}: $${totalCurrentYear.toLocaleString()}`);
        console.log(`💰 Total años anteriores: $${totalPreviousYears.toLocaleString()}`);
        console.log(`💰 Total general: $${totalGeneral.toLocaleString()}`);
        
        // Convertir a formato de gráfico
        const result: MonthlyGmvData[] = monthOrder.map(month => ({
          name: month,
          value: monthlyTotals[month]?.current || 0,
          previousYear: monthlyTotals[month]?.previous || 0
        }));
        
        console.log('📋 Resultado final para gráfico (criterios forenses):', result);
        
        return result;
        
      } catch (err) {
        console.error('❌ Error en consulta GMV chart:', err);
        throw err;
      }
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutos
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
