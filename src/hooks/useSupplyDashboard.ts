import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupplyMetrics {
  total_leads: number;
  leads_this_month: number;
  conversion_rate: number;
  pending_approvals: number;
  custodians_active: number;
  custodians_total: number;
  tickets_open: number;
  tickets_resolved_this_week: number;
  services_completed_today: number;
  avg_response_time_hours: number;
}

interface LeadProcessingMetrics {
  leads_in_psicometricos: number;
  leads_in_toxicologicos: number;
  leads_pending_gps: number;
  leads_active_custodians: number;
  avg_processing_time_days: number;
}

interface EmailAutomation {
  id: string;
  trigger_type: 'lead_timeout' | 'custodian_inactive' | 'ticket_escalation';
  status: 'active' | 'paused';
  last_sent: string;
  total_sent: number;
  success_rate: number;
}

export const useSupplyDashboard = () => {
  const [metrics, setMetrics] = useState<SupplyMetrics>({
    total_leads: 0,
    leads_this_month: 0,
    conversion_rate: 0,
    pending_approvals: 0,
    custodians_active: 0,
    custodians_total: 0,
    tickets_open: 0,
    tickets_resolved_this_week: 0,
    services_completed_today: 0,
    avg_response_time_hours: 0
  });

  const [leadProcessing, setLeadProcessing] = useState<LeadProcessingMetrics>({
    leads_in_psicometricos: 0,
    leads_in_toxicologicos: 0,
    leads_pending_gps: 0,
    leads_active_custodians: 0,
    avg_processing_time_days: 0
  });

  const [emailAutomations, setEmailAutomations] = useState<EmailAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSupplyMetrics();
  }, []);

  const fetchSupplyMetrics = async () => {
    try {
      setLoading(true);

      // Fetch leads metrics
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('estado, created_at')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (leadsError) throw leadsError;

      // Calculate basic metrics
      const totalLeads = leadsData?.length || 0;
      const leadsThisMonth = leadsData?.filter(lead => 
        new Date(lead.created_at).getMonth() === new Date().getMonth()
      ).length || 0;

      // Count leads by processing state
      const psicometricosCount = leadsData?.filter(lead => 
        lead.estado === 'psicometricos_pendiente'
      ).length || 0;

      const toxicologicosCount = leadsData?.filter(lead => 
        lead.estado === 'toxicologicos_pendiente'
      ).length || 0;

      const gpsCount = leadsData?.filter(lead => 
        lead.estado === 'instalacion_gps_pendiente'
      ).length || 0;

      const activeCustodiansCount = leadsData?.filter(lead => 
        lead.estado === 'custodio_activo'
      ).length || 0;

      // Fetch tickets metrics
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('status, created_at, resolved_at');

      if (ticketsError) throw ticketsError;

      const openTickets = ticketsData?.filter(ticket => 
        ['abierto', 'en_progreso'].includes(ticket.status)
      ).length || 0;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const resolvedThisWeek = ticketsData?.filter(ticket => 
        ticket.resolved_at && new Date(ticket.resolved_at) >= weekAgo
      ).length || 0;

      // Mock data for services (will be replaced with real data later)
      const servicesCompletedToday = Math.floor(Math.random() * 25) + 10;
      const avgResponseTime = Math.floor(Math.random() * 12) + 2;

      // Set metrics
      setMetrics({
        total_leads: totalLeads,
        leads_this_month: leadsThisMonth,
        conversion_rate: totalLeads > 0 ? (activeCustodiansCount / totalLeads) * 100 : 0,
        pending_approvals: Math.floor(Math.random() * 5) + 1,
        custodians_active: activeCustodiansCount,
        custodians_total: activeCustodiansCount + Math.floor(Math.random() * 10) + 5,
        tickets_open: openTickets,
        tickets_resolved_this_week: resolvedThisWeek,
        services_completed_today: servicesCompletedToday,
        avg_response_time_hours: avgResponseTime
      });

      setLeadProcessing({
        leads_in_psicometricos: psicometricosCount,
        leads_in_toxicologicos: toxicologicosCount,
        leads_pending_gps: gpsCount,
        leads_active_custodians: activeCustodiansCount,
        avg_processing_time_days: Math.floor(Math.random() * 10) + 3
      });

      // Mock email automations
      setEmailAutomations([
        {
          id: '1',
          trigger_type: 'lead_timeout',
          status: 'active',
          last_sent: new Date().toISOString(),
          total_sent: 45,
          success_rate: 87.2
        },
        {
          id: '2',
          trigger_type: 'custodian_inactive',
          status: 'active',
          last_sent: new Date(Date.now() - 86400000).toISOString(),
          total_sent: 23,
          success_rate: 91.3
        },
        {
          id: '3',
          trigger_type: 'ticket_escalation',
          status: 'paused',
          last_sent: new Date(Date.now() - 172800000).toISOString(),
          total_sent: 12,
          success_rate: 75.0
        }
      ]);

    } catch (error) {
      console.error('Error fetching supply metrics:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas del dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailAutomation = async (automationId: string) => {
    setEmailAutomations(prev => 
      prev.map(automation => 
        automation.id === automationId 
          ? { ...automation, status: automation.status === 'active' ? 'paused' : 'active' }
          : automation
      )
    );

    toast({
      title: "Automatización actualizada",
      description: "El estado de la automatización ha sido cambiado",
    });
  };

  return {
    metrics,
    leadProcessing,
    emailAutomations,
    loading,
    toggleEmailAutomation,
    refetch: fetchSupplyMetrics
  };
};