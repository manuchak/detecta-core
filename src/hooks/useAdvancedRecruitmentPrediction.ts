import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Interfaces mejoradas para Fase 1
export interface MetricasOperacionales {
  id: string;
  zona_id: string;
  ratio_rechazo_promedio: number;
  tiempo_respuesta_promedio_minutos: number;
  disponibilidad_custodios_horas: number;
  eficiencia_operacional: number;
  custodios_activos: number;
}

export interface ServicioSegmentado {
  id: string;
  zona_id: string;
  tipo_servicio: string; // Cambiado para coincidir con la DB
  duracion_promedio_horas: number;
  demanda_diaria_promedio: number;
  complejidad_score: number;
  margen_beneficio: number;
}

export interface CapacidadEfectiva {
  zona_id: string;
  local: {
    capacidad_nominal: number;
    capacidad_efectiva: number;
    servicios_posibles_dia: number;
  };
  foraneo: {
    capacidad_nominal: number;
    capacidad_efectiva: number;
    servicios_posibles_dia: number;
  };
  express: {
    capacidad_nominal: number;
    capacidad_efectiva: number;
    servicios_posibles_dia: number;
  };
}

export interface DeficitMejorado {
  zona_id: string;
  zona_nombre: string;
  deficit_local: number;
  deficit_foraneo: number;
  deficit_express: number;
  deficit_total: number;
  urgencia_score: number;
  capacidad_efectiva: CapacidadEfectiva;
  recomendaciones: string[];
}

export interface DatosRotacion {
  zona_id: string;
  custodiosActivos: number;
  custodiosEnRiesgo: number;
  custodiosInactivos: number;
  tasaRotacionMensual: number;
  proyeccionEgresos30Dias: number;
  proyeccionEgresos60Dias: number;
  promedioServiciosMes: number;
  retencionNecesaria: number;
}

export interface DeficitConRotacion extends DeficitMejorado {
  deficit_por_rotacion: number;
  deficit_total_con_rotacion: number;
  custodios_en_riesgo: number;
  necesidad_retencion: number;
}

export interface PredictionData {
  zonasData: any[];
  metricasData: any[];
  alertasData: any[];
  candidatosData: any[];
  metricasOperacionales: MetricasOperacionales[];
  serviciosSegmentados: ServicioSegmentado[];
  deficitMejorado: DeficitMejorado[];
  datosRotacion: DatosRotacion[];
  deficitConRotacion: DeficitConRotacion[];
}

// Algoritmos de cálculo mejorados
export const calcularCapacidadEfectiva = (
  custodiosActivos: number,
  ratioRechazo: number,
  horasDisponibles: number,
  duracionServicio: number,
  eficienciaOperacional: number = 0.85
): { capacidad_nominal: number; capacidad_efectiva: number; servicios_posibles_dia: number } => {
  const capacidadNominal = custodiosActivos;
  const capacidadEfectiva = custodiosActivos * (1 - ratioRechazo) * eficienciaOperacional;
  const serviciosPosiblesDia = capacidadEfectiva * (horasDisponibles / duracionServicio);
  
  return {
    capacidad_nominal: capacidadNominal,
    capacidad_efectiva: Math.floor(capacidadEfectiva * 100) / 100,
    servicios_posibles_dia: Math.floor(serviciosPosiblesDia * 100) / 100
  };
};

