import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RecursosPlaneacion, ClusterInactividad, IndisponibilidadTemporal, ZonaDemanda, ProveedorExternoMetrics } from '../types/planningResources';
import type { PeriodoReporte } from '../types';
import { subDays, startOfMonth, subMonths, startOfYear } from 'date-fns';

// Función de normalización de nombres para matching consistente
function normalizarNombre(nombre: string): string {
  if (!nombre) return '';
  return nombre
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s+/g, ' ')
    .trim();
}

const NOMBRES_EXCLUIDOS = ['NOAPLICA', 'PRUEBA', 'TEST', 'NA', 'N/A', 'SIN ASIGNAR', 'PENDIENTE'];

function calcularRangoFechas(periodo: PeriodoReporte): { fechaInicio: Date; hace30Dias: Date } {
  const now = new Date();
  switch (periodo) {
    case 'mes_actual':
      return {
        fechaInicio: startOfMonth(now),
        hace30Dias: startOfMonth(now),
      };
    case 'semana':
      return {
        fechaInicio: subDays(now, 7),
        hace30Dias: subDays(now, 7),
      };
    case 'mes':
      return {
        fechaInicio: subDays(now, 30),
        hace30Dias: subDays(now, 30),
      };
    case 'trimestre':
      return {
        fechaInicio: subMonths(now, 3),
        hace30Dias: subMonths(now, 3),
      };
    case 'year':
      return {
        fechaInicio: startOfYear(now),
        hace30Dias: startOfYear(now),
      };
    default:
      return {
        fechaInicio: startOfMonth(now),
        hace30Dias: startOfMonth(now),
      };
  }
}

