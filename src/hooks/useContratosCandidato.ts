import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TipoContrato = 
  | 'confidencialidad'
  | 'prestacion_servicios'
  | 'codigo_conducta'
  | 'aviso_privacidad'
  | 'responsiva_equipo';

export type EstadoContrato = 'pendiente' | 'enviado' | 'visto' | 'firmado' | 'rechazado' | 'vencido';

export interface ContratoCandidato {
  id: string;
  candidato_id: string;
  tipo_contrato: TipoContrato;
  plantilla_id?: string;
  version_plantilla: number;
  contenido_html?: string;
  datos_interpolados?: Record<string, any>;
  firmado: boolean;
  firma_imagen_url?: string;
  firma_data_url?: string;
  firma_ip?: string;
  firma_user_agent?: string;
  firma_timestamp?: string;
  firma_hash?: string;
  pdf_url?: string;
  pdf_generado_at?: string;
  estado: EstadoContrato;
  enviado_por?: string;
  fecha_envio?: string;
  visto_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PlantillaContrato {
  id: string;
  nombre: string;
  tipo_contrato: TipoContrato;
  version: number;
  activa: boolean;
  contenido_html: string;
  variables_requeridas: string[];
  descripcion?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const CONTRATO_LABELS: Record<TipoContrato, string> = {
  confidencialidad: 'Contrato de Confidencialidad',
  prestacion_servicios: 'Contrato de Prestación de Servicios',
  codigo_conducta: 'Código de Conducta',
  aviso_privacidad: 'Aviso de Privacidad',
  responsiva_equipo: 'Responsiva de Equipo'
};

export const CONTRATOS_REQUERIDOS: TipoContrato[] = [
  'confidencialidad',
  'codigo_conducta',
  'aviso_privacidad'
];

export function useContratosCandidato(candidatoId: string) {
  return useQuery({
    queryKey: ['contratos-candidato', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_candidato')
        .select('*')
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContratoCandidato[];
    },
    enabled: !!candidatoId,
  });
}

export function usePlantillasContrato() {
  return useQuery({
    queryKey: ['plantillas-contrato'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plantillas_contrato')
        .select('*')
        .eq('activa', true)
        .order('tipo_contrato');

      if (error) throw error;
      return data as PlantillaContrato[];
    },
  });
}

export function useGenerarContrato() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      candidatoId,
      tipoContrato,
      plantillaId,
      datosInterpolados
    }: {
      candidatoId: string;
      tipoContrato: TipoContrato;
      plantillaId: string;
      datosInterpolados: Record<string, string>;
    }) => {
      // Obtener plantilla
      const { data: plantilla, error: plantillaError } = await supabase
        .from('plantillas_contrato')
        .select('*')
        .eq('id', plantillaId)
        .single();

      if (plantillaError || !plantilla) throw new Error('Plantilla no encontrada');

      // Interpolar variables en el HTML
      let contenidoHtml = plantilla.contenido_html;
      Object.entries(datosInterpolados).forEach(([key, value]) => {
        contenidoHtml = contenidoHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      // Crear contrato
      const { data: contrato, error: insertError } = await supabase
        .from('contratos_candidato')
        .insert({
          candidato_id: candidatoId,
          tipo_contrato: tipoContrato,
          plantilla_id: plantillaId,
          version_plantilla: plantilla.version,
          contenido_html: contenidoHtml,
          datos_interpolados: datosInterpolados,
          estado: 'enviado',
          enviado_por: user?.id,
          fecha_envio: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return contrato as ContratoCandidato;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contratos-candidato', variables.candidatoId] });
      toast.success('Contrato generado correctamente');
    },
    onError: (error) => {
      console.error('Error generando contrato:', error);
      toast.error('Error al generar el contrato');
    }
  });
}

export function useFirmarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contratoId,
      candidatoId,
      firmaDataUrl
    }: {
      contratoId: string;
      candidatoId: string;
      firmaDataUrl: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generar-contrato-pdf', {
        body: {
          contrato_id: contratoId,
          firma_data_url: firmaDataUrl,
          firma_ip: 'N/A', // En producción se capturaría
          firma_user_agent: navigator.userAgent
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contratos-candidato', variables.candidatoId] });
      toast.success('Contrato firmado correctamente');
    },
    onError: (error) => {
      console.error('Error firmando contrato:', error);
      toast.error('Error al firmar el contrato');
    }
  });
}

export function useMarcarVisto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, candidatoId }: { contratoId: string; candidatoId: string }) => {
      const { error } = await supabase
        .from('contratos_candidato')
        .update({
          estado: 'visto',
          visto_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contratoId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contratos-candidato', variables.candidatoId] });
    }
  });
}

export function useContratosProgress(candidatoId: string) {
  const { data: contratos } = useContratosCandidato(candidatoId);

  const contratosFirmados = contratos?.filter(c => c.firmado) || [];
  const totalRequeridos = CONTRATOS_REQUERIDOS.length;
  const firmados = CONTRATOS_REQUERIDOS.filter(tipo => 
    contratosFirmados.some(c => c.tipo_contrato === tipo)
  ).length;
  const porcentaje = Math.round((firmados / totalRequeridos) * 100);

  const contratosFaltantes = CONTRATOS_REQUERIDOS.filter(tipo => 
    !contratosFirmados.some(c => c.tipo_contrato === tipo)
  );

  return {
    contratos,
    contratosFirmados,
    totalRequeridos,
    firmados,
    porcentaje,
    contratosFaltantes,
    isComplete: firmados >= totalRequeridos
  };
}

// Función auxiliar para interpolar datos del candidato
export function getDatosInterpolacion(candidato: {
  nombre: string;
  email?: string;
  telefono?: string;
  curp?: string;
  direccion?: string;
}): Record<string, string> {
  const hoy = new Date();
  return {
    nombre_completo: candidato.nombre || '',
    curp: candidato.curp || '[CURP_PENDIENTE]',
    direccion: candidato.direccion || '[DIRECCION_PENDIENTE]',
    fecha_actual: hoy.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    email: candidato.email || '',
    telefono: candidato.telefono || ''
  };
}
