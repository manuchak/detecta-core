import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export type EstadoIncidente = 'borrador' | 'abierto' | 'en_investigacion' | 'resuelto' | 'cerrado';
export type SeveridadIncidente = 'baja' | 'media' | 'alta' | 'critica';
export type TipoEntradaCronologia = 'deteccion' | 'notificacion' | 'accion' | 'escalacion' | 'evidencia' | 'resolucion' | 'nota';

export interface IncidenteOperativo {
  id: string;
  tipo: string;
  severidad: SeveridadIncidente;
  descripcion: string;
  zona: string | null;
  estado: EstadoIncidente;
  fecha_incidente: string;
  atribuible_operacion: boolean;
  controles_activos: string[] | null;
  control_efectivo: boolean | null;
  cliente_nombre: string | null;
  acciones_tomadas: string | null;
  resolucion_notas: string | null;
  fecha_resolucion: string | null;
  reportado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntradaCronologia {
  id: string;
  incidente_id: string;
  timestamp: string;
  tipo_entrada: TipoEntradaCronologia;
  descripcion: string;
  autor_id: string | null;
  created_at: string;
}

export interface IncidenteFormData {
  tipo: string;
  severidad: string;
  descripcion: string;
  zona: string;
  atribuible_operacion: boolean;
  controles_activos: string[];
  control_efectivo: boolean;
  cliente_nombre: string;
  acciones_tomadas: string;
  resolucion_notas: string;
}

export interface FiltrosIncidentes {
  estado?: EstadoIncidente | null;
  severidad?: SeveridadIncidente | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const TIPOS_INCIDENTE = [
  { value: 'robo', label: 'Robo' },
  { value: 'asalto', label: 'Asalto' },
  { value: 'accidente_vial', label: 'Accidente vial' },
  { value: 'agresion', label: 'Agresión' },
  { value: 'extorsion', label: 'Extorsión' },
  { value: 'perdida_mercancia', label: 'Pérdida de mercancía' },
  { value: 'falla_gps', label: 'Falla GPS' },
  { value: 'protocolo_incumplido', label: 'Protocolo incumplido' },
  { value: 'otro', label: 'Otro' },
];

export const SEVERIDADES = [
  { value: 'baja', label: 'Baja', color: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'media', label: 'Media', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-500/10 text-orange-600' },
  { value: 'critica', label: 'Crítica', color: 'bg-red-500/10 text-red-600' },
];

export const CONTROLES = ['GPS activo', 'Protocolo pavor', 'Botón pánico', 'Custodio armado', 'Escolta', 'Ruta alterna'];

export const TIPOS_ENTRADA_CRONOLOGIA: { value: TipoEntradaCronologia; label: string; icon: string }[] = [
  { value: 'deteccion', label: 'Detección', icon: 'Eye' },
  { value: 'notificacion', label: 'Notificación', icon: 'Bell' },
  { value: 'accion', label: 'Acción tomada', icon: 'Zap' },
  { value: 'escalacion', label: 'Escalación', icon: 'ArrowUp' },
  { value: 'evidencia', label: 'Evidencia', icon: 'Camera' },
  { value: 'resolucion', label: 'Resolución', icon: 'CheckCircle' },
  { value: 'nota', label: 'Nota', icon: 'MessageSquare' },
];

// =============================================================================
// HOOKS
// =============================================================================

export function useIncidentesList(filtros: FiltrosIncidentes = {}) {
  return useQuery({
    queryKey: ['incidentes-operativos', filtros],
    queryFn: async () => {
      let query = supabase
        .from('incidentes_operativos')
        .select('*')
        .order('fecha_incidente', { ascending: false });

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }
      if (filtros.severidad) {
        query = query.eq('severidad', filtros.severidad);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as IncidenteOperativo[];
    },
  });
}

export function useIncidenteResumen() {
  return useQuery({
    queryKey: ['incidentes-resumen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidentes_operativos')
        .select('estado');
      if (error) throw error;

      const items = data || [];
      return {
        borradores: items.filter(i => i.estado === 'borrador').length,
        abiertos: items.filter(i => i.estado === 'abierto').length,
        en_investigacion: items.filter(i => i.estado === 'en_investigacion').length,
        resueltos: items.filter(i => i.estado === 'resuelto').length,
        cerrados: items.filter(i => i.estado === 'cerrado').length,
        total: items.length,
      };
    },
  });
}

export function useIncidenteCronologia(incidenteId: string | null) {
  return useQuery({
    queryKey: ['incidente-cronologia', incidenteId],
    queryFn: async () => {
      if (!incidenteId) return [];
      const { data, error } = await supabase
        .from('incidente_cronologia')
        .select('*')
        .eq('incidente_id', incidenteId)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      return (data || []) as EntradaCronologia[];
    },
    enabled: !!incidenteId,
  });
}

export function useCreateIncidente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IncidenteOperativo>) => {
      const { data: result, error } = await supabase
        .from('incidentes_operativos')
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return result as IncidenteOperativo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidentes-operativos'] });
      queryClient.invalidateQueries({ queryKey: ['incidentes-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['incidentes-operativos-recent'] });
      queryClient.invalidateQueries({ queryKey: ['starmap-kpis'] });
    },
  });
}

export function useUpdateIncidente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<IncidenteOperativo> & { id: string }) => {
      const { error } = await supabase
        .from('incidentes_operativos')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidentes-operativos'] });
      queryClient.invalidateQueries({ queryKey: ['incidentes-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['incidentes-operativos-recent'] });
      queryClient.invalidateQueries({ queryKey: ['starmap-kpis'] });
    },
  });
}

export function useAddCronologiaEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { incidente_id: string; timestamp: string; tipo_entrada: TipoEntradaCronologia; descripcion: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('incidente_cronologia')
        .insert({
          ...data,
          autor_id: user?.user?.id || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidente-cronologia', variables.incidente_id] });
    },
  });
}

export function useDeleteCronologiaEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, incidente_id }: { id: string; incidente_id: string }) => {
      const { error } = await supabase
        .from('incidente_cronologia')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return incidente_id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidente-cronologia', variables.incidente_id] });
    },
  });
}
