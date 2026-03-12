import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SolicitudApoyo {
  id: string;
  servicio_custodia_id: number | null;
  id_servicio: string | null;
  custodio_id: string | null;
  custodio_nombre: string | null;
  cliente_nombre: string | null;
  tipo_apoyo: string;
  motivo: string;
  monto_solicitado: number;
  monto_aprobado: number | null;
  moneda: string | null;
  estado: string | null;
  urgencia: string | null;
  solicitado_por: string | null;
  fecha_solicitud: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  motivo_rechazo: string | null;
  comprobante_url: string | null;
  notas: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const TIPOS_APOYO_CUSTODIO = [
  { value: 'hotel', label: 'Hotel / Hospedaje' },
  { value: 'caseta_riesgo', label: 'Caseta en Zona de Riesgo' },
  { value: 'combustible', label: 'Combustible Adicional' },
  { value: 'alimentacion', label: 'Alimentación' },
  { value: 'transporte_alterno', label: 'Transporte Alterno' },
  { value: 'reparacion_vehicular', label: 'Reparación Vehicular' },
  { value: 'peaje_adicional', label: 'Peaje Adicional' },
  { value: 'regreso_base', label: 'Regreso a Base' },
  { value: 'otro', label: 'Otro' },
];

const QUERY_KEY = 'custodian-expenses';

/**
 * Parse comprobante_url which may be a single URL string or a JSON array of URLs.
 * Returns an array of URL strings for backward compatibility.
 */
export function parseComprobantes(url: string | null): string[] {
  if (!url) return [];
  const trimmed = url.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter((u: unknown) => typeof u === 'string' && u.length > 0);
    } catch {
      // fall through
    }
  }
  return [trimmed];
}

/** Compress an image file via Canvas API (~400KB target) */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_W = 1920, MAX_H = 1080;
      let w = img.width, h = img.height;
      if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export function useCustodianExpenses() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .select('*')
        .or(`solicitado_por.eq.${user.user.id},custodio_id.eq.${user.user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as SolicitudApoyo[];
    },
    staleTime: 30_000,
  });
}

export interface CreateExpenseInput {
  tipo_apoyo: string;
  motivo: string;
  monto_solicitado: number;
  urgencia: string;
  servicio_custodia_id?: number;
  id_servicio?: string;
  custodio_nombre?: string;
  cliente_nombre?: string;
  notas?: string;
  archivos?: File[];
}

export function useCreateCustodianExpense() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('No autenticado');

      // Validate unique folio
      const folioTrimmed = input.notas?.trim();
      if (folioTrimmed) {
        const { data: existing } = await supabase
          .from('solicitudes_apoyo_extraordinario')
          .select('id')
          .eq('notas', folioTrimmed)
          .limit(1);

        if (existing && existing.length > 0) {
          throw new Error('FOLIO_DUPLICADO');
        }
      }

      let comprobanteUrl: string | null = null;

      // Upload receipt photos (up to 3) in parallel
      if (input.archivos && input.archivos.length > 0) {
        const uploadPromises = input.archivos.map(async (file) => {
          const compressed = await compressImage(file);
          const ext = compressed.name.split('.').pop() || 'jpg';
          const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('comprobantes-gastos')
            .upload(fileName, compressed);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('comprobantes-gastos')
            .getPublicUrl(fileName);

          return urlData.publicUrl;
        });

        const urls = await Promise.all(uploadPromises);
        comprobanteUrl = urls.length === 1 ? urls[0] : JSON.stringify(urls);
      }

      const { data, error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .insert({
          tipo_apoyo: input.tipo_apoyo,
          motivo: input.motivo,
          monto_solicitado: input.monto_solicitado,
          urgencia: input.urgencia,
          servicio_custodia_id: input.servicio_custodia_id || null,
          id_servicio: input.id_servicio || null,
          custodio_id: userId,
          custodio_nombre: input.custodio_nombre || null,
          cliente_nombre: input.cliente_nombre || null,
          solicitado_por: userId,
          comprobante_url: comprobanteUrl,
          notas: folioTrimmed || null,
          estado: 'pendiente',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Solicitud de apoyo enviada correctamente');
    },
    onError: (e: Error) => {
      if (e.message === 'FOLIO_DUPLICADO') {
        toast.error('Este folio ya fue registrado. Verifica el número e intenta de nuevo.');
      } else {
        toast.error(`Error: ${e.message}`);
      }
    },
  });
}
