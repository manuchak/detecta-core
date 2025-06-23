
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GmvMonthData {
  month: string;
  year2025: number;
  year2024: number;
  growth: number;
}

interface GmvAnalysisData {
  monthlyData: GmvMonthData[];
  totalGmv2025: number;
  totalGmv2024: number;
  overallGrowth: number;
  clients: string[];
}

const fetchAllGmvData = async () => {
  console.log('🔍 GMV Analysis: Iniciando fetch completo de datos...');
  
  try {
    let allServices: any[] = [];
    let hasMore = true;
    let offset = 0;
    const batchSize = 1000;
    
    while (hasMore) {
      console.log(`📦 Fetching batch ${Math.floor(offset/batchSize) + 1} (offset: ${offset})`);
      
      const { data: batchData, error } = await supabase
        .from('servicios_custodia')
        .select('*')
        .order('fecha_hora_cita', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('❌ Error fetching batch:', error);
        throw error;
      }

      if (batchData && batchData.length > 0) {
        allServices = [...allServices, ...batchData];
        console.log(`✅ Batch ${Math.floor(offset/batchSize) + 1}: ${batchData.length} records`);
        
        if (batchData.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`🎯 Total records fetched: ${allServices.length}`);
    
    // Log sample data for debugging
    if (allServices.length > 0) {
      const sampleService = allServices[0];
      console.log('📋 Sample service structure:', {
        id_servicio: sampleService.id_servicio,
        cobro_cliente: sampleService.cobro_cliente,
        cobro_cliente_type: typeof sampleService.cobro_cliente,
        fecha_hora_cita: sampleService.fecha_hora_cita,
        nombre_cliente: sampleService.nombre_cliente
      });
    }
    
    return allServices;
  } catch (error) {
    console.error('💥 Critical error in fetchAllGmvData:', error);
    throw error;
  }
};

// Función mejorada para validar cobro_cliente
const isValidCobro = (cobro: any): boolean => {
  // Permitir 0 explícitamente
  if (cobro === 0 || cobro === '0' || cobro === '0.00') {
    return true;
  }
  
  // Verificar que no sea null/undefined/empty
  if (cobro === null || cobro === undefined || cobro === '') {
    return false;
  }
  
  // Convertir a número y verificar que sea válido
  const numericValue = Number(cobro);
  return !isNaN(numericValue) && isFinite(numericValue);
};

// Función para convertir cobro a número de forma segura
const parseCobroSafely = (cobro: any): number => {
  if (cobro === null || cobro === undefined || cobro === '') {
    return 0;
  }
  
  const numericValue = Number(cobro);
  return isNaN(numericValue) ? 0 : numericValue;
};

export const useGmvAnalysis = (selectedClient: string = "all") => {
  const { data: allServices, isLoading, error } = useQuery({
    queryKey: ['gmv-analysis-complete'],
    queryFn: fetchAllGmvData,
    staleTime: 15 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const analysisData = useMemo((): GmvAnalysisData => {
    if (!allServices || allServices.length === 0) {
      console.log('⚠️ No services data available');
      return {
        monthlyData: [],
        totalGmv2025: 0,
        totalGmv2024: 0,
        overallGrowth: 0,
        clients: []
      };
    }

    console.log(`🔍 GMV Analysis: Processing ${allServices.length} total records`);

    // Análisis detallado de cobro_cliente
    const cobroAnalysis = allServices.reduce((acc, service) => {
      const cobro = service.cobro_cliente;
      
      if (cobro === null) acc.null++;
      else if (cobro === undefined) acc.undefined++;
      else if (cobro === '') acc.empty++;
      else if (cobro === 0 || cobro === '0') acc.zero++;
      else if (isValidCobro(cobro)) acc.valid++;
      else acc.invalid++;
      
      return acc;
    }, { null: 0, undefined: 0, empty: 0, zero: 0, valid: 0, invalid: 0 });

    console.log('📊 Cobro_cliente analysis:', cobroAnalysis);

    // Filter services con validación mejorada
    const validServices = allServices.filter(service => {
      const cobro = service.cobro_cliente;
      const fecha = service.fecha_hora_cita;
      
      const hasValidCobro = isValidCobro(cobro);
      const hasValidDate = fecha && fecha !== null && fecha !== '';
      
      return hasValidCobro && hasValidDate;
    });

    console.log(`✅ Valid services after filtering: ${validServices.length}`);

    // Get unique clients
    const uniqueClients = Array.from(new Set(
      validServices
        .map(s => s.nombre_cliente)
        .filter(client => client && 
                         client.trim() !== '' && 
                         client !== '#N/A' &&
                         client.toLowerCase() !== 'n/a')
        .map(client => client.trim())
    )).sort();

    console.log(`👥 Unique clients found: ${uniqueClients.length}`, uniqueClients.slice(0, 10));

    // Filter by selected client
    let filteredServices = validServices;
    if (selectedClient !== "all") {
      filteredServices = validServices.filter(s => 
        s.nombre_cliente?.trim() === selectedClient
      );
      console.log(`🎯 Services for client "${selectedClient}": ${filteredServices.length}`);
    }

    // Process monthly data con mejor manejo de errores
    const monthlyStats: { [key: string]: { year2025: number; year2024: number } } = {};
    
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    months.forEach(month => {
      monthlyStats[month] = { year2025: 0, year2024: 0 };
    });

    let processedServices = 0;
    let errorCount = 0;

    filteredServices.forEach(service => {
      try {
        const fecha = new Date(service.fecha_hora_cita);
        
        // Validación adicional de fecha
        if (isNaN(fecha.getTime())) {
          console.warn('⚠️ Invalid date:', service.fecha_hora_cita);
          errorCount++;
          return;
        }
        
        const year = fecha.getFullYear();
        const monthIndex = fecha.getMonth();
        
        if (monthIndex < 0 || monthIndex > 11) {
          console.warn('⚠️ Invalid month index:', monthIndex);
          errorCount++;
          return;
        }
        
        const monthName = months[monthIndex];
        const cobro = parseCobroSafely(service.cobro_cliente);

        if (year === 2025) {
          monthlyStats[monthName].year2025 += cobro;
          processedServices++;
        } else if (year === 2024) {
          monthlyStats[monthName].year2024 += cobro;
          processedServices++;
        }
      } catch (error) {
        console.warn('⚠️ Error processing service:', service.id_servicio, error);
        errorCount++;
      }
    });

    console.log(`📈 Processed services: ${processedServices}, Errors: ${errorCount}`);

    // Convert to chart format
    const monthlyData: GmvMonthData[] = months.map(month => {
      const stats = monthlyStats[month];
      const growth = stats.year2024 > 0 
        ? ((stats.year2025 - stats.year2024) / stats.year2024) * 100 
        : stats.year2025 > 0 ? 100 : 0;

      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        year2025: Math.round(stats.year2025 * 100) / 100, // Redondear a 2 decimales
        year2024: Math.round(stats.year2024 * 100) / 100,
        growth: Math.round(growth * 10) / 10
      };
    });

    // Calculate totals
    const totalGmv2025 = monthlyData.reduce((sum, item) => sum + item.year2025, 0);
    const totalGmv2024 = monthlyData.reduce((sum, item) => sum + item.year2024, 0);
    const overallGrowth = totalGmv2024 > 0 
      ? Math.round(((totalGmv2025 - totalGmv2024) / totalGmv2024) * 1000) / 10 
      : totalGmv2025 > 0 ? 100 : 0;

    console.log(`🎯 Final GMV Analysis Results:`, {
      totalServices: filteredServices.length,
      processedServices,
      errorCount,
      totalGmv2025: totalGmv2025.toLocaleString(),
      totalGmv2024: totalGmv2024.toLocaleString(),
      overallGrowth,
      clientsCount: uniqueClients.length,
      selectedClient,
      cobroAnalysis,
      monthlyDataSample: monthlyData.filter(m => m.year2025 > 0 || m.year2024 > 0)
    });

    return {
      monthlyData,
      totalGmv2025,
      totalGmv2024,
      overallGrowth,
      clients: uniqueClients
    };
  }, [allServices, selectedClient]);

  return {
    ...analysisData,
    isLoading,
    error,
    totalRecords: allServices?.length || 0
  };
};
