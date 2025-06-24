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
  console.log('🔍 GMV Analysis: Iniciando análisis forense completo...');
  
  try {
    // Primero, verifiquemos la estructura de la tabla
    const { data: tableInfo, error: tableError } = await supabase
      .from('servicios_custodia')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error verificando estructura de tabla:', tableError);
      throw tableError;
    }

    console.log('📋 Estructura de tabla verificada:', tableInfo?.[0] ? Object.keys(tableInfo[0]) : 'Tabla vacía');

    // Ahora obtengamos una muestra pequeña para análisis
    const { data: sampleData, error: sampleError } = await supabase
      .from('servicios_custodia')
      .select('id_servicio, cobro_cliente, fecha_hora_cita, nombre_cliente')
      .order('fecha_hora_cita', { ascending: false })
      .limit(10);

    if (sampleError) {
      console.error('❌ Error obteniendo muestra:', sampleError);
      throw sampleError;
    }

    console.log('🔬 MUESTRA DE DATOS (primeros 10 registros):');
    sampleData?.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        id: record.id_servicio,
        cobro_cliente: record.cobro_cliente,
        cobro_type: typeof record.cobro_cliente,
        cobro_value: record.cobro_cliente === null ? 'NULL' : record.cobro_cliente === undefined ? 'UNDEFINED' : record.cobro_cliente,
        fecha: record.fecha_hora_cita,
        cliente: record.nombre_cliente
      });
    });

    // Obtener conteo total
    const { count: totalCount, error: countError } = await supabase
      .from('servicios_custodia')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error obteniendo conteo:', countError);
      throw countError;
    }

    console.log(`📊 TOTAL DE REGISTROS EN LA TABLA: ${totalCount}`);

    // Análisis detallado de cobro_cliente
    const { data: cobroAnalysis, error: analysisError } = await supabase
      .from('servicios_custodia')
      .select('cobro_cliente')
      .not('cobro_cliente', 'is', null);

    console.log(`🔍 Registros con cobro_cliente NO NULL: ${cobroAnalysis?.length || 0}`);

    // Análisis de tipos de valores
    const { data: allCobros, error: cobrosError } = await supabase
      .from('servicios_custodia')
      .select('cobro_cliente');

    if (!cobrosError && allCobros) {
      const analysis = allCobros.reduce((acc, record) => {
        const cobro = record.cobro_cliente;
        if (cobro === null) {
          acc.null++;
        } else if (cobro === undefined) {
          acc.undefined++;
        } else if (cobro === '') {
          acc.empty++;
        } else if (typeof cobro === 'number') {
          if (cobro === 0) acc.zero++;
          else if (cobro > 0) acc.positive++;
          else acc.other++;
        } else if (typeof cobro === 'string') {
          const numericValue = Number(cobro);
          if (cobro === '0' || numericValue === 0) acc.zero++;
          else if (!isNaN(numericValue) && numericValue > 0) acc.positiveString++;
          else acc.other++;
        } else {
          acc.other++;
        }
        
        return acc;
      }, { null: 0, undefined: 0, empty: 0, zero: 0, positive: 0, positiveString: 0, other: 0 });

      console.log('📈 ANÁLISIS DETALLADO DE COBRO_CLIENTE:', analysis);
    }

    // Obtener todos los datos válidos paso a paso
    console.log('🚀 Iniciando fetch completo con filtros aplicados...');
    
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

    console.log(`🎯 TOTAL RECORDS FETCHED: ${allServices.length}`);
    return allServices;
  } catch (error) {
    console.error('💥 Critical error in fetchAllGmvData:', error);
    throw error;
  }
};

// Función ultra-permisiva para validar cobro_cliente
const isValidCobroUltraPermissive = (cobro: any): boolean => {
  // Rechazar solo casos muy específicos
  if (cobro === null || cobro === undefined) {
    return false;
  }
  
  // Aceptar string vacío como 0
  if (cobro === '') {
    return true;
  }
  
  // Aceptar cualquier número (incluyendo 0)
  if (typeof cobro === 'number') {
    return !isNaN(cobro) && isFinite(cobro);
  }
  
  // Aceptar strings que pueden convertirse a número
  if (typeof cobro === 'string') {
    const trimmed = cobro.trim();
    if (trimmed === '') return true; // string vacío = 0
    const numericValue = Number(trimmed);
    return !isNaN(numericValue) && isFinite(numericValue);
  }
  
  return false;
};

