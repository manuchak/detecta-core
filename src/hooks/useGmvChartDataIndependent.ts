
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GmvDataPoint {
  name: string;
  value: number;
  previousYear: number;
}

// Función para obtener TODOS los servicios sin límites ni filtros
const fetchAllServicesForGmv = async () => {
  console.log('🔍 GMV CHART: Cargando TODOS los datos para análisis año vs año');
  
  try {
    // Estrategia 1: Consulta directa sin límites
    let allServices: any[] = [];
    let hasMore = true;
    let offset = 0;
    const batchSize = 1000;
    
    while (hasMore) {
      const { data: batchData, error: batchError, count } = await supabase
        .from('servicios_custodia')
        .select('*', { count: 'exact' })
        .order('fecha_hora_cita', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (batchError) {
        console.warn(`⚠️ GMV Error en lote ${offset}: ${batchError.message}`);
        break;
      }

      if (batchData && batchData.length > 0) {
        allServices = [...allServices, ...batchData];
        console.log(`📦 GMV: Lote ${Math.floor(offset/batchSize) + 1} - ${batchData.length} registros (Total: ${allServices.length})`);
        
        if (count && allServices.length >= count) {
          hasMore = false;
          console.log(`✅ GMV: Dataset completo - ${count} registros totales`);
        } else if (batchData.length < batchSize) {
          hasMore = false;
          console.log(`✅ GMV: Último lote - ${allServices.length} registros totales`);
        } else {
          offset += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    // Fallback con RPC si la consulta directa no funciona
    if (allServices.length === 0) {
      console.warn('⚠️ GMV: Consulta directa falló, usando RPC...');
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('bypass_rls_get_servicios', { max_records: 999999999 });

      if (rpcError) {
        console.error('❌ GMV Error en RPC:', rpcError);
        throw rpcError;
      }

      allServices = rpcData || [];
      console.log(`🔍 GMV RPC: ${allServices.length} registros obtenidos`);
    }

    console.log(`🎯 GMV FINAL: ${allServices.length} registros totales para análisis anual`);
    return allServices;
    
  } catch (error) {
    console.error('💥 GMV Error crítico:', error);
    
    // Fallback final
    try {
      const { data: fallbackData } = await supabase
        .from('servicios_custodia')
        .select('*')
        .order('fecha_hora_cita', { ascending: false });
      
      console.log(`🔄 GMV FALLBACK: ${fallbackData?.length || 0} registros`);
      return fallbackData || [];
    } catch (fallbackError) {
      console.error('💥 GMV Error en fallback:', fallbackError);
      throw error;
    }
  }
};

export const useGmvChartDataIndependent = () => {
  const { data: allServices, isLoading, error } = useQuery({
    queryKey: ['gmv-chart-independent-all-data'],
    queryFn: fetchAllServicesForGmv,
    staleTime: 15 * 60 * 1000, // 15 minutos para datos grandes
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { gmvData, clientsList } = useMemo(() => {
    if (!allServices || allServices.length === 0) {
      return {
        gmvData: Array.from({ length: 12 }, (_, i) => ({
          name: new Date(2025, i).toLocaleDateString('es-ES', { month: 'short' }),
          value: 0,
          previousYear: 0
        })),
        clientsList: []
      };
    }

    console.log(`📊 GMV PROCESSING: Procesando ${allServices.length} registros COMPLETOS`);

    // Filtrar solo servicios finalizados con cobro válido
    const serviciosValidos = allServices.filter(service => {
      const estado = (service.estado || '').toLowerCase().trim();
      const cobro = Number(service.cobro_cliente);
      const nombreCustodio = service.nombre_custodio || '';
      
      return estado === 'finalizado' && 
             !isNaN(cobro) && cobro > 0 && 
             nombreCustodio.trim() !== '' && nombreCustodio !== '#N/A' &&
             service.fecha_hora_cita;
    });

    console.log(`📊 GMV: ${serviciosValidos.length} servicios válidos de ${allServices.length} totales`);

    // Procesar datos por mes para 2024 y 2025
    const mesesData: { [key: string]: { value2025: number; value2024: number } } = {};
    
    // Inicializar todos los meses
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(2025, i).toLocaleDateString('es-ES', { month: 'short' });
      mesesData[monthName] = { value2025: 0, value2024: 0 };
    }

    // Procesar servicios válidos
    serviciosValidos.forEach(service => {
      const fecha = new Date(service.fecha_hora_cita);
      const year = fecha.getFullYear();
      const month = fecha.getMonth();
      const monthName = new Date(2025, month).toLocaleDateString('es-ES', { month: 'short' });
      const cobro = Number(service.cobro_cliente);

      if (year === 2025) {
        mesesData[monthName].value2025 += cobro;
      } else if (year === 2024) {
        mesesData[monthName].value2024 += cobro;
      }
    });

    // Convertir a formato del chart
    const gmvData: GmvDataPoint[] = Object.entries(mesesData).map(([name, data]) => ({
      name,
      value: Math.round(data.value2025),
      previousYear: Math.round(data.value2024)
    }));

    // Obtener lista única de clientes
    const uniqueClients = new Set<string>();
    serviciosValidos.forEach(service => {
      if (service.nombre_cliente && 
          service.nombre_cliente.trim() !== '' && 
          service.nombre_cliente !== '#N/A') {
        uniqueClients.add(service.nombre_cliente.trim());
      }
    });

    const clientsList = Array.from(uniqueClients).sort();

    const total2025 = gmvData.reduce((sum, item) => sum + item.value, 0);
    const total2024 = gmvData.reduce((sum, item) => sum + item.previousYear, 0);
    
    console.log(`📊 GMV RESULTADO:`);
    console.log(`   - Total 2025: $${total2025.toLocaleString()}`);
    console.log(`   - Total 2024: $${total2024.toLocaleString()}`);
    console.log(`   - Clientes únicos: ${clientsList.length}`);

    return { gmvData, clientsList };
  }, [allServices]);

  return {
    gmvData,
    clientsList,
    isLoading,
    error,
    totalRecordsProcessed: allServices?.length || 0
  };
};
