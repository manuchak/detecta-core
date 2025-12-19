import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, addMonths, isSameYear } from 'date-fns';
import { es } from 'date-fns/locale';
export interface ConversionRateBreakdown {
  month: string;
  leads: number;
  newCustodians: number;
  conversionRate: number;
}

export interface ConversionRateDetails {
  yearlyData: {
    totalLeads: number;
    totalNewCustodians: number;
    overallConversionRate: number;
    monthlyBreakdown: ConversionRateBreakdown[];
  };
  currentMonthData: {
    month: string;
    leads: number;
    newCustodians: number;
    conversionRate: number;
  };
  periodLabel: string;
  loading: boolean;
}

export interface ConversionRateDetailsOptions {
  enabled?: boolean;
}

export const useConversionRateDetails = (options: ConversionRateDetailsOptions = {}): ConversionRateDetails => {
  const { enabled = true } = options;

  // Calcular período dinámico: desde julio 2025 hasta último día del mes actual
  const today = new Date();
  const start = startOfMonth(new Date(2025, 6, 1)); // Julio 2025 (mes 6 porque enero = 0)
  const end = endOfMonth(today);
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  // Leads por mes (autenticado)
  const { data: leadsPorMes = {}, isLoading: leadsLoading } = useQuery<Record<string, number>>({
    queryKey: ['leads-por-mes', startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('fecha_creacion')
        .gte('fecha_creacion', startStr)
        .lte('fecha_creacion', endStr)
        .order('fecha_creacion', { ascending: true });

      if (error) throw error;

      const map: Record<string, number> = {};
      (data ?? []).forEach((lead: any) => {
        const fecha = new Date(lead.fecha_creacion);
        const ym = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        map[ym] = (map[ym] ?? 0) + 1;
      });
      return map;
    },
    staleTime: 30_000,
    refetchOnMount: true,
    enabled,
  });

  // Custodios nuevos (primer servicio) por mes (autenticado)
  const { data: custodiosNuevosPorMes = {}, isLoading: custodiosLoading } = useQuery<Record<string, number>>({
    queryKey: ['custodios-nuevos-conversion', startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_custodios_nuevos_por_mes', {
        fecha_inicio: startStr,
        fecha_fin: endStr,
      });

      if (error) throw error;

      const map: Record<string, number> = {};
      (data ?? []).forEach((item: any) => {
        map[item.mes] = item.custodios_nuevos;
      });
      return map;
    },
    staleTime: 30_000,
    refetchOnMount: true,
    enabled,
  });

  const conversionDetails = useMemo(() => {
    if (leadsLoading || custodiosLoading) {
      return {
        yearlyData: {
          totalLeads: 0,
          totalNewCustodians: 0,
          overallConversionRate: 0,
          monthlyBreakdown: [],
        },
        currentMonthData: {
          month: '',
          leads: 0,
          newCustodians: 0,
          conversionRate: 0,
        },
        periodLabel: '',
        loading: true,
      } as ConversionRateDetails;
    }

    // Construir meses entre start y end (inclusive)
    const months: { key: string; date: Date }[] = [];
    for (let d = startOfMonth(start); d <= end; d = addMonths(d, 1)) {
      months.push({ key: format(d, 'yyyy-MM'), date: new Date(d) });
    }

    let totalLeads = 0;
    let totalNewCustodians = 0;

    const monthlyBreakdown: ConversionRateBreakdown[] = months.map(({ key, date }) => {
      const leads = leadsPorMes[key] ?? 0;
      const newCustodians = custodiosNuevosPorMes[key] ?? 0;
      const conversionRate = leads > 0 ? Math.round((newCustodians / leads) * 100 * 100) / 100 : 0;
      totalLeads += leads;
      totalNewCustodians += newCustodians;
      const monthLabel = capitalize(format(date, 'LLLL', { locale: es }));
      return { month: monthLabel, leads, newCustodians, conversionRate };
    });

    const overallConversionRate = totalLeads > 0 ? Math.round((totalNewCustodians / totalLeads) * 100 * 100) / 100 : 0;

    // Mes actual (fin del período)
    const currentMonthKey = format(end, 'yyyy-MM');
    const currentMonthLeads = leadsPorMes[currentMonthKey] ?? 0;
    const currentMonthCustodians = custodiosNuevosPorMes[currentMonthKey] ?? 0;
    const currentMonthConversion = currentMonthLeads > 0 ? Math.round((currentMonthCustodians / currentMonthLeads) * 100 * 100) / 100 : 0;
    const currentMonthLabel = `${capitalize(format(end, 'LLLL', { locale: es }))} ${format(end, 'yyyy')}`;

    // Etiqueta de período
    const left = capitalize(format(start, isSameYear(start, end) ? 'LLL' : 'LLL yyyy', { locale: es }));
    const right = capitalize(format(end, 'LLL yyyy', { locale: es }));
    const periodLabel = `${left} - ${right}`;

    return {
      yearlyData: {
        totalLeads,
        totalNewCustodians,
        overallConversionRate,
        monthlyBreakdown,
      },
      currentMonthData: {
        month: currentMonthLabel,
        leads: currentMonthLeads,
        newCustodians: currentMonthCustodians,
        conversionRate: currentMonthConversion,
      },
      periodLabel,
      loading: false,
    } as ConversionRateDetails;
  }, [leadsPorMes, custodiosNuevosPorMes, leadsLoading, custodiosLoading, start, end]);

  return {
    ...conversionDetails,
    loading: leadsLoading || custodiosLoading,
  };
};