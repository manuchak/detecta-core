
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = () => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data-forensic'],
    queryFn: async () => {
      try {
        console.log("🔄 GMV CHART: Usando metodología forense EXACTA...");
        
        // Usar la MISMA función que usa el análisis forense
        const { data: forensicResult, error: forensicError } = await supabase
          .rpc('forensic_audit_servicios_enero_actual');

        if (forensicError) {
          console.error('❌ Error obteniendo auditoría forense:', forensicError);
          throw forensicError;
        }

        console.log(`📋 Datos forenses obtenidos:`, forensicResult?.[0]);
        
        if (!forensicResult || forensicResult.length === 0) {
          console.warn('⚠️ No se obtuvieron datos del análisis forense');
          return [];
        }

        const forensicData = forensicResult[0];
        
        // Obtener TODOS los datos RAW usando la misma función que el análisis forense
        const { data: rawData, error: rawError } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 500000
        });

        if (rawError) {
          console.error('❌ Error obteniendo datos raw:', rawError);
          throw rawError;
        }

        console.log(`📋 Total registros RAW: ${rawData?.length || 0}`);
        
        // APLICAR EXACTAMENTE LOS MISMOS FILTROS QUE EL ANÁLISIS FORENSE
        const serviciosValidosParaGMV = rawData?.filter(item => {
          // 1. Fecha válida
          if (!item.fecha_hora_cita) return false;
          
          const fecha = new Date(item.fecha_hora_cita);
          const year = fecha.getFullYear();
          
          // Solo datos desde 2024 hasta 2025 (incluir 2024 para comparación)
          if (year < 2024 || year > 2025) return false;
          
          // 2. ID de servicio válido
          if (!item.id_servicio || item.id_servicio.trim() === '') return false;
          
          // 3. Estado finalizado (EXACTAMENTE como en forensic audit)
          const estado = (item.estado || '').trim().toLowerCase();
          if (estado !== 'finalizado') return false;
          
          // 4. Cobro válido (mayor a 0)
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          if (cobro <= 0) return false;
          
          return true;
        }) || [];
        
        console.log(`✅ Servicios válidos para GMV (aplicando filtros forenses): ${serviciosValidosParaGMV.length}`);
        
        // ELIMINAR DUPLICADOS EXACTAMENTE como en el análisis forense
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
        
        // Inicializar estructura para 2024 y 2025
        [2024, 2025].forEach(year => {
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
        
        // VERIFICAR que los totales coincidan con el análisis forense
        const total2025Calculado = Object.values(dataPorAnioYMes[2025]).reduce((sum, val) => sum + val, 0);
        const total2024Calculado = Object.values(dataPorAnioYMes[2024]).reduce((sum, val) => sum + val, 0);
        
        console.log('💰 VERIFICACIÓN CON ANÁLISIS FORENSE:');
        console.log(`📊 Total 2025 calculado: $${total2025Calculado.toLocaleString()}`);
        console.log(`📊 Total 2024 calculado: $${total2024Calculado.toLocaleString()}`);
        console.log(`📊 GMV forense 2025 (solo finalizados): $${forensicData.gmv_solo_finalizados?.toLocaleString() || 0}`);
        
        // LOG detallado por mes para debugging
        console.log('📈 DESGLOSE MENSUAL DETALLADO:');
        Object.keys(dataPorAnioYMes).forEach(year => {
          const totalYear = Object.values(dataPorAnioYMes[parseInt(year)]).reduce((sum, val) => sum + val, 0);
          console.log(`${year}: $${totalYear.toLocaleString()}`);
          
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
        
        console.log('📈 RESULTADO FINAL PARA GRÁFICO (2024 vs 2025):');
        result.forEach(item => {
          if (item.value > 0 || item.previousYear > 0) {
            console.log(`${item.name}: 2025=$${item.value.toLocaleString()}, 2024=$${item.previousYear.toLocaleString()}`);
          }
        });
        
        // Verificar totales finales
        const totalGrafico2025 = result.reduce((sum, item) => sum + item.value, 0);
        const totalGrafico2024 = result.reduce((sum, item) => sum + item.previousYear, 0);
        console.log(`🎯 VERIFICACIÓN FINAL - TOTALES GRÁFICO:`);
        console.log(`📊 Total gráfico 2025: $${totalGrafico2025.toLocaleString()}`);
        console.log(`📊 Total gráfico 2024: $${totalGrafico2024.toLocaleString()}`);
        console.log(`📊 Diferencia con forense: $${Math.abs(totalGrafico2025 - (forensicData.gmv_solo_finalizados || 0)).toLocaleString()}`);
        
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

  // Obtener lista de clientes únicos usando la misma metodología
  const { data: clientsList = [] } = useQuery({
    queryKey: ['clients-list-gmv-forensic'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 200000
        });

        if (error) throw error;

        // Aplicar EXACTAMENTE los mismos filtros que para los datos principales
        const serviciosValidos = data?.filter(item => {
          if (!item.fecha_hora_cita || !item.id_servicio || item.id_servicio.trim() === '') return false;
          
          const fecha = new Date(item.fecha_hora_cita);
          const year = fecha.getFullYear();
          if (year < 2024 || year > 2025) return false;
          
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
