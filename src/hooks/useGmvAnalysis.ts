
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
  console.log('🔍 GMV Analysis: Fetching complete dataset...');
  
  let allServices: any[] = [];
  let hasMore = true;
  let offset = 0;
  const batchSize = 1000;
  
  while (hasMore) {
    const { data: batchData, error } = await supabase
      .from('servicios_custodia')
      .select('*')
      .order('fecha_hora_cita', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching batch:', error);
      break;
    }

    if (batchData && batchData.length > 0) {
      allServices = [...allServices, ...batchData];
      console.log(`📦 Batch ${Math.floor(offset/batchSize) + 1}: ${batchData.length} records`);
      
      if (batchData.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Total records loaded: ${allServices.length}`);
  return allServices;
};

export const useGmvAnalysis = (selectedClient: string = "all") => {
  const { data: allServices, isLoading, error } = useQuery({
    queryKey: ['gmv-analysis-complete'],
    queryFn: fetchAllGmvData,
    staleTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const analysisData = useMemo((): GmvAnalysisData => {
    if (!allServices || allServices.length === 0) {
      return {
        monthlyData: [],
        totalGmv2025: 0,
        totalGmv2024: 0,
        overallGrowth: 0,
        clients: []
      };
    }

    console.log(`🔍 GMV Analysis: Processing ${allServices.length} total records`);

    // Filter valid services with proper data
    const validServices = allServices.filter(service => {
      const estado = (service.estado || '').toLowerCase().trim();
      const cobro = parseFloat(service.cobro_cliente);
      const fecha = service.fecha_hora_cita;
      
      // Only include services that are completed/finalized and have valid charge
      return estado === 'finalizado' && 
             !isNaN(cobro) && cobro > 0 && 
             fecha && fecha !== null;
    });

    console.log(`📊 Valid services after filtering: ${validServices.length}`);

    // Get unique clients from nombre_cliente field
    const uniqueClients = Array.from(new Set(
      validServices
        .map(s => s.nombre_cliente)
        .filter(client => client && 
                         client.trim() !== '' && 
                         client !== '#N/A' &&
                         client.toLowerCase() !== 'n/a')
        .map(client => client.trim())
    )).sort();

    console.log(`👥 Unique clients found: ${uniqueClients.length}`, uniqueClients.slice(0, 5));

    // Filter by selected client if not "all"
    let filteredServices = validServices;
    if (selectedClient !== "all") {
      filteredServices = validServices.filter(s => 
        s.nombre_cliente?.trim() === selectedClient
      );
      console.log(`🎯 Services for client "${selectedClient}": ${filteredServices.length}`);
    }

    // Process monthly data
    const monthlyStats: { [key: string]: { year2025: number; year2024: number } } = {};
    
    // Initialize all months
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    months.forEach(month => {
      monthlyStats[month] = { year2025: 0, year2024: 0 };
    });

    // Aggregate data by month and year
    filteredServices.forEach(service => {
      try {
        const fecha = new Date(service.fecha_hora_cita);
        const year = fecha.getFullYear();
        const monthIndex = fecha.getMonth();
        const monthName = months[monthIndex];
        const cobro = parseFloat(service.cobro_cliente);

        if (!isNaN(cobro) && cobro > 0) {
          if (year === 2025) {
            monthlyStats[monthName].year2025 += cobro;
          } else if (year === 2024) {
            monthlyStats[monthName].year2024 += cobro;
          }
        }
      } catch (error) {
        console.warn('Error processing service date:', service.fecha_hora_cita, error);
      }
    });

    // Convert to chart format and calculate growth
    const monthlyData: GmvMonthData[] = months.map(month => {
      const stats = monthlyStats[month];
      const growth = stats.year2024 > 0 
        ? ((stats.year2025 - stats.year2024) / stats.year2024) * 100 
        : stats.year2025 > 0 ? 100 : 0;

      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        year2025: Math.round(stats.year2025),
        year2024: Math.round(stats.year2024),
        growth: Math.round(growth * 10) / 10
      };
    });

    // Calculate totals
    const totalGmv2025 = monthlyData.reduce((sum, item) => sum + item.year2025, 0);
    const totalGmv2024 = monthlyData.reduce((sum, item) => sum + item.year2024, 0);
    const overallGrowth = totalGmv2024 > 0 
      ? Math.round(((totalGmv2025 - totalGmv2024) / totalGmv2024) * 1000) / 10 
      : totalGmv2025 > 0 ? 100 : 0;

    console.log(`📊 GMV Analysis Results:`, {
      totalServices: filteredServices.length,
      totalGmv2025: totalGmv2025.toLocaleString(),
      totalGmv2024: totalGmv2024.toLocaleString(),
      overallGrowth,
      clientsCount: uniqueClients.length,
      selectedClient,
      monthlyDataSample: monthlyData.slice(0, 3)
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
