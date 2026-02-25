import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TipoContrato = 
  | 'confidencialidad'
  | 'prestacion_servicios'
  | 'codigo_conducta'
  | 'aviso_privacidad'
  | 'responsiva_equipo'
  | 'prestacion_servicios_propietario'
  | 'prestacion_servicios_no_propietario'
  | 'anexo_gps';

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
  es_documento_fisico?: boolean;
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
  confidencialidad: 'Convenio de Confidencialidad',
  prestacion_servicios: 'Contrato de Prestación de Servicios',
  codigo_conducta: 'Código de Conducta',
  aviso_privacidad: 'Aviso de Privacidad',
  responsiva_equipo: 'Responsiva de Equipo',
  prestacion_servicios_propietario: 'Contrato Custodio',
  prestacion_servicios_no_propietario: 'Contrato Custodio',
  anexo_gps: 'Anexo GPS'
};

export const CONTRATOS_REQUERIDOS: TipoContrato[] = [
  'confidencialidad',
  'aviso_privacidad',
  'anexo_gps'
];

export const CONTRATOS_CONDICIONALES: { propietario: TipoContrato; noPropietario: TipoContrato } = {
  propietario: 'prestacion_servicios_propietario',
  noPropietario: 'prestacion_servicios_no_propietario'
};

