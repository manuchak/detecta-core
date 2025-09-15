import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VapiAnalytics {
  totalInterviews: number;
  completedInterviews: number;
  averageDuration: number;
  averageScore: number;
  autoDecisionStats: {
    approved: number;
    secondInterview: number;
    rejected: number;
  };
  completionRate: number;
  costAnalysis: {
    totalCost: number;
    averageCostPerCall: number;
  };
  qualityMetrics: {
    averageConfidenceScore: number;
    averageCommunicationScore: number;
    redFlagsDetected: number;
  };
}

interface VapiCallDetails {
  id: string;
  lead_id: string;
  call_status: string;
  duration_seconds: number | null;
  analysis_score: number | null;
  auto_decision: string | null;
  recommendation: string | null;
  structured_data: any;
  created_at: string;
  ended_at: string | null;
  cost_usd: number | null;
  red_flags: string[];
}

export const useVapiAnalytics = () => {
  const [analytics, setAnalytics] = useState<VapiAnalytics | null>(null);
  const [recentCalls, setRecentCalls] = useState<VapiCallDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all VAPI call logs with structured data
      const { data: calls, error: callsError } = await supabase
        .from('vapi_call_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (callsError) throw callsError;

      // Calculate analytics from the data
      const totalInterviews = calls?.length || 0;
      const completedInterviews = calls?.filter(call => 
        call.call_status === 'completed' || call.call_status === 'ended'
      ).length || 0;

      const completedCalls = calls?.filter(call => 
        call.call_status === 'completed' && call.structured_data
      ) || [];

      // Duration analytics
      const durationsInMinutes = completedCalls
        .filter(call => call.duration_seconds)
        .map(call => call.duration_seconds / 60);
      
      const averageDuration = durationsInMinutes.length > 0 
        ? durationsInMinutes.reduce((sum, duration) => sum + duration, 0) / durationsInMinutes.length
        : 0;

      // Score analytics
      const scores = completedCalls
        .filter(call => call.analysis_score)
        .map(call => call.analysis_score);
      
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

      // Auto-decision analytics
      const autoDecisionStats = {
        approved: calls?.filter(call => call.auto_decision === 'aprobar').length || 0,
        secondInterview: calls?.filter(call => call.auto_decision === 'segunda_entrevista').length || 0,
        rejected: calls?.filter(call => call.auto_decision === 'rechazar').length || 0,
      };

      // Cost analytics
      const costs = calls?.filter(call => call.cost_usd).map(call => call.cost_usd) || [];
      const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
      const averageCostPerCall = costs.length > 0 ? totalCost / costs.length : 0;

      // Quality metrics from structured data
      let totalConfidenceScore = 0;
      let totalCommunicationScore = 0;
      let confidenceCount = 0;
      let communicationCount = 0;
      let totalRedFlags = 0;

      completedCalls.forEach(call => {
        if (call.structured_data && typeof call.structured_data === 'object') {
          const structuredData = call.structured_data as any;
          const evaluation = structuredData.evaluacion;
          
          if (evaluation && typeof evaluation === 'object') {
            if (evaluation.confianza_score) {
              totalConfidenceScore += evaluation.confianza_score;
              confidenceCount++;
            }
            
            if (evaluation.comunicacion_score) {
              totalCommunicationScore += evaluation.comunicacion_score;
              communicationCount++;
            }
          }
        }

        if (call.red_flags) {
          totalRedFlags += call.red_flags.length;
        }
      });

      const qualityMetrics = {
        averageConfidenceScore: confidenceCount > 0 ? totalConfidenceScore / confidenceCount : 0,
        averageCommunicationScore: communicationCount > 0 ? totalCommunicationScore / communicationCount : 0,
        redFlagsDetected: totalRedFlags,
      };

      const analyticsData: VapiAnalytics = {
        totalInterviews,
        completedInterviews,
        averageDuration,
        averageScore,
        autoDecisionStats,
        completionRate: totalInterviews > 0 ? (completedInterviews / totalInterviews) * 100 : 0,
        costAnalysis: {
          totalCost,
          averageCostPerCall,
        },
        qualityMetrics,
      };

      setAnalytics(analyticsData);
      setRecentCalls(calls?.slice(0, 10) || []);

    } catch (error) {
      console.error('Error fetching VAPI analytics:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getCallsByDateRange = async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('vapi_call_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching calls by date range:', error);
      return [];
    }
  };

  const getCallDetails = async (callId: string) => {
    try {
      const { data, error } = await supabase
        .from('vapi_call_logs')
        .select('*')
        .eq('vapi_call_id', callId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching call details:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    recentCalls,
    loading,
    error,
    refreshAnalytics: fetchAnalytics,
    getCallsByDateRange,
    getCallDetails,
  };
};