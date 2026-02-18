import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LMSPlantillaCertificado {
  id: string;
  nombre: string;
  descripcion?: string;
  plantilla_html: string;
  estilos_css?: string;
  variables_disponibles: string[];
  es_default: boolean;
  activo: boolean;
}

export const useLMSPlantillas = () => {
  return useQuery({
    queryKey: ['lms-plantillas-certificados'],
    queryFn: async (): Promise<LMSPlantillaCertificado[]> => {
      const { data, error } = await supabase
        .from('lms_certificados_plantillas')
        .select('*')
        .eq('activo', true)
        .order('es_default', { ascending: false });

      if (error) throw error;
      return (data || []) as LMSPlantillaCertificado[];
    },
    staleTime: 60000,
  });
};
