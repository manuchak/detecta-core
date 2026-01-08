import { useCallback, useEffect, useState } from 'react';
import { SIERCPResponse } from './useSIERCP';

const STORAGE_KEY = 'siercp_session';
const SESSION_TIMEOUT_MS = 90 * 60 * 1000; // 90 minutos

export interface SIERCPSession {
  startedAt: string; // ISO timestamp
  responses: SIERCPResponse[];
  currentModule: string;
  currentQuestionIndex: number;
  timestamp: number;
}

export function useSIERCPPersistence() {
  const [savedSession, setSavedSession] = useState<SIERCPSession | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Cargar sesión al montar
  useEffect(() => {
    const session = loadSession();
    if (session && !isSessionExpired(session)) {
      setSavedSession(session);
    } else if (session) {
      // Sesión expirada, limpiar
      clearSession();
    }
    setInitialized(true);
  }, []);

  const loadSession = useCallback((): SIERCPSession | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as SIERCPSession;
    } catch (error) {
      console.error('Error loading SIERCP session:', error);
      return null;
    }
  }, []);

  const saveSession = useCallback((session: Partial<SIERCPSession> & { responses: SIERCPResponse[] }) => {
    try {
      const existingSession = loadSession();
      const fullSession: SIERCPSession = {
        startedAt: existingSession?.startedAt || new Date().toISOString(),
        responses: session.responses,
        currentModule: session.currentModule || existingSession?.currentModule || 'integridad',
        currentQuestionIndex: session.currentQuestionIndex ?? existingSession?.currentQuestionIndex ?? 0,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fullSession));
      setSavedSession(fullSession);
    } catch (error) {
      console.error('Error saving SIERCP session:', error);
    }
  }, [loadSession]);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setSavedSession(null);
    } catch (error) {
      console.error('Error clearing SIERCP session:', error);
    }
  }, []);

  const isSessionExpired = useCallback((session: SIERCPSession): boolean => {
    const startTime = new Date(session.startedAt).getTime();
    const now = Date.now();
    return (now - startTime) > SESSION_TIMEOUT_MS;
  }, []);

  const getRemainingTime = useCallback((): number => {
    const session = savedSession || loadSession();
    if (!session) return SESSION_TIMEOUT_MS;
    
    const startTime = new Date(session.startedAt).getTime();
    const elapsed = Date.now() - startTime;
    const remaining = SESSION_TIMEOUT_MS - elapsed;
    
    return Math.max(0, remaining);
  }, [savedSession, loadSession]);

  const getElapsedTime = useCallback((): number => {
    const session = savedSession || loadSession();
    if (!session) return 0;
    
    const startTime = new Date(session.startedAt).getTime();
    return Date.now() - startTime;
  }, [savedSession, loadSession]);

  const hasSavedSession = useCallback((): boolean => {
    const session = savedSession || loadSession();
    return !!session && !isSessionExpired(session) && session.responses.length > 0;
  }, [savedSession, loadSession, isSessionExpired]);

  return {
    savedSession,
    initialized,
    saveSession,
    clearSession,
    loadSession,
    isSessionExpired,
    getRemainingTime,
    getElapsedTime,
    hasSavedSession,
    SESSION_TIMEOUT_MS
  };
}
