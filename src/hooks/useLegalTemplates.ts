import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PlantillaContrato {
  id: string;
  nombre: string;
  tipo_contrato: string;
  version: number | null;
  activa: boolean | null;
  contenido_html: string;
  variables_requeridas: string[] | null;
  descripcion: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlantillaVersion {
  id: string;
  plantilla_id: string;
  version: number;
  contenido_html: string;
  variables_requeridas: string[] | null;
  change_description: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface ComplianceCheck {
  id: string;
  plantilla_id: string;
  compliance_type: string;
  status: string;
  last_reviewed_at: string | null;
  reviewed_by: string | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Queries ──

export function usePlantillasLegal() {
  return useQuery({
    queryKey: ['legal-plantillas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plantillas_contrato')
        .select('*')
        .order('tipo_contrato');
      if (error) throw error;
      return data as PlantillaContrato[];
    },
  });
}

export function usePlantillaVersiones(plantillaId: string | null) {
  return useQuery({
    queryKey: ['legal-versiones', plantillaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plantillas_contrato_versiones')
        .select('*')
        .eq('plantilla_id', plantillaId!)
        .order('version', { ascending: false });
      if (error) throw error;
      return data as PlantillaVersion[];
    },
    enabled: !!plantillaId,
  });
}

export function useComplianceChecks() {
  return useQuery({
    queryKey: ['legal-compliance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_compliance_checks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ComplianceCheck[];
    },
  });
}

// ── Mutations ──

export function useUpdatePlantilla() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      plantillaId,
      contenidoHtml,
      variablesRequeridas,
      changeDescription,
    }: {
      plantillaId: string;
      contenidoHtml: string;
      variablesRequeridas: string[];
      changeDescription: string;
    }) => {
      // 1. Get current plantilla to save as version
      const { data: current, error: fetchErr } = await supabase
        .from('plantillas_contrato')
        .select('*')
        .eq('id', plantillaId)
        .single();
      if (fetchErr || !current) throw fetchErr || new Error('Plantilla no encontrada');

      // 2. Save current as version
      const { error: versionErr } = await supabase
        .from('plantillas_contrato_versiones')
        .insert({
          plantilla_id: plantillaId,
          version: current.version || 1,
          contenido_html: current.contenido_html,
          variables_requeridas: current.variables_requeridas,
          change_description: changeDescription,
          changed_by: user?.id,
        });
      if (versionErr) throw versionErr;

      // 3. Update plantilla with new content
      const { error: updateErr } = await supabase
        .from('plantillas_contrato')
        .update({
          contenido_html: contenidoHtml,
          variables_requeridas: variablesRequeridas,
          version: (current.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plantillaId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-plantillas'] });
      queryClient.invalidateQueries({ queryKey: ['legal-versiones'] });
      toast.success('Plantilla actualizada correctamente');
    },
    onError: (err) => {
      console.error('Error updating plantilla:', err);
      toast.error('Error al actualizar la plantilla');
    },
  });
}

export function useRollbackPlantilla() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      plantillaId,
      version,
    }: {
      plantillaId: string;
      version: PlantillaVersion;
    }) => {
      // Save current as version first
      const { data: current } = await supabase
        .from('plantillas_contrato')
        .select('*')
        .eq('id', plantillaId)
        .single();

      if (current) {
        await supabase.from('plantillas_contrato_versiones').insert({
          plantilla_id: plantillaId,
          version: current.version || 1,
          contenido_html: current.contenido_html,
          variables_requeridas: current.variables_requeridas,
          change_description: `Rollback a versión ${version.version}`,
          changed_by: user?.id,
        });
      }

      const { error } = await supabase
        .from('plantillas_contrato')
        .update({
          contenido_html: version.contenido_html,
          variables_requeridas: version.variables_requeridas,
          version: (current?.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plantillaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-plantillas'] });
      queryClient.invalidateQueries({ queryKey: ['legal-versiones'] });
      toast.success('Plantilla restaurada correctamente');
    },
    onError: () => toast.error('Error al restaurar la plantilla'),
  });
}

export function useUpsertCompliance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      plantillaId,
      complianceType,
      status,
      nextReviewDate,
      notes,
    }: {
      plantillaId: string;
      complianceType: string;
      status: string;
      nextReviewDate?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.from('legal_compliance_checks').upsert(
        {
          plantilla_id: plantillaId,
          compliance_type: complianceType,
          status,
          last_reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          next_review_date: nextReviewDate || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-compliance'] });
      toast.success('Compliance actualizado');
    },
    onError: () => toast.error('Error al actualizar compliance'),
  });
}

// ── Helpers ──

export function extractVariables(html: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const vars = new Set<string>();
  let match;
  while ((match = regex.exec(html)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}

export const COMPLIANCE_TYPES = [
  { value: 'ley_federal_trabajo', label: 'Ley Federal del Trabajo' },
  { value: 'lfpdppp', label: 'LFPDPPP (Privacidad)' },
  { value: 'sedena', label: 'Regulaciones SEDENA' },
  { value: 'norma_interna', label: 'Norma Interna' },
] as const;

export const COMPLIANCE_STATUS = [
  { value: 'compliant', label: 'Cumple', color: 'text-emerald-600 bg-emerald-50' },
  { value: 'review_needed', label: 'Revisión Pendiente', color: 'text-amber-600 bg-amber-50' },
  { value: 'non_compliant', label: 'No Cumple', color: 'text-destructive bg-destructive/10' },
] as const;
