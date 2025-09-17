// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InterviewSession {
  sessionId: string;
  leadId: string;
  interviewData: Record<string, any>;
  isActive: boolean;
  lastSaveTime: Date | null;
}

export interface UseInterviewSessionProps {
  leadId: string;
  onSessionSaved?: (sessionId: string, data: Record<string, any>) => void;
  onSessionInterrupted?: (sessionId: string, reason: string) => void;
  autoSaveInterval?: number; // en segundos, default 30
}

export const useInterviewSession = ({
  leadId,
  onSessionSaved,
  onSessionInterrupted,
  autoSaveInterval = 30
}: UseInterviewSessionProps) => {
  const [session, setSession] = useState<InterviewSession>({
    sessionId: crypto.randomUUID(),
    leadId,
    interviewData: {},
    isActive: false,
    lastSaveTime: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<Record<string, any>>({});

  // Auto-guardado
  const autoSave = useCallback(async () => {
    if (!session.isActive || Object.keys(pendingDataRef.current).length === 0) {
      return;
    }

    try {
      const { error } = await supabase.rpc('save_interview_progress', {
        p_lead_id: leadId,
        p_session_id: session.sessionId,
        p_interview_data: { ...session.interviewData, ...pendingDataRef.current },
        p_autosave: true
      });

      if (error) {
        console.error('Error en auto-guardado:', error);
        return;
      }

      // Actualizar el estado local
      setSession(prev => ({
        ...prev,
        interviewData: { ...prev.interviewData, ...pendingDataRef.current },
        lastSaveTime: new Date()
      }));

      // Limpiar datos pendientes
      pendingDataRef.current = {};

      onSessionSaved?.(session.sessionId, session.interviewData);
    } catch (error) {
      console.error('Error en auto-guardado:', error);
    }
  }, [leadId, session.sessionId, session.isActive, session.interviewData, onSessionSaved]);

  // Iniciar sesión de entrevista
  const startSession = useCallback(async (existingData?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const sessionData = existingData || {};
      
      setSession(prev => ({
        ...prev,
        interviewData: sessionData,
        isActive: true,
        lastSaveTime: null
      }));

      // Configurar auto-guardado
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }

      autoSaveIntervalRef.current = setInterval(autoSave, autoSaveInterval * 1000);
      
      toast.success('Sesión de entrevista iniciada');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast.error('Error al iniciar la sesión de entrevista');
    } finally {
      setIsLoading(false);
    }
  }, [autoSave, autoSaveInterval]);

  // Actualizar datos de entrevista
  const updateInterviewData = useCallback((key: string, value: any) => {
    pendingDataRef.current = {
      ...pendingDataRef.current,
      [key]: value
    };

    // Actualizar estado local inmediatamente para la UI
    setSession(prev => ({
      ...prev,
      interviewData: {
        ...prev.interviewData,
        [key]: value
      }
    }));
  }, []);

  // Guardar manualmente
  const saveSession = useCallback(async () => {
    if (!session.isActive) return;

    setIsLoading(true);
    try {
      const dataToSave = { ...session.interviewData, ...pendingDataRef.current };
      
      const { error } = await supabase.rpc('save_interview_progress', {
        p_lead_id: leadId,
        p_session_id: session.sessionId,
        p_interview_data: dataToSave,
        p_autosave: false
      });

      if (error) throw error;

      setSession(prev => ({
        ...prev,
        interviewData: dataToSave,
        lastSaveTime: new Date()
      }));

      pendingDataRef.current = {};
      onSessionSaved?.(session.sessionId, dataToSave);
      toast.success('Progreso guardado correctamente');
    } catch (error) {
      console.error('Error al guardar sesión:', error);
      toast.error('Error al guardar el progreso');
    } finally {
      setIsLoading(false);
    }
  }, [leadId, session, onSessionSaved]);

  // Marcar sesión como interrumpida
  const markAsInterrupted = useCallback(async (reason: string) => {
    if (!session.isActive) return;

    setIsLoading(true);
    try {
      // Guardar el progreso actual antes de marcar como interrumpida
      await saveSession();

      const { error } = await supabase.rpc('mark_interview_interrupted', {
        p_lead_id: leadId,
        p_session_id: session.sessionId,
        p_reason: reason
      });

      if (error) throw error;

      setSession(prev => ({
        ...prev,
        isActive: false
      }));

      onSessionInterrupted?.(session.sessionId, reason);
      toast.info('Entrevista marcada como interrumpida');
    } catch (error) {
      console.error('Error al marcar como interrumpida:', error);
      toast.error('Error al marcar la entrevista como interrumpida');
    } finally {
      setIsLoading(false);
    }
  }, [leadId, session, saveSession, onSessionInterrupted]);

  // Finalizar sesión
  const endSession = useCallback(async () => {
    if (!session.isActive) return;

    // Guardar una última vez
    await saveSession();

    // Limpiar auto-guardado
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    setSession(prev => ({
      ...prev,
      isActive: false
    }));

    toast.success('Sesión de entrevista finalizada');
  }, [saveSession, session.isActive]);

  // Recuperar sesión existente
  const recoverSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: leadData, error } = await supabase
        .from('leads')
        .select('last_interview_data, interview_session_id, interruption_reason')
        .eq('id', leadId)
        .single();

      if (error) throw error;

      if (leadData?.last_interview_data && leadData.interview_session_id) {
        const interviewData = typeof leadData.last_interview_data === 'object' && 
                              leadData.last_interview_data !== null ? 
                              leadData.last_interview_data as Record<string, any> : {};
        
        setSession(prev => ({
          ...prev,
          sessionId: leadData.interview_session_id,
          interviewData,
          isActive: false,
          lastSaveTime: new Date()
        }));

        return {
          hasRecoveryData: true,
          sessionId: leadData.interview_session_id,
          data: leadData.last_interview_data,
          interruptionReason: leadData.interruption_reason
        };
      }

      return { hasRecoveryData: false };
    } catch (error) {
      console.error('Error al recuperar sesión:', error);
      toast.error('Error al recuperar la sesión anterior');
      return { hasRecoveryData: false };
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  return {
    session,
    isLoading,
    startSession,
    updateInterviewData,
    saveSession,
    markAsInterrupted,
    endSession,
    recoverSession
  };
};