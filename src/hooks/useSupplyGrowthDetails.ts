import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format } from 'date-fns';

interface SupplyGrowthData {
  period_start: string;
  period_end: string;
  custodios_nuevos: number;
  custodios_perdidos: number;
  custodios_activos_inicio: number;
  custodios_activos_fin: number;
  supply_growth_rate: number;
  supply_growth_absolute: number;
}

interface MonthlySupplyGrowth {
  month: string;
  monthName: string;
  nuevos: number;
  perdidos: number;
  netGrowth: number;
  growthRate: number;
  activeCustodians: number;
}

interface SupplyGrowthDetails {
  monthlyEvolution: MonthlySupplyGrowth[];
  currentMonthData: {
    growthRate: number;
    netGrowth: number;
    nuevos: number;
    perdidos: number;
    activeCustodians: number;
  };
  yearlyData: {
    averageGrowthRate: number;
    totalNewCustodians: number;
    totalLostCustodians: number;
    netGrowthYear: number;
    strongestGrowthMonth: string;
    weakestGrowthMonth: string;
  };
}

export function useSupplyGrowthDetails() {
  const { data: monthlyGrowthData, isLoading } = useQuery({
    queryKey: ['supply-growth-monthly-details'],
    queryFn: async () => {
      const results: SupplyGrowthData[] = [];
      const now = new Date();
      
      // Obtener datos para los últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const endDate = subMonths(now, i);
        const startDate = subMonths(endDate, 1);
        
        const { data, error } = await supabase.rpc('get_supply_growth_metrics', {
          fecha_inicio: format(startDate, 'yyyy-MM-dd'),
          fecha_fin: format(endDate, 'yyyy-MM-dd')
        });
        
        if (error) {
          console.error(`Error fetching supply growth for ${format(startDate, 'yyyy-MM')}:`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          results.push(data[0]);
        }
      }
      
      return results;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });

  const supplyGrowthDetails: SupplyGrowthDetails | null = useMemo(() => {
    if (!monthlyGrowthData || monthlyGrowthData.length === 0) {
      return null;
    }

    const monthlyEvolution: MonthlySupplyGrowth[] = monthlyGrowthData.map((data) => {
      const date = new Date(data.period_end);
      return {
        month: format(date, 'yyyy-MM'),
        monthName: format(date, 'MMM yyyy'),
        nuevos: data.custodios_nuevos,
        perdidos: data.custodios_perdidos,
        netGrowth: data.supply_growth_absolute,
        growthRate: data.supply_growth_rate,
        activeCustodians: data.custodios_activos_fin,
      };
    });

    const currentMonth = monthlyEvolution[monthlyEvolution.length - 1];
    
    const averageGrowthRate = monthlyEvolution.reduce((sum, month) => sum + month.growthRate, 0) / monthlyEvolution.length;
    const totalNewCustodians = monthlyEvolution.reduce((sum, month) => sum + month.nuevos, 0);
    const totalLostCustodians = monthlyEvolution.reduce((sum, month) => sum + month.perdidos, 0);
    
    // Encontrar el mes con mayor y menor crecimiento
    const sortedByGrowth = [...monthlyEvolution].sort((a, b) => b.growthRate - a.growthRate);
    const strongestGrowthMonth = sortedByGrowth[0]?.monthName || 'N/A';
    const weakestGrowthMonth = sortedByGrowth[sortedByGrowth.length - 1]?.monthName || 'N/A';

    return {
      monthlyEvolution,
      currentMonthData: {
        growthRate: currentMonth?.growthRate || 0,
        netGrowth: currentMonth?.netGrowth || 0,
        nuevos: currentMonth?.nuevos || 0,
        perdidos: currentMonth?.perdidos || 0,
        activeCustodians: currentMonth?.activeCustodians || 0,
      },
      yearlyData: {
        averageGrowthRate: Math.round(averageGrowthRate * 100) / 100,
        totalNewCustodians,
        totalLostCustodians,
        netGrowthYear: totalNewCustodians - totalLostCustodians,
        strongestGrowthMonth,
        weakestGrowthMonth,
      },
    };
  }, [monthlyGrowthData]);

  return {
    supplyGrowthDetails,
    loading: isLoading,
  };
}