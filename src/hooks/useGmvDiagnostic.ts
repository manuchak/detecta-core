
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useGmvDiagnostic = () => {
  
  const { data: allServices, isLoading, error } = useQuery({
    queryKey: ['gmv-diagnostic'],
    queryFn: async () => {
      console.log('=== DIAGNÓSTICO GMV DETALLADO ===');
      
      try {
        const { data: serviceData, error } = await supabase
          .rpc('bypass_rls_get_servicios', { max_records: 25000 });

        if (error) {
          console.error('Error al obtener servicios:', error);
          throw error;
        }

        console.log(`📊 Total de registros obtenidos: ${serviceData?.length || 0}`);
        return serviceData || [];
      } catch (error) {
        console.error('Error en consulta diagnóstica:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
  
  const diagnosticResult = useMemo(() => {
    if (isLoading || error || !allServices) {
      return null;
    }

    console.log('🔍 === ANÁLISIS DETALLADO GMV ENERO-MAYO ===');
    
    // PASO 1: Filtrar por rango Enero-Mayo 2025
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-05-31T23:59:59');
    
    console.log(`📅 Rango de análisis: ${startDate.toISOString()} a ${endDate.toISOString()}`);
    
    const serviciosEnRango = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      return serviceDate >= startDate && serviceDate <= endDate;
    });
    
    console.log(`📅 Servicios en rango Enero-Mayo: ${serviciosEnRango.length}`);
    
    // PASO 2: Analizar cobro_cliente
    console.log('\n💰 === ANÁLISIS DE COBRO_CLIENTE ===');
    
    const serviciosConCobroValido = serviciosEnRango.filter(service => {
      const cobro = service.cobro_cliente;
      return cobro !== null && cobro !== undefined && cobro !== '' && !isNaN(Number(cobro)) && Number(cobro) > 0;
    });
    
    const serviciosConCobroNulo = serviciosEnRango.filter(service => {
      const cobro = service.cobro_cliente;
      return cobro === null || cobro === undefined;
    });
    
    const serviciosConCobroCero = serviciosEnRango.filter(service => {
      const cobro = Number(service.cobro_cliente);
      return !isNaN(cobro) && cobro === 0;
    });
    
    const serviciosConCobroVacio = serviciosEnRango.filter(service => {
      return service.cobro_cliente === '';
    });
    
    console.log(`💳 Servicios con cobro válido (>0): ${serviciosConCobroValido.length}`);
    console.log(`❌ Servicios con cobro nulo: ${serviciosConCobroNulo.length}`);
    console.log(`🚫 Servicios con cobro = 0: ${serviciosConCobroCero.length}`);
    console.log(`📝 Servicios con cobro vacío (''): ${serviciosConCobroVacio.length}`);
    
    // PASO 3: Calcular GMV SIN filtros de estado
    console.log('\n🧮 === CÁLCULO GMV SIN FILTROS DE ESTADO ===');
    
    let gmvTotalSinFiltros = 0;
    const uniqueServicesIds = new Set();
    
    serviciosConCobroValido.forEach(service => {
      if (service.id_servicio && !uniqueServicesIds.has(service.id_servicio)) {
        uniqueServicesIds.add(service.id_servicio);
        const cobro = Number(service.cobro_cliente);
        gmvTotalSinFiltros += cobro;
      }
    });
    
    console.log(`💰 GMV total SIN filtros de estado: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvTotalSinFiltros)}`);
    console.log(`🆔 Servicios únicos con cobro: ${uniqueServicesIds.size}`);
    
    // PASO 4: Analizar por estado
    console.log('\n📋 === ANÁLISIS POR ESTADO ===');
    
    const estadosConteo = {};
    const estadosGmv = {};
    
    serviciosConCobroValido.forEach(service => {
      const estado = service.estado || 'SIN_ESTADO';
      estadosConteo[estado] = (estadosConteo[estado] || 0) + 1;
      
      if (!estadosGmv[estado]) {
        estadosGmv[estado] = 0;
      }
      estadosGmv[estado] += Number(service.cobro_cliente);
    });
    
    console.log('📊 Distribución por estado (cantidad):');
    Object.entries(estadosConteo).forEach(([estado, cantidad]) => {
      console.log(`  ${estado}: ${cantidad} servicios`);
    });
    
    console.log('\n💰 Distribución por estado (GMV):');
    Object.entries(estadosGmv).forEach(([estado, gmv]) => {
      console.log(`  ${estado}: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmv)}`);
    });
    
    // PASO 5: Aplicar filtro de "Finalizado" como hace el código actual
    console.log('\n✅ === ANÁLISIS CON FILTRO "FINALIZADO" ===');
    
    const serviciosFinalizados = serviciosConCobroValido.filter(service => {
      const estado = (service.estado || '').trim();
      return estado === 'Finalizado';
    });
    
    let gmvSoloFinalizados = 0;
    const uniqueFinalizadosIds = new Set();
    
    serviciosFinalizados.forEach(service => {
      if (service.id_servicio && !uniqueFinalizadosIds.has(service.id_servicio)) {
        uniqueFinalizadosIds.add(service.id_servicio);
        gmvSoloFinalizados += Number(service.cobro_cliente);
      }
    });
    
    console.log(`✅ Servicios con estado "Finalizado": ${serviciosFinalizados.length}`);
    console.log(`💰 GMV solo servicios "Finalizado": ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvSoloFinalizados)}`);
    console.log(`🆔 Servicios únicos finalizados: ${uniqueFinalizadosIds.size}`);
    
    // PASO 6: Comparación con expectativa (22M)
    console.log('\n🎯 === COMPARACIÓN CON EXPECTATIVA ===');
    console.log(`💰 Expectativa (consulta directa BDD): $22,000,000 MXN`);
    console.log(`💰 Resultado sin filtros estado: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvTotalSinFiltros)}`);
    console.log(`💰 Resultado solo "Finalizado": ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvSoloFinalizados)}`);
    console.log(`📉 Diferencia sin filtros: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(22000000 - gmvTotalSinFiltros)}`);
    console.log(`📉 Diferencia solo "Finalizado": ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(22000000 - gmvSoloFinalizados)}`);
    
    // PASO 7: Análisis de muestras
    console.log('\n🔬 === MUESTRA DE DATOS ===');
    console.log('Primeros 5 servicios con mayor cobro:');
    const serviciosOrdenados = serviciosConCobroValido
      .sort((a, b) => Number(b.cobro_cliente) - Number(a.cobro_cliente))
      .slice(0, 5);
    
    serviciosOrdenados.forEach((service, index) => {
      console.log(`${index + 1}. ID: ${service.id_servicio}, Estado: ${service.estado}, Cobro: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(service.cobro_cliente))}, Fecha: ${service.fecha_hora_cita}`);
    });
    
    return {
      totalServicios: serviciosEnRango.length,
      serviciosConCobro: serviciosConCobroValido.length,
      serviciosUnicos: uniqueServicesIds.size,
      gmvTotalSinFiltros,
      gmvSoloFinalizados,
      serviciosFinalizados: serviciosFinalizados.length,
      estadosConteo,
      estadosGmv,
      diferenciaSinFiltros: 22000000 - gmvTotalSinFiltros,
      diferenciaFinalizados: 22000000 - gmvSoloFinalizados
    };
  }, [allServices, isLoading, error]);
  
  return {
    isLoading,
    error,
    diagnosticResult
  };
};
