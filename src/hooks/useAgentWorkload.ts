import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentWorkload {
  agent_id: string;
  display_name: string;
  email: string;
  role: string;
  tickets_activos: number;
  tickets_abiertos: number;
  tickets_en_progreso: number;
  avg_age_hours: number;
}

export interface AgentWorkloadStats {
  totalAgents: number;
  totalActiveTickets: number;
  avgTicketsPerAgent: number;
  mostLoadedAgent: AgentWorkload | null;
  leastLoadedAgent: AgentWorkload | null;
}

export const useAgentWorkload = () => {
  const [agents, setAgents] = useState<AgentWorkload[]>([]);
  const [stats, setStats] = useState<AgentWorkloadStats>({
    totalAgents: 0,
    totalActiveTickets: 0,
    avgTicketsPerAgent: 0,
    mostLoadedAgent: null,
    leastLoadedAgent: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('v_ticket_agent_workload')
        .select('*')
        .order('tickets_activos', { ascending: true });

      if (fetchError) throw fetchError;

      const agentData: AgentWorkload[] = (data || []).map(row => ({
        agent_id: row.agent_id,
        display_name: row.display_name || 'Sin nombre',
        email: row.email || '',
        role: row.role,
        tickets_activos: Number(row.tickets_activos) || 0,
        tickets_abiertos: Number(row.tickets_abiertos) || 0,
        tickets_en_progreso: Number(row.tickets_en_progreso) || 0,
        avg_age_hours: Number(row.avg_age_hours) || 0
      }));

      setAgents(agentData);

      // Calculate stats
      const totalActiveTickets = agentData.reduce((sum, a) => sum + a.tickets_activos, 0);
      const agentsWithTickets = agentData.filter(a => a.tickets_activos > 0);
      
      setStats({
        totalAgents: agentData.length,
        totalActiveTickets,
        avgTicketsPerAgent: agentData.length > 0 
          ? Math.round((totalActiveTickets / agentData.length) * 10) / 10 
          : 0,
        mostLoadedAgent: agentData.length > 0 
          ? agentData.reduce((max, a) => a.tickets_activos > max.tickets_activos ? a : max, agentData[0])
          : null,
        leastLoadedAgent: agentData.length > 0 ? agentData[0] : null
      });

    } catch (err) {
      console.error('Error loading agent workload:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const getAgentsByDepartment = useCallback((departamento: string): AgentWorkload[] => {
    // Map department to roles
    const roleMapping: Record<string, string[]> = {
      finanzas: ['admin', 'owner'],
      planeacion: ['supply_admin', 'admin', 'owner'],
      instaladores: ['supply_lead', 'admin', 'owner'],
      supply: ['supply_admin', 'supply_lead', 'admin', 'owner'],
      soporte: ['soporte', 'admin', 'owner']
    };

    const allowedRoles = roleMapping[departamento] || ['admin', 'owner'];
    return agents.filter(a => allowedRoles.includes(a.role));
  }, [agents]);

  const getLeastLoadedForDepartment = useCallback((departamento: string): AgentWorkload | null => {
    const deptAgents = getAgentsByDepartment(departamento);
    if (deptAgents.length === 0) return null;
    
    return deptAgents.reduce((min, a) => 
      a.tickets_activos < min.tickets_activos ? a : min, 
      deptAgents[0]
    );
  }, [getAgentsByDepartment]);

  useEffect(() => {
    loadWorkload();
  }, [loadWorkload]);

  return {
    agents,
    stats,
    loading,
    error,
    refetch: loadWorkload,
    getAgentsByDepartment,
    getLeastLoadedForDepartment
  };
};

export default useAgentWorkload;
