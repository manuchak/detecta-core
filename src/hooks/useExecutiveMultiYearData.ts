import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCDMXYear, getCDMXMonth, getCDMXDayOfMonth, getCDMXWeekday } from '@/utils/cdmxDateUtils';

export interface MonthlyData {
  year: number;
  month: number;
  monthLabel: string;
  services: number;
  gmv: number;
  aov: number;
}

export interface QuarterlyData {
  year: number;
  quarter: number;
  quarterLabel: string;
  services: number;
  gmv: number;
}

export interface YearlyData {
  year: number;
  services: number;
  gmv: number;
  aov: number;
}

export interface DailyData {
  day: number;
  dayLabel: string;
  services: number;
  gmv: number;
}

export interface ClientMTDData {
  client: string;
  services: number;
  gmv: number;
  aov: number;
}

export interface WeekdayData {
  weekday: string;
  weekdayIndex: number;
  currentMTD: number;
  previousMTD: number;
}

export interface LocalForaneoData {
  yearMonth: string;
  local: number;
  foraneo: number;
  localPct: number;
  foraneoPct: number;
  total: number;
}

export interface ArmedData {
  yearMonth: string;
  armed: number;
  notArmed: number;
  armedPct: number;
  total: number;
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Fetch all rows with pagination to bypass Supabase 1000-row limit */
async function fetchAllPaginated(
  baseQuery: () => any,
  pageSize = 1000
) {
  const allRecords: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await baseQuery().range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRecords.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return allRecords;
}

export function useExecutiveMultiYearData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['executive-multi-year-data'],
    queryFn: async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      const startYear = currentYear - 3;

      // ========================================
      // SOURCE 1: RPC for monthly aggregates (server-side, no row limit)
      // ========================================
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_historical_monthly_data');
      if (rpcErr) throw rpcErr;
      const rpcRows = (rpcData || []) as Array<{ year: number; month: number; services: number; gmv: string | number }>;

      // Build monthlyMap from RPC
      const monthlyMap: Record<string, { services: number; gmv: number }> = {};
      rpcRows.forEach(r => {
        const key = `${r.year}-${r.month - 1}`; // month in RPC is 1-12, we use 0-11 internally
        monthlyMap[key] = { services: r.services, gmv: parseFloat(String(r.gmv)) || 0 };
      });

      // Monthly by Year
      const monthlyByYear: MonthlyData[] = [];
      for (let y = startYear; y <= currentYear; y++) {
        for (let m = 0; m < 12; m++) {
          const d = monthlyMap[`${y}-${m}`] || { services: 0, gmv: 0 };
          monthlyByYear.push({
            year: y, month: m + 1,
            monthLabel: MONTH_LABELS[m],
            services: d.services,
            gmv: d.gmv,
            aov: d.services > 0 ? d.gmv / d.services : 0,
          });
        }
      }

      // Quarterly by Year
      const quarterlyByYear: QuarterlyData[] = [];
      for (let y = startYear; y <= currentYear; y++) {
        for (let q = 1; q <= 4; q++) {
          const months = [(q - 1) * 3, (q - 1) * 3 + 1, (q - 1) * 3 + 2];
          let services = 0, gmv = 0;
          months.forEach(m => {
            const d = monthlyMap[`${y}-${m}`];
            if (d) { services += d.services; gmv += d.gmv; }
          });
          quarterlyByYear.push({ year: y, quarter: q, quarterLabel: `T${q}`, services, gmv });
        }
      }

      // Yearly Totals
      const yearlyAgg: Record<number, { services: number; gmv: number }> = {};
      rpcRows.forEach(r => {
        if (!yearlyAgg[r.year]) yearlyAgg[r.year] = { services: 0, gmv: 0 };
        yearlyAgg[r.year].services += r.services;
        yearlyAgg[r.year].gmv += parseFloat(String(r.gmv)) || 0;
      });
      const yearlyTotals: YearlyData[] = Object.entries(yearlyAgg)
        .map(([y, d]) => ({
          year: Number(y), services: d.services, gmv: d.gmv,
          aov: d.services > 0 ? d.gmv / d.services : 0,
        }))
        .sort((a, b) => a.year - b.year);

      // ========================================
      // SOURCE 2: Paginated detail queries for current + previous month
      // ========================================
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonthStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
      const nextMonthStart = currentMonth === 11
        ? `${currentYear + 1}-01-01`
        : `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-01`;

