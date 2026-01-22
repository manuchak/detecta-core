import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlanificadorPerformance, PeriodoReporte } from '../types';
import { subDays, subMonths, differenceInMinutes } from 'date-fns';

export const usePlanificadoresPerformance = (periodo: PeriodoReporte = 'mes') => {
  return useQuery({
    queryKey: ['planificadores-performance', periodo],
    queryFn: async (): Promise<PlanificadorPerformance[]> => {
      const now = new Date();
      let fechaInicio: Date;
      
      switch (periodo) {
        case 'semana':
          fechaInicio = subDays(now, 7);
          break;
        case 'mes':
          fechaInicio = subMonths(now, 1);
          break;
        case 'trimestre':
          fechaInicio = subMonths(now, 3);
          break;
        case 'year':
          fechaInicio = subMonths(now, 12);
          break;
        default:
          fechaInicio = subMonths(now, 1);
      }
      
      const fechaInicioISO = fechaInicio.toISOString();
      const diasEnPeriodo = Math.ceil((now.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
      
      // Obtener todos los usuarios
      const { data: allUsersData, error: planificadoresError } = await supabase
        .rpc('get_all_users_with_roles_secure');
      
      if (planificadoresError) throw planificadoresError;
      
      // Consultar servicios_planificados primero para saber qué admins tienen actividad
      const { data: servicios, error: serviciosError } = await supabase
        .from('servicios_planificados')
        .select('*')
        .gte('created_at', fechaInicioISO);
      
      if (serviciosError) throw serviciosError;
      
      // IDs de usuarios que crearon servicios en el período
      const creadoresIds = [...new Set(servicios?.map(s => s.created_by) || [])];
      
      // Filtrar planificadores activos
      const planificadoresActivos = allUsersData?.filter((user: any) => 
        user.is_active === true && user.role === 'planificador'
      ) || [];
      
      // Filtrar admins/owners activos que crearon servicios (se mostrarán como "Control")
      const adminsConServicios = allUsersData?.filter((user: any) =>
        user.is_active === true && 
        ['admin', 'owner'].includes(user.role) && 
        creadoresIds.includes(user.id)
      ).map((admin: any) => ({
        ...admin,
        esControl: true
      })) || [];
      
      // Combinar: planificadores activos + admins con servicios
      const planificadores = [...planificadoresActivos, ...adminsConServicios];
      
      const performances: PlanificadorPerformance[] = planificadores.map((planificador: any) => {
        const userId = planificador.id;
        
        // Servicios creados por este planificador
        const serviciosPlanificador = servicios?.filter(s => 
          s.created_by === userId
        ) || [];
        
        const totalServicios = serviciosPlanificador.length;
        
        // Tasa de aceptación: servicios con custodio asignado
        const serviciosConCustodio = serviciosPlanificador.filter(s => 
          s.custodio_asignado
        ).length;
        const tasaAceptacion = totalServicios > 0 
          ? (serviciosConCustodio / totalServicios) * 100 
          : 0;
        
        // Tasa de completado
        const serviciosCompletados = serviciosPlanificador.filter(s => 
          s.estado_planeacion === 'completado' || s.estado_planeacion === 'finalizado'
        ).length;
        const tasaCompletado = totalServicios > 0
          ? (serviciosCompletados / totalServicios) * 100
          : 0;
        
        // Servicios con incidencias (cancelados)
        const serviciosConIncidencias = serviciosPlanificador.filter(s => 
          s.estado_planeacion === 'cancelado'
        ).length;
        const serviciosConIncidenciasPorcentaje = totalServicios > 0
          ? (serviciosConIncidencias / totalServicios) * 100
          : 0;
        
        // Tiempo promedio de asignación
        const serviciosConAsignacion = serviciosPlanificador.filter(s => 
          s.fecha_asignacion && s.created_at
        );
        let tiempoPromedioAsignacion = 0;
        if (serviciosConAsignacion.length > 0) {
          const totalMinutos = serviciosConAsignacion.reduce((acc, s) => {
            const creado = new Date(s.created_at);
            const asignado = new Date(s.fecha_asignacion);
            return acc + differenceInMinutes(asignado, creado);
          }, 0);
          tiempoPromedioAsignacion = Math.round(totalMinutos / serviciosConAsignacion.length);
        }
        
        // Custodios distintos utilizados
        const custodiosDistintos = new Set(
          serviciosPlanificador
            .filter(s => s.custodio_asignado)
            .map(s => s.custodio_asignado)
        ).size;
        
        // Armados distintos utilizados
        const armadosDistintos = new Set(
          serviciosPlanificador
            .filter(s => s.armado_id)
            .map(s => s.armado_id)
        ).size;
        
        // Servicios activos ahora (no finalizados ni cancelados)
        const serviciosActivosAhora = serviciosPlanificador.filter(s => 
          s.estado_planeacion !== 'cancelado' && 
          s.estado_planeacion !== 'completado' &&
          s.estado_planeacion !== 'finalizado'
        ).length;
        
        // Calcular score ponderado
        const score = calcularScore({
          tasaAceptacion,
          tasaCompletado,
          serviciosConIncidenciasPorcentaje,
          serviciosPorDia: totalServicios / diasEnPeriodo
        });
        
        return {
          id: planificador.id,
          user_id: planificador.id,
          nombre: planificador.display_name || 'Sin nombre',
          email: planificador.email || '',
          
          serviciosCreados: totalServicios,
          serviciosPorDia: Math.round((totalServicios / diasEnPeriodo) * 10) / 10,
          tiempoPromedioAsignacion,
          
          tasaAceptacion: Math.round(tasaAceptacion * 10) / 10,
          tasaCompletado: Math.round(tasaCompletado * 10) / 10,
          serviciosConIncidencias,
          serviciosConIncidenciasPorcentaje: Math.round(serviciosConIncidenciasPorcentaje * 10) / 10,
          
          custodiosDistintos,
          armadosDistintos,
          
          score: Math.round(score),
          ranking: 0,
          tendenciaSemanal: 0,
          
          serviciosActivosAhora,
          esControl: planificador.esControl || false
        };
      });
      
      // Ordenar por score y asignar ranking
      performances.sort((a, b) => b.score - a.score);
      performances.forEach((p, index) => {
        p.ranking = index + 1;
      });
      
      return performances;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

function calcularScore(metricas: {
  tasaAceptacion: number;
  tasaCompletado: number;
  serviciosConIncidenciasPorcentaje: number;
  serviciosPorDia: number;
}): number {
  const {
    tasaAceptacion,
    tasaCompletado,
    serviciosConIncidenciasPorcentaje,
    serviciosPorDia
  } = metricas;
  
  const pesoAceptacion = 0.30;
  const pesoCompletado = 0.30;
  const pesoCalidad = 0.25;
  const pesoProductividad = 0.15;
  
  // Normalizar productividad (máximo esperado: 10 servicios/día)
  const productividadNormalizada = Math.min(serviciosPorDia / 10, 1) * 100;
  const scoreCalidad = Math.max(100 - serviciosConIncidenciasPorcentaje, 0);
  
  const score = 
    (tasaAceptacion * pesoAceptacion) +
    (tasaCompletado * pesoCompletado) +
    (scoreCalidad * pesoCalidad) +
    (productividadNormalizada * pesoProductividad);
  
  return score;
}
