import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OperativeProfileFull {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  zona_base: string | null;
  disponibilidad: string;
  estado: string;
  experiencia_seguridad: boolean | null;
  vehiculo_propio: boolean | null;
  certificaciones: string[] | null;
  numero_servicios: number | null;
  rating_promedio: number | null;
  tasa_aceptacion: number | null;
  tasa_respuesta: number | null;
  tasa_confiabilidad: number | null;
  score_comunicacion: number | null;
  score_aceptacion: number | null;
  score_confiabilidad: number | null;
  score_total: number | null;
  lat: number | null;
  lng: number | null;
  fuente: string | null;
  fecha_ultimo_servicio: string | null;
  created_at: string;
  updated_at: string;
  pc_custodio_id: string | null;
}

export interface ArmadoProfileFull {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  zona_base: string | null;
  disponibilidad: string;
  estado: string;
  tipo_armado: string;
  licencia_portacion: string | null;
  fecha_vencimiento_licencia: string | null;
  experiencia_anos: number | null;
  equipamiento_disponible: string[] | null;
  numero_servicios: number | null;
  rating_promedio: number | null;
  tasa_confirmacion: number | null;
  tasa_respuesta: number | null;
  tasa_confiabilidad: number | null;
  score_total: number | null;
  created_at: string;
  updated_at: string;
}

export function useOperativeProfile(id: string | undefined, tipo: 'custodio' | 'armado') {
  return useQuery({
    queryKey: ['operative-profile', tipo, id],
    queryFn: async () => {
      if (!id) throw new Error('ID requerido');
      
      const table = tipo === 'custodio' ? 'custodios_operativos' : 'armados_operativos';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as OperativeProfileFull | ArmadoProfileFull;
    },
    enabled: !!id
  });
}

export function useCustodioROI(custodioId: string | undefined) {
  return useQuery({
    queryKey: ['custodio-roi', custodioId],
    queryFn: async () => {
      if (!custodioId) throw new Error('ID requerido');
      
      const { data, error } = await supabase
        .from('roi_custodios')
        .select('*')
        .eq('custodio_id', custodioId)
        .order('periodo_fin', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!custodioId
  });
}
