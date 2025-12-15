import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth, parseISO, differenceInMinutes } from 'date-fns';

export interface TicketMetrics {
  // KPIs principales
  avgFirstResponseTime: number; // minutos
  avgResolutionTime: number; // minutos
  slaComplianceRate: number; // porcentaje
  avgCsat: number; // 1-5
  
  // Volumen
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  
  // Por período
  ticketsByDay: { date: string; created: number; resolved: number }[];
  ticketsByCategory: { categoria: string; count: number; color: string }[];
  ticketsByDepartment: { departamento: string; count: number; avgResolution: number; slaCompliance: number }[];
  
  // Heatmap
  loadHeatmap: { day: number; hour: number; count: number }[][];
  
  // Por agente
  agentPerformance: {
    agent_id: string;
    nombre: string;
    assigned: number;
    resolved: number;
    avgResponse: number;
    avgResolution: number;
    slaCompliance: number;
    avgCsat: number;
  }[];
  
  // Tendencias
  trendFirstResponse: number; // % cambio vs período anterior
  trendResolution: number;
  trendSlaCompliance: number;
  trendCsat: number;
}

interface UseTicketMetricsOptions {
  startDate?: Date;
  endDate?: Date;
  departamento?: string;
  agentId?: string;
}

export const useTicketMetrics = (options: UseTicketMetricsOptions = {}) => {
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    startDate = startOfMonth(new Date()),
    endDate = new Date(),
    departamento,
    agentId
  } = options;

  const calculateMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // Fetch tickets with related data
      let query = supabase
        .from('tickets')
        .select(`
          *,
          categoria:ticket_categorias_custodio(nombre, color, departamento_responsable),
          assigned:profiles!tickets_assigned_to_fkey(full_name)
        `)
        .gte('created_at', startStr)
        .lte('created_at', endStr + 'T23:59:59');

      if (departamento) {
        query = query.eq('categoria.departamento_responsable', departamento);
      }

      if (agentId) {
        query = query.eq('assigned_to', agentId);
      }

      const { data: tickets, error: ticketsError } = await query;

      if (ticketsError) throw ticketsError;

      // Fetch responses for first response time
      const ticketIds = (tickets || []).map(t => t.id);
      const { data: responses } = await supabase
        .from('ticket_respuestas')
        .select('ticket_id, created_at, es_interna')
        .in('ticket_id', ticketIds.length > 0 ? ticketIds : ['none'])
        .eq('es_interna', false)
        .order('created_at', { ascending: true });

      // Calculate first response times
      const firstResponses = new Map<string, Date>();
      (responses || []).forEach(r => {
        if (!firstResponses.has(r.ticket_id)) {
          firstResponses.set(r.ticket_id, parseISO(r.created_at));
        }
      });

      // Calculate metrics
      const now = new Date();
      let totalFirstResponseMinutes = 0;
      let firstResponseCount = 0;
      let totalResolutionMinutes = 0;
      let resolutionCount = 0;
      let slaMetCount = 0;
      let slaApplicableCount = 0;
      let totalCsat = 0;
      let csatCount = 0;
      let overdueCount = 0;

      const categoryMap = new Map<string, { count: number; color: string }>();
      const departmentMap = new Map<string, { count: number; totalResolution: number; slaMet: number; total: number }>();
      const dayMap = new Map<string, { created: number; resolved: number }>();
      const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

      (tickets || []).forEach(ticket => {
        const createdAt = parseISO(ticket.created_at);
        const dateKey = format(createdAt, 'yyyy-MM-dd');
        
        // Daily tracking
        const dayData = dayMap.get(dateKey) || { created: 0, resolved: 0 };
        dayData.created++;
        dayMap.set(dateKey, dayData);

        // Heatmap (day of week x hour)
        const dayOfWeek = createdAt.getDay();
        const hour = createdAt.getHours();
        heatmap[dayOfWeek][hour]++;

        // Category tracking
        const catName = ticket.categoria?.nombre || 'Sin categoría';
        const catColor = ticket.categoria?.color || '#6B7280';
        const catData = categoryMap.get(catName) || { count: 0, color: catColor };
        catData.count++;
        categoryMap.set(catName, catData);

        // Department tracking
        const dept = ticket.categoria?.departamento_responsable || 'Sin asignar';
        const deptData = departmentMap.get(dept) || { count: 0, totalResolution: 0, slaMet: 0, total: 0 };
        deptData.count++;
        deptData.total++;

        // First response time
        const firstResponse = firstResponses.get(ticket.id);
        if (firstResponse) {
          const responseMinutes = differenceInMinutes(firstResponse, createdAt);
          totalFirstResponseMinutes += responseMinutes;
          firstResponseCount++;
        }

        // Resolution time
        if (ticket.estado === 'resuelto' && ticket.resolved_at) {
          const resolvedAt = parseISO(ticket.resolved_at);
          const resolutionMinutes = differenceInMinutes(resolvedAt, createdAt);
          totalResolutionMinutes += resolutionMinutes;
          resolutionCount++;
          deptData.totalResolution += resolutionMinutes;

          const resolvedDateKey = format(resolvedAt, 'yyyy-MM-dd');
          const resolvedDayData = dayMap.get(resolvedDateKey) || { created: 0, resolved: 0 };
          resolvedDayData.resolved++;
          dayMap.set(resolvedDateKey, resolvedDayData);
        }

        // SLA compliance
        if (ticket.sla_deadline_resolucion) {
          slaApplicableCount++;
          const deadline = parseISO(ticket.sla_deadline_resolucion);
          if (ticket.estado === 'resuelto' && ticket.resolved_at) {
            const resolvedAt = parseISO(ticket.resolved_at);
            if (resolvedAt <= deadline) {
              slaMetCount++;
              deptData.slaMet++;
            }
          } else if (now > deadline) {
            overdueCount++;
          }
        }

        // CSAT
        if (ticket.csat_rating) {
          totalCsat += ticket.csat_rating;
          csatCount++;
        }

        departmentMap.set(dept, deptData);
      });

      // Agent performance
      const agentMap = new Map<string, {
        nombre: string;
        assigned: number;
        resolved: number;
        totalResponse: number;
        responseCount: number;
        totalResolution: number;
        resolutionCount: number;
        slaMet: number;
        slaTotal: number;
        totalCsat: number;
        csatCount: number;
      }>();

      (tickets || []).forEach(ticket => {
        if (!ticket.assigned_to) return;

        const agentData = agentMap.get(ticket.assigned_to) || {
          nombre: ticket.assigned?.full_name || 'Sin nombre',
          assigned: 0,
          resolved: 0,
          totalResponse: 0,
          responseCount: 0,
          totalResolution: 0,
          resolutionCount: 0,
          slaMet: 0,
          slaTotal: 0,
          totalCsat: 0,
          csatCount: 0
        };

        agentData.assigned++;

        if (ticket.estado === 'resuelto') {
          agentData.resolved++;
          if (ticket.resolved_at) {
            const resolutionMinutes = differenceInMinutes(
              parseISO(ticket.resolved_at),
              parseISO(ticket.created_at)
            );
            agentData.totalResolution += resolutionMinutes;
            agentData.resolutionCount++;
          }
        }

        const firstResponse = firstResponses.get(ticket.id);
        if (firstResponse) {
          const responseMinutes = differenceInMinutes(
            firstResponse,
            parseISO(ticket.created_at)
          );
          agentData.totalResponse += responseMinutes;
          agentData.responseCount++;
        }

        if (ticket.sla_deadline_resolucion) {
          agentData.slaTotal++;
          const deadline = parseISO(ticket.sla_deadline_resolucion);
          if (ticket.estado === 'resuelto' && ticket.resolved_at) {
            if (parseISO(ticket.resolved_at) <= deadline) {
              agentData.slaMet++;
            }
          }
        }

        if (ticket.csat_rating) {
          agentData.totalCsat += ticket.csat_rating;
          agentData.csatCount++;
        }

        agentMap.set(ticket.assigned_to, agentData);
      });

      // Build final metrics object
      const calculatedMetrics: TicketMetrics = {
        avgFirstResponseTime: firstResponseCount > 0 ? totalFirstResponseMinutes / firstResponseCount : 0,
        avgResolutionTime: resolutionCount > 0 ? totalResolutionMinutes / resolutionCount : 0,
        slaComplianceRate: slaApplicableCount > 0 ? (slaMetCount / slaApplicableCount) * 100 : 100,
        avgCsat: csatCount > 0 ? totalCsat / csatCount : 0,
        
        totalTickets: tickets?.length || 0,
        openTickets: (tickets || []).filter(t => t.estado !== 'resuelto' && t.estado !== 'cerrado').length,
        resolvedTickets: (tickets || []).filter(t => t.estado === 'resuelto' || t.estado === 'cerrado').length,
        overdueTickets: overdueCount,
        
        ticketsByDay: Array.from(dayMap.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        
        ticketsByCategory: Array.from(categoryMap.entries())
          .map(([categoria, data]) => ({ categoria, count: data.count, color: data.color }))
          .sort((a, b) => b.count - a.count),
        
        ticketsByDepartment: Array.from(departmentMap.entries())
          .map(([departamento, data]) => ({
            departamento,
            count: data.count,
            avgResolution: data.count > 0 ? data.totalResolution / data.count : 0,
            slaCompliance: data.total > 0 ? (data.slaMet / data.total) * 100 : 100
          })),
        
        loadHeatmap: heatmap.map((dayData, day) => 
          dayData.map((count, hour) => ({ day, hour, count }))
        ),
        
        agentPerformance: Array.from(agentMap.entries())
          .map(([agent_id, data]) => ({
            agent_id,
            nombre: data.nombre,
            assigned: data.assigned,
            resolved: data.resolved,
            avgResponse: data.responseCount > 0 ? data.totalResponse / data.responseCount : 0,
            avgResolution: data.resolutionCount > 0 ? data.totalResolution / data.resolutionCount : 0,
            slaCompliance: data.slaTotal > 0 ? (data.slaMet / data.slaTotal) * 100 : 100,
            avgCsat: data.csatCount > 0 ? data.totalCsat / data.csatCount : 0
          }))
          .sort((a, b) => b.resolved - a.resolved),
        
        // Trends (simplified - would need previous period data for accurate calculation)
        trendFirstResponse: 0,
        trendResolution: 0,
        trendSlaCompliance: 0,
        trendCsat: 0
      };

      setMetrics(calculatedMetrics);
    } catch (err) {
      console.error('Error calculating metrics:', err);
      setError('Error al calcular métricas');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departamento, agentId]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: calculateMetrics
  };
};

// Helper to format minutes as human readable
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
};
