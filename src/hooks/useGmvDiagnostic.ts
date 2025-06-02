
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
    
    // PASO 2: ANÁLISIS EXHAUSTIVO DE COBRO_CLIENTE
    console.log('\n💰 === ANÁLISIS EXHAUSTIVO DE COBRO_CLIENTE ===');
    
    // Analizar todos los tipos de valores en cobro_cliente
    const cobroAnalysis = {
      nulos: 0,
      vacios: 0,
      ceros: 0,
      validos: 0,
      negativos: 0,
      textoInvalido: 0,
      valoresEjemplo: []
    };
    
    let totalCobroRaw = 0;
    const valoresUnicos = new Set();
    
    serviciosEnRango.forEach((service, index) => {
      const cobro = service.cobro_cliente;
      
      // Guardar ejemplos de los primeros 10 registros
      if (index < 10) {
        cobroAnalysis.valoresEjemplo.push({
          id: service.id_servicio,
          cobro_original: cobro,
          tipo: typeof cobro,
          fecha: service.fecha_hora_cita
        });
      }
      
      if (cobro === null || cobro === undefined) {
        cobroAnalysis.nulos++;
      } else if (typeof cobro === 'string' && cobro === '') {
        cobroAnalysis.vacios++;
      } else {
        const cobroNumerico = Number(cobro);
        if (isNaN(cobroNumerico)) {
          cobroAnalysis.textoInvalido++;
          if (valoresUnicos.size < 10) {
            valoresUnicos.add(`"${cobro}" (${typeof cobro})`);
          }
        } else if (cobroNumerico === 0) {
          cobroAnalysis.ceros++;
        } else if (cobroNumerico < 0) {
          cobroAnalysis.negativos++;
        } else {
          cobroAnalysis.validos++;
          totalCobroRaw += cobroNumerico;
        }
      }
    });
    
    console.log('📊 DISTRIBUCIÓN DE VALORES EN COBRO_CLIENTE:');
    console.log(`  ❌ Nulos (null/undefined): ${cobroAnalysis.nulos}`);
    console.log(`  📝 Vacíos (''): ${cobroAnalysis.vacios}`);
    console.log(`  🚫 Ceros (0): ${cobroAnalysis.ceros}`);
    console.log(`  ✅ Válidos (>0): ${cobroAnalysis.validos}`);
    console.log(`  ⚠️ Negativos: ${cobroAnalysis.negativos}`);
    console.log(`  🔤 Texto inválido: ${cobroAnalysis.textoInvalido}`);
    
    if (valoresUnicos.size > 0) {
      console.log(`  🔤 Ejemplos de texto inválido: ${Array.from(valoresUnicos).join(', ')}`);
    }
    
    console.log('\n🔬 MUESTRA DE PRIMEROS 10 REGISTROS:');
    cobroAnalysis.valoresEjemplo.forEach((ejemplo, i) => {
      console.log(`  ${i+1}. ID: ${ejemplo.id}, Cobro: ${ejemplo.cobro_original} (${ejemplo.tipo}), Fecha: ${ejemplo.fecha}`);
    });
    
    // PASO 3: CÁLCULO GMV CON DIFERENTES ESTRATEGIAS
    console.log('\n🧮 === CÁLCULO GMV CON DIFERENTES ESTRATEGIAS ===');
    
    // Estrategia 1: Solo servicios con cobro válido > 0
    const serviciosCobroValido = serviciosEnRango.filter(service => {
      const cobro = service.cobro_cliente;
      if (cobro === null || cobro === undefined) return false;
      if (typeof cobro === 'string' && cobro === '') return false;
      const cobroNumerico = Number(cobro);
      return !isNaN(cobroNumerico) && cobroNumerico > 0;
    });
    
    let gmvEstrategia1 = 0;
    const uniqueIds1 = new Set();
    serviciosCobroValido.forEach(service => {
      if (service.id_servicio && !uniqueIds1.has(service.id_servicio)) {
        uniqueIds1.add(service.id_servicio);
        gmvEstrategia1 += Number(service.cobro_cliente);
      }
    });
    
    // Estrategia 2: Incluir ceros también
    const serviciosConCobroNumerico = serviciosEnRango.filter(service => {
      const cobro = service.cobro_cliente;
      if (cobro === null || cobro === undefined) return false;
      if (typeof cobro === 'string' && cobro === '') return false;
      const cobroNumerico = Number(cobro);
      return !isNaN(cobroNumerico) && cobroNumerico >= 0;
    });
    
    let gmvEstrategia2 = 0;
    const uniqueIds2 = new Set();
    serviciosConCobroNumerico.forEach(service => {
      if (service.id_servicio && !uniqueIds2.has(service.id_servicio)) {
        uniqueIds2.add(service.id_servicio);
        gmvEstrategia2 += Number(service.cobro_cliente);
      }
    });
    
    // Estrategia 3: Solo servicios "Finalizado" con cobro válido
    const serviciosFinalizadosConCobro = serviciosCobroValido.filter(service => {
      const estado = (service.estado || '').toString().trim();
      return estado === 'Finalizado';
    });
    
    let gmvEstrategia3 = 0;
    const uniqueIds3 = new Set();
    serviciosFinalizadosConCobro.forEach(service => {
      if (service.id_servicio && !uniqueIds3.has(service.id_servicio)) {
        uniqueIds3.add(service.id_servicio);
        gmvEstrategia3 += Number(service.cobro_cliente);
      }
    });
    
    // PASO 4: ANÁLISIS NUEVOS ENFOQUES DE DISCREPANCIA
    console.log('\n🔍 === ANÁLISIS PROFUNDO DE DISCREPANCIA ===');
    
    // 4.1: Análisis por estado detallado
    const estadosCount = {};
    const estadosGmv = {};
    serviciosEnRango.forEach(service => {
      const estado = (service.estado || 'Sin estado').toString().trim();
      const cobroNumerico = Number(service.cobro_cliente);
      
      estadosCount[estado] = (estadosCount[estado] || 0) + 1;
      if (!isNaN(cobroNumerico) && cobroNumerico > 0) {
        estadosGmv[estado] = (estadosGmv[estado] || 0) + cobroNumerico;
      }
    });
    
    console.log('📊 DISTRIBUCIÓN POR ESTADOS:');
    Object.entries(estadosCount).forEach(([estado, count]) => {
      const gmvEstado = estadosGmv[estado] || 0;
      console.log(`  ${estado}: ${count} servicios, GMV: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvEstado)}`);
    });
    
    // 4.2: Análisis de servicios sin cobro_cliente o con valor extraño
    const serviciosSinCobro = serviciosEnRango.filter(service => {
      const cobro = service.cobro_cliente;
      const cobroNumerico = Number(cobro);
      return cobro === null || cobro === undefined || (typeof cobro === 'string' && cobro === '') || (isNaN(cobroNumerico) || cobroNumerico === 0);
    });
    
    console.log(`\n🚫 SERVICIOS SIN COBRO VÁLIDO: ${serviciosSinCobro.length}`);
    if (serviciosSinCobro.length > 0) {
      console.log('📋 Primeros 5 servicios sin cobro:');
      serviciosSinCobro.slice(0, 5).forEach((service, i) => {
        console.log(`  ${i+1}. ID: ${service.id_servicio}, Estado: ${service.estado}, Cobro: ${service.cobro_cliente}, Fecha: ${service.fecha_hora_cita}`);
      });
    }
    
    // 4.3: Análisis de fechas más amplio
    console.log('\n📅 === ANÁLISIS DE FECHAS EXTENDIDO ===');
    
    // Todo 2025
    const startDate2025 = new Date('2025-01-01');
    const endDate2025 = new Date('2025-12-31T23:59:59');
    
    const servicios2025 = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      return serviceDate >= startDate2025 && serviceDate <= endDate2025;
    });
    
    const servicios2025ConCobro = servicios2025.filter(service => {
      const cobro = service.cobro_cliente;
      if (cobro === null || cobro === undefined) return false;
      if (typeof cobro === 'string' && cobro === '') return false;
      const cobroNumerico = Number(cobro);
      return !isNaN(cobroNumerico) && cobroNumerico > 0;
    });
    
    let gmv2025Total = 0;
    const uniqueIds2025 = new Set();
    servicios2025ConCobro.forEach(service => {
      if (service.id_servicio && !uniqueIds2025.has(service.id_servicio)) {
        uniqueIds2025.add(service.id_servicio);
        gmv2025Total += Number(service.cobro_cliente);
      }
    });
    
    console.log(`📅 Servicios TODO 2025: ${servicios2025.length}`);
    console.log(`💰 GMV TODO 2025: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmv2025Total)}`);
    console.log(`📊 Si extrapolamos Ene-May a todo el año: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvEstrategia1 * 2.4)}`);
    
    console.log(`💰 Estrategia 1 (cobro > 0): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvEstrategia1)} | Servicios únicos: ${uniqueIds1.size}`);
    console.log(`💰 Estrategia 2 (cobro >= 0): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvEstrategia2)} | Servicios únicos: ${uniqueIds2.size}`);
    console.log(`💰 Estrategia 3 (solo "Finalizado"): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvEstrategia3)} | Servicios únicos: ${uniqueIds3.size}`);
    
    // PASO 5: ANÁLISIS DE DUPLICADOS
    console.log('\n🔄 === ANÁLISIS DE DUPLICADOS ===');
    
    const idCounts = {};
    serviciosEnRango.forEach(service => {
      if (service.id_servicio) {
        idCounts[service.id_servicio] = (idCounts[service.id_servicio] || 0) + 1;
      }
    });
    
    const duplicados = Object.entries(idCounts).filter(([id, count]) => count > 1);
    console.log(`🔄 Servicios con ID duplicado: ${duplicados.length}`);
    
    if (duplicados.length > 0) {
      console.log('📋 Primeros 5 IDs duplicados:');
      duplicados.slice(0, 5).forEach(([id, count]) => {
        console.log(`  ID: ${id} aparece ${count} veces`);
      });
    }
    
    // PASO 6: ANÁLISIS POR RANGOS DE COBRO
    console.log('\n📊 === ANÁLISIS POR RANGOS DE COBRO ===');
    
    const rangos = {
      '0-1000': 0,
      '1000-5000': 0,
      '5000-10000': 0,
      '10000-50000': 0,
      '50000+': 0
    };
    
    let sumaRangos = 0;
    serviciosCobroValido.forEach(service => {
      const cobroNumerico = Number(service.cobro_cliente);
      if (!isNaN(cobroNumerico)) {
        sumaRangos += cobroNumerico;
        
        if (cobroNumerico <= 1000) rangos['0-1000']++;
        else if (cobroNumerico <= 5000) rangos['1000-5000']++;
        else if (cobroNumerico <= 10000) rangos['5000-10000']++;
        else if (cobroNumerico <= 50000) rangos['10000-50000']++;
        else rangos['50000+']++;
      }
    });
    
    Object.entries(rangos).forEach(([rango, cantidad]) => {
      console.log(`  ${rango}: ${cantidad} servicios`);
    });
    
    console.log(`💰 Suma total por rangos: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(sumaRangos)}`);
    
    // PASO 7: COMPARACIÓN FINAL
    console.log('\n🎯 === COMPARACIÓN CON EXPECTATIVA 22M ===');
    console.log(`💰 Expectativa: $22,000,000 MXN`);
    console.log(`💰 Calculado (>0): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvEstrategia1)}`);
    console.log(`💰 Calculado (>=0): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvEstrategia2)}`);
    console.log(`💰 Solo "Finalizado": ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(gmvEstrategia3)}`);
    console.log(`📉 Diferencia mayor: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(22000000 - gmvEstrategia1)}`);
    
    const porcentajeCobertura = (gmvEstrategia1 / 22000000) * 100;
    console.log(`📊 Cobertura: ${porcentajeCobertura.toFixed(1)}% de lo esperado`);
    
    // PASO 8: TEORÍAS SOBRE LA DISCREPANCIA
    console.log('\n🤔 === POSIBLES CAUSAS DE LA DISCREPANCIA ===');
    console.log('1. 📅 Rango de fechas: ¿Los 22M incluyen TODO el año 2025?');
    console.log('2. 🔄 Duplicados: ¿Se están contando servicios duplicados en BDD?');
    console.log('3. 💰 Tipos de datos: ¿Algunos cobros están en formato diferente?');
    console.log('4. 🏷️ Estados: ¿Se incluyen otros estados además de "Finalizado"?');
    console.log('5. 📊 Fuente: ¿Los 22M vienen de otra tabla o vista?');
    console.log('6. 🎯 Proyección: Si extrapolamos 5 meses a 12: ~14.8M (aún falta)');
    console.log('7. 🔍 Datos faltantes: ¿Hay servicios sin fecha_hora_cita?');
    
    return {
      totalServicios: serviciosEnRango.length,
      serviciosConCobro: serviciosCobroValido.length,
      serviciosUnicos: uniqueIds1.size,
      gmvTotalSinFiltros: gmvEstrategia1,
      gmvSoloFinalizados: gmvEstrategia3,
      serviciosFinalizados: serviciosFinalizadosConCobro.length,
      diferenciaSinFiltros: 22000000 - gmvEstrategia1,
      diferenciaFinalizados: 22000000 - gmvEstrategia3,
      cobroAnalysis,
      duplicados: duplicados.length,
      rangos,
      porcentajeCobertura,
      gmv2025Total,
      estadosCount,
      estadosGmv,
      serviciosSinCobro: serviciosSinCobro.length
    };
  }, [allServices, isLoading, error]);
  
  return {
    isLoading,
    error,
    diagnosticResult
  };
};
