import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustodianDocument {
  id: string;
  custodio_telefono: string;
  tipo_documento: string;
  numero_documento: string | null;
  fecha_emision: string | null;
  fecha_vigencia: string | null;
  foto_url: string | null;
  verificado: boolean;
  verificado_por: string | null;
  fecha_verificacion: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustodianDocsForProfile(telefono: string | null) {
  return useQuery({
    queryKey: ['custodian-docs-profile', telefono],
    queryFn: async () => {
      if (!telefono) return [];
      
      const { data, error } = await supabase
        .rpc('get_documentos_custodio_by_phone', { p_telefono: telefono });
      
      if (error) {
        console.error('Error fetching custodian documents:', error);
        return [];
      }
      
      return data as CustodianDocument[];
    },
    enabled: !!telefono,
    refetchOnWindowFocus: false
  });
}

export function useCustodianDocStats(telefono: string | null) {
  const { data: documents, isLoading } = useCustodianDocsForProfile(telefono);
  
  const stats = {
    total: documents?.length || 0,
    verificados: documents?.filter(d => d.verificado).length || 0,
    pendientes: documents?.filter(d => !d.verificado).length || 0,
    porVencer: documents?.filter(d => {
      if (!d.fecha_vigencia) return false;
      const vencimiento = new Date(d.fecha_vigencia);
      const hoy = new Date();
      const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes > 0 && diasRestantes <= 30;
    }).length || 0
  };
  
  return { stats, isLoading };
}