export const calcularDeficitMejorado = (
  zona: any,
  metricasOperacionales: MetricasOperacionales,
  serviciosSegmentados: ServicioSegmentado[]
): DeficitMejorado => {
  const custodiosActivos = metricasOperacionales.custodios_activos || 0;
  const ratioRechazo = isNaN(metricasOperacionales.ratio_rechazo_promedio) || metricasOperacionales.ratio_rechazo_promedio == null 
    ? 0.25 : metricasOperacionales.ratio_rechazo_promedio;
  const horasDisponibles = isNaN(metricasOperacionales.disponibilidad_custodios_horas) || metricasOperacionales.disponibilidad_custodios_horas == null 
    ? 16 : metricasOperacionales.disponibilidad_custodios_horas;
  const eficiencia = isNaN(metricasOperacionales.eficiencia_operacional) || metricasOperacionales.eficiencia_operacional == null 
    ? 0.85 : metricasOperacionales.eficiencia_operacional;

  console.log(`🔍 Calculando déficit para zona "${zona.nombre}":`, {
    custodiosActivos,
    ratioRechazo,
    horasDisponibles,
    eficiencia,
    serviciosDia: zona.servicios_dia
  });

  // Obtener servicios segmentados para esta zona
  const servicioLocal = serviciosSegmentados.find(s => s.zona_id === zona.id && s.tipo_servicio === 'local');
  const servicioForaneo = serviciosSegmentados.find(s => s.zona_id === zona.id && s.tipo_servicio === 'foraneo');
  const servicioExpress = serviciosSegmentados.find(s => s.zona_id === zona.id && s.tipo_servicio === 'express');

  // Calcular capacidades por tipo de servicio
  const capacidadLocal = calcularCapacidadEfectiva(
    custodiosActivos,
    ratioRechazo,
    horasDisponibles,
    servicioLocal?.duracion_promedio_horas || 6,
    eficiencia
  );

  const capacidadForanea = calcularCapacidadEfectiva(
    custodiosActivos,
    ratioRechazo,
    horasDisponibles,
    servicioForaneo?.duracion_promedio_horas || 14,
    eficiencia
  );

  const capacidadExpress = calcularCapacidadEfectiva(
    custodiosActivos,
    ratioRechazo,
    horasDisponibles,
    servicioExpress?.duracion_promedio_horas || 4,
    eficiencia
  );

  // Calcular déficits por tipo (validando que zona.servicios_dia no sea NaN)
  const serviciosDiaValidos = isNaN(zona.servicios_dia) || zona.servicios_dia == null ? 0 : zona.servicios_dia;
  
  const demandaLocal = servicioLocal?.demanda_diaria_promedio || serviciosDiaValidos * 0.6; // 60% locales
  const demandaForanea = servicioForaneo?.demanda_diaria_promedio || serviciosDiaValidos * 0.3; // 30% foráneos
  const demandaExpress = servicioExpress?.demanda_diaria_promedio || serviciosDiaValidos * 0.1; // 10% express

  console.log(`📈 Demandas calculadas para "${zona.nombre}":`, { demandaLocal, demandaForanea, demandaExpress });
  console.log(`⚙️ Capacidades calculadas para "${zona.nombre}":`, {
    local: capacidadLocal.servicios_posibles_dia,
    foranea: capacidadForanea.servicios_posibles_dia,
    express: capacidadExpress.servicios_posibles_dia
  });

  const deficitLocal = demandaLocal - capacidadLocal.servicios_posibles_dia;
  const deficitForaneo = demandaForanea - capacidadForanea.servicios_posibles_dia;
  const deficitExpress = demandaExpress - capacidadExpress.servicios_posibles_dia;
  const deficitTotal = deficitLocal + deficitForaneo + deficitExpress;

  console.log(`📉 Déficits calculados para "${zona.nombre}":`, {
    deficitLocal, deficitForaneo, deficitExpress, deficitTotal
  });

  // Calcular score de urgencia mejorado
  const urgenciaScore = calcularUrgenciaMejorada(deficitTotal, zona.servicios_dia, custodiosActivos);

  // Generar recomendaciones inteligentes
  const recomendaciones = generarRecomendacionesInteligentes(
    deficitLocal,
    deficitForaneo,
    deficitExpress,
    capacidadLocal,
    capacidadForanea,
    capacidadExpress
  );

  return {
    zona_id: zona.id,
    zona_nombre: zona.nombre,
    deficit_local: Math.ceil(deficitLocal),
    deficit_foraneo: Math.ceil(deficitForaneo),
    deficit_express: Math.ceil(deficitExpress),
    deficit_total: Math.ceil(deficitTotal),
    urgencia_score: urgenciaScore,
    capacidad_efectiva: {
      zona_id: zona.id,
      local: capacidadLocal,
      foraneo: capacidadForanea,
      express: capacidadExpress
    },
    recomendaciones
  };
};

