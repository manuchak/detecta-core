import { useMemo } from 'react';
import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

export interface SupplyGrowthMonthlyData {
  month: string;
  monthName: string;
  custodiosActivos: number;
  custodiosNuevos: number;
  custodiosPerdidos: number;
  custodiosReactivados: number;
  crecimientoNeto: number;
  crecimientoPorcentual: number;
  custodiosActivosAnterior: number;
  tasaRetencionMensual: number;
}

export interface SupplyQualityMetrics {
  custodiosConMas5Servicios: number;
  custodiosConMenos1Servicio: number;
  promedioServiciosPorCustodio: number;
  custodiosTop10Percent: number;
  ingresoPromedioPorCustodio: number;
  custodiosConIngresosCero: number;
}

export interface SupplyGrowthSummary {
  crecimientoPromedioMensual: number;
  crecimientoNetoAnual: number;
  custodiosActivosActuales: number;
  custodiosNuevosAnual: number;
  custodiosPerdidosAnual: number;
  mejorMes: { mes: string; crecimiento: number };
  peorMes: { mes: string; crecimiento: number };
  tendencia: 'creciendo' | 'decreciendo' | 'estable';
  velocidadCrecimiento: number; // aceleración/desaceleración
}

export interface SupplyGrowthDetailsData {
  monthlyData: SupplyGrowthMonthlyData[];
  summary: SupplyGrowthSummary;
  qualityMetrics: SupplyQualityMetrics;
  loading: boolean;
}

