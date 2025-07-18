import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SIERCPResult {
  id: string;
  user_id: string;
  scores: any; // Json type from Supabase
  percentiles: any; // Json type from Supabase  
  clinical_interpretation: string | null;
  risk_flags: string[] | null;
  global_score: number;
  completed_at: string;
  created_at: string;
}

export const useSIERCPResults = () => {
  const { user, userRole } = useAuth();
  const [existingResult, setExistingResult] = useState<SIERCPResult | null>(null);
  const [allResults, setAllResults] = useState<SIERCPResult[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userRole === 'admin' || userRole === 'owner' || userRole === 'supply_admin';

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

    try {
      const { data, error } = await supabase
        .from('siercp_results')
        .select(`
          *,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching all results:', error);
        return;
      }

      setAllResults(data || []);
    } catch (err) {
      console.error('Error in fetchAllResults:', err);
    }
  };

  const saveResult = async (resultData: {
    scores: Record<string, any>;
    percentiles: Record<string, any>;
    clinical_interpretation: string;
    risk_flags: string[];
    global_score: number;
  }) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const { data, error } = await supabase
        .from('siercp_results')
        .insert([
          {
            user_id: user.id,
            ...resultData
          }
        ])
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