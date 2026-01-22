import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RecursosPlaneacion, ClusterInactividad, IndisponibilidadTemporal, ZonaDemanda } from '../types/planningResources';
import { subDays } from 'date-fns';

export const usePlanningResourcesMetrics = () => {
  return useQuery({
    queryKey: ['planning-resources-metrics'],
    queryFn: async (): Promise<RecursosPlaneacion> => {
      const now = new Date();
      const hace30Dias = subDays(now, 30).toISOString();
      const hace120Dias = subDays(now, 120).toISOString();
      
      // === CUSTODIOS ===
      // 1. Pool total registrado (para contexto)
      const { data: custodiosRegistrados, error: custodiosError } = await supabase
        .from('custodios_operativos')
        .select('id, disponibilidad, estado')
        .eq('estado', 'activo');
      
      if (custodiosError) throw custodiosError;
      
      const poolTotalRegistrado = custodiosRegistrados?.length || 0;
      
      // 2. Custodios OPERATIVOS = con al menos 1 servicio en últimos 120 días
      const { data: serviciosCustodios, error: serviciosOpError } = await supabase
        .from('servicios_planificados')
        .select('custodio_id')
        .gte('fecha_hora_cita', hace120Dias)
        .not('custodio_id', 'is', null);
      
      if (serviciosOpError) throw serviciosOpError;
      
      const custodiosOperativosIds = [...new Set((serviciosCustodios || []).map(s => s.custodio_id))];
      const totalCustodiosOperativos = custodiosOperativosIds.length;
      
      // 3. Disponibles = de los operativos, cuáles tienen disponibilidad='disponible'
      const custodiosOperativosSet = new Set(custodiosOperativosIds);
      const custodiosDisponibles = (custodiosRegistrados || [])
        .filter(c => custodiosOperativosSet.has(c.id) && c.disponibilidad === 'disponible').length;
      
      // 4. Clusters de inactividad de custodios operativos
      const custodiosParaClusters = (custodiosRegistrados || [])
        .filter(c => custodiosOperativosSet.has(c.id));
      const custodiosClusters = await calcularClustersCustodios(custodiosParaClusters);
      
      // 3. Indisponibilidades temporales activas
      const { data: indisponibilidades, error: indispError } = await supabase
        .from('custodio_indisponibilidades')
        .select('tipo_indisponibilidad')
        .eq('estado', 'activo');
      
      if (indispError) throw indispError;
      
      const indisponibilidadesPorTipo = (indisponibilidades || []).reduce((acc, item) => {
        const tipo = item.tipo_indisponibilidad;
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const indisponibilidadesTemporales: IndisponibilidadTemporal[] = Object.entries(indisponibilidadesPorTipo)
        .map(([tipo, cantidad]) => ({ tipo, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
      
      // === ARMADOS ===
      // 1. Total armados activos
      const { data: armadosActivos, error: armadosError } = await supabase
        .from('armados_operativos')
        .select('id, disponibilidad, estado')
        .eq('estado', 'activo');
      
      if (armadosError) throw armadosError;
      
      const totalArmadosActivos = armadosActivos?.length || 0;
      const armadosDisponibles = armadosActivos?.filter(a => a.disponibilidad === 'disponible').length || 0;
      
      // 2. Clusters de inactividad de armados
      const armadosClusters = await calcularClustersArmados(armadosActivos || []);
      
      // 3. Indisponibilidades de armados (si existe la tabla)
      const armadosIndisponibilidades: IndisponibilidadTemporal[] = [];
      try {
        const { data: armadosIndisp } = await supabase
          .from('armados_indisponibilidades')
          .select('tipo')
          .eq('activo', true);
        
        if (armadosIndisp) {
          const porTipo = armadosIndisp.reduce((acc, item) => {
            const tipo = item.tipo;
            acc[tipo] = (acc[tipo] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          Object.entries(porTipo).forEach(([tipo, cantidad]) => {
            armadosIndisponibilidades.push({ tipo, cantidad });
          });
        }
      } catch {
        // Tabla puede no existir, ignorar
      }
      
      // === TOP ZONAS DE DEMANDA ===
      const { data: serviciosRecientes, error: serviciosError } = await supabase
        .from('servicios_planificados')
        .select('origen')
        .gte('created_at', hace30Dias)
        .not('origen', 'is', null);
      
      if (serviciosError) throw serviciosError;
      
      const demandaPorZona = (serviciosRecientes || []).reduce((acc, s) => {
        const origen = s.origen?.trim();
        if (origen) {
          acc[origen] = (acc[origen] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const totalDemanda = Object.values(demandaPorZona).reduce((a, b) => a + b, 0);
      
      const topZonasDemanda: ZonaDemanda[] = Object.entries(demandaPorZona)
        .map(([origen, cantidad]) => ({
          origen,
          cantidad_servicios: cantidad,
          porcentaje: totalDemanda > 0 ? Math.round((cantidad / totalDemanda) * 1000) / 10 : 0
        }))
        .sort((a, b) => b.cantidad_servicios - a.cantidad_servicios)
        .slice(0, 5);
      
      // Calcular tasas de activación
      const custodiosActivos30d = custodiosClusters.activo_30d;
      const tasaActivacionCustodios = totalCustodiosOperativos > 0 
        ? Math.round((custodiosActivos30d / totalCustodiosOperativos) * 1000) / 10
        : 0;
      
      const armadosActivos30d = armadosClusters.activo_30d;
      const tasaActivacionArmados = totalArmadosActivos > 0
        ? Math.round((armadosActivos30d / totalArmadosActivos) * 1000) / 10
        : 0;
      
      return {
        custodios: {
          total_activos: totalCustodiosOperativos,
          pool_registrado: poolTotalRegistrado,
          disponibles: custodiosDisponibles,
          con_servicio_reciente: custodiosActivos30d,
          tasa_activacion: tasaActivacionCustodios,
          clusters: custodiosClusters,
          indisponibilidades: indisponibilidadesTemporales,
        },
        armados: {
          total_activos: totalArmadosActivos,
          disponibles: armadosDisponibles,
          con_servicio_30d: armadosActivos30d,
          tasa_activacion: tasaActivacionArmados,
          clusters: armadosClusters,
          indisponibilidades: armadosIndisponibilidades,
        },
        top_zonas_demanda: topZonasDemanda,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

async function calcularClustersCustodios(custodios: { id: string }[]): Promise<ClusterInactividad> {
  if (custodios.length === 0) {
    return getEmptyCluster();
  }
  
  const custodioIds = custodios.map(c => c.id);
  
  // Obtener último servicio por custodio
  const { data: servicios } = await supabase
    .from('servicios_planificados')
    .select('custodio_id, fecha_hora_cita')
    .in('custodio_id', custodioIds)
    .in('estado_planeacion', ['planificado', 'asignado', 'confirmado', 'completado', 'en_curso', 'finalizado'])
    .order('fecha_hora_cita', { ascending: false });
  
  // Mapear último servicio por custodio
  const ultimoServicioPorCustodio = new Map<string, Date>();
  for (const s of servicios || []) {
    if (s.custodio_id && !ultimoServicioPorCustodio.has(s.custodio_id)) {
      ultimoServicioPorCustodio.set(s.custodio_id, new Date(s.fecha_hora_cita));
    }
  }
  
  return clasificarEnClusters(custodioIds, ultimoServicioPorCustodio);
}

async function calcularClustersArmados(armados: { id: string }[]): Promise<ClusterInactividad> {
  if (armados.length === 0) {
    return getEmptyCluster();
  }
  
  const armadoIds = armados.map(a => a.id);
  
  // Obtener último servicio por armado desde asignacion_armados
  const { data: asignaciones } = await supabase
    .from('asignacion_armados')
    .select('armado_id, created_at')
    .in('armado_id', armadoIds)
    .in('estado_asignacion', ['asignado', 'confirmado', 'completado'])
    .order('created_at', { ascending: false });
  
  // Mapear último servicio por armado
  const ultimoServicioPorArmado = new Map<string, Date>();
  for (const a of asignaciones || []) {
    if (a.armado_id && !ultimoServicioPorArmado.has(a.armado_id)) {
      ultimoServicioPorArmado.set(a.armado_id, new Date(a.created_at));
    }
  }
  
  return clasificarEnClusters(armadoIds, ultimoServicioPorArmado);
}

function clasificarEnClusters(ids: string[], ultimoServicio: Map<string, Date>): ClusterInactividad {
  const now = new Date();
  const clusters: ClusterInactividad = getEmptyCluster();
  
  for (const id of ids) {
    const ultimaFecha = ultimoServicio.get(id);
    
    if (!ultimaFecha) {
      clusters.nunca_asignado++;
      continue;
    }
    
    const diasDesdeUltimo = Math.floor((now.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasDesdeUltimo <= 30) {
      clusters.activo_30d++;
    } else if (diasDesdeUltimo <= 60) {
      clusters.inactivo_30_60d++;
    } else if (diasDesdeUltimo <= 90) {
      clusters.inactivo_60_90d++;
    } else if (diasDesdeUltimo <= 120) {
      clusters.inactivo_90_120d++;
    } else {
      clusters.inactivo_mas_120d++;
    }
  }
  
  return clusters;
}

function getEmptyCluster(): ClusterInactividad {
  return {
    activo_30d: 0,
    inactivo_30_60d: 0,
    inactivo_60_90d: 0,
    inactivo_90_120d: 0,
    inactivo_mas_120d: 0,
    nunca_asignado: 0,
  };
}