export function useSupplyGrowthDetails(): SupplyGrowthDetailsData {
  // Obtener datos históricos de custodios activos
  const { data: rawData, isLoading } = useAuthenticatedQuery(
    ['supply-growth-details'],
    async () => {
      console.log('🔄 Obteniendo datos de crecimiento de supply...');
      
      // Obtener datos de servicios para calcular custodios activos por mes
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select(`
          fecha_hora_cita,
          nombre_custodio,
          estado,
          cobro_cliente,
          fecha_primer_servicio
        `)
        .not('nombre_custodio', 'is', null)
        .not('nombre_custodio', 'eq', '')
        .not('nombre_custodio', 'eq', '#N/A')
        .gte('fecha_hora_cita', '2024-01-01')
        .order('fecha_hora_cita', { ascending: false });

      if (error) {
        console.error('❌ Error al obtener datos de supply:', error);
        throw error;
      }

      console.log('✅ Datos de supply obtenidos:', data?.length, 'registros');
      return data || [];
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
    }
  );

  return useMemo(() => {
    if (isLoading || !rawData) {
      return {
        monthlyData: [],
        summary: {
          crecimientoPromedioMensual: 0,
          crecimientoNetoAnual: 0,
          custodiosActivosActuales: 0,
          custodiosNuevosAnual: 0,
          custodiosPerdidosAnual: 0,
          mejorMes: { mes: '', crecimiento: 0 },
          peorMes: { mes: '', crecimiento: 0 },
          tendencia: 'estable' as const,
          velocidadCrecimiento: 0,
        },
        qualityMetrics: {
          custodiosConMas5Servicios: 0,
          custodiosConMenos1Servicio: 0,
          promedioServiciosPorCustodio: 0,
          custodiosTop10Percent: 0,
          ingresoPromedioPorCustodio: 0,
          custodiosConIngresosCero: 0,
        },
        loading: true,
      };
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Agrupar por mes y custodio
    const monthlyGroups = new Map<string, Set<string>>();
    const custodianFirstAppearance = new Map<string, string>();
    const custodianServices = new Map<string, { count: number; revenue: number }>();

    rawData.forEach(service => {
      const fecha = new Date(service.fecha_hora_cita);
      const monthKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const custodio = service.nombre_custodio;

      // Agrupar custodios activos por mes
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, new Set());
      }
      monthlyGroups.get(monthKey)!.add(custodio);

      // Rastrear primera aparición
      if (!custodianFirstAppearance.has(custodio)) {
        custodianFirstAppearance.set(custodio, monthKey);
      } else {
        const current = custodianFirstAppearance.get(custodio)!;
        if (monthKey < current) {
          custodianFirstAppearance.set(custodio, monthKey);
        }
      }

      // Contar servicios y revenue por custodio
      if (!custodianServices.has(custodio)) {
        custodianServices.set(custodio, { count: 0, revenue: 0 });
      }
      const custodianData = custodianServices.get(custodio)!;
      custodianData.count++;
      if (service.estado?.toLowerCase().includes('completado') || service.estado?.toLowerCase().includes('finalizado')) {
        custodianData.revenue += Number(service.cobro_cliente || 0);
      }
    });

    // Procesar datos mensuales
    const monthlyData: SupplyGrowthMonthlyData[] = [];
    const sortedMonths = Array.from(monthlyGroups.keys()).sort();

    sortedMonths.forEach((month, index) => {
      const custodiosActivos = monthlyGroups.get(month)!.size;
      const custodiosActivosAnterior = index > 0 ? monthlyGroups.get(sortedMonths[index - 1])?.size || 0 : custodiosActivos;
      
      // Calcular nuevos custodios (primera aparición en este mes)
      const custodiosNuevos = Array.from(monthlyGroups.get(month)!).filter(
        custodio => custodianFirstAppearance.get(custodio) === month
      ).length;

      // Calcular custodios perdidos (estaban el mes anterior pero no este mes)
      let custodiosPerdidos = 0;
      let custodiosReactivados = 0;
      
      if (index > 0) {
        const custodiosAnterior = monthlyGroups.get(sortedMonths[index - 1])!;
        const custodiosActuales = monthlyGroups.get(month)!;
        
        custodiosPerdidos = Array.from(custodiosAnterior).filter(
          custodio => !custodiosActuales.has(custodio)
        ).length;

        // Reactivados: estaban hace 2+ meses, no el mes anterior, pero sí este mes
        custodiosReactivados = Array.from(custodiosActuales).filter(custodio => {
          if (custodianFirstAppearance.get(custodio) === month) return false; // Es nuevo
          return !custodiosAnterior.has(custodio); // No estaba el mes anterior
        }).length;
      }

      const crecimientoNeto = custodiosActivos - custodiosActivosAnterior;
      const crecimientoPorcentual = custodiosActivosAnterior > 0 ? 
        (crecimientoNeto / custodiosActivosAnterior) * 100 : 0;

      const tasaRetencionMensual = custodiosActivosAnterior > 0 ? 
        ((custodiosActivosAnterior - custodiosPerdidos) / custodiosActivosAnterior) * 100 : 100;

      const [year, monthNum] = month.split('-');
      const monthName = monthNames[parseInt(monthNum) - 1];

      monthlyData.push({
        month,
        monthName: `${monthName} ${year}`,
        custodiosActivos,
        custodiosNuevos,
        custodiosPerdidos,
        custodiosReactivados,
        crecimientoNeto,
        crecimientoPorcentual: Math.round(crecimientoPorcentual * 100) / 100,
        custodiosActivosAnterior,
        tasaRetencionMensual: Math.round(tasaRetencionMensual * 100) / 100,
      });
    });

    // Calcular métricas de calidad
    const serviceCounts = Array.from(custodianServices.values());
    const qualityMetrics: SupplyQualityMetrics = {
      custodiosConMas5Servicios: serviceCounts.filter(c => c.count >= 5).length,
      custodiosConMenos1Servicio: serviceCounts.filter(c => c.count <= 1).length,
      promedioServiciosPorCustodio: serviceCounts.length > 0 ? 
        serviceCounts.reduce((sum, c) => sum + c.count, 0) / serviceCounts.length : 0,
      custodiosTop10Percent: Math.ceil(serviceCounts.length * 0.1),
      ingresoPromedioPorCustodio: serviceCounts.length > 0 ?
        serviceCounts.reduce((sum, c) => sum + c.revenue, 0) / serviceCounts.length : 0,
      custodiosConIngresosCero: serviceCounts.filter(c => c.revenue === 0).length,
    };

    // Calcular resumen
    const recent12Months = monthlyData.slice(-12);

    const mejorMes = recent12Months.reduce((max, current) => 
      current.crecimientoPorcentual > max.crecimiento ? 
        { mes: current.monthName, crecimiento: current.crecimientoPorcentual } : max,
      { mes: '', crecimiento: -Infinity }
    );

    const peorMes = recent12Months.reduce((min, current) => 
      current.crecimientoPorcentual < min.crecimiento ? 
        { mes: current.monthName, crecimiento: current.crecimientoPorcentual } : min,
      { mes: '', crecimiento: Infinity }
    );

    // Determinar tendencia (últimos 3 meses vs anteriores 3)
    const last3Months = recent12Months.slice(-3);
    const previous3Months = recent12Months.slice(-6, -3);
    
    const avgLast3 = last3Months.length > 0 ? last3Months.reduce((sum, m) => sum + m.crecimientoPorcentual, 0) / last3Months.length : 0;
    const avgPrevious3 = previous3Months.length > 0 ? previous3Months.reduce((sum, m) => sum + m.crecimientoPorcentual, 0) / previous3Months.length : 0;
    
    let tendencia: 'creciendo' | 'decreciendo' | 'estable' = 'estable';
    const velocidadCrecimiento = avgLast3 - avgPrevious3;
    
    if (velocidadCrecimiento > 1) tendencia = 'creciendo';
    else if (velocidadCrecimiento < -1) tendencia = 'decreciendo';

    const summary: SupplyGrowthSummary = {
      crecimientoPromedioMensual: recent12Months.length > 0 ?
        recent12Months.reduce((sum, m) => sum + m.crecimientoPorcentual, 0) / recent12Months.length : 0,
      crecimientoNetoAnual: recent12Months.reduce((sum, m) => sum + m.crecimientoNeto, 0),
      custodiosActivosActuales: monthlyData[monthlyData.length - 1]?.custodiosActivos || 0,
      custodiosNuevosAnual: recent12Months.reduce((sum, m) => sum + m.custodiosNuevos, 0),
      custodiosPerdidosAnual: recent12Months.reduce((sum, m) => sum + m.custodiosPerdidos, 0),
      mejorMes,
      peorMes,
      tendencia,
      velocidadCrecimiento: Math.round(velocidadCrecimiento * 100) / 100,
    };

    console.log('✅ Supply Growth calculado:', { 
      monthlyData: monthlyData.length, 
      summary, 
      qualityMetrics 
    });

    return {
      monthlyData: monthlyData.reverse(), // Más reciente primero
      summary,
      qualityMetrics,
      loading: false,
    };
  }, [rawData, isLoading]);
}