export const usePlanningResourcesMetrics = (periodo: PeriodoReporte = 'mes_actual') => {
  return useQuery({
    queryKey: ['planning-resources-metrics', periodo],
    queryFn: async (): Promise<RecursosPlaneacion> => {
      const now = new Date();
      const { fechaInicio, hace30Dias } = calcularRangoFechas(periodo);
      const fechaInicioStr = fechaInicio.toISOString();
      const hace30DiasStr = hace30Dias.toISOString();
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
      
      // 5. Indisponibilidades temporales activas
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
      
      // === ARMADOS INTERNOS ===
      // 1. Pool registrado de armados internos
      const { data: armadosRegistrados, error: armadosError } = await supabase
        .from('armados_operativos')
        .select('id, nombre, disponibilidad, estado, tipo_armado')
        .eq('tipo_armado', 'interno')
        .eq('estado', 'activo');
      
      if (armadosError) throw armadosError;
      
      // Filtrar nombres de prueba/inválidos
      const armadosInternosLimpios = (armadosRegistrados || []).filter(a => {
        const nombreNorm = normalizarNombre(a.nombre || '');
        return nombreNorm.length > 2 && !NOMBRES_EXCLUIDOS.some(excl => nombreNorm.includes(excl));
      });
      
      const poolRegistradoArmados = armadosInternosLimpios.length;
      
      // 2. Armados operativos = con servicios en el período seleccionado (desde servicios_planificados)
      const { data: serviciosArmadosInternos, error: serviciosArmadosError } = await supabase
        .from('servicios_planificados')
        .select('armado_asignado, fecha_hora_cita')
        .gte('fecha_hora_cita', fechaInicioStr)
        .eq('tipo_asignacion_armado', 'interno')
        .not('armado_asignado', 'is', null);
      
      if (serviciosArmadosError) throw serviciosArmadosError;
      
      // Obtener nombres únicos de armados con servicios recientes
      const armadosActivosNombres = [...new Set(
        (serviciosArmadosInternos || [])
          .map(s => normalizarNombre(s.armado_asignado))
          .filter(n => n.length > 2 && !NOMBRES_EXCLUIDOS.some(excl => n.includes(excl)))
      )];
      
      const totalArmadosOperativos = armadosActivosNombres.length;
      
      // 3. Disponibles = armados registrados con estado 'disponible' (sin importar si tuvieron servicio)
      // Esta métrica indica cuántos están LISTOS para asignar hoy
      const armadosDisponibles = armadosInternosLimpios.filter(a => 
        a.disponibilidad === 'disponible'
      ).length;
      
      // 4. Clusters de inactividad usando servicios_planificados
      const armadosClusters = await calcularClustersArmadosInterno(armadosInternosLimpios);
      
      // 5. Indisponibilidades de armados
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
      
      // === PROVEEDORES EXTERNOS ===
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('proveedores_armados')
        .select('id, nombre_empresa, activo')
        .eq('activo', true);
      
      if (proveedoresError) throw proveedoresError;
      
      const proveedorIds = (proveedoresData || []).map(p => p.id);
      
      // Servicios de proveedores externos en el período seleccionado
      const { data: serviciosExternos, error: serviciosExtError } = await supabase
        .from('servicios_planificados')
        .select('proveedor_armado_id, armado_asignado, fecha_hora_cita')
        .eq('tipo_asignacion_armado', 'proveedor')
        .gte('fecha_hora_cita', fechaInicioStr)
        .in('proveedor_armado_id', proveedorIds);
      
      if (serviciosExtError) throw serviciosExtError;
      
      const proveedoresMetrics = calcularMetricasProveedores(
        proveedoresData || [],
        serviciosExternos || [],
        hace30DiasStr
      );
      
      // === TOP ZONAS DE DEMANDA ===
      const { data: serviciosRecientes, error: serviciosError } = await supabase
        .from('servicios_planificados')
        .select('origen')
        .gte('created_at', fechaInicioStr)
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
      
      const tasaActivacionArmados = poolRegistradoArmados > 0
        ? Math.round((totalArmadosOperativos / poolRegistradoArmados) * 1000) / 10
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
          total_activos: totalArmadosOperativos,
          pool_registrado: poolRegistradoArmados,
          disponibles: armadosDisponibles,
          con_servicio_30d: totalArmadosOperativos, // Ahora son los mismos (operativos = activos 30d)
          tasa_activacion: tasaActivacionArmados,
          clusters: armadosClusters,
          indisponibilidades: armadosIndisponibilidades,
        },
        proveedores_externos: proveedoresMetrics,
        top_zonas_demanda: topZonasDemanda,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

function calcularMetricasProveedores(
  proveedores: { id: string; nombre_empresa: string }[],
  servicios: { proveedor_armado_id: string; armado_asignado: string; fecha_hora_cita: string }[],
  hace30Dias: string
): ProveedorExternoMetrics[] {
  return proveedores.map(prov => {
    const serviciosProv = servicios.filter(s => s.proveedor_armado_id === prov.id);
    const servicios30d = serviciosProv.filter(s => 
      new Date(s.fecha_hora_cita) >= new Date(hace30Dias)
    );
    const diasUnicos = new Set(
      serviciosProv.map(s => new Date(s.fecha_hora_cita).toISOString().split('T')[0])
    ).size;
    const armadosUnicos = new Set(
      serviciosProv
        .map(s => normalizarNombre(s.armado_asignado))
        .filter(n => n.length > 2)
    ).size;
    
    return {
      nombre: prov.nombre_empresa,
      serviciosTotales: serviciosProv.length,
      servicios30d: servicios30d.length,
      diasActivos: diasUnicos,
      armadosActivos: armadosUnicos,
      activo: servicios30d.length > 0,
    };
  });
}

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

async function calcularClustersArmadosInterno(
  armadosRegistrados: { id: string; nombre?: string }[]
): Promise<ClusterInactividad> {
  if (armadosRegistrados.length === 0) {
    return getEmptyCluster();
  }
  
  // Obtener servicios de armados internos desde servicios_planificados
  const { data: servicios } = await supabase
    .from('servicios_planificados')
    .select('armado_asignado, fecha_hora_cita')
    .eq('tipo_asignacion_armado', 'interno')
    .not('armado_asignado', 'is', null)
    .order('fecha_hora_cita', { ascending: false });
  
  // Mapear último servicio por nombre normalizado
  const ultimoServicioPorNombre = new Map<string, Date>();
  for (const s of servicios || []) {
    const nombreNorm = normalizarNombre(s.armado_asignado);
    if (nombreNorm && !ultimoServicioPorNombre.has(nombreNorm)) {
      ultimoServicioPorNombre.set(nombreNorm, new Date(s.fecha_hora_cita));
    }
  }
  
  // Clasificar armados registrados por nombre normalizado
  const clusters: ClusterInactividad = getEmptyCluster();
  const now = new Date();
  
  for (const armado of armadosRegistrados) {
    const nombreNorm = normalizarNombre(armado.nombre || '');
    const ultimaFecha = ultimoServicioPorNombre.get(nombreNorm);
    
    if (!ultimaFecha) {
      clusters.nunca_asignado++;
      continue;
    }
    
    const diasDesdeUltimo = Math.floor(
      (now.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24)
    );
    
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
