import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileDocument {
  id: string;
  tipo_documento: string;
  estado_validacion: string;
  fecha_vencimiento: string | null;
  documento_vigente: boolean;
  archivo_url: string | null;
  created_at: string;
}

export const DOCUMENTO_LABELS: Record<string, string> = {
  ine: 'INE / Identificación Oficial',
  curp: 'CURP',
  rfc: 'RFC',
  comprobante_domicilio: 'Comprobante de Domicilio',
  licencia_conducir: 'Licencia de Conducir',
  antecedentes_penales: 'Carta de Antecedentes Penales',
  acta_nacimiento: 'Acta de Nacimiento',
  comprobante_estudios: 'Comprobante de Estudios',
  cv: 'Curriculum Vitae',
  foto: 'Fotografía',
  contrato: 'Contrato Firmado',
  otro: 'Otro Documento'
};

export function useProfileDocuments(candidatoId: string | null) {
  return useQuery({
    queryKey: ['profile-documents', candidatoId],
    queryFn: async () => {
      if (!candidatoId) return [];
      
      const { data, error } = await supabase
        .from('documentos_candidato')
        .select('id, tipo_documento, estado_validacion, fecha_vencimiento, documento_vigente, archivo_url, created_at')
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }
      
      return data as ProfileDocument[];
    },
    enabled: !!candidatoId
  });
}

export function useDocumentStats(candidatoId: string | null) {
  const { data: documents, isLoading } = useProfileDocuments(candidatoId);
  
  const stats = {
    total: documents?.length || 0,
    validos: documents?.filter(d => d.estado_validacion === 'valido').length || 0,
    pendientes: documents?.filter(d => d.estado_validacion === 'pendiente').length || 0,
    rechazados: documents?.filter(d => d.estado_validacion === 'invalido').length || 0,
    porVencer: documents?.filter(d => {
      if (!d.fecha_vencimiento) return false;
      const vencimiento = new Date(d.fecha_vencimiento);
      const hoy = new Date();
      const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes > 0 && diasRestantes <= 30;
    }).length || 0
  };
  
  return { stats, isLoading };
}
