import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export interface MonthlyTrendData {
  mes: string;
  mesLabel: string;
  serviciosAsignados: number;
  serviciosConfirmados: number;
  serviciosCancelados: number;
  kmRecorridos: number;
  ingresos: number;
  tasaCumplimiento: number;
}

export function useProfileTrends(custodioId: string | undefined, nombre: string | undefined) {
  return useQuery({
    queryKey: ['profile-trends', custodioId, nombre],
    queryFn: async () => {
      const trends: MonthlyTrendData[] = [];
      const now = new Date();
      
      // Get data for the last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const mesKey = format(monthDate, 'yyyy-MM');
        const mesLabel = format(monthDate, 'MMM', { locale: es });
        
        let serviciosAsignados = 0;
        let serviciosConfirmados = 0;
        let serviciosCancelados = 0;
        let kmRecorridos = 0;
        let ingresos = 0;

        // Query servicios_planificados for this month
        if (custodioId) {
          const { data: planificados } = await supabase
            .from('servicios_planificados')
            .select('id, estado_planeacion')
            .eq('custodio_id', custodioId)
            .gte('fecha_hora_cita', monthStart.toISOString())
            .lte('fecha_hora_cita', monthEnd.toISOString());
          
          if (planificados) {
            serviciosAsignados = planificados.length;
            serviciosConfirmados = planificados.filter(s => s.estado_planeacion === 'confirmado').length;
            serviciosCancelados = planificados.filter(s => s.estado_planeacion === 'cancelado').length;
          }
        }

        // Query servicios_custodia for this month
        if (nombre) {
          const { data: ejecutados } = await supabase
            .from('servicios_custodia')
            .select('id, km_recorridos, km_teorico, costo_custodio')
            .ilike('nombre_custodio', `%${nombre}%`)
            .gte('fecha_hora_cita', monthStart.toISOString())
            .lte('fecha_hora_cita', monthEnd.toISOString());
          
          if (ejecutados) {
            kmRecorridos = ejecutados.reduce((sum, s) => sum + (s.km_recorridos || s.km_teorico || 0), 0);
            ingresos = ejecutados.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
          }
        }

        const tasaCumplimiento = serviciosAsignados > 0 
          ? Math.round((serviciosConfirmados / serviciosAsignados) * 100)
          : 0;

        trends.push({
          mes: mesKey,
          mesLabel: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
          serviciosAsignados,
          serviciosConfirmados,
          serviciosCancelados,
          kmRecorridos: Math.round(kmRecorridos),
          ingresos: Math.round(ingresos),
          tasaCumplimiento
        });
      }

      return trends;
    },
    enabled: !!(custodioId || nombre)
  });
}