      const detailRecords = await fetchAllPaginated(() =>
        supabase
          .from('servicios_custodia')
          .select('fecha_hora_cita, cobro_cliente, nombre_cliente, local_foraneo, nombre_armado')
          .gte('fecha_hora_cita', prevMonthStart)
          .lt('fecha_hora_cita', nextMonthStart)
          .not('estado', 'eq', 'Cancelado')
      );

      const enriched = detailRecords.map(s => {
        const fecha = s.fecha_hora_cita;
        if (!fecha) return null;
        const year = getCDMXYear(fecha);
        const month = getCDMXMonth(fecha);
        const day = getCDMXDayOfMonth(fecha);
        const cobro = parseFloat(String(s.cobro_cliente || 0));
        const weekdayIndex = getCDMXWeekday(fecha);
        return {
          year, month, day, cobro, weekdayIndex,
          client: s.nombre_cliente || 'Sin nombre',
          localForaneo: s.local_foraneo || '',
          armed: !!s.nombre_armado && s.nombre_armado.trim() !== '',
        };
      }).filter(Boolean) as Array<{
        year: number; month: number; day: number; cobro: number;
        weekdayIndex: number; client: string; localForaneo: string; armed: boolean;
      }>;

      // Daily Current Month
      const dailyMap: Record<number, { services: number; gmv: number }> = {};
      enriched.filter(s => s.year === currentYear && s.month === currentMonth).forEach(s => {
        if (!dailyMap[s.day]) dailyMap[s.day] = { services: 0, gmv: 0 };
        dailyMap[s.day].services += 1;
        dailyMap[s.day].gmv += s.cobro;
      });
      const dailyCurrent: DailyData[] = Object.entries(dailyMap)
        .map(([d, v]) => ({
          day: Number(d),
          dayLabel: `${Number(d)} ${MONTH_LABELS[currentMonth]}`,
          services: v.services,
          gmv: v.gmv,
        }))
        .sort((a, b) => a.day - b.day);

      // Daily Previous Month
      const dailyPrevMap: Record<number, { services: number; gmv: number }> = {};
      enriched.filter(s => s.year === prevYear && s.month === prevMonth).forEach(s => {
        if (!dailyPrevMap[s.day]) dailyPrevMap[s.day] = { services: 0, gmv: 0 };
        dailyPrevMap[s.day].services += 1;
        dailyPrevMap[s.day].gmv += s.cobro;
      });
      const dailyPrevious: DailyData[] = Object.entries(dailyPrevMap)
        .map(([d, v]) => ({
          day: Number(d),
          dayLabel: `${Number(d)} ${MONTH_LABELS[prevMonth]}`,
          services: v.services,
          gmv: v.gmv,
        }))
        .sort((a, b) => a.day - b.day);

      // Clients MTD
      const clientMap: Record<string, { services: number; gmv: number }> = {};
      enriched.filter(s => s.year === currentYear && s.month === currentMonth).forEach(s => {
        if (!clientMap[s.client]) clientMap[s.client] = { services: 0, gmv: 0 };
        clientMap[s.client].services += 1;
        clientMap[s.client].gmv += s.cobro;
      });
      const clientsMTD: ClientMTDData[] = Object.entries(clientMap)
        .map(([client, d]) => ({
          client, services: d.services, gmv: d.gmv,
          aov: d.services > 0 ? d.gmv / d.services : 0,
        }))
        .sort((a, b) => b.gmv - a.gmv)
        .slice(0, 15);

      // Weekday Comparison - Promedio por ocurrencia de cada día
      const weekdayCurrent: Record<number, number> = {};
      const weekdayPrev: Record<number, number> = {};
      const weekdayCurrentDays: Record<number, Set<string>> = {};
      const weekdayPrevDays: Record<number, Set<string>> = {};

      enriched.filter(s => s.year === currentYear && s.month === currentMonth).forEach(s => {
        weekdayCurrent[s.weekdayIndex] = (weekdayCurrent[s.weekdayIndex] || 0) + 1;
        if (!weekdayCurrentDays[s.weekdayIndex]) weekdayCurrentDays[s.weekdayIndex] = new Set();
        weekdayCurrentDays[s.weekdayIndex].add(String(s.day));
      });
      enriched.filter(s => s.year === prevYear && s.month === prevMonth).forEach(s => {
        weekdayPrev[s.weekdayIndex] = (weekdayPrev[s.weekdayIndex] || 0) + 1;
        if (!weekdayPrevDays[s.weekdayIndex]) weekdayPrevDays[s.weekdayIndex] = new Set();
        weekdayPrevDays[s.weekdayIndex].add(String(s.day));
      });
      const weekdayComparison: WeekdayData[] = WEEKDAY_LABELS.map((label, idx) => ({
        weekday: label, weekdayIndex: idx,
        currentMTD: weekdayCurrentDays[idx]?.size
          ? Math.round((weekdayCurrent[idx] || 0) / weekdayCurrentDays[idx].size)
          : 0,
        previousMTD: weekdayPrevDays[idx]?.size
          ? Math.round((weekdayPrev[idx] || 0) / weekdayPrevDays[idx].size)
          : 0,
      }));

