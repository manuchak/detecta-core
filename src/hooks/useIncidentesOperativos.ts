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
  imagen_url: string | null;
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
  {
    value: 'robo',
    label: 'Robo',
    descripcion: 'Sustracción de bienes sin confrontación directa con personas. El delincuente actúa sin violencia física hacia el custodio u operador.',
    ejemplo: 'Mercancía sustraída de la unidad mientras el operador estaba en descanso; robo de autopartes en estacionamiento.',
  },
  {
    value: 'asalto',
    label: 'Asalto',
    descripcion: 'Agresión con violencia o intimidación directa hacia el personal para despojar bienes. Implica amenaza con arma o fuerza física.',
    ejemplo: 'Sujetos armados interceptan la unidad y amenazan al operador; encajonamiento en carretera con armas de fuego.',
  },
  {
    value: 'accidente_vial',
    label: 'Accidente vial',
    descripcion: 'Colisión, volcadura o percance vehicular durante el traslado. Puede o no involucrar terceros.',
    ejemplo: 'Choque en crucero por falta de semáforo; volcadura en curva por exceso de velocidad.',
  },
  {
    value: 'agresion',
    label: 'Agresión',
    descripcion: 'Ataque físico o verbal hacia el personal sin intención de robo. Puede ser de terceros o entre personal.',
    ejemplo: 'Altercado con conductor de otro vehículo; agresión de civil en punto de entrega.',
  },
  {
    value: 'extorsion',
    label: 'Extorsión',
    descripcion: 'Exigencia de dinero o bienes bajo amenaza, sin sustracción directa de mercancía. Incluye cobro de piso o llamadas amenazantes.',
    ejemplo: 'Llamada exigiendo pago para permitir paso en zona; cobro de "derecho de piso" en punto de entrega.',
  },
  {
    value: 'perdida_mercancia',
    label: 'Pérdida de mercancía',
    descripcion: 'Faltante de producto sin evidencia de acto delictivo. Puede ser por error logístico, daño en tránsito o discrepancia en conteo.',
    ejemplo: 'Al entregar se detectan 3 cajas faltantes sin signos de apertura forzada; producto dañado por mala estiba.',
  },
  {
    value: 'falla_gps',
    label: 'Falla GPS',
    descripcion: 'Pérdida de señal, desconexión o mal funcionamiento del dispositivo de rastreo durante el servicio.',
    ejemplo: 'GPS sin reportar posición por más de 30 min; dispositivo desconectado detectado en revisión.',
  },
  {
    value: 'protocolo_incumplido',
    label: 'Protocolo incumplido',
    descripcion: 'Violación a procedimientos operativos establecidos sin que necesariamente ocurra un siniestro.',
    ejemplo: 'Operador no realizó check-in en punto de control; custodio abandonó la unidad sin autorización.',
  },
  {
    value: 'otro',
    label: 'Otro',
    descripcion: 'Evento que no encaja en las categorías anteriores pero requiere documentación.',
    ejemplo: 'Bloqueo carretero que impide la entrega; fenómeno meteorológico que daña la unidad.',
  },
];

export const SEVERIDADES = [
  {
    value: 'baja',
    label: 'Baja',
    color: 'bg-emerald-500/10 text-emerald-600',
    descripcion: 'Sin lesiones, sin pérdida económica significativa, sin afectación al servicio.',
    ejemplo: 'Falla de GPS temporal resuelta en minutos; protocolo menor incumplido sin consecuencias.',
  },
  {
    value: 'media',
    label: 'Media',
    color: 'bg-amber-500/10 text-amber-600',
    descripcion: 'Pérdida económica moderada o retraso significativo en la entrega. Sin lesiones graves.',
    ejemplo: 'Pérdida parcial de mercancía por daño en tránsito; accidente vial menor sin heridos.',
  },
  {
    value: 'alta',
    label: 'Alta',
    color: 'bg-orange-500/10 text-orange-600',
    descripcion: 'Pérdida económica importante, lesiones leves, o riesgo de afectación a la relación con el cliente.',
    ejemplo: 'Robo de carga completa sin violencia; accidente con lesiones leves; cliente escala queja formal.',
  },
  {
    value: 'critica',
    label: 'Crítica',
    color: 'bg-red-500/10 text-red-600',
    descripcion: 'Lesiones graves, pérdida total de carga de alto valor, uso de armas, o riesgo de vida.',
    ejemplo: 'Asalto con arma de fuego; secuestro de operador; pérdida de carga valuada en más de $500K.',
  },
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

// ---------------------------------------------------------------------------
// Image compression utility (Canvas API, max 1920x1080, quality 0.7)
// ---------------------------------------------------------------------------
async function compressImage(file: File): Promise<File> {
  const MAX_W = 1920;
  const MAX_H = 1080;
  const QUALITY = 0.7;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_W || height > MAX_H) {
        const ratio = Math.min(MAX_W / width, MAX_H / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: blob.type }));
        },
        'image/jpeg',
        QUALITY,
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadEvidenciaImage(file: File, incidenteId: string): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop() || 'jpg';
  const path = `${incidenteId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('evidencias-incidentes')
    .upload(path, compressed, { contentType: compressed.type, upsert: false });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('evidencias-incidentes')
    .getPublicUrl(path);
  return urlData.publicUrl;
}

export function useAddCronologiaEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      incidente_id: string;
      timestamp: string;
      tipo_entrada: TipoEntradaCronologia;
      descripcion: string;
      imagen?: File;
    }) => {
      const { imagen, ...rest } = data;
      let imagen_url: string | null = null;

      if (imagen) {
        imagen_url = await uploadEvidenciaImage(imagen, data.incidente_id);
      }

      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('incidente_cronologia')
        .insert({
          ...rest,
          imagen_url,
          autor_id: user?.user?.id || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidente-cronologia', variables.incidente_id] });
    },
  });
}

export { uploadEvidenciaImage };

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