export function getContratosRequeridosParaCandidato(vehiculoPropio: boolean): TipoContrato[] {
  return [
    ...CONTRATOS_REQUERIDOS,
    vehiculoPropio ? CONTRATOS_CONDICIONALES.propietario : CONTRATOS_CONDICIONALES.noPropietario
  ];
}

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
      const { data: plantilla, error: plantillaError } = await supabase
        .from('plantillas_contrato')
        .select('*')
        .eq('id', plantillaId)
        .single();

      if (plantillaError || !plantilla) throw new Error('Plantilla no encontrada');

      let contenidoHtml = plantilla.contenido_html;
      Object.entries(datosInterpolados).forEach(([key, value]) => {
        contenidoHtml = contenidoHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

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

export function useEliminarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contratoId, candidatoId }: { contratoId: string; candidatoId: string }) => {
      const { error } = await supabase
        .from('contratos_candidato')
        .delete()
        .eq('id', contratoId);

      if (error) throw error;
      return { candidatoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contratos-candidato', result.candidatoId] });
      toast.success('Contrato eliminado');
    },
    onError: (error) => {
      console.error('Error eliminando contrato:', error);
      toast.error('Error al eliminar el contrato');
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
          firma_ip: 'N/A',
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

// Hook para subir contratos físicos escaneados
export function useSubirContratoFisico() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      candidatoId,
      tipoContrato,
      archivo
    }: {
      candidatoId: string;
      tipoContrato: TipoContrato;
      archivo: File;
    }) => {
      // Comprimir imagen si es JPG/PNG
      let fileToUpload: File | Blob = archivo;
      if (archivo.type.startsWith('image/') && archivo.type !== 'image/svg+xml') {
        try {
          fileToUpload = await compressImage(archivo);
        } catch {
          // Fallback al archivo original si falla la compresión
          fileToUpload = archivo;
        }
      }

      // Sanitizar nombre de archivo
      const ext = archivo.name.split('.').pop()?.toLowerCase() || 'pdf';
      const timestamp = Date.now();
      const sanitizedName = `${tipoContrato}_${timestamp}.${ext}`;
      const filePath = `${candidatoId}/${sanitizedName}`;

      // Subir a storage
      const { error: uploadError } = await supabase.storage
        .from('contratos-escaneados')
        .upload(filePath, fileToUpload, {
          contentType: archivo.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Verificar que el archivo existe (Verify-Before-Commit)
      const { data: files } = await supabase.storage
        .from('contratos-escaneados')
        .list(candidatoId, { search: sanitizedName });

      if (!files || files.length === 0) {
        throw new Error('El archivo no se subió correctamente');
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('contratos-escaneados')
        .getPublicUrl(filePath);

      // Insertar registro en contratos_candidato
      const { data: contrato, error: insertError } = await supabase
        .from('contratos_candidato')
        .insert({
          candidato_id: candidatoId,
          tipo_contrato: tipoContrato,
          plantilla_id: null,
          version_plantilla: 0,
          firmado: true,
          firma_timestamp: new Date().toISOString(),
          pdf_url: urlData.publicUrl,
          estado: 'firmado',
          es_documento_fisico: true,
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
      toast.success('Contrato físico subido correctamente');
    },
    onError: (error) => {
      console.error('Error subiendo contrato físico:', error);
      toast.error('Error al subir el contrato físico');
    }
  });
}

// Compresión de imagen siguiendo el estándar del proyecto
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        0.7
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export function useContratosProgress(candidatoId: string, vehiculoPropio: boolean = false) {
  const { data: contratos } = useContratosCandidato(candidatoId);

  const requeridos = getContratosRequeridosParaCandidato(vehiculoPropio);
  const contratosFirmados = contratos?.filter(c => c.firmado) || [];
  const totalRequeridos = requeridos.length;
  const firmados = requeridos.filter(tipo => 
    contratosFirmados.some(c => c.tipo_contrato === tipo)
  ).length;
  const porcentaje = Math.round((firmados / totalRequeridos) * 100);

  const contratosFaltantes = requeridos.filter(tipo => 
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
  direccion?: string;
  curp?: string;
  // Licencia
  numero_licencia?: string;
  licencia_expedida_por?: string;
  // Vehículo
  marca_vehiculo?: string;
  modelo_vehiculo?: string;
  numero_serie?: string;
  placas?: string;
  color_vehiculo?: string;
  numero_motor?: string;
  clave_vehicular?: string;
  verificacion_vehicular?: string;
  tarjeta_circulacion?: string;
  // Factura
  numero_factura?: string;
  fecha_factura?: string;
  factura_emitida_a?: string;
  // Seguro
  numero_poliza?: string;
  aseguradora?: string;
  fecha_poliza?: string;
  poliza_emitida_a?: string;
  tipo_poliza?: string;
  // Bancarios
  banco?: string;
  numero_cuenta?: string;
  clabe?: string;
  beneficiario?: string;
  // No propietario
  nombre_propietario_vehiculo?: string;
}, analista?: {
  nombre: string;
  email: string;
}): Record<string, string> {
  const hoy = new Date();
  const fechaFormateada = hoy.toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return {
    nombre_completo: candidato.nombre || '[PENDIENTE]',
    curp: candidato.curp || '[CURP_PENDIENTE]',
    direccion: candidato.direccion || '[DIRECCION_PENDIENTE]',
    fecha_actual: fechaFormateada,
    fecha_contratacion: fechaFormateada,
    email_custodio: candidato.email || '[PENDIENTE]',
    telefono: candidato.telefono || '',
    // Licencia
    numero_licencia: candidato.numero_licencia || '[PENDIENTE]',
    licencia_expedida_por: candidato.licencia_expedida_por || '[PENDIENTE]',
    // Vehículo
    marca_vehiculo: candidato.marca_vehiculo || '[PENDIENTE]',
    modelo_vehiculo: candidato.modelo_vehiculo || '[PENDIENTE]',
    numero_serie: candidato.numero_serie || '[PENDIENTE]',
    placas: candidato.placas || '[PENDIENTE]',
    color_vehiculo: candidato.color_vehiculo || '[PENDIENTE]',
    numero_motor: candidato.numero_motor || '[PENDIENTE]',
    clave_vehicular: candidato.clave_vehicular || '[PENDIENTE]',
    verificacion_vehicular: candidato.verificacion_vehicular || '[PENDIENTE]',
    tarjeta_circulacion: candidato.tarjeta_circulacion || '[PENDIENTE]',
    // Factura
    numero_factura: candidato.numero_factura || '[PENDIENTE]',
    fecha_factura: candidato.fecha_factura || '[PENDIENTE]',
    factura_emitida_a: candidato.factura_emitida_a || '[PENDIENTE]',
    // Seguro
    numero_poliza: candidato.numero_poliza || '[PENDIENTE]',
    aseguradora: candidato.aseguradora || '[PENDIENTE]',
    fecha_poliza: candidato.fecha_poliza || '[PENDIENTE]',
    poliza_emitida_a: candidato.poliza_emitida_a || '[PENDIENTE]',
    tipo_poliza: candidato.tipo_poliza || '[PENDIENTE]',
    // Bancarios
    banco: candidato.banco || '[PENDIENTE]',
    numero_cuenta: candidato.numero_cuenta || '[PENDIENTE]',
    clabe: candidato.clabe || '[PENDIENTE]',
    beneficiario: candidato.beneficiario || '[PENDIENTE]',
    // No propietario
    nombre_propietario_vehiculo: candidato.nombre_propietario_vehiculo || '[PENDIENTE]',
    // Analista
    nombre_analista: analista?.nombre || '[PENDIENTE]',
    email_analista: analista?.email || '[PENDIENTE]',
  };
}
