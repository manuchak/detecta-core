import React from 'react';
import { NationalMap } from './NationalMap';
import type { ZonaOperacionReal, MetricaDemandaReal, AlertaSistemaReal, CandidatoReal } from '@/hooks/useRealNationalRecruitment';
import type { ZonaOperacion, MetricaDemandaZona, AlertaSistema, CandidatoCustodio } from '@/hooks/useNationalRecruitment';
import type { MultiMonthPrediction } from '@/hooks/useMultiMonthRecruitmentPrediction';

interface RealDataMapProps {
  multiMonthData?: MultiMonthPrediction | null;
  zonasReales: ZonaOperacionReal[];
  metricasReales: MetricaDemandaReal[];
  alertasReales: AlertaSistemaReal[];
  candidatosReales: CandidatoReal[];
}

export const RealDataMap: React.FC<RealDataMapProps> = ({
  multiMonthData,
  zonasReales,
  metricasReales,
  alertasReales,
  candidatosReales
}) => {
  // Función para mapear nombres de clusters a datos de mapa
  const getClusterMapData = (clusterName: string) => {
    const targetMonthClusters = multiMonthData?.targetMonth?.clustersNeeds || [];
    const cluster = targetMonthClusters.find(c => 
      c.clusterName.toLowerCase() === clusterName.toLowerCase()
    );
    
    return {
      finalNeed: cluster?.finalNeed || 0,
      urgencyLevel: cluster?.urgencyLevel || 'estable',
      currentCustodians: cluster?.currentCustodians || 0,
      projectedServices: cluster?.projectedServices || 0
    };
  };

  // Adaptar datos reales al formato esperado por NationalMap usando multiMonthData
  const zonasAdaptadas: ZonaOperacion[] = zonasReales.map(zona => {
    const clusterData = getClusterMapData(zona.nombre);
    
    return {
      id: zona.id,
      nombre: zona.nombre,
      estados_incluidos: zona.estados_incluidos,
      coordenadas_centro: zona.coordenadas_centro,
      radio_cobertura_km: 100,
      prioridad_reclutamiento: clusterData.urgencyLevel === 'critico' ? 10 : 
                               clusterData.urgencyLevel === 'urgente' ? 7 :
                               clusterData.urgencyLevel === 'estable' ? 3 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  const metricasAdaptadas: MetricaDemandaZona[] = zonasReales.map(zona => {
    const clusterData = getClusterMapData(zona.nombre);
    const metricaReal = metricasReales.find(m => m.zona_id === zona.id);
    
    return {
      id: zona.id,
      zona_id: zona.id,
      periodo_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      periodo_fin: new Date().toISOString(),
      servicios_promedio_dia: clusterData.projectedServices,
      custodios_activos: clusterData.currentCustodians,
      custodios_requeridos: clusterData.currentCustodians + clusterData.finalNeed,
      deficit_custodios: clusterData.finalNeed, // Este es el número que debe aparecer en el mapa
      score_urgencia: clusterData.urgencyLevel === 'critico' ? 10 : 
                     clusterData.urgencyLevel === 'urgente' ? 7 :
                     clusterData.urgencyLevel === 'estable' ? 3 : 1,
      gmv_promedio: metricaReal?.gmv_promedio || 0,
      ingresos_esperados_custodio: 1830, // Usar el costo base actualizado
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      zona: zonasAdaptadas.find(z => z.id === zona.id)
    };
  });

  const alertasAdaptadas: AlertaSistema[] = alertasReales.map(alerta => ({
    id: alerta.id,
    tipo_alerta: alerta.tipo_alerta,
    categoria: alerta.categoria,
    zona_id: alerta.zona_id,
    titulo: alerta.titulo,
    descripcion: alerta.descripcion,
    datos_contexto: alerta.datos_contexto,
    prioridad: alerta.prioridad,
    estado: alerta.estado,
    asignado_a: null,
    fecha_resolucion: null,
    acciones_sugeridas: alerta.acciones_sugeridas,
    created_at: alerta.created_at,
    updated_at: new Date().toISOString(),
    zona: alerta.zona_id ? zonasAdaptadas.find(z => z.id === alerta.zona_id) : undefined
  }));

  const candidatosAdaptados: CandidatoCustodio[] = candidatosReales.map(candidato => ({
    id: candidato.id,
    nombre: candidato.nombre,
    telefono: candidato.telefono,
    email: candidato.email,
    ubicacion_residencia: candidato.ubicacion_residencia,
    zona_preferida_id: null,
    fuente_reclutamiento: candidato.fuente_reclutamiento,
    estado_proceso: candidato.estado_proceso,
    fecha_contacto: null,
    calificacion_inicial: candidato.calificacion_inicial,
    experiencia_seguridad: candidato.experiencia_seguridad,
    vehiculo_propio: candidato.vehiculo_propio,
    disponibilidad_horarios: { lunes_viernes: true, sabados: true, domingos: false },
    inversion_inicial_disponible: 0,
    expectativa_ingresos: 30000,
    notas_recruiter: null,
    created_at: candidato.fecha_creacion,
    updated_at: new Date().toISOString()
  }));

  return (
    <NationalMap
      zonas={zonasAdaptadas}
      metricas={metricasAdaptadas}
      alertas={alertasAdaptadas}
      candidatos={candidatosAdaptados}
    />
  );
};