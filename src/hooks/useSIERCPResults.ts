// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InterviewResponse {
  questionId: string;
  question: string;
  answer: string;
}

export interface SIERCPResult {
  id: string;
  user_id: string;
  scores: any;
  percentiles: any;
  clinical_interpretation: string | null;
  risk_flags: string[] | null;
  global_score: number;
  completed_at: string;
  created_at: string;
  ai_report?: any; // AI-generated analysis stored at completion
  interview_responses?: InterviewResponse[]; // Textual responses from Module 7
  // Profile info (from RPC join)
  profiles?: {
    display_name: string | null;
    email: string | null;
  };
  display_name?: string | null;
  email?: string | null;
}

export const useSIERCPResults = () => {
  const { user, userRole } = useAuth();
  const [existingResult, setExistingResult] = useState<SIERCPResult | null>(null);
  const [allResults, setAllResults] = useState<SIERCPResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [errorAllResults, setErrorAllResults] = useState<string | null>(null);

  const isAdmin = userRole === 'admin' || userRole === 'owner' || userRole === 'supply_admin' || userRole === 'supply_lead';

  useEffect(() => {
    if (user) {
      checkExistingResult();
      if (isAdmin) {
        fetchAllResults();
      }
    }
  }, [user, isAdmin]);

  const checkExistingResult = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('siercp_results')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing result:', error);
        return;
      }

      setExistingResult(data);
    } catch (err) {
      console.error('Error in checkExistingResult:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async () => {
    if (!isAdmin) return;

    setLoadingAll(true);
    setErrorAllResults(null);

    try {
      // Usar RPC segura que hace el join correcto con profiles
      const { data, error } = await supabase
        .rpc('get_siercp_calibration_results');

      if (error) {
        console.error('Error fetching calibration results:', error);
        setErrorAllResults(error.message || 'Error al cargar resultados de calibración');
        return;
      }

      // Transformar datos de RPC al formato esperado por los componentes
      const transformedResults = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        global_score: Number(row.global_score),
        scores: row.scores,
        percentiles: row.percentiles,
        risk_flags: row.risk_flags,
        clinical_interpretation: row.clinical_interpretation,
        completed_at: row.completed_at,
        created_at: row.created_at,
        ai_report: row.ai_report,
        // Mantener compatibilidad con el formato anterior (nested profiles)
        profiles: {
          display_name: row.display_name,
          email: row.email
        }
      }));

      console.log('SIERCP: Resultados de calibración cargados:', transformedResults.length);
      setAllResults(transformedResults);
    } catch (err) {
      console.error('Error in fetchAllResults:', err);
      setErrorAllResults('Error inesperado al cargar resultados');
    } finally {
      setLoadingAll(false);
    }
  };

  const saveResult = async (resultData: {
    scores: Record<string, any>;
    percentiles: Record<string, any>;
    clinical_interpretation: string;
    risk_flags: string[];
    global_score: number;
    ai_report?: any;
    interview_responses?: InterviewResponse[];
  }) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Usar upsert para permitir que admins retomen evaluaciones
      const { data, error } = await supabase
        .from('siercp_results')
        .upsert(
          {
            user_id: user.id,
            ...resultData,
            completed_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      setExistingResult(data);
      return data;
    } catch (err) {
      console.error('Error saving result:', err);
      throw err;
    }
  };

  const deleteResult = async (resultId: string) => {
    if (!isAdmin) {
      throw new Error('No tienes permisos para eliminar resultados');
    }

    try {
      const { error } = await supabase
        .from('siercp_results')
        .delete()
        .eq('id', resultId);

      if (error) {
        throw error;
      }

      // Refrescar la lista
      await fetchAllResults();
      
      // Si es el resultado del usuario actual, limpiarlo
      if (existingResult?.id === resultId) {
        setExistingResult(null);
      }
    } catch (err) {
      console.error('Error deleting result:', err);
      throw err;
    }
  };

  const canTakeEvaluation = () => {
    // Los admins siempre pueden tomar la evaluación (para pruebas)
    if (isAdmin) return true;
    
    // Los otros usuarios solo si no tienen resultado previo
    return !existingResult;
  };

  return {
    existingResult,
    allResults,
    loading,
    loadingAll,
    errorAllResults,
    isAdmin,
    canTakeEvaluation: canTakeEvaluation(),
    saveResult,
    deleteResult,
    refetch: () => {
      checkExistingResult();
      if (isAdmin) fetchAllResults();
    }
  };
};
