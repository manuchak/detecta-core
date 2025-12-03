import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export interface AdoptionMetrics {
  mesActual: {
    planificados: number;
    ejecutados: number;
    tasaAdopcion: number;
    brechaServicios: number;
  };
  mesAnterior: {
    planificados: number;
    ejecutados: number;
    tasaAdopcion: number;
  };
  tendenciaMensual: number;
  metaAdopcion: number;
  historicoAdopcion: Array<{
    mes: string;
    mesLabel: string;
    planificados: number;
    ejecutados: number;
    tasaAdopcion: number;
    sinPlanificar: number;
  }>;
  proyeccion: {
    fechaMeta100: string | null;
    tendenciaPromedio: number;
  };
}

export function useAdoptionMetrics() {
  return useQuery({
    queryKey: ['adoption-metrics'],
    queryFn: async (): Promise<AdoptionMetrics> => {
      const now = new Date();
      const inicioMesActual = startOfMonth(now);
      const inicioMesAnterior = startOfMonth(subMonths(now, 1));
      
      // Fetch last 6 months of data for historical analysis
      const inicioHistorico = startOfMonth(subMonths(now, 5));

      // Query servicios_planificados grouped by month
      const { data: planificadosData, error: planError } = await supabase
        .from('servicios_planificados')
        .select('created_at')
        .gte('created_at', inicioHistorico.toISOString());

      if (planError) throw planError;

      // Query servicios_custodia (executed) grouped by month
      const { data: ejecutadosData, error: ejError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita')
        .gte('fecha_hora_cita', inicioHistorico.toISOString());

      if (ejError) throw ejError;

      // Group by month
      const planificadosPorMes: Record<string, number> = {};
      const ejecutadosPorMes: Record<string, number> = {};

      // Process planificados
      planificadosData?.forEach(s => {
        if (s.created_at) {
          const mes = format(new Date(s.created_at), 'yyyy-MM');
          planificadosPorMes[mes] = (planificadosPorMes[mes] || 0) + 1;
        }
      });

      // Process ejecutados - handle text date format
      ejecutadosData?.forEach(s => {
        if (s.fecha_hora_cita) {
          try {
            // fecha_hora_cita is stored as text, parse it
            const fecha = new Date(s.fecha_hora_cita);
            if (!isNaN(fecha.getTime())) {
              const mes = format(fecha, 'yyyy-MM');
              ejecutadosPorMes[mes] = (ejecutadosPorMes[mes] || 0) + 1;
            }
          } catch {
            // Skip invalid dates
          }
        }
      });

      // Build historical data (last 6 months)
      const historicoAdopcion = [];
      for (let i = 5; i >= 0; i--) {
        const fecha = subMonths(now, i);
        const mes = format(fecha, 'yyyy-MM');
        const mesLabel = format(fecha, 'MMM yyyy', { locale: es });
        const planificados = planificadosPorMes[mes] || 0;
        const ejecutados = ejecutadosPorMes[mes] || 0;
        const tasaAdopcion = ejecutados > 0 ? Math.round((planificados / ejecutados) * 100 * 10) / 10 : 0;
        const sinPlanificar = Math.max(0, ejecutados - planificados);

        historicoAdopcion.push({
          mes,
          mesLabel,
          planificados,
          ejecutados,
          tasaAdopcion,
          sinPlanificar
        });
      }

      // Current month metrics
      const mesActualKey = format(now, 'yyyy-MM');
      const mesAnteriorKey = format(subMonths(now, 1), 'yyyy-MM');

      const planificadosActual = planificadosPorMes[mesActualKey] || 0;
      const ejecutadosActual = ejecutadosPorMes[mesActualKey] || 0;
      const tasaActual = ejecutadosActual > 0 ? Math.round((planificadosActual / ejecutadosActual) * 100 * 10) / 10 : 0;

      const planificadosAnterior = planificadosPorMes[mesAnteriorKey] || 0;
      const ejecutadosAnterior = ejecutadosPorMes[mesAnteriorKey] || 0;
      const tasaAnterior = ejecutadosAnterior > 0 ? Math.round((planificadosAnterior / ejecutadosAnterior) * 100 * 10) / 10 : 0;

      const tendenciaMensual = tasaActual - tasaAnterior;

      // Calculate projection to 100%
      const tasasConValor = historicoAdopcion.filter(h => h.tasaAdopcion > 0);
      let tendenciaPromedio = 0;
      let fechaMeta100: string | null = null;

      if (tasasConValor.length >= 2) {
        // Calculate average monthly growth
        const crecimientos = [];
        for (let i = 1; i < tasasConValor.length; i++) {
          crecimientos.push(tasasConValor[i].tasaAdopcion - tasasConValor[i - 1].tasaAdopcion);
        }
        tendenciaPromedio = crecimientos.reduce((a, b) => a + b, 0) / crecimientos.length;

        if (tendenciaPromedio > 0 && tasaActual < 100) {
          const mesesParaMeta = Math.ceil((100 - tasaActual) / tendenciaPromedio);
          const fechaProyectada = subMonths(now, -mesesParaMeta);
          fechaMeta100 = format(fechaProyectada, 'MMMM yyyy', { locale: es });
        }
      }

      return {
        mesActual: {
          planificados: planificadosActual,
          ejecutados: ejecutadosActual,
          tasaAdopcion: tasaActual,
          brechaServicios: Math.max(0, ejecutadosActual - planificadosActual)
        },
        mesAnterior: {
          planificados: planificadosAnterior,
          ejecutados: ejecutadosAnterior,
          tasaAdopcion: tasaAnterior
        },
        tendenciaMensual,
        metaAdopcion: 100,
        historicoAdopcion,
        proyeccion: {
          fechaMeta100,
          tendenciaPromedio: Math.round(tendenciaPromedio * 10) / 10
        }
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000
  });
}