const calcularUrgenciaMejorada = (deficitTotal: number, serviciosDia: number, custodiosActivos: number): number => {
  if (serviciosDia === 0 || custodiosActivos === 0) return 10;
  
  // Factor de déficit (0-40 puntos)
  const factorDeficit = Math.min((deficitTotal / serviciosDia) * 40, 40);
  
  // Factor de capacidad crítica (0-30 puntos)
  const factorCapacidad = custodiosActivos < 2 ? 30 : Math.max(0, 30 - (custodiosActivos * 5));
  
  // Factor de demanda (0-30 puntos)
  const factorDemanda = Math.min((serviciosDia / 10) * 30, 30);
  
  const scoreTotal = factorDeficit + factorCapacidad + factorDemanda;
  return Math.min(Math.max(Math.round(scoreTotal), 1), 10);
};

const generarRecomendacionesInteligentes = (
  deficitLocal: number,
  deficitForaneo: number,
  deficitExpress: number,
  capacidadLocal: any,
  capacidadForanea: any,
  capacidadExpress: any
): string[] => {
  const recomendaciones: string[] = [];

  // Recomendaciones específicas por tipo de servicio
  if (deficitLocal > 0) {
    const custodiosNecesarios = Math.ceil(deficitLocal / capacidadLocal.servicios_posibles_dia * capacidadLocal.capacidad_nominal);
    recomendaciones.push(`Contratar ${custodiosNecesarios} custodios para servicios locales`);
  }

  if (deficitForaneo > 0) {
    const custodiosNecesarios = Math.ceil(deficitForaneo / capacidadForanea.servicios_posibles_dia * capacidadForanea.capacidad_nominal);
    recomendaciones.push(`Contratar ${custodiosNecesarios} custodios especializados en servicios foráneos`);
  }

  if (deficitExpress > 0) {
    const custodiosNecesarios = Math.ceil(deficitExpress / capacidadExpress.servicios_posibles_dia * capacidadExpress.capacidad_nominal);
    recomendaciones.push(`Contratar ${custodiosNecesarios} custodios para servicios express`);
  }

  // Recomendaciones operacionales
  if (deficitLocal > 0 || deficitForaneo > 0 || deficitExpress > 0) {
    recomendaciones.push("Implementar bonos por aceptación de servicios para reducir el ratio de rechazo");
    recomendaciones.push("Optimizar rutas para aumentar la eficiencia operacional");
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push("Capacidad suficiente - mantener nivel actual de custodios");
  }

  return recomendaciones;
};

