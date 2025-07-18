import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InterviewResponse {
  questionId: string;
  question: string;
  response: string;
}

export interface AnalysisResult {
  coherenceScore: number;
  complexityScore: number;
  riskIndicators: number;
  validityScales: {
    infrecuency: number;
    lie: number;
    correction: number;
    inconsistency: number;
  };
  sentimentAnalysis: {
    overall: number;
    emotional_density: number;
    honesty_markers: number;
  };
  overallScore: number;
  classification: string;
  recommendations: string[];
  redFlags: string[];
}

// Función independiente para análisis
export const analyzeInterview = async (responses: InterviewResponse[]): Promise<AnalysisResult | null> => {
  if (!responses || responses.length === 0) {
    return null;
  }

  try {
    const { data, error: functionError } = await supabase.functions.invoke('analyze-interview', {
      body: { responses }
    });

    if (functionError) {
      throw new Error(functionError.message);
    }

    return data || null;
  } catch (err) {
    console.error('Error analyzing interview:', err);
    return null;
  }
};

export const useInterviewAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async (responses: InterviewResponse[]): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeInterview(responses);
      setAnalysisResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido durante el análisis';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getValidityIssues = (result: AnalysisResult): string[] => {
    const issues: string[] = [];
    
    if (result.validityScales.infrecuency > 70) {
      issues.push('Respuestas estadísticamente improbables detectadas');
    }
    
    if (result.validityScales.lie > 70) {
      issues.push('Posible presentación artificialmente positiva');
    }
    
    if (result.validityScales.correction > 70) {
      issues.push('Defensividad excesiva detectada');
    }
    
    if (result.validityScales.inconsistency > 70) {
      issues.push('Inconsistencias significativas en las respuestas');
    }

    if (result.sentimentAnalysis.honesty_markers < 30) {
      issues.push('Marcadores de honestidad insuficientes');
    }

    if (result.complexityScore < 30) {
      issues.push('Respuestas excesivamente breves o evasivas');
    }

    return issues;
  };

  const isValidInterview = (result: AnalysisResult): boolean => {
    const validityIssues = getValidityIssues(result);
    return validityIssues.length <= 1 && result.overallScore > 0;
  };

  const getScoreInterpretation = (score: number): { color: string; label: string } => {
    if (score >= 85) return { color: 'text-green-600', label: 'Excelente' };
    if (score >= 70) return { color: 'text-blue-600', label: 'Bueno' };
    if (score >= 55) return { color: 'text-yellow-600', label: 'Moderado' };
    if (score >= 40) return { color: 'text-orange-600', label: 'Preocupante' };
    return { color: 'text-red-600', label: 'Crítico' };
  };

  const reset = () => {
    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
  };

  return {
    analyzeInterview: performAnalysis,
    isAnalyzing,
    analysisResult,
    error,
    getValidityIssues,
    isValidInterview,
    getScoreInterpretation,
    reset
  };
};