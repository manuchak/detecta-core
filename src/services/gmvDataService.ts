
import { supabase } from '@/integrations/supabase/client';

export const fetchAllGmvData = async () => {
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
