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

export interface PredictionData {
  zonasData: any[];
  metricasData: any[];
  alertasData: any[];
  candidatosData: any[];
  metricasOperacionales: MetricasOperacionales[];
  serviciosSegmentados: ServicioSegmentado[];
  deficitMejorado: DeficitMejorado[];
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
  const ratioRechazo = metricasOperacionales.ratio_rechazo_promedio;
  const horasDisponibles = metricasOperacionales.disponibilidad_custodios_horas;
  const eficiencia = metricasOperacionales.eficiencia_operacional;

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

  // Calcular déficits por tipo
  const demandaLocal = servicioLocal?.demanda_diaria_promedio || zona.servicios_dia * 0.6; // 60% locales
  const demandaForanea = servicioForaneo?.demanda_diaria_promedio || zona.servicios_dia * 0.3; // 30% foráneos
  const demandaExpress = servicioExpress?.demanda_diaria_promedio || zona.servicios_dia * 0.1; // 10% express

  const deficitLocal = demandaLocal - capacidadLocal.servicios_posibles_dia;
  const deficitForaneo = demandaForanea - capacidadForanea.servicios_posibles_dia;
  const deficitExpress = demandaExpress - capacidadExpress.servicios_posibles_dia;
  const deficitTotal = deficitLocal + deficitForaneo + deficitExpress;

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

export function useAdvancedRecruitmentPrediction() {
  const [loading, setLoading] = useState(true);
  const [predictionData, setPredictionData] = useState<PredictionData>({
    zonasData: [],
    metricasData: [],
    alertasData: [],
    candidatosData: [],
    metricasOperacionales: [],
    serviciosSegmentados: [],
    deficitMejorado: []
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

      setPredictionData({
        zonasData,
        metricasData,
        alertasData: alertasRes.data || [],
        candidatosData: candidatosRes.data || [],
        metricasOperacionales,
        serviciosSegmentados,
        deficitMejorado
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

  // KPIs calculados con algoritmo mejorado
  const kpis = useMemo(() => {
    const { deficitMejorado, alertasData, candidatosData } = predictionData;

    const totalDeficit = deficitMejorado.reduce((sum, zone) => sum + Math.max(0, zone.deficit_total), 0);
    const zonasPrioritarias = deficitMejorado.filter(zone => zone.urgencia_score >= 7).length;
    const alertasCriticas = alertasData.filter(a => a.prioridad >= 8).length;
    const alertasPreventivas = alertasData.filter(a => a.prioridad >= 5 && a.prioridad < 8).length;
    const candidatosActivos = candidatosData.filter(c => c.estado_proceso !== 'descartado').length;

    return {
      alertasCriticas,
      alertasPreventivas,
      oportunidades: candidatosActivos,
      totalDeficit: Math.ceil(totalDeficit),
      zonasPrioritarias,
      candidatosActivos
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