// Función para calcular rotación por cluster (corregida)
export const calcularDatosRotacionPorCluster = async (nombreCluster: string): Promise<DatosRotacion> => {
  try {
    console.log('🔍 Calculando rotación para cluster:', nombreCluster);
    
    // Mapear cluster a ciudades correspondientes
    let ciudadesDelCluster: string[] = [];
    
    const nombreClusterLower = nombreCluster.toLowerCase();
    if (nombreClusterLower.includes('centro') && nombreClusterLower.includes('méxico')) {
      ciudadesDelCluster = ['CDMX', 'Nacional']; // Centro de México incluye CDMX y zona metropolitana
    } else if (nombreClusterLower.includes('occidente')) {
      ciudadesDelCluster = ['Guadalajara']; // Occidente incluye Guadalajara
    } else if (nombreClusterLower.includes('norte')) {
      ciudadesDelCluster = ['Monterrey']; // Norte incluye Monterrey
    } else if (nombreClusterLower.includes('bajío')) {
      ciudadesDelCluster = ['Puebla']; // Bajío incluye Puebla
    } else if (nombreClusterLower.includes('golfo')) {
      ciudadesDelCluster = ['Tijuana']; // Golfo incluye Tijuana
    } else {
      ciudadesDelCluster = ['Nacional']; // Otros clusters usan datos nacionales
    }
    
    console.log(`🏙️ Cluster "${nombreCluster}" incluye ciudades:`, ciudadesDelCluster);
    
    // Obtener datos de todas las ciudades del cluster
    const { data: trackingData, error } = await supabase
      .from('custodios_rotacion_tracking')
      .select('*')
      .in('zona_operacion', ciudadesDelCluster);

    if (error) {
      console.error('❌ Error fetching rotación data:', error);
      throw error;
    }

    console.log('📊 Datos de rotación obtenidos:', trackingData?.length || 0, 'registros para cluster', nombreCluster);
    
    // Agregar datos de todas las ciudades del cluster
    const datosAgregados = trackingData || [];
    const custodiosActivos = datosAgregados.filter(c => c.estado_actividad === 'activo').length;
    const custodiosEnRiesgo = datosAgregados.filter(c => c.estado_actividad === 'en_riesgo').length;
    const custodiosInactivos = datosAgregados.filter(c => c.estado_actividad === 'inactivo').length;

    console.log(`📈 ${nombreCluster} - Activos: ${custodiosActivos}, En Riesgo: ${custodiosEnRiesgo}, Inactivos: ${custodiosInactivos}`);

    // Calcular tasa de rotación mensual correctamente
    // Mi cálculo anterior era de retención, la rotación es 100% - retención
    const totalCustodios = custodiosActivos + custodiosEnRiesgo + custodiosInactivos;
    const tasaRetencion = totalCustodios > 0 ? ((custodiosActivos + custodiosEnRiesgo) / totalCustodios) * 100 : 100;
    const tasaRotacionMensual = 100 - tasaRetencion; // Rotación = 100% - Retención

    // Proyección de egresos
    const proyeccionEgresos30Dias = datosAgregados.filter(c => 
      c.estado_actividad === 'en_riesgo' && (c.dias_sin_servicio || 0) >= 45
    ).length;
    
    const proyeccionEgresos60Dias = datosAgregados.filter(c => 
      c.estado_actividad === 'en_riesgo' || 
      (c.estado_actividad === 'activo' && (c.dias_sin_servicio || 0) >= 15)
    ).length;

    // Promedio de servicios mensuales
    const totalPromedioServicios = datosAgregados.reduce((sum, c) => sum + (c.promedio_servicios_mes || 0), 0);
    const promedioServiciosMes = datosAgregados.length > 0 ? totalPromedioServicios / datosAgregados.length : 0;

    // Necesidad de retención
    const retencionNecesaria = custodiosEnRiesgo + Math.ceil(proyeccionEgresos30Dias * 0.7);

    const resultado = {
      zona_id: nombreCluster,
      custodiosActivos,
      custodiosEnRiesgo,
      custodiosInactivos,
      tasaRotacionMensual: Math.round(tasaRotacionMensual * 100) / 100,
      proyeccionEgresos30Dias,
      proyeccionEgresos60Dias,
      promedioServiciosMes: Math.round(promedioServiciosMes * 100) / 100,
      retencionNecesaria
    };

    console.log('✅ Resultado rotación para cluster', nombreCluster, ':', resultado);
    return resultado;
  } catch (error) {
    console.error('Error calculando datos de rotación para cluster:', error);
    return {
      zona_id: nombreCluster,
      custodiosActivos: 0,
      custodiosEnRiesgo: 0,
      custodiosInactivos: 0,
      tasaRotacionMensual: 0,
      proyeccionEgresos30Dias: 0,
      proyeccionEgresos60Dias: 0,
      promedioServiciosMes: 0,
      retencionNecesaria: 0
    };
  }
};

