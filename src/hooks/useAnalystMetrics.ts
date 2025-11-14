import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalystMetric {
  analystId: string;
  analystName: string;
  analystEmail: string;
  leadsAsignados: number;
  leadsNuevos: number;
  leadsEnProceso: number;
  leadsAprobados: number;
  leadsRechazados: number;
  tasaContacto: number;
  tasaConversion: number;
  tasaAprobacion: number;
  tiempoPromedioRespuesta: number;
  ultimaAsignacion: string | null;
}

export const useAnalystMetrics = () => {
  const [metrics, setMetrics] = useState<AnalystMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalystMetrics();
  }, []);

  const fetchAnalystMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get analysts with supply roles
      const { data: analysts, error: analystsError } = await supabase
        .rpc('get_users_with_roles_secure');

      if (analystsError) throw analystsError;

      const supplyAnalysts = analysts?.filter((u: any) => 
        ['admin', 'owner', 'supply_admin', 'supply_lead'].includes(u.role)
      ) || [];

      // Get all leads
      const { data: leads, error: leadsError } = await supabase
        .from('candidatos_custodios')
        .select('*');

      if (leadsError) throw leadsError;

      // Calculate metrics for each analyst
      const analystMetrics: AnalystMetric[] = supplyAnalysts.map((analyst: any) => {
        const analystLeads = leads?.filter(l => l.notas_recruiter?.includes(analyst.display_name)) || [];
        
        const leadsAsignados = analystLeads.length;
        const leadsNuevos = analystLeads.filter(l => l.estado_proceso === 'lead').length;
        const leadsEnProceso = analystLeads.filter(l => 
          ['contactado', 'entrevista'].includes(l.estado_proceso || '')
        ).length;
        const leadsAprobados = analystLeads.filter(l => 
          ['aprobado', 'contratado'].includes(l.estado_proceso || '')
        ).length;
        const leadsRechazados = analystLeads.filter(l => l.estado_proceso === 'rechazado').length;

        // Calculate contact rate (leads with fecha_contacto)
        const contacted = analystLeads.filter(l => l.fecha_contacto).length;
        const tasaContacto = leadsAsignados > 0 ? (contacted / leadsAsignados) * 100 : 0;

        // Calculate conversion rate
        const processed = leadsAprobados + leadsRechazados;
        const tasaConversion = processed > 0 ? (leadsAprobados / processed) * 100 : 0;

        // Calculate approval rate
        const tasaAprobacion = leadsAsignados > 0 ? (leadsAprobados / leadsAsignados) * 100 : 0;

        // Calculate average response time (hours from creation to first contact)
        const leadsWithContact = analystLeads.filter(l => l.created_at && l.fecha_contacto);
        const avgResponseTime = leadsWithContact.length > 0
          ? leadsWithContact.reduce((acc, l) => {
              const created = new Date(l.created_at!).getTime();
              const contacted = new Date(l.fecha_contacto!).getTime();
              return acc + (contacted - created) / (1000 * 60 * 60); // Convert to hours
            }, 0) / leadsWithContact.length
          : 0;

        // Get last assignment date
        const sortedLeads = analystLeads.sort((a, b) => 
          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
        );
        const ultimaAsignacion = sortedLeads[0]?.created_at || null;

        return {
          analystId: analyst.id,
          analystName: analyst.display_name,
          analystEmail: analyst.email,
          leadsAsignados,
          leadsNuevos,
          leadsEnProceso,
          leadsAprobados,
          leadsRechazados,
          tasaContacto: Math.round(tasaContacto * 10) / 10,
          tasaConversion: Math.round(tasaConversion * 10) / 10,
          tasaAprobacion: Math.round(tasaAprobacion * 10) / 10,
          tiempoPromedioRespuesta: Math.round(avgResponseTime * 10) / 10,
          ultimaAsignacion
        };
      });

      // Sort by leads assigned (descending)
      analystMetrics.sort((a, b) => b.leadsAsignados - a.leadsAsignados);

      setMetrics(analystMetrics);
    } catch (err) {
      console.error('Error fetching analyst metrics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    loading,
    error,
    refetch: fetchAnalystMetrics
  };
};
