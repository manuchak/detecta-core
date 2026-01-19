import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WidgetType } from '@/config/roleHomeConfig';

interface WidgetData {
  value: number | string;
  subtext?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
}

const fetchWidgetData = async (type: WidgetType): Promise<WidgetData> => {
  try {
    switch (type) {
      case 'pendingCandidates': {
        const { count } = await supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .in('estado_proceso', ['lead', 'entrevista', 'documentacion', 'en_liberacion']);
        
        return { value: count || 0 };
      }

      case 'activeCustodians': {
        // Custodios únicos con servicios en el mes actual
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { data } = await supabase
          .from('servicios_custodia')
          .select('nombre_custodio')
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .neq('estado', 'Cancelado')
          .not('nombre_custodio', 'is', null);
        
        const uniqueCustodians = new Set(data?.map(d => d.nombre_custodio) || []);
        return { value: uniqueCustodians.size };
      }

      case 'monthlyGMV': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const { data } = await supabase
          .from('servicios_custodia')
          .select('cobro_cliente')
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .lt('fecha_hora_cita', nextMonth.toISOString())
          .neq('estado', 'Cancelado')
          .gt('cobro_cliente', 0);
        
        const total = data?.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0) || 0;
        
        if (total >= 1000000) {
          return { value: `$${(total / 1000000).toFixed(1)}M` };
        } else if (total >= 1000) {
          return { value: `$${(total / 1000).toFixed(0)}K` };
        }
        return { value: `$${total.toLocaleString()}` };
      }

      case 'monthlyServices': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const { count } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .lt('fecha_hora_cita', nextMonth.toISOString())
          .neq('estado', 'Cancelado');
        
        return { value: count || 0 };
      }

      case 'todayServices': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { count } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', today.toISOString())
          .lt('fecha_hora_cita', tomorrow.toISOString())
          .neq('estado', 'Cancelado');
        
        return { value: count || 0 };
      }

      case 'weekServices': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        
        const { count } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', today.toISOString())
          .lt('fecha_hora_cita', weekEnd.toISOString())
          .neq('estado', 'Cancelado');
        
        return { value: count || 0 };
      }

      case 'completionRate': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const today = new Date();
        
        const { count: total } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .lte('fecha_hora_cita', today.toISOString())
          .neq('estado', 'Cancelado');
        
        const { count: completed } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .lte('fecha_hora_cita', today.toISOString())
          .eq('estado', 'Finalizado');
        
        const rate = total ? Math.round((completed || 0) / total * 100) : 0;
        return { value: `${rate}%` };
      }

      case 'unassignedServices': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', today.toISOString())
          .or('nombre_custodio.is.null,nombre_custodio.eq.')
          .neq('estado', 'Cancelado');
        
        return { value: count || 0 };
      }

      case 'newLeads': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count } = await supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString());
        
        return { value: count || 0 };
      }

      case 'conversionRate': {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        const { count: total } = await supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthAgo.toISOString());
        
        const { count: converted } = await supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthAgo.toISOString())
          .eq('estado_proceso', 'liberado');
        
        const rate = total ? Math.round((converted || 0) / total * 100) : 0;
        return { value: `${rate}%` };
      }

      case 'myAssigned': {
        const { count } = await supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .in('estado_proceso', ['entrevista', 'documentacion']);
        
        return { value: count || 0 };
      }

      case 'activeAlerts': {
        const { count } = await supabase
          .from('alertas_sistema_nacional')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente');
        
        return { value: count || 0 };
      }

      case 'vehiclesOnline': {
        const { count } = await supabase
          .from('activos_monitoreo')
          .select('*', { count: 'exact', head: true })
          .eq('integrado_sistema', true);
        
        return { value: count || 0 };
      }

      case 'offlineVehicles': {
        const { count } = await supabase
          .from('activos_monitoreo')
          .select('*', { count: 'exact', head: true })
          .eq('integrado_sistema', false);
        
        return { value: count || 0 };
      }

      case 'openTickets': {
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .in('status', ['abierto', 'en_progreso']);
        
        return { value: count || 0 };
      }

      case 'pendingInstallations': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { count } = await supabase
          .from('programacion_instalaciones')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_programada', today.toISOString().split('T')[0])
          .lt('fecha_programada', tomorrow.toISOString().split('T')[0])
          .eq('estado', 'pendiente');
        
        return { value: count || 0 };
      }

      case 'completedInstallations': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        
        const { count } = await supabase
          .from('programacion_instalaciones')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_programada', startOfMonth.toISOString().split('T')[0])
          .eq('estado', 'completada');
        
        return { value: count || 0 };
      }

      // New executive-level widgets
      case 'gmvVariation': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const startOfPrevMonth = new Date(startOfMonth);
        startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
        
        const { data: currentData } = await supabase
          .from('servicios_custodia')
          .select('cobro_cliente')
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .lt('fecha_hora_cita', nextMonth.toISOString())
          .in('estado', ['completado', 'finalizado', 'Finalizado', 'Completado'])
          .gt('cobro_cliente', 0);
        
        const { data: prevData } = await supabase
          .from('servicios_custodia')
          .select('cobro_cliente')
          .gte('fecha_hora_cita', startOfPrevMonth.toISOString())
          .lt('fecha_hora_cita', startOfMonth.toISOString())
          .in('estado', ['completado', 'finalizado', 'Finalizado', 'Completado'])
          .gt('cobro_cliente', 0);
        
        const currentTotal = currentData?.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0) || 0;
        const prevTotal = prevData?.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0) || 0;
        
        const variation = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : 0;
        
        return { 
          value: `${variation >= 0 ? '+' : ''}${variation}%`,
          trend: variation,
          trendDirection: variation > 0 ? 'up' : variation < 0 ? 'down' : 'neutral'
        };
      }

      case 'serviceGrowth': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const startOfPrevMonth = new Date(startOfMonth);
        startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
        
        const { count: currentCount } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .lt('fecha_hora_cita', nextMonth.toISOString())
          .neq('estado', 'Cancelado');
        
        const { count: prevCount } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', startOfPrevMonth.toISOString())
          .lt('fecha_hora_cita', startOfMonth.toISOString())
          .neq('estado', 'Cancelado');
        
        const current = currentCount || 0;
        const prev = prevCount || 0;
        const growth = prev > 0 ? Math.round(((current - prev) / prev) * 100) : 0;
        
        return { 
          value: `${growth >= 0 ? '+' : ''}${growth}%`,
          trend: growth,
          trendDirection: growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'
        };
      }

      case 'capacityUtilization': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Get services with custodians assigned
        const { data: services } = await supabase
          .from('servicios_custodia')
          .select('nombre_custodio')
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .lt('fecha_hora_cita', nextMonth.toISOString())
          .neq('estado', 'Cancelado');
        
        if (!services || services.length === 0) {
          return { value: '0%' };
        }
        
        const assigned = services.filter(s => s.nombre_custodio).length;
        const rate = Math.round((assigned / services.length) * 100);
        
        return { 
          value: `${rate}%`,
          trendDirection: rate >= 90 ? 'up' : rate >= 70 ? 'neutral' : 'down'
        };
      }

      // === NEW WIDGETS WITH FULL CONTEXT (SUBTEXT) ===
      
      case 'monthlyGMVWithContext': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const startOfPrevMonth = new Date(startOfMonth);
        startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
        
        const { data: currentData } = await supabase
          .from('servicios_custodia')
          .select('cobro_cliente')
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .lt('fecha_hora_cita', nextMonth.toISOString())
          .neq('estado', 'Cancelado')
          .gt('cobro_cliente', 0);
        
        const { data: prevData } = await supabase
          .from('servicios_custodia')
          .select('cobro_cliente')
          .gte('fecha_hora_cita', startOfPrevMonth.toISOString())
          .lt('fecha_hora_cita', startOfMonth.toISOString())
          .neq('estado', 'Cancelado')
          .gt('cobro_cliente', 0);
        
        const currentTotal = currentData?.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0) || 0;
        const prevTotal = prevData?.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0) || 0;
        
        const variation = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : 0;
        
        // Format current GMV
        let formattedValue: string;
        if (currentTotal >= 1000000) {
          formattedValue = `$${(currentTotal / 1000000).toFixed(2)}M`;
        } else if (currentTotal >= 1000) {
          formattedValue = `$${(currentTotal / 1000).toFixed(0)}K`;
        } else {
          formattedValue = `$${currentTotal.toLocaleString()}`;
        }
        
        // Format previous GMV for context
        let prevFormatted: string;
        if (prevTotal >= 1000000) {
          prevFormatted = `$${(prevTotal / 1000000).toFixed(1)}M`;
        } else if (prevTotal >= 1000) {
          prevFormatted = `$${(prevTotal / 1000).toFixed(0)}K`;
        } else {
          prevFormatted = `$${prevTotal.toLocaleString()}`;
        }
        
        const monthName = new Date(startOfPrevMonth).toLocaleDateString('es-MX', { month: 'short' });
        
        return { 
          value: formattedValue,
          subtext: `${variation >= 0 ? '↑' : '↓'} ${Math.abs(variation)}% vs. ${prevFormatted} ${monthName}`,
          trend: variation,
          trendDirection: variation > 0 ? 'up' : variation < 0 ? 'down' : 'neutral'
        };
      }

      case 'activeCustodiansWithContext': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        // Custodians with services this month (activos)
        const { data: servicesData } = await supabase
          .from('servicios_custodia')
          .select('nombre_custodio')
          .gte('fecha_hora_cita', startOfMonth.toISOString())
          .neq('estado', 'Cancelado')
          .not('nombre_custodio', 'is', null);
        
        const activeCustodians = new Set(servicesData?.map(d => d.nombre_custodio) || []);
        const activeCount = activeCustodians.size;
        
        // Custodians released THIS MONTH by Supply
        const { count: releasedThisMonth } = await supabase
          .from('custodio_liberacion')
          .select('*', { count: 'exact', head: true })
          .eq('estado_liberacion', 'liberado')
          .gte('fecha_liberacion', startOfMonth.toISOString());
        
        const released = releasedThisMonth || 0;
        
        return { 
          value: activeCount,
          subtext: `${released} liberados este mes`,
          trendDirection: released >= 15 ? 'up' : released >= 5 ? 'neutral' : 'down'
        };
      }

      case 'completionRateToday': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { count: totalToday } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', today.toISOString())
          .lt('fecha_hora_cita', tomorrow.toISOString())
          .neq('estado', 'Cancelado');
        
        const { count: completedToday } = await supabase
          .from('servicios_custodia')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_hora_cita', today.toISOString())
          .lt('fecha_hora_cita', tomorrow.toISOString())
          .eq('estado', 'Finalizado');
        
        const total = totalToday || 0;
        const completed = completedToday || 0;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { 
          value: `${rate}%`,
          subtext: `${completed} de ${total} servicios`,
          trendDirection: rate >= 90 ? 'up' : rate >= 70 ? 'neutral' : 'down'
        };
      }

      default:
        return { value: 0 };
    }
  } catch (error) {
    console.error(`Error fetching widget data for type ${type}:`, error);
    return { value: 0 };
  }
};

export const useWidgetData = (type: WidgetType) => {
  return useQuery({
    queryKey: ['home-widget', type],
    queryFn: () => fetchWidgetData(type),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
