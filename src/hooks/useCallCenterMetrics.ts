// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CallCenterMetrics {
  contactabilidad: number; // Porcentaje de contactos efectivos
  llamadasPromedioDia: number; // Llamadas promedio por día
  contactosEfectivosDia: number; // Contactos efectivos promedio por día
  agentesActivos: number; // Número de agentes únicos activos
  leadsUnicosContactados: number; // Leads únicos contactados
}

interface UseCallCenterMetricsParams {
  dateFrom?: string;
  dateTo?: string;
  enabled?: boolean;
}

export const useCallCenterMetrics = ({ 
  dateFrom, 
  dateTo, 
  enabled = true 
}: UseCallCenterMetricsParams = {}) => {
  const [metrics, setMetrics] = useState<CallCenterMetrics>({
    contactabilidad: 0,
    llamadasPromedioDia: 0,
    contactosEfectivosDia: 0,
    agentesActivos: 0,
    leadsUnicosContactados: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Función para calcular métricas desde los logs de llamadas
  const calculateMetrics = useMemo(() => async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Construir query con filtros de fecha
      let query = supabase
        .from('manual_call_logs')
        .select('*');

      // Aplicar filtros de fecha si están disponibles
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        // Agregar 1 día y usar < para incluir todo el día
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString().split('T')[0]);
      }

      const { data: callLogs, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      if (!callLogs || callLogs.length === 0) {
        setMetrics({
          contactabilidad: 0,
          llamadasPromedioDia: 0,
          contactosEfectivosDia: 0,
          agentesActivos: 0,
          leadsUnicosContactados: 0
        });
        return;
      }

      // Calcular métricas
      const totalLlamadas = callLogs.length;
      
      // Contactos efectivos: successful + reschedule_requested
      const contactosEfectivos = callLogs.filter(log => 
        log.call_outcome === 'successful' || log.call_outcome === 'reschedule_requested'
      ).length;
      
      // Contactabilidad (porcentaje)
      const contactabilidad = totalLlamadas > 0 ? Math.round((contactosEfectivos / totalLlamadas) * 100) : 0;
      
      // Agentes únicos activos
      const agentesUnicos = new Set(callLogs.map(log => log.caller_id).filter(Boolean));
      const agentesActivos = agentesUnicos.size;
      
      // Leads únicos contactados
      const leadsUnicos = new Set(callLogs.map(log => log.lead_id).filter(Boolean));
      const leadsUnicosContactados = leadsUnicos.size;
      
      // Calcular días en el período
      let diasEnPeriodo = 1;
      if (dateFrom && dateTo) {
        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTo);
        diasEnPeriodo = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      } else if (dateFrom || dateTo) {
        // Si solo hay una fecha, usar 7 días como default
        diasEnPeriodo = 7;
      } else {
        // Sin filtros de fecha, calcular días únicos basado en las llamadas
        const fechasUnicas = new Set(
          callLogs.map(log => log.created_at?.split('T')[0]).filter(Boolean)
        );
        diasEnPeriodo = Math.max(1, fechasUnicas.size);
      }
      
      // Promedios diarios
      const llamadasPromedioDia = Math.round(totalLlamadas / diasEnPeriodo);
      const contactosEfectivosDia = Math.round(contactosEfectivos / diasEnPeriodo);

      setMetrics({
        contactabilidad,
        llamadasPromedioDia,
        contactosEfectivosDia,
        agentesActivos,
        leadsUnicosContactados
      });

    } catch (err) {
      const error = err as Error;
      console.error('Error calculando métricas de call center:', error);
      setError(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas del call center",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, enabled, toast]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: calculateMetrics
  };
};