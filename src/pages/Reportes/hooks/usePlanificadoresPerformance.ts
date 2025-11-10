import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlanificadorPerformance, PeriodoReporte } from '../types';
import { subDays, subMonths } from 'date-fns';

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
      
      // Usar la función RPC segura que hace el join correctamente
      const { data: allUsersData, error: planificadoresError } = await supabase
        .rpc('get_all_users_with_roles_secure');
      
      if (planificadoresError) throw planificadoresError;
      
      // Filtrar solo los planificadores
      const planificadores = allUsersData?.filter((user: any) => 
        user.role === 'planificador'
      ) || [];
      
      const { data: servicios, error: serviciosError } = await supabase
        .from('servicios_custodia')
        .select('*')
        .gte('created_at', fechaInicioISO);
      
      if (serviciosError) throw serviciosError;
      
      const diasEnPeriodo = Math.ceil((now.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
      
      const performances: PlanificadorPerformance[] = planificadores.map((planificador: any) => {
        const userId = planificador.id;
        
        const serviciosPlanificador = servicios?.filter(s => 
          s.created_by_user_id === userId
        ) || [];
        
        const totalServicios = serviciosPlanificador.length;
        
        const serviciosConfirmados = serviciosPlanificador.filter(s => 
          s.estado_planeacion === 'confirmado' || s.estado_planeacion === 'en_curso'
        ).length;
        const tasaAceptacion = totalServicios > 0 
          ? (serviciosConfirmados / totalServicios) * 100 
          : 0;
        
        const serviciosCompletados = serviciosPlanificador.filter(s => 
          s.estado_planeacion === 'completado'
        ).length;
        const tasaCompletado = totalServicios > 0
          ? (serviciosCompletados / totalServicios) * 100
          : 0;
        
        const serviciosConIncidencias = 0;
        const serviciosConIncidenciasPorcentaje = totalServicios > 0
          ? (serviciosConIncidencias / totalServicios) * 100
          : 0;
        
        const custodiosDistintos = new Set(
          serviciosPlanificador
            .filter(s => s.custodio_asignado)
            .map(s => s.custodio_asignado)
        ).size;
        
        const armadosDistintos = new Set(
          serviciosPlanificador
            .filter(s => s.armado_asignado)
            .map(s => s.armado_asignado)
        ).size;
        
        const serviciosActivosAhora = serviciosPlanificador.filter(s => 
          s.estado_planeacion === 'en_curso' || s.estado_planeacion === 'confirmado'
        ).length;
        
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
          serviciosPorDia: totalServicios / diasEnPeriodo,
          tiempoPromedioAsignacion: 45,
          
          tasaAceptacion: Math.round(tasaAceptacion * 10) / 10,
          tasaCompletado: Math.round(tasaCompletado * 10) / 10,
          serviciosConIncidencias,
          serviciosConIncidenciasPorcentaje: Math.round(serviciosConIncidenciasPorcentaje * 10) / 10,
          
          custodiosDistintos,
          armadosDistintos,
          
          score: Math.round(score),
          ranking: 0,
          tendenciaSemanal: 0,
          
          serviciosActivosAhora
        };
      });
      
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
  
  const productividadNormalizada = Math.min(serviciosPorDia / 5, 1) * 100;
  const scoreCalidad = Math.max(100 - serviciosConIncidenciasPorcentaje, 0);
  
  const score = 
    (tasaAceptacion * pesoAceptacion) +
    (tasaCompletado * pesoCompletado) +
    (scoreCalidad * pesoCalidad) +
    (productividadNormalizada * pesoProductividad);
  
  return score;
}
