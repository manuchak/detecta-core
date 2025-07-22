import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupplyMetrics {
  leadsToday: number;
  leadsThisMonth: number;
  leadsThisWeek: number;
  contactRate: number;
  conversionRate: number;
  avgTimeToContact: number;
  leadsPerAnalyst: number;
  activeCandidates: number;
  candidatesInProcess: number;
  candidatesApproved: number;
  candidatesRejected: number;
  funnelMetrics: {
    leads: number;
    contacted: number;
    interviewed: number;
    approved: number;
    onboarded: number;
  };
  analystPerformance: Array<{
    name: string;
    leadsManaged: number;
    contactRate: number;
    conversionRate: number;
  }>;
}

export const useSupplyMetrics = () => {
  const [metrics, setMetrics] = useState<SupplyMetrics>({
    leadsToday: 0,
    leadsThisMonth: 0,
    leadsThisWeek: 0,
    contactRate: 0,
    conversionRate: 0,
    avgTimeToContact: 0,
    leadsPerAnalyst: 0,
    activeCandidates: 0,
    candidatesInProcess: 0,
    candidatesApproved: 0,
    candidatesRejected: 0,
    funnelMetrics: {
      leads: 0,
      contacted: 0,
      interviewed: 0,
      approved: 0,
      onboarded: 0,
    },
    analystPerformance: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSupplyMetrics();
  }, []);

  const fetchSupplyMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);

      // Fetch candidates data
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidatos_custodios')
        .select('*');

      if (candidatesError) throw candidatesError;

      if (!candidates) {
        throw new Error('No se pudieron obtener los datos de candidatos');
      }

      // Calculate metrics
      const leadsToday = candidates.filter(c => 
        new Date(c.created_at!) >= startOfToday
      ).length;

      const leadsThisMonth = candidates.filter(c => 
        new Date(c.created_at!) >= startOfMonth
      ).length;

      const leadsThisWeek = candidates.filter(c => 
        new Date(c.created_at!) >= startOfWeek
      ).length;

      const activeCandidates = candidates.filter(c => 
        c.estado_proceso === 'lead' || c.estado_proceso === 'contactado' || c.estado_proceso === 'entrevista'
      ).length;

      const candidatesInProcess = candidates.filter(c => 
        c.estado_proceso === 'contactado' || c.estado_proceso === 'entrevista'
      ).length;

      const candidatesApproved = candidates.filter(c => 
        c.estado_proceso === 'aprobado' || c.estado_proceso === 'contratado'
      ).length;

      const candidatesRejected = candidates.filter(c => 
        c.estado_proceso === 'rechazado'
      ).length;

      // Calculate conversion rates
      const totalProcessed = candidatesApproved + candidatesRejected;
      const conversionRate = totalProcessed > 0 ? (candidatesApproved / totalProcessed) * 100 : 0;

      // Calculate contact rate (assuming candidates with fecha_contacto have been contacted)
      const contacted = candidates.filter(c => c.fecha_contacto).length;
      const contactRate = candidates.length > 0 ? (contacted / candidates.length) * 100 : 0;

      // Funnel metrics
      const funnelMetrics = {
        leads: candidates.length,
        contacted: contacted,
        interviewed: candidates.filter(c => c.estado_proceso === 'entrevista').length,
        approved: candidatesApproved,
        onboarded: candidates.filter(c => c.estado_proceso === 'contratado').length,
      };

      // Calculate average time to contact (mock data since we don't have detailed timestamps)
      const avgTimeToContact = 2.5; // hours (mock)

      // Calculate leads per analyst (mock since we don't have analyst assignment)
      const totalAnalysts = 3; // mock
      const leadsPerAnalyst = candidates.length / totalAnalysts;

      // Mock analyst performance
      const analystPerformance = [
        {
          name: 'Analista 1',
          leadsManaged: Math.floor(candidates.length * 0.4),
          contactRate: 85,
          conversionRate: 75,
        },
        {
          name: 'Analista 2',
          leadsManaged: Math.floor(candidates.length * 0.35),
          contactRate: 78,
          conversionRate: 68,
        },
        {
          name: 'Analista 3',
          leadsManaged: Math.floor(candidates.length * 0.25),
          contactRate: 82,
          conversionRate: 72,
        },
      ];

      setMetrics({
        leadsToday,
        leadsThisMonth,
        leadsThisWeek,
        contactRate,
        conversionRate,
        avgTimeToContact,
        leadsPerAnalyst,
        activeCandidates,
        candidatesInProcess,
        candidatesApproved,
        candidatesRejected,
        funnelMetrics,
        analystPerformance,
      });

    } catch (err) {
      console.error('Error fetching supply metrics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    loading,
    error,
    refetch: fetchSupplyMetrics,
  };
};