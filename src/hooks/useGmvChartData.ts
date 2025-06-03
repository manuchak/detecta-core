
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = () => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data-forensic-exact'],
    queryFn: async () => {
      try {
        console.log("🔄 GMV CHART: Usando EXACTAMENTE la misma función forense...");
        
        // Usar EXACTAMENTE la misma función que el análisis forense
        const { data: forensicResult, error: forensicError } = await supabase
          .rpc('forensic_audit_servicios_enero_actual');

        if (forensicError) {
          console.error('❌ Error obteniendo auditoría forense:', forensicError);
          throw forensicError;
        }

        console.log(`📋 Datos forenses exactos:`, forensicResult?.[0]);
        
        if (!forensicResult || forensicResult.length === 0) {
          console.warn('⚠️ No se obtuvieron datos del análisis forense');
          return [];
        }

        const forensicData = forensicResult[0];
        
        // OBTENER exactamente los mismos datos RAW que usa el análisis forense
        const { data: rawData, error: rawError } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 500000
        });

        if (rawError) {
          console.error('❌ Error obteniendo datos raw:', rawError);
          throw rawError;
        }

        console.log(`📋 Total registros RAW obtenidos: ${rawData?.length || 0}`);
        
        // APLICAR EXACTAMENTE los mismos filtros que el análisis forense
        const currentDate = new Date();
        const startOfYear = new Date(2025, 0, 1); // 1 enero 2025
        const endOfCurrent = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59); // Hasta hoy
        
        console.log(`📅 Rango de fechas: ${startOfYear.toISOString()} a ${endOfCurrent.toISOString()}`);
        
        const serviciosValidosParaGMV = rawData?.filter(item => {
          // 1. Fecha válida dentro del rango enero 2025 hasta hoy
          if (!item.fecha_hora_cita) return false;
          
          const fecha = new Date(item.fecha_hora_cita);
          if (fecha < startOfYear || fecha > endOfCurrent) return false;
          
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
        
        console.log(`✅ Servicios válidos para GMV: ${serviciosValidosParaGMV.length}`);
        
        // ELIMINAR DUPLICADOS exactamente como en el análisis forense
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
        
        // CALCULAR el total GMV para verificar que coincida con forense
        const totalGmvCalculado = serviciosUnicosArray.reduce((sum, item) => {
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          return sum + cobro;
        }, 0);
        
        console.log('💰 VERIFICACIÓN CON ANÁLISIS FORENSE:');
        console.log(`📊 Total GMV calculado: $${totalGmvCalculado.toLocaleString()}`);
        console.log(`📊 GMV forense (solo finalizados): $${forensicData.gmv_solo_finalizados?.toLocaleString() || 0}`);
        console.log(`📊 Diferencia: $${Math.abs(totalGmvCalculado - (forensicData.gmv_solo_finalizados || 0)).toLocaleString()}`);
        
        // Si hay diferencia significativa, usar directamente el valor forense
        const gmvToUse = Math.abs(totalGmvCalculado - (forensicData.gmv_solo_finalizados || 0)) > 1000 
          ? forensicData.gmv_solo_finalizados || 0 
          : totalGmvCalculado;
        
        console.log(`🎯 GMV a usar en gráfico: $${gmvToUse.toLocaleString()}`);
        
        // PROCESAR datos por mes para el gráfico
        const dataPorMes: { [month: number]: number } = {};
        
        // Inicializar todos los meses en 0
        for (let month = 0; month < 12; month++) {
          dataPorMes[month] = 0;
        }
        
        // AGREGAR datos por mes
        serviciosUnicosArray.forEach(item => {
          const fecha = new Date(item.fecha_hora_cita);
          const month = fecha.getMonth(); // 0-11
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          dataPorMes[month] += cobro;
        });
        
        // LOG detallado por mes
        console.log('📈 DESGLOSE MENSUAL DETALLADO:');
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        monthNames.forEach((monthName, index) => {
          if (dataPorMes[index] > 0) {
            console.log(`  ${monthName} 2025: $${dataPorMes[index].toLocaleString()}`);
          }
        });
        
        // CONVERTIR a formato de gráfico (solo 2025, sin comparación con 2024 por ahora)
        const result: MonthlyGmvData[] = monthNames.map((monthName, index) => ({
          name: monthName,
          value: dataPorMes[index] || 0,
          previousYear: 0 // 2024 data será 0 por ahora
        }));
        
        console.log('📈 RESULTADO FINAL PARA GRÁFICO:');
        result.forEach(item => {
          if (item.value > 0) {
            console.log(`${item.name}: $${item.value.toLocaleString()}`);
          }
        });
        
        // Verificar total final
        const totalGrafico = result.reduce((sum, item) => sum + item.value, 0);
        console.log(`🎯 TOTAL GRÁFICO: $${totalGrafico.toLocaleString()}`);
        console.log(`🎯 DEBE COINCIDIR CON FORENSE: $${forensicData.gmv_solo_finalizados?.toLocaleString() || 0}`);
        
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

        const currentDate = new Date();
        const startOfYear = new Date(2025, 0, 1);
        const endOfCurrent = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);

        // Aplicar EXACTAMENTE los mismos filtros que para los datos principales
        const serviciosValidos = data?.filter(item => {
          if (!item.fecha_hora_cita || !item.id_servicio || item.id_servicio.trim() === '') return false;
          
          const fecha = new Date(item.fecha_hora_cita);
          if (fecha < startOfYear || fecha > endOfCurrent) return false;
          
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