      // ========================================
      // SOURCE 3: Paginated detail for last 12 months (local/foraneo + armed)
      // ========================================
      const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1);
      const lfStart = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

      const lfRecords = await fetchAllPaginated(() =>
        supabase
          .from('servicios_custodia')
          .select('fecha_hora_cita, local_foraneo, nombre_armado')
          .gte('fecha_hora_cita', lfStart)
          .not('estado', 'eq', 'Cancelado')
      );

      const lfEnriched = lfRecords.map(s => {
        const fecha = s.fecha_hora_cita;
        if (!fecha) return null;
        const year = getCDMXYear(fecha);
        const month = getCDMXMonth(fecha);
        return {
          year, month,
          localForaneo: s.local_foraneo || '',
          armed: !!s.nombre_armado && s.nombre_armado.trim() !== '',
        };
      }).filter(Boolean) as Array<{ year: number; month: number; localForaneo: string; armed: boolean }>;

      // Local/Foráneo Monthly
      const lfMap: Record<string, { local: number; foraneo: number }> = {};
      lfEnriched.forEach(s => {
        const key = `${s.year}-${String(s.month + 1).padStart(2, '0')}`;
        if (!lfMap[key]) lfMap[key] = { local: 0, foraneo: 0 };
        const tipo = s.localForaneo?.toLowerCase() || '';
        if (tipo.includes('local') || tipo.includes('reparto')) {
          lfMap[key].local += 1;
        } else {
          lfMap[key].foraneo += 1;
        }
      });
      const localForaneoMonthly: LocalForaneoData[] = Object.entries(lfMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([ym, d]) => {
          const total = d.local + d.foraneo;
          return {
            yearMonth: ym, local: d.local, foraneo: d.foraneo, total,
            localPct: total > 0 ? (d.local / total) * 100 : 0,
            foraneoPct: total > 0 ? (d.foraneo / total) * 100 : 0,
          };
        });

      // Armed Monthly
      const armedMap: Record<string, { armed: number; notArmed: number }> = {};
      lfEnriched.forEach(s => {
        const key = `${s.year}-${String(s.month + 1).padStart(2, '0')}`;
        if (!armedMap[key]) armedMap[key] = { armed: 0, notArmed: 0 };
        if (s.armed) armedMap[key].armed += 1;
        else armedMap[key].notArmed += 1;
      });
      const armedMonthly: ArmedData[] = Object.entries(armedMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([ym, d]) => {
          const total = d.armed + d.notArmed;
          return {
            yearMonth: ym, armed: d.armed, notArmed: d.notArmed, total,
            armedPct: total > 0 ? (d.armed / total) * 100 : 0,
          };
        });

      return {
        monthlyByYear, quarterlyByYear, yearlyTotals,
        dailyCurrent, clientsMTD, weekdayComparison,
        dailyPrevious,
        localForaneoMonthly, armedMonthly,
        currentYear, currentMonth: currentMonth + 1,
        prevYear, prevMonth: prevMonth + 1,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    monthlyByYear: data?.monthlyByYear || [],
    quarterlyByYear: data?.quarterlyByYear || [],
    yearlyTotals: data?.yearlyTotals || [],
    dailyCurrent: data?.dailyCurrent || [],
    dailyPrevious: data?.dailyPrevious || [],
    clientsMTD: data?.clientsMTD || [],
    weekdayComparison: data?.weekdayComparison || [],
    localForaneoMonthly: data?.localForaneoMonthly || [],
    armedMonthly: data?.armedMonthly || [],
    currentYear: data?.currentYear || new Date().getFullYear(),
    currentMonth: data?.currentMonth || new Date().getMonth() + 1,
    prevYear: data?.prevYear || new Date().getFullYear(),
    prevMonth: data?.prevMonth || new Date().getMonth(),
    loading: isLoading,
    error,
  };
}
