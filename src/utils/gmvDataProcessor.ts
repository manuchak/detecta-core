
import { isValidCobroUltraPermissive, parseCobroUltraPermissive } from './cobroValidation';

export interface GmvMonthData {
  month: string;
  year2025: number;
  year2024: number;
  growth: number;
}

export interface GmvAnalysisData {
  monthlyData: GmvMonthData[];
  totalGmv2025: number;
  totalGmv2024: number;
  overallGrowth: number;
  clients: string[];
}

export const processGmvData = (allServices: any[], selectedClient: string = "all"): GmvAnalysisData => {
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
};
