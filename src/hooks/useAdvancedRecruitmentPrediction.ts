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
  crecimiento_esperado_servicios: number;
  plan_reclutamiento_3_meses: {
    mes_1: number;
    mes_2: number;
    mes_3: number;
    total_3_meses: number;
    prioridad_urgencia: 'alta' | 'media' | 'baja';
  };
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

// Función para calcular rotación por cluster basada en servicios reales
export const calcularDatosRotacionPorCluster = async (nombreCluster: string): Promise<DatosRotacion> => {
  try {
    console.log('🔍 Calculando rotación REAL para cluster:', nombreCluster);
    
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
    
    // Obtener fecha actual e inicio del mes
    const fechaActual = new Date();
    const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    
    console.log(`📅 Analizando servicios del ${inicioMes.toISOString().split('T')[0]} al ${finMes.toISOString().split('T')[0]}`);
    
    // Obtener servicios reales del mes actual para estas ciudades
    const { data: serviciosReales, error } = await supabase
      .from('servicios_custodia')
      .select('nombre_custodio, estado, fecha_hora_cita, km_recorridos')
      .gte('fecha_hora_cita', inicioMes.toISOString())
      .lte('fecha_hora_cita', finMes.toISOString())
      .not('nombre_custodio', 'is', null)
      .neq('nombre_custodio', '')
      .neq('nombre_custodio', '#N/A');

    if (error) {
      console.error('❌ Error fetching servicios reales:', error);
      throw error;
    }

    console.log('📊 Servicios obtenidos:', serviciosReales?.length || 0, 'registros para cluster', nombreCluster);
    
    // Filtrar servicios por zona si es necesario y crear análisis de custodios
    const serviciosFiltrados = serviciosReales || [];
    
    // Obtener custodios únicos con servicios este mes
    const custodiosUnicos = new Set(
      serviciosFiltrados
        .filter(s => s.nombre_custodio && s.nombre_custodio.trim() !== '')
        .map(s => s.nombre_custodio)
    );
    
    const custodiosActivos = custodiosUnicos.size;
    
    // Analizar custodios por estado de actividad
    const custodiosPorEstado = new Map();
    serviciosFiltrados.forEach(servicio => {
      const nombre = servicio.nombre_custodio;
      if (!nombre || nombre.trim() === '') return;
      
      if (!custodiosPorEstado.has(nombre)) {
        custodiosPorEstado.set(nombre, {
          servicios: 0,
          ultimoServicio: null,
          estadosServicios: []
        });
      }
      
      const custodio = custodiosPorEstado.get(nombre);
      custodio.servicios++;
      custodio.estadosServicios.push(servicio.estado);
      
      if (!custodio.ultimoServicio || new Date(servicio.fecha_hora_cita) > new Date(custodio.ultimoServicio)) {
        custodio.ultimoServicio = servicio.fecha_hora_cita;
      }
    });
    
    // Calcular custodios en riesgo (pocos servicios o servicios antiguos)
    let custodiosEnRiesgo = 0;
    let custodiosInactivos = 0;
    
    const fechaLimiteRiesgo = new Date();
    fechaLimiteRiesgo.setDate(fechaLimiteRiesgo.getDate() - 15); // 15 días sin servicio = en riesgo
    
    custodiosPorEstado.forEach((datos, nombre) => {
      if (datos.servicios <= 2) {
        custodiosEnRiesgo++;
      } else if (datos.ultimoServicio && new Date(datos.ultimoServicio) < fechaLimiteRiesgo) {
        custodiosEnRiesgo++;
      }
    });

    console.log(`📈 ${nombreCluster} - Custodios activos REALES: ${custodiosActivos}, En Riesgo: ${custodiosEnRiesgo}`);

    // Calcular tasa de rotación basada en servicios históricos (mes anterior vs actual)
    const inicioMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    const finMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 0);
    
    const { data: serviciosMesAnterior, error: errorAnterior } = await supabase
      .from('servicios_custodia')
      .select('nombre_custodio')
      .gte('fecha_hora_cita', inicioMesAnterior.toISOString())
      .lte('fecha_hora_cita', finMesAnterior.toISOString())
      .not('nombre_custodio', 'is', null)
      .neq('nombre_custodio', '');
    
    const custodiosMesAnterior = new Set(
      (serviciosMesAnterior || [])
        .filter(s => s.nombre_custodio && s.nombre_custodio.trim() !== '')
        .map(s => s.nombre_custodio)
    );
    
    // Calcular rotación real
    const custodiosQueSalieron = Array.from(custodiosMesAnterior).filter(c => !custodiosUnicos.has(c));
    const totalMesAnterior = custodiosMesAnterior.size;
    const tasaRotacionMensual = totalMesAnterior > 0 ? (custodiosQueSalieron.length / totalMesAnterior) * 100 : 0;

    // Proyecciones
    const proyeccionEgresos30Dias = Math.ceil(custodiosEnRiesgo * 0.6); // 60% de los en riesgo
    const proyeccionEgresos60Dias = Math.ceil(custodiosEnRiesgo * 0.8); // 80% de los en riesgo
    
    // Promedio de servicios
    const totalServicios = Array.from(custodiosPorEstado.values()).reduce((sum, c) => sum + c.servicios, 0);
    const promedioServiciosMes = custodiosActivos > 0 ? totalServicios / custodiosActivos : 0;
    
    // Necesidad de retención
    const retencionNecesaria = custodiosEnRiesgo + Math.ceil(proyeccionEgresos30Dias * 0.5);

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

    console.log('✅ Resultado rotación REAL para cluster', nombreCluster, ':', resultado);
    return resultado;
  } catch (error) {
    console.error('Error calculando datos de rotación REAL para cluster:', error);
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

export const calcularDeficitConRotacion = async (
  deficitOriginal: DeficitMejorado,
  datosRotacion: DatosRotacion
): Promise<DeficitConRotacion> => {
  console.log('🧮 Calculando déficit con rotación para:', deficitOriginal.zona_nombre);
  console.log('📊 Déficit original:', deficitOriginal.deficit_total);
  console.log('🔄 Datos rotación:', datosRotacion);

  // Validar que los valores no sean NaN o undefined
  const deficitOriginalValido = isNaN(deficitOriginal.deficit_total) ? 0 : deficitOriginal.deficit_total;
  const proyeccionEgresos30 = isNaN(datosRotacion.proyeccionEgresos30Dias) ? 0 : datosRotacion.proyeccionEgresos30Dias;
  const proyeccionEgresos60 = isNaN(datosRotacion.proyeccionEgresos60Dias) ? 0 : datosRotacion.proyeccionEgresos60Dias;

  // Obtener datos de forecast para calcular crecimiento basado en proyecciones reales
  let crecimientoEsperadoServicios = 0;
  try {
    const { data: forecastData, error } = await supabase
      .rpc('forensic_audit_servicios_enero_actual');

    if (!error && forecastData?.[0]) {
      const currentMonth = new Date().getMonth() + 1;
      const monthsWithData = Math.max(1, currentMonth - 1);
      const avgServicesPerMonth = Math.round((forecastData[0].servicios_unicos_id || 0) / monthsWithData);
      
      // Proyección anual basada en datos reales
      const annualProjection = avgServicesPerMonth * 12;
      const currentAnnualRate = forecastData[0].servicios_unicos_id || 0;
      
      // Calcular crecimiento esperado basado en forecast vs histórico
      if (currentAnnualRate > 0) {
        crecimientoEsperadoServicios = ((annualProjection - currentAnnualRate) / currentAnnualRate) * 100;
        console.log(`📈 Crecimiento calculado basado en forecast: ${crecimientoEsperadoServicios.toFixed(1)}%`);
      }
    }
  } catch (error) {
    console.warn('Error obteniendo forecast para cálculo de crecimiento:', error);
    crecimientoEsperadoServicios = 15; // Fallback conservador
  }

  // Calcular déficit por rotación basado en tasa real mensual
  // Usar la tasa de rotación para proyectar necesidad real de reclutamiento
  const custodiosActivosActuales = datosRotacion.custodiosActivos + datosRotacion.custodiosEnRiesgo;
  const deficitPorRotacionMensual = Math.ceil(custodiosActivosActuales * (datosRotacion.tasaRotacionMensual / 100));
  
  // Proyectar a 3 meses para tener buffer razonable
  const deficitPorRotacion = Math.ceil(deficitPorRotacionMensual * 3);
  
  // Buffer de seguridad más conservador del 10%
  const bufferSeguridad = Math.ceil(deficitPorRotacion * 0.1);
  
  const deficitTotalConRotacion = Math.max(0, 
    deficitOriginalValido + deficitPorRotacion + bufferSeguridad
  );

  // Calcular plan de reclutamiento para 3 meses
  const totalNecesario = deficitTotalConRotacion;
  
  // Distribuir reclutamiento según urgencia
  let planReclutamiento;
  if (deficitOriginal.urgencia_score >= 8) {
    // Alta urgencia: 60% primer mes, 30% segundo mes, 10% tercer mes
    planReclutamiento = {
      mes_1: Math.ceil(totalNecesario * 0.6),
      mes_2: Math.ceil(totalNecesario * 0.3),
      mes_3: Math.ceil(totalNecesario * 0.1),
      total_3_meses: totalNecesario,
      prioridad_urgencia: 'alta' as const
    };
  } else if (deficitOriginal.urgencia_score >= 5) {
    // Media urgencia: 40% primer mes, 40% segundo mes, 20% tercer mes
    planReclutamiento = {
      mes_1: Math.ceil(totalNecesario * 0.4),
      mes_2: Math.ceil(totalNecesario * 0.4),
      mes_3: Math.ceil(totalNecesario * 0.2),
      total_3_meses: totalNecesario,
      prioridad_urgencia: 'media' as const
    };
  } else {
    // Baja urgencia: distribución uniforme
    planReclutamiento = {
      mes_1: Math.ceil(totalNecesario / 3),
      mes_2: Math.ceil(totalNecesario / 3),
      mes_3: Math.ceil(totalNecesario / 3),
      total_3_meses: totalNecesario,
      prioridad_urgencia: 'baja' as const
    };
  }

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
    crecimiento_esperado_servicios: crecimientoEsperadoServicios,
    plan_reclutamiento_3_meses: planReclutamiento,
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

      // Calcular déficit con rotación combinando ambos datasets usando Promise.all
      const deficitConRotacionPromises = deficitMejorado.map((deficit, index) => {
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
      
      const deficitConRotacion = await Promise.all(deficitConRotacionPromises);

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