export const calcularDeficitConRotacion = (
  deficitOriginal: DeficitMejorado,
  datosRotacion: DatosRotacion
): DeficitConRotacion => {
  console.log('🧮 Calculando déficit con rotación para:', deficitOriginal.zona_nombre);
  console.log('📊 Déficit original:', deficitOriginal.deficit_total);
  console.log('🔄 Datos rotación:', datosRotacion);

  // Validar que los valores no sean NaN o undefined
  const deficitOriginalValido = isNaN(deficitOriginal.deficit_total) ? 0 : deficitOriginal.deficit_total;
  const proyeccionEgresos30 = isNaN(datosRotacion.proyeccionEgresos30Dias) ? 0 : datosRotacion.proyeccionEgresos30Dias;
  const proyeccionEgresos60 = isNaN(datosRotacion.proyeccionEgresos60Dias) ? 0 : datosRotacion.proyeccionEgresos60Dias;

  // Calcular déficit adicional por rotación proyectada
  const deficitPorRotacion = Math.ceil(
    (proyeccionEgresos30 * 1.2) + // Factor de seguridad del 20%
    (proyeccionEgresos60 * 0.3)    // 30% de probabilidad adicional
  );

  // Buffer de seguridad del 15% para compensar variabilidad
  const bufferSeguridad = Math.ceil(deficitOriginalValido * 0.15);
  
  const deficitTotalConRotacion = Math.max(0, 
    deficitOriginalValido + deficitPorRotacion + bufferSeguridad
  );

  console.log(`✅ Resultado para ${deficitOriginal.zona_nombre}:`, {
    deficitOriginal: deficitOriginalValido,
    deficitPorRotacion,
    bufferSeguridad,
    deficitTotalConRotacion
  });

  // Generar recomendaciones mejoradas incluyendo retención
  const recomendacionesConRotacion = [
    ...deficitOriginal.recomendaciones,
    ...(datosRotacion.custodiosEnRiesgo > 0 ? [
      `Implementar programa de retención para ${datosRotacion.custodiosEnRiesgo} custodios en riesgo`,
      'Activar bonos de permanencia y asignación preferencial de servicios'
    ] : []),
    ...(deficitPorRotacion > 0 ? [
      `Reclutar ${deficitPorRotacion} custodios adicionales para compensar rotación proyectada`,
      'Acelerar proceso de onboarding para reducir tiempo de incorporación'
    ] : [])
  ];

  return {
    ...deficitOriginal,
    deficit_por_rotacion: deficitPorRotacion,
    deficit_total_con_rotacion: deficitTotalConRotacion,
    custodios_en_riesgo: datosRotacion.custodiosEnRiesgo,
    necesidad_retencion: datosRotacion.retencionNecesaria,
    recomendaciones: recomendacionesConRotacion
  };
};

