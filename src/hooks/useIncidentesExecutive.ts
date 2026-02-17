import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IncidenteQuarterlyData {
  year: number;
  quarter: number;
  quarterLabel: string;
  total: number;
  criticos: number;
  noCriticos: number;
  tasaCriticos: number;
}

export function useIncidentesExecutive() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['incidentes-executive-quarterly'],
    queryFn: async () => {
      const { data: incidents, error: err } = await supabase
        .from('incidentes_operativos')
        .select('fecha_incidente, severidad');

      if (err) throw err;

      const quarterMap: Record<string, { total: number; criticos: number }> = {};

      (incidents || []).forEach(inc => {
        if (!inc.fecha_incidente) return;
        const d = new Date(inc.fecha_incidente);
        const year = d.getFullYear();
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        const key = `${year}-T${quarter}`;
        if (!quarterMap[key]) quarterMap[key] = { total: 0, criticos: 0 };
        quarterMap[key].total += 1;
        const sev = (inc.severidad || '').toLowerCase();
        if (sev === 'critica' || sev === 'crítica' || sev === 'alta') {
          quarterMap[key].criticos += 1;
        }
      });

      const result: IncidenteQuarterlyData[] = Object.entries(quarterMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, d]) => {
          const [yearStr, qLabel] = key.split('-');
          const year = Number(yearStr);
          const quarter = Number(qLabel.replace('T', ''));
          return {
            year, quarter, quarterLabel: qLabel,
            total: d.total, criticos: d.criticos,
            noCriticos: d.total - d.criticos,
            tasaCriticos: d.total > 0 ? (d.criticos / d.total) * 100 : 0,
          };
        });

      return result;
    },
    staleTime: 10 * 60 * 1000,
  });

  return { data: data || [], loading: isLoading, error };
}
