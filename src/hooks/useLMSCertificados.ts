import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Certificado {
  id: string;
  inscripcion_id: string;
  codigo_verificacion: string;
  fecha_emision: string;
  datos_certificado: {
    nombre_usuario: string;
    titulo_curso: string;
    calificacion: number;
    duracion_curso: number;
    fecha_completado: string;
    codigo_verificacion: string;
  };
  pdf_url?: string;
}

export interface CertificadoVerificacion {
  valido: boolean;
  error?: string;
  datos?: {
    nombre_usuario: string;
    titulo_curso: string;
    calificacion: number;
    fecha_completado: string;
  };
  curso?: string;
}

// Hook para obtener certificados del usuario
export const useLMSCertificados = () => {
  return useQuery({
    queryKey: ['lms-certificados'],
    queryFn: async (): Promise<Certificado[]> => {
      const { data, error } = await supabase
        .from('lms_certificados')
        .select('*')
        .order('fecha_emision', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Certificado[];
    },
    staleTime: 60000,
  });
};

// Hook para generar certificado
export const useLMSGenerarCertificado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inscripcionId: string) => {
      const { data, error } = await supabase.rpc('lms_generar_certificado', {
        p_inscripcion_id: inscripcionId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        if (data?.ya_existia) {
          toast.info('El certificado ya fue generado anteriormente');
        } else {
          toast.success('¡Certificado generado exitosamente!');
        }
        queryClient.invalidateQueries({ queryKey: ['lms-certificados'] });
        queryClient.invalidateQueries({ queryKey: ['lms-inscripcion'] });
      } else {
        toast.error(data?.error || 'Error al generar certificado');
      }
    },
    onError: (error) => {
      console.error('Error generating certificate:', error);
      toast.error('Error al generar el certificado');
    },
  });
};

// Hook para verificar un certificado (público)
export const useLMSVerificarCertificado = () => {
  return useMutation({
    mutationFn: async (codigo: string): Promise<CertificadoVerificacion> => {
      const { data, error } = await supabase.rpc('lms_verificar_certificado', {
        p_codigo: codigo
      });

      if (error) throw error;
      return data as CertificadoVerificacion;
    },
  });
};

// Hook para obtener un certificado específico por inscripción
export const useLMSCertificadoPorInscripcion = (inscripcionId: string | undefined) => {
  return useQuery({
    queryKey: ['lms-certificado', inscripcionId],
    queryFn: async (): Promise<Certificado | null> => {
      if (!inscripcionId) return null;

      const { data, error } = await supabase
        .from('lms_certificados')
        .select('*')
        .eq('inscripcion_id', inscripcionId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Certificado | null;
    },
    enabled: !!inscripcionId,
  });
};
