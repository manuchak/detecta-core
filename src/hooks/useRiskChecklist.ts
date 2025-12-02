import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RiskChecklist {
  id: string;
  candidato_id: string;
  antecedentes_penales: boolean;
  antecedentes_laborales_negativos: boolean;
  inconsistencias_cv: boolean;
  actitud_defensiva: boolean;
  respuestas_evasivas: boolean;
  nerviosismo_excesivo: boolean;
  cambios_frecuentes_empleo: boolean;
  referencias_no_verificables: boolean;
  documentacion_incompleta: boolean;
  zona_alto_riesgo: boolean;
  risk_score: number;
  risk_level: 'bajo' | 'medio' | 'alto';
  notas: string | null;
  evaluado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskChecklistFormData {
  candidato_id: string;
  antecedentes_penales?: boolean;
  antecedentes_laborales_negativos?: boolean;
  inconsistencias_cv?: boolean;
  actitud_defensiva?: boolean;
  respuestas_evasivas?: boolean;
  nerviosismo_excesivo?: boolean;
  cambios_frecuentes_empleo?: boolean;
  referencias_no_verificables?: boolean;
  documentacion_incompleta?: boolean;
  zona_alto_riesgo?: boolean;
  notas?: string;
}

export function useRiskChecklist(candidatoId: string) {
  return useQuery({
    queryKey: ['risk-checklist', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidato_risk_checklist')
        .select('*')
        .eq('candidato_id', candidatoId)
        .maybeSingle();

      if (error) throw error;
      return data as RiskChecklist | null;
    },
    enabled: !!candidatoId,
  });
}

export function useUpsertRiskChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RiskChecklistFormData) => {
      const { data: checklist, error } = await supabase
        .from('candidato_risk_checklist')
        .upsert(
          {
            candidato_id: data.candidato_id,
            antecedentes_penales: data.antecedentes_penales ?? false,
            antecedentes_laborales_negativos: data.antecedentes_laborales_negativos ?? false,
            inconsistencias_cv: data.inconsistencias_cv ?? false,
            actitud_defensiva: data.actitud_defensiva ?? false,
            respuestas_evasivas: data.respuestas_evasivas ?? false,
            nerviosismo_excesivo: data.nerviosismo_excesivo ?? false,
            cambios_frecuentes_empleo: data.cambios_frecuentes_empleo ?? false,
            referencias_no_verificables: data.referencias_no_verificables ?? false,
            documentacion_incompleta: data.documentacion_incompleta ?? false,
            zona_alto_riesgo: data.zona_alto_riesgo ?? false,
            notas: data.notas,
          },
          { onConflict: 'candidato_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return checklist;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risk-checklist', variables.candidato_id] });
      toast.success('Checklist de riesgo actualizado');
    },
    onError: (error) => {
      console.error('Error saving risk checklist:', error);
      toast.error('Error al guardar el checklist de riesgo');
    },
  });
}

export const RISK_FACTORS = [
  { key: 'antecedentes_penales', label: 'Antecedentes penales', weight: 30, severity: 'critical' },
  { key: 'antecedentes_laborales_negativos', label: 'Antecedentes laborales negativos', weight: 20, severity: 'high' },
  { key: 'inconsistencias_cv', label: 'Inconsistencias en CV', weight: 15, severity: 'high' },
  { key: 'actitud_defensiva', label: 'Actitud defensiva en entrevista', weight: 10, severity: 'medium' },
  { key: 'respuestas_evasivas', label: 'Respuestas evasivas', weight: 10, severity: 'medium' },
  { key: 'nerviosismo_excesivo', label: 'Nerviosismo excesivo', weight: 5, severity: 'low' },
  { key: 'cambios_frecuentes_empleo', label: 'Cambios frecuentes de empleo', weight: 5, severity: 'low' },
  { key: 'referencias_no_verificables', label: 'Referencias no verificables', weight: 15, severity: 'high' },
  { key: 'documentacion_incompleta', label: 'Documentación incompleta', weight: 10, severity: 'medium' },
  { key: 'zona_alto_riesgo', label: 'Zona de alto riesgo', weight: 10, severity: 'medium' },
] as const;

export type RiskFactorKey = typeof RISK_FACTORS[number]['key'];