export function useAdvancedRecruitmentPrediction() {
  const [loading, setLoading] = useState(true);
  const [predictionData, setPredictionData] = useState<PredictionData>({
    zonasData: [],
    metricasData: [],
    alertasData: [],
    candidatosData: [],
    metricasOperacionales: [],
    serviciosSegmentados: [],
    deficitMejorado: [],
    datosRotacion: [],
    deficitConRotacion: []
  });

  const fetchMetricasOperacionales = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('metricas_operacionales_zona')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching métricas operacionales:', error);
      return [];
    }
  }, []);

  const fetchServiciosSegmentados = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('servicios_segmentados')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching servicios segmentados:', error);
      return [];
    }
  }, []);

  const fetchAllPredictionData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch datos existentes
      const [zonasRes, metricasRes, alertasRes, candidatosRes] = await Promise.all([
        supabase.from('zonas_operacion_nacional').select('*'),
        supabase.from('metricas_demanda_zona').select('*'),
        supabase.from('alertas_sistema_nacional').select('*'),
        supabase.from('candidatos_custodios').select('*')
      ]);

      // Fetch nuevos datos
      const [metricasOperacionales, serviciosSegmentados] = await Promise.all([
        fetchMetricasOperacionales(),
        fetchServiciosSegmentados()
      ]);

      const zonasData = zonasRes.data || [];
      const metricasData = metricasRes.data || [];

      // Calcular déficit mejorado para cada zona
      const deficitMejorado = zonasData.map(zona => {
        const metricasOp = metricasOperacionales.find(m => m.zona_id === zona.id) || {
          id: '',
          zona_id: zona.id,
          ratio_rechazo_promedio: 0.25,
          tiempo_respuesta_promedio_minutos: 30,
          disponibilidad_custodios_horas: 16,
          eficiencia_operacional: 0.85,
          custodios_activos: 0
        };

        return calcularDeficitMejorado(zona, metricasOp, serviciosSegmentados);
      });

      // Calcular datos de rotación para cada cluster
      console.log('🏗️ Calculando rotación para clusters:', zonasData.map(z => z.nombre));
      const datosRotacionPromises = zonasData.map(zona => {
        console.log(`🔗 Calculando rotación para cluster: "${zona.nombre}"`);
        return calcularDatosRotacionPorCluster(zona.nombre);
      });
      
      const datosRotacion = await Promise.all(datosRotacionPromises);
      console.log('📈 Datos de rotación calculados:', datosRotacion);

      // Calcular déficit con rotación combinando ambos datasets
      const deficitConRotacion = deficitMejorado.map((deficit, index) => {
        const rotacionData = datosRotacion[index] || {
          zona_id: deficit.zona_nombre,
          custodiosActivos: 0,
          custodiosEnRiesgo: 0,
          custodiosInactivos: 0,
          tasaRotacionMensual: 0,
          proyeccionEgresos30Dias: 0,
          proyeccionEgresos60Dias: 0,
          promedioServiciosMes: 0,
          retencionNecesaria: 0
        };
        
        console.log(`🔄 Combinando déficit "${deficit.zona_nombre}" con rotación:`, rotacionData);
        return calcularDeficitConRotacion(deficit, rotacionData);
      });

      console.log('✅ Déficit con rotación final:', deficitConRotacion);

      setPredictionData({
        zonasData,
        metricasData,
        alertasData: alertasRes.data || [],
        candidatosData: candidatosRes.data || [],
        metricasOperacionales,
        serviciosSegmentados,
        deficitMejorado,
        datosRotacion,
        deficitConRotacion
      });
    } catch (error) {
      console.error('Error fetching prediction data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchMetricasOperacionales, fetchServiciosSegmentados]);

  useEffect(() => {
    fetchAllPredictionData();
  }, [fetchAllPredictionData]);

  // KPIs calculados con algoritmo mejorado incluyendo rotación
  const kpis = useMemo(() => {
    const { deficitConRotacion, deficitMejorado, alertasData, candidatosData, datosRotacion } = predictionData;

    // Usar déficit con rotación si está disponible, sino el tradicional
    const deficitData = deficitConRotacion.length > 0 ? deficitConRotacion : deficitMejorado;
    
    const totalDeficit = deficitData.reduce((sum, zone) => {
      const deficit = 'deficit_total_con_rotacion' in zone 
        ? (zone as DeficitConRotacion).deficit_total_con_rotacion 
        : zone.deficit_total;
      return sum + Math.max(0, deficit);
    }, 0);
    
    const zonasPrioritarias = deficitData.filter(zone => zone.urgencia_score >= 7).length;
    const alertasCriticas = alertasData.filter(a => a.prioridad >= 8).length;
    const alertasPreventivas = alertasData.filter(a => a.prioridad >= 5 && a.prioridad < 8).length;
    const candidatosActivos = candidatosData.filter(c => c.estado_proceso !== 'descartado').length;

    // Nuevas métricas de rotación
    const totalCustodiosEnRiesgo = datosRotacion.reduce((sum, zona) => sum + zona.custodiosEnRiesgo, 0);
    const totalRotacionProyectada = datosRotacion.reduce((sum, zona) => sum + zona.proyeccionEgresos30Dias, 0);
    const promedioTasaRotacion = datosRotacion.length > 0 
      ? datosRotacion.reduce((sum, zona) => sum + zona.tasaRotacionMensual, 0) / datosRotacion.length 
      : 0;

    return {
      alertasCriticas,
      alertasPreventivas,
      oportunidades: candidatosActivos,
      totalDeficit: Math.ceil(totalDeficit),
      zonasPrioritarias,
      candidatosActivos,
      // Nuevos KPIs de rotación
      custodiosEnRiesgo: totalCustodiosEnRiesgo,
      rotacionProyectada: totalRotacionProyectada,
      tasaRotacionPromedio: Math.round(promedioTasaRotacion * 100) / 100
    };
  }, [predictionData]);

  return {
    ...predictionData,
    kpis,
    loading,
    refreshData: fetchAllPredictionData,
    // Funciones de utilidad para Fase 2
    calcularCapacidadEfectiva,
    calcularDeficitMejorado
  };
}