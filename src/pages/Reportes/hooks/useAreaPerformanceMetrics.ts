import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaPerformanceMetrics, PeriodoReporte } from '../types';
import { subDays, subMonths, format, differenceInMinutes } from 'date-fns';

export const useAreaPerformanceMetrics = (periodo: PeriodoReporte = 'mes') => {
  return useQuery({
    queryKey: ['area-performance', periodo],
    queryFn: async (): Promise<AreaPerformanceMetrics> => {
      const now = new Date();
      let fechaInicio: Date;
      let fechaInicioPeriodoAnterior: Date;
      
      switch (periodo) {
        case 'semana':
          fechaInicio = subDays(now, 7);
          fechaInicioPeriodoAnterior = subDays(now, 14);
          break;
        case 'mes':
          fechaInicio = subMonths(now, 1);
          fechaInicioPeriodoAnterior = subMonths(now, 2);
          break;
        case 'trimestre':
          fechaInicio = subMonths(now, 3);
          fechaInicioPeriodoAnterior = subMonths(now, 6);
          break;
        case 'year':
          fechaInicio = subMonths(now, 12);
          fechaInicioPeriodoAnterior = subMonths(now, 24);
          break;
        default:
          fechaInicio = subMonths(now, 1);
          fechaInicioPeriodoAnterior = subMonths(now, 2);
      }
      
      const fechaInicioISO = fechaInicio.toISOString();
      const fechaInicioPeriodoAnteriorISO = fechaInicioPeriodoAnterior.toISOString();
      
      // Consultar servicios_planificados (tabla correcta con datos reales)
      const { data: servicios, error: serviciosError } = await supabase
        .from('servicios_planificados')
        .select('*')
        .gte('created_at', fechaInicioISO);
      
      if (serviciosError) throw serviciosError;
      
      // Servicios del período anterior para calcular tendencia
      const { data: serviciosPeriodoAnterior, error: anteriorError } = await supabase
        .from('servicios_planificados')
        .select('id')
        .gte('created_at', fechaInicioPeriodoAnteriorISO)
        .lt('created_at', fechaInicioISO);
      
      if (anteriorError) throw anteriorError;
      
      // Custodios activos reales
      const { data: custodiosActivos, error: custodiosError } = await supabase
        .from('custodios_operativos')
        .select('id')
        .eq('estado', 'activo');
      
      if (custodiosError) throw custodiosError;
      
      // Armados distintos en el período
      const armadosDistintos = new Set(
        servicios?.filter(s => s.armado_id).map(s => s.armado_id)
      );
      
      const totalServicios = servicios?.length || 0;
      const totalServiciosPeriodoAnterior = serviciosPeriodoAnterior?.length || 0;
      const diasEnPeriodo = Math.ceil((now.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
      
      // Distribución por estado
      const serviciosPorEstado = servicios?.reduce((acc, s) => {
        const estado = s.estado_planeacion || 'sin_estado';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      // Distribución por tipo (con/sin armado)
      const serviciosPorTipo = servicios?.reduce((acc, s) => {
        const tipo = s.requiere_armado ? 'con_armado' : 'sin_armado';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      // Tasa de aceptación: servicios con custodio asignado / total
      const serviciosConCustodio = servicios?.filter(s => s.custodio_asignado).length || 0;
      const tasaAceptacion = totalServicios > 0 
        ? (serviciosConCustodio / totalServicios) * 100 
        : 0;
      
      // Tiempo medio de asignación: diferencia entre fecha_asignacion y created_at
      const serviciosConAsignacion = servicios?.filter(s => 
        s.fecha_asignacion && s.created_at
      ) || [];
      
      let tiempoMedioAsignacion = 0;
      if (serviciosConAsignacion.length > 0) {
        const totalMinutos = serviciosConAsignacion.reduce((acc, s) => {
          const creado = new Date(s.created_at);
          const asignado = new Date(s.fecha_asignacion);
          return acc + differenceInMinutes(asignado, creado);
        }, 0);
        tiempoMedioAsignacion = Math.round(totalMinutos / serviciosConAsignacion.length);
      }
      
      // Servicios completados (estados finales)
      const serviciosCompletados = servicios?.filter(s => 
        s.estado_planeacion === 'completado' || s.estado_planeacion === 'finalizado'
      ).length || 0;
      const serviciosCompletadosATiempo = totalServicios > 0 
        ? (serviciosCompletados / totalServicios) * 100 
        : 0;
      
      // Servicios con incidencias (cancelados o con problemas)
      const serviciosConIncidencias = servicios?.filter(s => 
        s.estado_planeacion === 'cancelado'
      ).length || 0;
      
      // Tasa de replanificación (servicios modificados después de creación)
      const serviciosReplanificados = servicios?.filter(s => 
        s.updated_at && s.created_at && s.updated_at !== s.created_at
      ).length || 0;
      const tasaReplanificacion = totalServicios > 0
        ? (serviciosReplanificados / totalServicios) * 100
        : 0;
      
      // Cumplimiento de armados: servicios que requieren armado Y tienen armado asignado
      const serviciosRequierenArmado = servicios?.filter(s => s.requiere_armado).length || 0;
      const serviciosConArmadoAsignado = servicios?.filter(s => 
        s.requiere_armado && s.armado_id
      ).length || 0;
      const cumplimientoArmados = serviciosRequierenArmado > 0
        ? (serviciosConArmadoAsignado / serviciosRequierenArmado) * 100
        : 100;
      
      // Tendencia mensual: comparación con período anterior
      const tendenciaMensual = totalServiciosPeriodoAnterior > 0
        ? ((totalServicios - totalServiciosPeriodoAnterior) / totalServiciosPeriodoAnterior) * 100
        : 0;
      
      // Utilización de recursos: servicios asignados / custodios disponibles
      const custodiosCount = custodiosActivos?.length || 1;
      const utilizacionRecursos = Math.min(
        (serviciosConCustodio / custodiosCount) * 100,
        100
      );
      
      // Histórico de servicios (últimos 30 días)
      const historicoServicios = generarHistoricoServicios(servicios || [], 30);
      
      return {
        totalServiciosCreados: totalServicios,
        serviciosPorDia: Math.round((totalServicios / diasEnPeriodo) * 10) / 10,
        tendenciaMensual: Math.round(tendenciaMensual * 10) / 10,
        
        tasaAceptacion: Math.round(tasaAceptacion * 10) / 10,
        tiempoMedioAsignacion,
        serviciosCompletadosATiempo: Math.round(serviciosCompletadosATiempo * 10) / 10,
        
        serviciosConIncidencias,
        tasaReplanificacion: Math.round(tasaReplanificacion * 10) / 10,
        cumplimientoArmados: Math.round(cumplimientoArmados * 10) / 10,
        
        custodiosActivosPromedio: custodiosActivos?.length || 0,
        armadosActivosPromedio: armadosDistintos.size,
        utilizacionRecursos: Math.round(utilizacionRecursos * 10) / 10,
        
        serviciosPorEstado,
        serviciosPorTipo,
        historicoServicios
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

function generarHistoricoServicios(servicios: any[], dias: number) {
  const now = new Date();
  const historico = [];
  
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = subDays(now, i);
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    
    const serviciosDelDia = servicios.filter(s => {
      const createdAt = new Date(s.created_at);
      return format(createdAt, 'yyyy-MM-dd') === fechaStr;
    });
    
    historico.push({
      fecha: format(fecha, 'dd/MM'),
      creados: serviciosDelDia.length,
      completados: serviciosDelDia.filter(s => 
        s.estado_planeacion === 'completado' || s.estado_planeacion === 'finalizado'
      ).length,
      cancelados: serviciosDelDia.filter(s => s.estado_planeacion === 'cancelado').length
    });
  }
  
  return historico;
}
