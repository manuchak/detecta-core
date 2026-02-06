import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TipoDocumento = 
  | 'ine_frente' 
  | 'ine_reverso' 
  | 'licencia_frente' 
  | 'licencia_reverso'
  | 'curp' 
  | 'rfc' 
  | 'comprobante_domicilio'
  | 'carta_antecedentes';

export type EstadoValidacion = 'pendiente' | 'procesando' | 'valido' | 'invalido' | 'requiere_revision';

export interface DocumentoCandidato {
  id: string;
  candidato_id: string;
  tipo_documento: TipoDocumento;
  archivo_url: string;
  archivo_nombre: string;
  archivo_tipo?: string;
  archivo_tamaño?: number;
  ocr_procesado: boolean;
  ocr_datos_extraidos?: Record<string, any>;
  ocr_confianza?: number;
  ocr_fecha_proceso?: string;
  ocr_error?: string;
  estado_validacion: EstadoValidacion;
  validado_por?: string;
  fecha_validacion?: string;
  motivo_rechazo?: string;
  nombre_esperado?: string;
  nombre_extraido?: string;
  coincidencia_nombre?: boolean;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  documento_vigente?: boolean;
  subido_por?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  ine_frente: 'INE (Frente)',
  ine_reverso: 'INE (Reverso)',
  licencia_frente: 'Licencia de Conducir (Frente)',
  licencia_reverso: 'Licencia de Conducir (Reverso)',
  curp: 'CURP',
  rfc: 'RFC / Constancia de Situación Fiscal',
  comprobante_domicilio: 'Comprobante de Domicilio',
  carta_antecedentes: 'Carta de Antecedentes No Penales'
};

export const DOCUMENTOS_REQUERIDOS: TipoDocumento[] = [
  'ine_frente',
  'ine_reverso',
  'licencia_frente',
  'licencia_reverso',
  'curp',
  'rfc',
  'comprobante_domicilio',
  'carta_antecedentes'
];

export function useDocumentosCandidato(candidatoId: string) {
  return useQuery({
    queryKey: ['documentos-candidato', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_candidato')
        .select('*')
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocumentoCandidato[];
    },
    enabled: !!candidatoId,
  });
}

export function useUploadDocumento() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      candidatoId,
      tipoDocumento,
      file,
      nombreEsperado
    }: {
      candidatoId: string;
      tipoDocumento: TipoDocumento;
      file: File;
      nombreEsperado?: string;
    }) => {
      // 1. Subir archivo a storage
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${candidatoId}/${tipoDocumento}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('candidato-documentos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // 2. Verificar que el archivo existe en storage
      const { data: fileCheck } = await supabase.storage
        .from('candidato-documentos')
        .list(candidatoId, { search: `${tipoDocumento}_` });

      if (!fileCheck || fileCheck.length === 0) {
        throw new Error('El archivo no se guardó correctamente. Por favor intenta de nuevo.');
      }

      // 3. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('candidato-documentos')
        .getPublicUrl(fileName);

      // 4. Crear registro en BD
      const { data: documento, error: insertError } = await supabase
        .from('documentos_candidato')
        .insert({
          candidato_id: candidatoId,
          tipo_documento: tipoDocumento,
          archivo_url: urlData.publicUrl,
          archivo_nombre: file.name,
          archivo_tipo: file.type,
          archivo_tamaño: file.size,
          subido_por: user?.id,
          nombre_esperado: nombreEsperado,
          estado_validacion: 'pendiente'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return documento as DocumentoCandidato;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-candidato', variables.candidatoId] });
      toast.success('Documento subido correctamente');
    },
    onError: (error) => {
      console.error('Error subiendo documento:', error);
      toast.error('Error al subir el documento');
    }
  });
}

export function useProcesarOCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentoId, imagenUrl }: { documentoId: string; imagenUrl: string }) => {
      const { data, error } = await supabase.functions.invoke('ocr-documento', {
        body: {
          documento_id: documentoId,
          imagen_url: imagenUrl
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-candidato'] });
      toast.success('OCR procesado correctamente');
    },
    onError: (error) => {
      console.error('Error procesando OCR:', error);
      toast.error('Error al procesar OCR');
    }
  });
}

export function useValidarDocumento() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      documentoId,
      candidatoId,
      estado,
      motivoRechazo
    }: {
      documentoId: string;
      candidatoId: string;
      estado: 'valido' | 'invalido' | 'requiere_revision';
      motivoRechazo?: string;
    }) => {
      const { error } = await supabase
        .from('documentos_candidato')
        .update({
          estado_validacion: estado,
          validado_por: user?.id,
          fecha_validacion: new Date().toISOString(),
          motivo_rechazo: motivoRechazo,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentoId);

      if (error) throw error;
      return { documentoId, estado };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-candidato', variables.candidatoId] });
      toast.success('Documento validado');
    },
    onError: (error) => {
      console.error('Error validando documento:', error);
      toast.error('Error al validar el documento');
    }
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentoId, candidatoId, archivoUrl }: { documentoId: string; candidatoId: string; archivoUrl: string }) => {
      // Extraer path del archivo
      const urlParts = archivoUrl.split('/candidato-documentos/');
      if (urlParts.length > 1) {
        await supabase.storage.from('candidato-documentos').remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from('documentos_candidato')
        .delete()
        .eq('id', documentoId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-candidato', variables.candidatoId] });
      toast.success('Documento eliminado');
    },
    onError: (error) => {
      console.error('Error eliminando documento:', error);
      toast.error('Error al eliminar el documento');
    }
  });
}

export function useDocumentosProgress(candidatoId: string) {
  const { data: documentos } = useDocumentosCandidato(candidatoId);

  const documentosValidos = documentos?.filter(d => d.estado_validacion === 'valido') || [];
  const totalRequeridos = DOCUMENTOS_REQUERIDOS.length;
  const completados = documentosValidos.length;
  const porcentaje = Math.round((completados / totalRequeridos) * 100);

  const documentosFaltantes = DOCUMENTOS_REQUERIDOS.filter(tipo => 
    !documentosValidos.some(d => d.tipo_documento === tipo)
  );

  return {
    documentos,
    documentosValidos,
    totalRequeridos,
    completados,
    porcentaje,
    documentosFaltantes,
    isComplete: completados >= totalRequeridos
  };
}
