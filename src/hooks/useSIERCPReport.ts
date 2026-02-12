import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ModuleAnalysis {
  modulo: string;
  score: number;
  nivel: 'Alto' | 'Medio' | 'Bajo';
  interpretacion: string;
  implicacion_custodio: string;
}

interface FitCustodio {
  nivel: 'Alta' | 'Media' | 'Baja' | 'No apto';
  porcentaje_confianza: number;
  justificacion: string;
}

interface ReportMetadata {
  fecha_generacion: string;
  fecha_evaluacion: string;
  candidato: string;
  score_global: number;
  generado_por: string;
}

export interface SIERCPReport {
  resumen_ejecutivo: string;
  analisis_modulos: ModuleAnalysis[];
  factores_riesgo: string[];
  factores_proteccion: string[];
  fit_custodio: FitCustodio;
  recomendaciones: string[];
  areas_seguimiento: string[];
  conclusion_profesional: string;
  metadata: ReportMetadata;
}

interface ModuleScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
}

interface GenerateReportParams {
  globalScore: number;
  moduleScores: ModuleScore[];
  riskFlags: string[];
  candidateName?: string;
  evaluationDate: string;
}

export const useSIERCPReport = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SIERCPReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (params: GenerateReportParams): Promise<SIERCPReport | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-siercp-report', {
        body: params
      });

      if (fnError) {
        throw fnError;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error desconocido al generar el informe');
      }

      const generatedReport = data.report as SIERCPReport;
      setReport(generatedReport);

      toast({
        title: "✅ Informe generado",
        description: "El informe detallado ha sido generado exitosamente",
      });

      return generatedReport;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generando el informe';
      setError(errorMessage);
      
      toast({
        title: "❌ Error generando informe",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (evaluacionId: string, reportData: SIERCPReport) => {
    try {
      const { error: updateError } = await supabase
        .from('evaluaciones_psicometricas')
        .update({ ai_report: reportData as any })
        .eq('id', evaluacionId);

      if (updateError) {
        console.error('Error saving report:', updateError);
      }
    } catch (err) {
      console.error('Error saving report to DB:', err);
    }
  };

  const loadReport = (savedReport: Record<string, any>) => {
    setReport(savedReport as unknown as SIERCPReport);
  };

  const clearReport = () => {
    setReport(null);
    setError(null);
  };

  return {
    loading,
    report,
    error,
    generateReport,
    saveReport,
    loadReport,
    clearReport
  };
};
