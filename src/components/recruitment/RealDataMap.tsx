import React from 'react';
import { NationalMap } from './NationalMap';
import type { ZonaOperacionReal, MetricaDemandaReal, AlertaSistemaReal, CandidatoReal } from '@/hooks/useRealNationalRecruitment';
import type { ZonaOperacion, MetricaDemandaZona, AlertaSistema, CandidatoCustodio } from '@/hooks/useNationalRecruitment';

interface RealDataMapProps {
  zonasReales: ZonaOperacionReal[];
  metricasReales: MetricaDemandaReal[];
  alertasReales: AlertaSistemaReal[];
  candidatosReales: CandidatoReal[];
}

export const RealDataMap: React.FC<RealDataMapProps> = ({
  zonasReales,
  metricasReales,
  alertasReales,
  candidatosReales
}) => {
  // Adaptar datos reales al formato esperado por NationalMap
  const zonasAdaptadas: ZonaOperacion[] = zonasReales.map(zona => ({
    id: zona.id,
    nombre: zona.nombre,
    estados_incluidos: zona.estados_incluidos,
    coordenadas_centro: zona.coordenadas_centro,
    radio_cobertura_km: 100, // Valor por defecto
    prioridad_reclutamiento: zona.score_urgencia,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const metricasAdaptadas: MetricaDemandaZona[] = metricasReales.map(metrica => ({
    id: metrica.zona_id,
    zona_id: metrica.zona_id,
    periodo_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    periodo_fin: new Date().toISOString(),
    servicios_promedio_dia: metrica.servicios_promedio_dia,
    custodios_activos: metrica.custodios_activos,
    custodios_requeridos: metrica.custodios_requeridos,
    deficit_custodios: metrica.deficit_custodios,
    score_urgencia: metrica.score_urgencia,
    gmv_promedio: metrica.gmv_promedio,
    ingresos_esperados_custodio: metrica.costo_adquisicion_promedio,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    zona: zonasAdaptadas.find(z => z.id === metrica.zona_id)
  }));

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