
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = () => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data-forensic'],
    queryFn: async () => {
      try {
        console.log("🔄 GMV CHART: Usando metodología forense EXACTA (independiente de filtros)...");
        
        // Obtener TODOS los datos RAW sin límites
        const { data: rawData, error: rawError } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 500000  // Aumentar para asegurar todos los datos
        });

        if (rawError) {
          console.error('❌ Error obteniendo datos raw:', rawError);
          throw rawError;
        }

        console.log(`📋 Total registros RAW obtenidos: ${rawData?.length || 0}`);
        
        // APLICAR METODOLOGÍA FORENSE EXACTA (sin filtros de cliente):
        // 1. Solo servicios con estado "finalizado" (case insensitive)
        // 2. Solo con cobro_cliente > 0
        // 3. Solo con id_servicio válido
        // 4. Solo fechas válidas desde 2023
        const serviciosValidosParaGMV = rawData?.filter(item => {
          // 1. Fecha válida
          if (!item.fecha_hora_cita) return false;
          
          const fecha = new Date(item.fecha_hora_cita);
          const year = fecha.getFullYear();
          
          // Solo datos desde 2023 hasta 2025
          if (year < 2023 || year > 2025) return false;
          
          // 2. ID de servicio válido
          if (!item.id_servicio || item.id_servicio.trim() === '') return false;
          
          // 3. Estado finalizado (exactamente como en forensic audit)
          const estado = (item.estado || '').trim().toLowerCase();
          if (estado !== 'finalizado') return false;
          
          // 4. Cobro válido (mayor a 0)
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          if (cobro <= 0) return false;
          
          return true;
        }) || [];
        
        console.log(`✅ Servicios válidos para GMV: ${serviciosValidosParaGMV.length}`);
        
        // ELIMINAR DUPLICADOS por ID de servicio (clave para forensic accuracy)
        const serviciosUnicos = new Map();
        serviciosValidosParaGMV.forEach(item => {
          const id = item.id_servicio.trim();
          if (!serviciosUnicos.has(id)) {
            serviciosUnicos.set(id, item);
          } else {
            // Si hay duplicado, tomar el que tenga mayor cobro
            const existing = serviciosUnicos.get(id);
            const existingCobro = parseFloat(String(existing.cobro_cliente)) || 0;
            const currentCobro = parseFloat(String(item.cobro_cliente)) || 0;
            if (currentCobro > existingCobro) {
              serviciosUnicos.set(id, item);
            }
          }
        });
        
        const serviciosUnicosArray = Array.from(serviciosUnicos.values());
        console.log(`🎯 Servicios únicos finales: ${serviciosUnicosArray.length}`);
        
        // PROCESAR DATOS POR AÑO Y MES (metodología forense exacta)
        const dataPorAnioYMes: { [year: number]: { [month: number]: number } } = {};
        
        // Inicializar estructura para 2023, 2024, 2025
        [2023, 2024, 2025].forEach(year => {
          dataPorAnioYMes[year] = {};
          for (let month = 0; month < 12; month++) {
            dataPorAnioYMes[year][month] = 0;
          }
        });
        
        // AGREGAR datos por mes y año
        serviciosUnicosArray.forEach(item => {
          const fecha = new Date(item.fecha_hora_cita);
          const year = fecha.getFullYear();
          const month = fecha.getMonth(); // 0-11
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          
          if (dataPorAnioYMes[year]) {
            dataPorAnioYMes[year][month] += cobro;
          }
        });
        
        // LOG para verificación
        console.log('💰 TOTALES POR AÑO (metodología forense):');
        Object.keys(dataPorAnioYMes).forEach(year => {
          const totalYear = Object.values(dataPorAnioYMes[parseInt(year)]).reduce((sum, val) => sum + val, 0);
          console.log(`${year}: $${totalYear.toLocaleString()}`);
          
          // LOG detallado por mes para debugging
          Object.keys(dataPorAnioYMes[parseInt(year)]).forEach(month => {
            const monthValue = dataPorAnioYMes[parseInt(year)][parseInt(month)];
            if (monthValue > 0) {
              const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
              console.log(`  ${monthNames[parseInt(month)]} ${year}: $${monthValue.toLocaleString()}`);
            }
          });
        });
        
        // CONVERTIR a formato de gráfico (2024 vs 2025)
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        
        const result: MonthlyGmvData[] = monthNames.map((monthName, index) => ({
          name: monthName,
          value: dataPorAnioYMes[2025][index] || 0,        // 2025 como línea principal
          previousYear: dataPorAnioYMes[2024][index] || 0  // 2024 como comparación
        }));
        
        console.log('📈 RESULTADO FINAL (2024 vs 2025):');
        result.forEach(item => {
          if (item.value > 0 || item.previousYear > 0) {
            console.log(`${item.name}: 2025=$${item.value.toLocaleString()}, 2024=$${item.previousYear.toLocaleString()}`);
          }
        });
        
        // Verificar totales finales
        const total2025 = result.reduce((sum, item) => sum + item.value, 0);
        const total2024 = result.reduce((sum, item) => sum + item.previousYear, 0);
        console.log(`📊 VERIFICACIÓN FINAL GMV CHART:`);
        console.log(`📊 Total 2025: $${total2025.toLocaleString()}`);
        console.log(`📊 Total 2024: $${total2024.toLocaleString()}`);
        
        return result;
        
      } catch (err) {
        console.error('❌ Error crítico en GMV chart:', err);
        throw err;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Obtener lista de clientes únicos (usando misma metodología pero sin filtrar por cliente)
  const { data: clientsList = [] } = useQuery({
    queryKey: ['clients-list-gmv-forensic'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 200000
        });

        if (error) throw error;

        // Aplicar los mismos filtros que para los datos principales
        const serviciosValidos = data?.filter(item => {
          if (!item.fecha_hora_cita || !item.id_servicio || item.id_servicio.trim() === '') return false;
          
          const fecha = new Date(item.fecha_hora_cita);
          const year = fecha.getFullYear();
          if (year < 2023 || year > 2025) return false;
          
          const estado = (item.estado || '').trim().toLowerCase();
          if (estado !== 'finalizado') return false;
          
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          if (cobro <= 0) return false;
          
          return true;
        }) || [];

        const uniqueClients = new Set(
          serviciosValidos
            .filter(service => service.nombre_cliente && service.nombre_cliente.trim() !== '' && service.nombre_cliente !== '#N/A')
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
