import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PoolBenchmarks {
  // Promedios del pool
  promedioIngresoPorKm: number;
  promedioIngresoPorServicio: number;
  promedioServiciosPorCustodio: number;
  promedioIngresosTotales: number;
  
  // Totales del pool
  totalCustodiosActivos: number;
  
  // Rankings del custodio actual
  rankingIngresos: number;
  rankingServicios: number;
  rankingIngresoPorKm: number;
  percentil: number;
  
  // Top performers para referencia
  topIngresoPorKm: number;
  topIngresosTotales: number;
}

function normalizarNombre(nombre: string): string {
  return nombre.trim().toUpperCase();
}

export function usePoolBenchmarks(nombre: string | undefined) {
  return useQuery({
    queryKey: ['pool-benchmarks', nombre],
    queryFn: async (): Promise<PoolBenchmarks> => {
      if (!nombre) throw new Error('Nombre requerido');
      
      const nombreNormalizado = normalizarNombre(nombre);
      
      // Obtener stats agregados de todos los custodios (últimos 6 meses para relevancia)
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
      
      const { data: servicios, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, costo_custodio, km_recorridos')
        .eq('estado', 'Finalizado')
        .gt('costo_custodio', 0)
        .gte('fecha_hora_cita', seisMesesAtras.toISOString());
      
      if (error) throw error;
      
      // Agregar por custodio
      const custodioStats: { [key: string]: { ingresos: number; servicios: number; km: number } } = {};
      
      (servicios || []).forEach(s => {
        const key = s.nombre_custodio?.trim().toUpperCase() || 'UNKNOWN';
        if (!custodioStats[key]) {
          custodioStats[key] = { ingresos: 0, servicios: 0, km: 0 };
        }
        custodioStats[key].ingresos += s.costo_custodio || 0;
        custodioStats[key].servicios++;
        custodioStats[key].km += s.km_recorridos || 0;
      });
      
      const custodios = Object.entries(custodioStats)
        .map(([nombre, stats]) => ({
          nombre,
          ...stats,
          ingresoPorKm: stats.km > 0 ? stats.ingresos / stats.km : 0
        }))
        .filter(c => c.servicios >= 3); // Al menos 3 servicios para ser relevante
      
      const totalCustodiosActivos = custodios.length;
      
      if (totalCustodiosActivos === 0) {
        return {
          promedioIngresoPorKm: 0,
          promedioIngresoPorServicio: 0,
          promedioServiciosPorCustodio: 0,
          promedioIngresosTotales: 0,
          totalCustodiosActivos: 0,
          rankingIngresos: 0,
          rankingServicios: 0,
          rankingIngresoPorKm: 0,
          percentil: 0,
          topIngresoPorKm: 0,
          topIngresosTotales: 0
        };
      }
      
      // Calcular promedios
      const sumIngresos = custodios.reduce((sum, c) => sum + c.ingresos, 0);
      const sumServicios = custodios.reduce((sum, c) => sum + c.servicios, 0);
      const sumKm = custodios.reduce((sum, c) => sum + c.km, 0);
      
      const promedioIngresosTotales = sumIngresos / totalCustodiosActivos;
      const promedioServiciosPorCustodio = sumServicios / totalCustodiosActivos;
      const promedioIngresoPorKm = sumKm > 0 ? sumIngresos / sumKm : 0;
      const promedioIngresoPorServicio = sumServicios > 0 ? sumIngresos / sumServicios : 0;
      
      // Rankings (ordenar de mayor a menor)
      const porIngresos = [...custodios].sort((a, b) => b.ingresos - a.ingresos);
      const porServicios = [...custodios].sort((a, b) => b.servicios - a.servicios);
      const porIngresoPorKm = [...custodios].sort((a, b) => b.ingresoPorKm - a.ingresoPorKm);
      
      // Encontrar posición del custodio actual
      const rankingIngresos = porIngresos.findIndex(c => c.nombre === nombreNormalizado) + 1;
      const rankingServicios = porServicios.findIndex(c => c.nombre === nombreNormalizado) + 1;
      const rankingIngresoPorKm = porIngresoPorKm.findIndex(c => c.nombre === nombreNormalizado) + 1;
      
      // Percentil (basado en ingresos)
      const percentil = rankingIngresos > 0 
        ? Math.round(((totalCustodiosActivos - rankingIngresos + 1) / totalCustodiosActivos) * 100)
        : 0;
      
      // Top performers
      const topIngresoPorKm = porIngresoPorKm.length > 0 ? porIngresoPorKm[0].ingresoPorKm : 0;
      const topIngresosTotales = porIngresos.length > 0 ? porIngresos[0].ingresos : 0;
      
      return {
        promedioIngresoPorKm,
        promedioIngresoPorServicio,
        promedioServiciosPorCustodio,
        promedioIngresosTotales,
        totalCustodiosActivos,
        rankingIngresos: rankingIngresos || totalCustodiosActivos,
        rankingServicios: rankingServicios || totalCustodiosActivos,
        rankingIngresoPorKm: rankingIngresoPorKm || totalCustodiosActivos,
        percentil,
        topIngresoPorKm,
        topIngresosTotales
      };
    },
    enabled: !!nombre,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}
