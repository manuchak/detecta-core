import { useMemo } from 'react';
// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CPADetails {
  yearlyBreakdown: {
    totalCosts: number;
    totalNewCustodians: number;
    costBreakdown: {
      staff: number;
      technology: number;
      recruitment: number;
      marketing: number;
    };
    monthlyData: Array<{
      month: string;
      costs: number;
      newCustodians: number;
      cpa: number;
    }>;
  };
  currentMonthData: {
    month: string;
    costs: number;
    newCustodians: number;
    cpa: number;
    costBreakdown: {
      staff: number;
      technology: number;
      recruitment: number;
      marketing: number;
    };
  };
  overallCPA: number;
}

export const useCPADetails = () => {
  // Obtener gastos reales
  const { data: gastosReales, isLoading: gastosLoading } = useQuery({
    queryKey: ['cpa-details-gastos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_externos')
        .select('concepto, monto, fecha_gasto')
        .gte('fecha_gasto', '2025-01-01')
        .lte('fecha_gasto', '2025-12-31')
        .order('fecha_gasto', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Obtener custodios nuevos por mes
  const { data: custodiosNuevosPorMes, isLoading: custodiosLoading } = useQuery({
    queryKey: ['cpa-details-custodios'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('bypass_rls_get_servicios', { max_records: 10000 });
      
      if (error) throw error;
      
      // Procesar datos para encontrar primer servicio de cada custodio
      const custodiosPrimerServicio = new Map();
      
      if (data && data.length > 0) {
        const serviciosOrdenados = data
          .filter(s => s.nombre_custodio && s.fecha_hora_cita)
          .sort((a, b) => new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime());
        
        serviciosOrdenados.forEach(servicio => {
          const custodio = servicio.nombre_custodio;
          if (!custodiosPrimerServicio.has(custodio)) {
            custodiosPrimerServicio.set(custodio, new Date(servicio.fecha_hora_cita));
          }
        });
      }
      
      // Agrupar por mes los custodios que tuvieron su primer servicio
      const custodiosPorMes = {};
      
      custodiosPrimerServicio.forEach((fechaPrimerServicio, custodio) => {
        if (fechaPrimerServicio >= new Date('2025-01-01') && fechaPrimerServicio <= new Date('2025-12-31')) {
          const yearMonth = `${fechaPrimerServicio.getFullYear()}-${String(fechaPrimerServicio.getMonth() + 1).padStart(2, '0')}`;
          
          if (!custodiosPorMes[yearMonth]) {
            custodiosPorMes[yearMonth] = [];
          }
          custodiosPorMes[yearMonth].push(custodio);
        }
      });
      
      return custodiosPorMes;
    },
    staleTime: 5 * 60 * 1000,
  });

  const cpaDetails = useMemo((): CPADetails => {
    if (!gastosReales || !custodiosNuevosPorMes) {
      return {
        yearlyBreakdown: {
          totalCosts: 0,
          totalNewCustodians: 0,
          costBreakdown: { staff: 0, technology: 0, recruitment: 0, marketing: 0 },
          monthlyData: []
        },
        currentMonthData: {
          month: new Date().toISOString().substring(0, 7),
          costs: 0,
          newCustodians: 0,
          cpa: 0,
          costBreakdown: { staff: 0, technology: 0, recruitment: 0, marketing: 0 }
        },
        overallCPA: 0
      };
    }

    // Agrupar gastos por mes y categoría
    const gastosPorMes = {};
    const costBreakdownTotal = { staff: 0, technology: 0, recruitment: 0, marketing: 0 };

    gastosReales.forEach(gasto => {
      const fecha = new Date(gasto.fecha_gasto);
      const yearMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const monto = Number(gasto.monto) || 0;

      if (!gastosPorMes[yearMonth]) {
        gastosPorMes[yearMonth] = {
          total: 0,
          breakdown: { staff: 0, technology: 0, recruitment: 0, marketing: 0 }
        };
      }

      gastosPorMes[yearMonth].total += monto;

      // Categorizar gastos
      switch (gasto.concepto) {
        case 'STAFF':
          gastosPorMes[yearMonth].breakdown.staff += monto;
          costBreakdownTotal.staff += monto;
          break;
        case 'GPS':
        case 'PLATAFORMA':
          gastosPorMes[yearMonth].breakdown.technology += monto;
          costBreakdownTotal.technology += monto;
          break;
        case 'TOXICOLOGÍA':
        case 'EVALUACIONES':
          gastosPorMes[yearMonth].breakdown.recruitment += monto;
          costBreakdownTotal.recruitment += monto;
          break;
        case 'FACEBOOK':
        case 'INDEED':
          gastosPorMes[yearMonth].breakdown.marketing += monto;
          costBreakdownTotal.marketing += monto;
          break;
      }
    });

    // Crear datos mensuales
    const monthlyData = [];
    let totalCosts = 0;
    let totalNewCustodians = 0;

    Object.keys(gastosPorMes).forEach(mes => {
      const gastosMes = gastosPorMes[mes].total;
      const custodiosNuevosMes = custodiosNuevosPorMes[mes] ? custodiosNuevosPorMes[mes].length : 0;
      const cpaDelMes = custodiosNuevosMes > 0 ? gastosMes / custodiosNuevosMes : 0;

      monthlyData.push({
        month: mes,
        costs: gastosMes,
        newCustodians: custodiosNuevosMes,
        cpa: cpaDelMes
      });

      totalCosts += gastosMes;
      totalNewCustodians += custodiosNuevosMes;
    });

    // Datos del mes actual
    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentMonthGastos = gastosPorMes[currentMonth] || { total: 0, breakdown: { staff: 0, technology: 0, recruitment: 0, marketing: 0 } };
    const currentMonthCustodios = custodiosNuevosPorMes[currentMonth] ? custodiosNuevosPorMes[currentMonth].length : 0;

    const monthNames = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };

    return {
      yearlyBreakdown: {
        totalCosts,
        totalNewCustodians,
        costBreakdown: costBreakdownTotal,
        monthlyData: monthlyData.sort((a, b) => a.month.localeCompare(b.month))
      },
      currentMonthData: {
        month: monthNames[currentMonth.split('-')[1]] || currentMonth,
        costs: currentMonthGastos.total,
        newCustodians: currentMonthCustodios,
        cpa: currentMonthCustodios > 0 ? currentMonthGastos.total / currentMonthCustodios : 0,
        costBreakdown: currentMonthGastos.breakdown
      },
      overallCPA: totalNewCustodians > 0 ? totalCosts / totalNewCustodians : 0
    };
  }, [gastosReales, custodiosNuevosPorMes]);

  return {
    cpaDetails,
    loading: gastosLoading || custodiosLoading
  };
};