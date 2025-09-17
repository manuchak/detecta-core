// @ts-nocheck
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduledCall {
  id: string;
  lead_id: string;
  fecha_programada: string;
  tipo_llamada: 'entrevista' | 'seguimiento' | 'reprogramada';
  motivo_reprogramacion?: string;
  session_id?: string;
  estado: 'programada' | 'completada' | 'cancelada';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleCallProps {
  leadId: string;
  fecha: Date;
  tipo: 'entrevista' | 'seguimiento' | 'reprogramada';
  motivo?: string;
  sessionId?: string;
}

export const useCallScheduling = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);

  // Programar una nueva llamada
  const scheduleCall = useCallback(async ({
    leadId,
    fecha,
    tipo,
    motivo,
    sessionId
  }: ScheduleCallProps) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('programacion_llamadas')
        .insert({
          lead_id: leadId,
          fecha_programada: fecha.toISOString(),
          tipo_llamada: tipo,
          motivo_reprogramacion: motivo,
          session_id: sessionId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Llamada programada correctamente');
      return data;
    } catch (error) {
      console.error('Error al programar llamada:', error);
      toast.error('Error al programar la llamada');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reprogramar una llamada interrumpida
  const rescheduleInterruptedCall = useCallback(async ({
    leadId,
    fecha,
    motivo,
    sessionId
  }: Omit<ScheduleCallProps, 'tipo'> & { motivo: string; sessionId: string }) => {
    return await scheduleCall({
      leadId,
      fecha,
      tipo: 'reprogramada',
      motivo,
      sessionId
    });
  }, [scheduleCall]);

  // Obtener llamadas programadas para un lead
  const getScheduledCallsForLead = useCallback(async (leadId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('programacion_llamadas')
        .select('*')
        .eq('lead_id', leadId)
        .eq('estado', 'programada')
        .order('fecha_programada', { ascending: true });

      if (error) throw error;

      const typedData = (data || []).map(call => ({
        ...call,
        tipo_llamada: call.tipo_llamada as 'entrevista' | 'seguimiento' | 'reprogramada',
        estado: call.estado as 'programada' | 'completada' | 'cancelada'
      }));

      setScheduledCalls(typedData);
      return typedData;
    } catch (error) {
      console.error('Error al obtener llamadas programadas:', error);
      toast.error('Error al cargar las llamadas programadas');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener todas las llamadas programadas para el día
  const getTodaysScheduledCalls = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data, error } = await supabase
        .from('programacion_llamadas')
        .select(`
          *,
          leads!programacion_llamadas_lead_id_fkey (
            nombre,
            email,
            telefono
          )
        `)
        .eq('estado', 'programada')
        .gte('fecha_programada', startOfDay.toISOString())
        .lt('fecha_programada', endOfDay.toISOString())
        .order('fecha_programada', { ascending: true });

      if (error) throw error;

      const typedData = (data || []).map(call => ({
        ...call,
        tipo_llamada: call.tipo_llamada as 'entrevista' | 'seguimiento' | 'reprogramada',
        estado: call.estado as 'programada' | 'completada' | 'cancelada'
      }));

      setScheduledCalls(typedData);
      return typedData;
    } catch (error) {
      console.error('Error al obtener llamadas de hoy:', error);
      toast.error('Error al cargar las llamadas de hoy');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Marcar llamada como completada
  const markCallAsCompleted = useCallback(async (callId: string) => {
    try {
      const { error } = await supabase
        .from('programacion_llamadas')
        .update({ estado: 'completada' })
        .eq('id', callId);

      if (error) throw error;

      setScheduledCalls(prev => 
        prev.map(call => 
          call.id === callId 
            ? { ...call, estado: 'completada' as const }
            : call
        )
      );

      toast.success('Llamada marcada como completada');
    } catch (error) {
      console.error('Error al marcar llamada como completada:', error);
      toast.error('Error al actualizar el estado de la llamada');
    }
  }, []);

  // Cancelar llamada programada
  const cancelScheduledCall = useCallback(async (callId: string) => {
    try {
      const { error } = await supabase
        .from('programacion_llamadas')
        .update({ estado: 'cancelada' })
        .eq('id', callId);

      if (error) throw error;

      setScheduledCalls(prev => 
        prev.map(call => 
          call.id === callId 
            ? { ...call, estado: 'cancelada' as const }
            : call
        )
      );

      toast.success('Llamada cancelada');
    } catch (error) {
      console.error('Error al cancelar llamada:', error);
      toast.error('Error al cancelar la llamada');
    }
  }, []);

  return {
    isLoading,
    scheduledCalls,
    scheduleCall,
    rescheduleInterruptedCall,
    getScheduledCallsForLead,
    getTodaysScheduledCalls,
    markCallAsCompleted,
    cancelScheduledCall
  };
};