// Función ultra-permisiva para convertir cobro a número
const parseCobroUltraPermissive = (cobro: any): number => {
  if (cobro === null || cobro === undefined) {
    return 0;
  }
  
  if (cobro === '') {
    return 0;
  }
  
  if (typeof cobro === 'number') {
    return isNaN(cobro) ? 0 : cobro;
  }
  
  if (typeof cobro === 'string') {
    const trimmed = cobro.trim();
    if (trimmed === '' || trimmed === '0') return 0;
    const numericValue = Number(trimmed);
    return isNaN(numericValue) ? 0 : numericValue;
  }
  
  return 0;
};

export const useGmvAnalysis = (selectedClient: string = "all") => {
  const { data: allServices, isLoading, error } = useQuery({
    queryKey: ['gmv-analysis-complete'],
    queryFn: fetchAllGmvData,
    staleTime: 5 * 60 * 1000, // Reducido a 5 minutos para datos más frescos
    gcTime: 10 * 60 * 1000, // Cache durante 10 minutos
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Evitar refetch innecesario al montar
  });

  const analysisData = useMemo((): GmvAnalysisData => {
    if (!allServices || allServices.length === 0) {
      console.log('⚠️ No services data available for analysis');
      return {
        monthlyData: [],
        totalGmv2025: 0,
        totalGmv2024: 0,
        overallGrowth: 0,
        clients: []
      };
    }

    console.log(`🔍 GMV Analysis: Starting processing of ${allServices.length} total records`);

    // PASO 1: Análisis detallado de validación de cobro_cliente
    console.log('📊 PASO 1: Análisis de validación de cobro_cliente');
    const cobroValidationAnalysis = allServices.reduce((acc, service, index) => {
      const cobro = service.cobro_cliente;
      const isValid = isValidCobroUltraPermissive(cobro);
      
      // Log detallado para los primeros 20 registros
      if (index < 20) {
        console.log(`Record ${index + 1}:`, {
          id: service.id_servicio,
          cobro_original: cobro,
          cobro_type: typeof cobro,
          is_valid: isValid,
          parsed_value: isValid ? parseCobroUltraPermissive(cobro) : 'N/A',
          fecha: service.fecha_hora_cita,
          cliente: service.nombre_cliente
        });
      }
      
      if (isValid) acc.valid++;
      else acc.invalid++;
      
      return acc;
    }, { valid: 0, invalid: 0 });

    console.log('✅ RESULTADO VALIDACIÓN COBRO:', cobroValidationAnalysis);

    // PASO 2: Filtrar servicios válidos
    console.log('📊 PASO 2: Filtrado de servicios válidos');
    const validServices = allServices.filter(service => {
      const cobroValid = isValidCobroUltraPermissive(service.cobro_cliente);
      const fechaValid = service.fecha_hora_cita && service.fecha_hora_cita !== null && String(service.fecha_hora_cita) !== '';
      
      return cobroValid && fechaValid;
    });

    console.log(`✅ Services after validation filter: ${validServices.length} de ${allServices.length}`);

    // PASO 3: Análisis de clientes únicos
    console.log('📊 PASO 3: Análisis de clientes únicos');
    const clientAnalysis = validServices.reduce((acc, service) => {
      const cliente = service.nombre_cliente;
      if (cliente && typeof cliente === 'string' && cliente.trim() !== '' && cliente !== '#N/A' && cliente.toLowerCase() !== 'n/a') {
        acc.valid++;
        if (!acc.uniqueClients.has(cliente.trim())) {
          acc.uniqueClients.add(cliente.trim());
        }
      } else {
        acc.invalid++;
      }
      return acc;
    }, { valid: 0, invalid: 0, uniqueClients: new Set<string>() });

    const uniqueClients: string[] = Array.from(clientAnalysis.uniqueClients);
    console.log('✅ ANÁLISIS DE CLIENTES:', {
      services_with_valid_client: clientAnalysis.valid,
      services_with_invalid_client: clientAnalysis.invalid,
      unique_clients_count: uniqueClients.length,
      first_10_clients: uniqueClients.slice(0, 10)
    });

    // PASO 4: Filtrar por cliente seleccionado
    console.log('📊 PASO 4: Filtrado por cliente seleccionado');
    let filteredServices = validServices;
    if (selectedClient !== "all") {
      filteredServices = validServices.filter(s => 
        s.nombre_cliente?.trim() === selectedClient
      );
      console.log(`✅ Services for client "${selectedClient}": ${filteredServices.length}`);
    }

    // PASO 5: Procesamiento de datos mensuales
    console.log('📊 PASO 5: Procesamiento de datos mensuales');
    const monthlyStats: { [key: string]: { year2025: number; year2024: number; count2025: number; count2024: number } } = {};
    
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    months.forEach(month => {
      monthlyStats[month] = { year2025: 0, year2024: 0, count2025: 0, count2024: 0 };
    });

    let processedServices = 0;
    let errorCount = 0;
    let totalAmount = 0;

    filteredServices.forEach((service, index) => {
      try {
        const fecha = new Date(service.fecha_hora_cita);
        
        if (isNaN(fecha.getTime())) {
          console.warn(`⚠️ Invalid date for service ${service.id_servicio}:`, service.fecha_hora_cita);
          errorCount++;
          return;
        }
        
        const year = fecha.getFullYear();
        const monthIndex = fecha.getMonth();
        
        if (monthIndex < 0 || monthIndex > 11) {
          console.warn(`⚠️ Invalid month index ${monthIndex} for service ${service.id_servicio}`);
          errorCount++;
          return;
        }
        
        const monthName = months[monthIndex];
        const cobro = parseCobroUltraPermissive(service.cobro_cliente);
        totalAmount += cobro;

        // Log detallado para los primeros 10 servicios procesados
        if (processedServices < 10) {
          console.log(`Processing service ${processedServices + 1}:`, {
            id: service.id_servicio,
            year,
            month: monthName,
            cobro_original: service.cobro_cliente,
            cobro_parsed: cobro,
            fecha: service.fecha_hora_cita
          });
        }

        if (year === 2025) {
          monthlyStats[monthName].year2025 += cobro;
          monthlyStats[monthName].count2025++;
          processedServices++;
        } else if (year === 2024) {
          monthlyStats[monthName].year2024 += cobro;
          monthlyStats[monthName].count2024++;
          processedServices++;
        }
      } catch (error) {
        console.warn(`⚠️ Error processing service ${service.id_servicio}:`, error);
        errorCount++;
      }
    });

    console.log('✅ RESULTADO PROCESAMIENTO MENSUAL:', {
      processed_services: processedServices,
      error_count: errorCount,
      total_amount: totalAmount,
      monthly_breakdown: Object.entries(monthlyStats)
        .filter(([_, stats]) => stats.year2025 > 0 || stats.year2024 > 0)
        .map(([month, stats]) => ({
          month,
          year2025: stats.year2025,
          year2024: stats.year2024,
          count2025: stats.count2025,
          count2024: stats.count2024
        }))
    });

    // Convert to chart format
    const monthlyData: GmvMonthData[] = months.map(month => {
      const stats = monthlyStats[month];
      const growth = stats.year2024 > 0 
        ? ((stats.year2025 - stats.year2024) / stats.year2024) * 100 
        : stats.year2025 > 0 ? 100 : 0;

      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        year2025: Math.round(stats.year2025 * 100) / 100,
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

    console.log('🎯 RESULTADO FINAL DEL ANÁLISIS GMV:', {
      total_services_fetched: allServices.length,
      valid_services_after_filter: validServices.length,
      filtered_services_for_client: filteredServices.length,
      processed_services: processedServices,
      error_count: errorCount,
      total_gmv_2025: totalGmv2025,
      total_gmv_2024: totalGmv2024,
      overall_growth: overallGrowth,
      clients_count: uniqueClients.length,
      selected_client: selectedClient,
      months_with_data: monthlyData.filter(m => m.year2025 > 0 || m.year2024 > 0).length
    });

    return {
      monthlyData,
      totalGmv2025,
      totalGmv2024,
      overallGrowth,
      clients: uniqueClients.sort()
    };
  }, [allServices, selectedClient]);

  return {
    ...analysisData,
    isLoading,
    error,
    totalRecords: allServices?.length || 0
  };
};
