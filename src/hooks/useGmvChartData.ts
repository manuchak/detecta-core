
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyGmvData } from './useDashboardData';

export const useGmvChartData = (clientFilter: string = "all") => {
  const { data: gmvData = [], isLoading, error } = useQuery({
    queryKey: ['gmv-chart-data', clientFilter],
    queryFn: async () => {
      try {
        console.log("🔄 Obteniendo datos históricos GMV para replicar análisis forense...");
        
        // Usar la función RPC para obtener TODOS los datos históricos
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 100000
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
        
        // Aplicar los mismos criterios que usa el análisis forense de Looker Studio
        const serviciosValidos = filteredData.filter(item => {
          // 1. Debe tener fecha válida
          if (!item.fecha_hora_cita) return false;
          
          // 2. Debe tener ID de servicio válido
          if (!item.id_servicio || item.id_servicio.trim() === '') return false;
          
          // 3. Debe estar finalizado
          const estado = (item.estado || '').trim().toLowerCase();
          if (estado !== 'finalizado') return false;
          
          // 4. Debe tener cobro válido (mayor a 0)
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          if (cobro <= 0) return false;
          
          // 5. Filtrar por fechas válidas (desde 2023)
          const fecha = new Date(item.fecha_hora_cita);
          const year = fecha.getFullYear();
          if (year < 2023 || year > 2025) return false;
          
          return true;
        });
        
        console.log(`✅ Servicios válidos después de filtros: ${serviciosValidos.length}`);
        
        // Eliminar duplicados por ID de servicio para evitar doble conteo
        const serviciosUnicos = new Map();
        serviciosValidos.forEach(item => {
          const id = item.id_servicio.trim();
          if (!serviciosUnicos.has(id)) {
            serviciosUnicos.set(id, item);
          } else {
            // Si ya existe, tomar el que tenga mayor cobro (más reciente)
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
        
        // Procesar datos por año y mes exactamente como en el análisis forense
        const dataPorAnioYMes: { [year: number]: { [month: number]: number } } = {};
        
        // Inicializar estructura para años 2023, 2024, 2025
        [2023, 2024, 2025].forEach(year => {
          dataPorAnioYMes[year] = {};
          for (let month = 0; month < 12; month++) {
            dataPorAnioYMes[year][month] = 0;
          }
        });
        
        // Procesar cada servicio único
        serviciosUnicosArray.forEach(item => {
          const fecha = new Date(item.fecha_hora_cita);
          const year = fecha.getFullYear();
          const month = fecha.getMonth(); // 0-11
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          
          if (dataPorAnioYMes[year]) {
            dataPorAnioYMes[year][month] += cobro;
          }
        });
        
        // Log de totales por año para verificar
        Object.keys(dataPorAnioYMes).forEach(year => {
          const totalYear = Object.values(dataPorAnioYMes[parseInt(year)]).reduce((sum, val) => sum + val, 0);
          console.log(`💰 Total ${year}: $${totalYear.toLocaleString()}`);
        });
        
        // Convertir a formato de gráfico (MoM: 2024 vs 2025)
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        
        const result: MonthlyGmvData[] = monthNames.map((monthName, index) => ({
          name: monthName,
          value: dataPorAnioYMes[2025][index] || 0,        // 2025 como línea principal
          previousYear: dataPorAnioYMes[2024][index] || 0  // 2024 como comparación
        }));
        
        console.log('📋 Resultado final para gráfico (MoM 2024 vs 2025):', result);
        
        // Verificar totales finales
        const total2025 = result.reduce((sum, item) => sum + item.value, 0);
        const total2024 = result.reduce((sum, item) => sum + item.previousYear, 0);
        console.log(`📊 Total 2025 en gráfico: $${total2025.toLocaleString()}`);
        console.log(`📊 Total 2024 en gráfico: $${total2024.toLocaleString()}`);
        
        return result;
        
      } catch (err) {
        console.error('❌ Error en consulta GMV chart:', err);
        throw err;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3
  });

  // Obtener lista de clientes únicos
  const { data: clientsList = [] } = useQuery({
    queryKey: ['clients-list-gmv'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 50000
        });

        if (error) throw error;

        // Aplicar los mismos filtros que para los datos principales
        const serviciosValidos = data?.filter(item => {
          if (!item.fecha_hora_cita || !item.id_servicio || item.id_servicio.trim() === '') return false;
          const estado = (item.estado || '').trim().toLowerCase();
          if (estado !== 'finalizado') return false;
          const cobro = parseFloat(String(item.cobro_cliente)) || 0;
          if (cobro <= 0) return false;
          const fecha = new Date(item.fecha_hora_cita);
          const year = fecha.getFullYear();
          if (year < 2023 || year > 2025) return false;
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
