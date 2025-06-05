
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = () => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data-forensic-corrected-full'],
    queryFn: async () => {
      try {
        console.log("🔄 GMV CHART: Iniciando análisis corregido COMPLETO...");
        
        // Obtener datos RAW
        const { data: rawData, error: rawError } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 500000
        });

        if (rawError) {
          console.error('❌ Error obteniendo datos raw:', rawError);
          throw rawError;
        }

        console.log(`📋 Total registros RAW: ${rawData?.length || 0}`);
        
        if (!rawData || rawData.length === 0) {
          console.warn('⚠️ No hay datos disponibles');
          return [];
        }

        // Filtrar datos de 2025 con validación robusta
        const data2025 = rawData.filter(item => {
          if (!item.fecha_hora_cita) return false;
          try {
            const fecha = new Date(item.fecha_hora_cita);
            const year = fecha.getFullYear();
            return year === 2025;
          } catch (error) {
            console.warn(`⚠️ Fecha inválida en gráfico: ${item.fecha_hora_cita}`);
            return false;
          }
        });

        console.log(`📅 Registros de 2025 para gráfico: ${data2025.length}`);

        // Aplicar filtros forenses: Finalizado + cobro válido + ID válido
        const serviciosValidosParaGMV = data2025.filter(item => {
          // 1. ID de servicio válido
          if (!item.id_servicio || item.id_servicio.trim() === '') return false;
          
          // 2. Estado finalizado (con variaciones)
          const estado = (item.estado || '').trim().toLowerCase();
          if (estado !== 'finalizado' && estado !== 'completado' && estado !== 'finished') return false;
          
          // 3. Cobro válido (mayor a 0)
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          if (cobro <= 0) return false;
          
          return true;
        });
        
        console.log(`✅ Servicios válidos para GMV: ${serviciosValidosParaGMV.length}`);
        
        // Eliminar duplicados por ID de servicio
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
        console.log(`🎯 Servicios únicos para gráfico: ${serviciosUnicosArray.length}`);
        
        // Procesar datos por mes
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const dataPorMes: { [month: number]: number } = {};
        
        // Inicializar todos los meses en 0
        for (let month = 0; month < 12; month++) {
          dataPorMes[month] = 0;
        }
        
        // Agregar datos por mes
        serviciosUnicosArray.forEach(item => {
          try {
            const fecha = new Date(item.fecha_hora_cita);
            const month = fecha.getMonth(); // 0-11
            const cobro = parseFloat(String(item.cobro_cliente)) || 0;
            dataPorMes[month] += cobro;
          } catch (error) {
            console.warn(`⚠️ Error procesando fecha para gráfico: ${item.fecha_hora_cita}`);
          }
        });
        
        // Log detallado por mes
        console.log('📈 DESGLOSE MENSUAL GRÁFICO CORREGIDO:');
        for (let month = 0; month < 12; month++) {
          if (dataPorMes[month] > 0) {
            console.log(`  ${monthNames[month]} 2025: $${dataPorMes[month].toLocaleString()}`);
          }
        }
        
        // Convertir a formato de gráfico
        const result: MonthlyGmvData[] = monthNames.map((monthName, index) => ({
          name: monthName,
          value: dataPorMes[index] || 0,
          previousYear: 0 // Por ahora sin datos de 2024
        }));
        
        // Verificar total
        const totalGrafico = result.reduce((sum, item) => sum + item.value, 0);
        console.log(`🎯 TOTAL GMV GRÁFICO: $${totalGrafico.toLocaleString()}`);
        
        // Mostrar todos los meses (incluidos los que tienen 0)
        console.log(`📊 Todos los meses del año:`);
        result.forEach(item => {
          console.log(`  ${item.name}: $${item.value.toLocaleString()}`);
        });
        
        return result;
        
      } catch (err) {
        console.error('❌ Error crítico en GMV chart:', err);
        throw err;
      }
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Obtener lista de clientes únicos
  const { data: clientsList = [] } = useQuery({
    queryKey: ['clients-list-gmv-corrected'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 200000
        });

        if (error) throw error;

        // Filtrar datos de 2025 con mismos criterios
        const serviciosValidos = data?.filter(item => {
          if (!item.fecha_hora_cita || !item.id_servicio || item.id_servicio.trim() === '') return false;
          
          const fecha = new Date(item.fecha_hora_cita);
          if (fecha.getFullYear() !== 2025) return false;
          
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
    staleTime: 10 * 60 * 1000,
  });

  return {
    gmvData,
    clientsList,
    isLoading,
    error
  };
};
