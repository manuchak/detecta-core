import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustodioCommunication {
  id: string;
  custodio_id: string;
  custodio_nombre: string;
  custodio_telefono: string;
  servicio_id?: string;
  tipo_comunicacion: 'whatsapp' | 'llamada' | 'sms';
  direccion: 'enviado' | 'recibido';
  contenido?: string;
  estado: 'enviado' | 'entregado' | 'leido' | 'respondido' | 'fallido';
  timestamp_comunicacion: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CustodioResponse {
  id: string;
  communication_id: string;
  custodio_id: string;
  servicio_id?: string;
  tipo_respuesta: 'aceptacion' | 'rechazo' | 'consulta' | 'contraoferta';
  respuesta_texto?: string;
  tiempo_respuesta_minutos?: number;
  razon_rechazo?: string;
  precio_propuesto?: number;
  disponibilidad_propuesta?: string;
  metadata: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export interface CustodioPerformanceMetrics {
  id: string;
  custodio_id: string;
  custodio_nombre: string;
  custodio_telefono: string;
  
  // Métricas de comunicación
  total_comunicaciones: number;
  total_respuestas: number;
  tasa_respuesta: number;
  tiempo_promedio_respuesta_minutos: number;
  
  // Métricas de aceptación
  total_ofertas: number;
  total_aceptaciones: number;
  total_rechazos: number;
  tasa_aceptacion: number;
  
  // Métricas de confiabilidad
  servicios_completados: number;
  servicios_cancelados: number;
  no_shows: number;
  tasa_confiabilidad: number;
  
  // Scoring dinámico
  score_comunicacion: number;
  score_aceptacion: number;
  score_confiabilidad: number;
  score_total: number;
  
  // Metadata
  ultima_comunicacion?: string;
  ultimo_servicio?: string;
  zona_operacion?: string;
  notas_performance?: string;
  created_at: string;
  updated_at: string;
}

export const useCustodioTracking = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Registrar comunicación con custodio
  const logCommunication = async (params: {
    custodio_id: string;
    custodio_nombre: string;
    custodio_telefono: string;
    servicio_id?: string;
    tipo_comunicacion: 'whatsapp' | 'llamada' | 'sms';
    contenido?: string;
    metadata?: Record<string, any>;
  }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custodio_communications')
        .insert({
          ...params,
          direccion: 'enviado',
          estado: 'enviado',
          timestamp_comunicacion: new Date().toISOString(),
          metadata: params.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`Comunicación ${params.tipo_comunicacion} registrada`);
      return data;
    } catch (error) {
      console.error('Error registrando comunicación:', error);
      toast.error('Error al registrar la comunicación');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Registrar respuesta del custodio
  const logResponse = async (params: {
    communication_id: string;
    custodio_id: string;
    servicio_id?: string;
    tipo_respuesta: 'aceptacion' | 'rechazo' | 'consulta' | 'contraoferta';
    respuesta_texto?: string;
    razon_rechazo?: string;
    precio_propuesto?: number;
    disponibilidad_propuesta?: string;
    metadata?: Record<string, any>;
  }) => {
    setIsLoading(true);
    try {
      // Obtener el timestamp de la comunicación original para calcular tiempo de respuesta
      const { data: communication } = await supabase
        .from('custodio_communications')
        .select('timestamp_comunicacion')
        .eq('id', params.communication_id)
        .single();

      const tiempoRespuesta = communication 
        ? Math.round((Date.now() - new Date(communication.timestamp_comunicacion).getTime()) / (1000 * 60))
        : undefined;

      const { data, error } = await supabase
        .from('custodio_responses')
        .insert({
          ...params,
          tiempo_respuesta_minutos: tiempoRespuesta,
          metadata: params.metadata || {},
          processed: false
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar el estado de la comunicación original
      await supabase
        .from('custodio_communications')
        .update({ estado: 'respondido' })
        .eq('id', params.communication_id);
      
      toast.success(`Respuesta ${params.tipo_respuesta} registrada`);
      return data;
    } catch (error) {
      console.error('Error registrando respuesta:', error);
      toast.error('Error al registrar la respuesta');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener métricas de performance de un custodio
  const getCustodioMetrics = async (custodio_id: string): Promise<CustodioPerformanceMetrics | null> => {
    try {
      const { data, error } = await supabase
        .from('custodio_performance_metrics')
        .select('*')
        .eq('custodio_id', custodio_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      return null;
    }
  };

  // Obtener métricas de todos los custodios ordenadas por score
  const getAllCustodioMetrics = async (): Promise<CustodioPerformanceMetrics[]> => {
    try {
      const { data, error } = await supabase
        .from('custodio_performance_metrics')
        .select('*')
        .order('score_total', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo todas las métricas:', error);
      return [];
    }
  };

  // Obtener historial de comunicaciones de un custodio
  const getComunicacionesHistorial = async (custodio_id: string): Promise<CustodioCommunication[]> => {
    try {
      const { data, error } = await supabase
        .from('custodio_communications')
        .select('*')
        .eq('custodio_id', custodio_id)
        .order('timestamp_comunicacion', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  };

  // Obtener respuestas de un custodio
  const getResponsesHistorial = async (custodio_id: string): Promise<CustodioResponse[]> => {
    try {
      const { data, error } = await supabase
        .from('custodio_responses')
        .select('*')
        .eq('custodio_id', custodio_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo respuestas:', error);
      return [];
    }
  };

  // Recalcular scores de performance
  const recalculateScores = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('calculate_custodio_scores');
      
      if (error) throw error;
      toast.success('Scores de performance actualizados');
    } catch (error) {
      console.error('Error recalculando scores:', error);
      toast.error('Error al actualizar los scores');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar respuesta como procesada
  const markResponseAsProcessed = async (response_id: string) => {
    try {
      const { error } = await supabase
        .from('custodio_responses')
        .update({ processed: true })
        .eq('id', response_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marcando respuesta como procesada:', error);
      throw error;
    }
  };

  // Registrar evento de servicio (completado, cancelado, no-show)
  const logServiceEvent = async (params: {
    custodio_id: string;
    event_type: 'completado' | 'cancelado' | 'no_show';
    servicio_id?: string;
  }) => {
    try {
      const { custodio_id, event_type } = params;
      
      // Obtener métricas actuales
      const metrics = await getCustodioMetrics(custodio_id);
      if (!metrics) return;

      // Actualizar según el tipo de evento
      const updates: Partial<CustodioPerformanceMetrics> = {
        ultimo_servicio: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      switch (event_type) {
        case 'completado':
          updates.servicios_completados = metrics.servicios_completados + 1;
          break;
        case 'cancelado':
          updates.servicios_cancelados = metrics.servicios_cancelados + 1;
          break;
        case 'no_show':
          updates.no_shows = metrics.no_shows + 1;
          break;
      }

      const { error } = await supabase
        .from('custodio_performance_metrics')
        .update(updates)
        .eq('custodio_id', custodio_id);

      if (error) throw error;

      // Recalcular scores después de la actualización
      await recalculateScores();
      
      toast.success(`Evento de servicio ${event_type} registrado`);
    } catch (error) {
      console.error('Error registrando evento de servicio:', error);
      toast.error('Error al registrar el evento de servicio');
      throw error;
    }
  };

  return {
    isLoading,
    logCommunication,
    logResponse,
    getCustodioMetrics,
    getAllCustodioMetrics,
    getComunicacionesHistorial,
    getResponsesHistorial,
    recalculateScores,
    markResponseAsProcessed,
    logServiceEvent
  };
};