import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface CustodioProfile {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  zona_base: string | null;
  estado: string;
  disponibilidad: string;
  vehiculo_propio: boolean | null;
  rating_promedio: number | null;
  tasa_aceptacion: number | null;
  tasa_respuesta: number | null;
  numero_servicios: number | null;
  fecha_ultimo_servicio: string | null;
  score_total: number | null;
  created_at: string;
  preferencia_tipo_servicio: 'local' | 'foraneo' | 'indistinto' | null;
  // Calculated fields
  dias_sin_actividad: number;
  nivel_actividad: 'activo' | 'moderado' | 'inactivo' | 'sin_actividad';
}

export interface ArmadoProfile {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  zona_base: string | null;
  estado: string;
  disponibilidad: string;
  tipo_armado: string;
  origen: string | null;
  proveedor_id: string | null;
  licencia_portacion: string | null;
  fecha_vencimiento_licencia: string | null;
  rating_promedio: number | null;
  tasa_confirmacion: number | null;
  numero_servicios: number | null;
  fecha_ultimo_servicio: string | null;
  score_total: number | null;
  created_at: string;
  preferencia_tipo_servicio: 'local' | 'foraneo' | 'indistinto' | null;
  // Calculated fields
  dias_sin_actividad: number;
  nivel_actividad: 'activo' | 'moderado' | 'inactivo' | 'sin_actividad';
}

export interface ArchivedProfile {
  id: string;
  personal_id: string;
  personal_tipo: 'custodio' | 'armado';
  nombre: string;
  telefono: string | null;
  email: string | null;
  fecha_archivo: string;
  motivo_archivo: string;
  archivado_por: string | null;
  puede_reactivar: boolean;
}

export interface ProfileStats {
  totalCustodios: number;
  totalArmados: number;
  totalArchivados: number;
  activosUltimos30Dias: number;
  inactivosMas60Dias: number;
  documentosCompletos: number;
}

function calculateActivityLevel(fechaUltimoServicio: string | null): {
  diasSinActividad: number;
  nivel: CustodioProfile['nivel_actividad'];
} {
  if (!fechaUltimoServicio) {
    return { diasSinActividad: 999, nivel: 'sin_actividad' };
  }
  
  const diasSinActividad = Math.floor(
    (Date.now() - new Date(fechaUltimoServicio).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (diasSinActividad <= 30) return { diasSinActividad, nivel: 'activo' };
  if (diasSinActividad <= 60) return { diasSinActividad, nivel: 'moderado' };
  if (diasSinActividad <= 90) return { diasSinActividad, nivel: 'inactivo' };
  return { diasSinActividad, nivel: 'sin_actividad' };
}

export function useOperativeProfiles() {
  // Fetch custodios operativos
  const custodiosQuery = useQuery({
    queryKey: ['operative-profiles', 'custodios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custodios_operativos')
        .select(`
          id,
          nombre,
          telefono,
          email,
          zona_base,
          estado,
          disponibilidad,
          vehiculo_propio,
          rating_promedio,
          tasa_aceptacion,
          tasa_respuesta,
          numero_servicios,
          fecha_ultimo_servicio,
          score_total,
          created_at,
          preferencia_tipo_servicio
        `)
        .neq('estado', 'archivado')
        .order('nombre');
      
      if (error) throw error;
      
      return (data || []).map(c => {
        const { diasSinActividad, nivel } = calculateActivityLevel(c.fecha_ultimo_servicio);
        return {
          ...c,
          dias_sin_actividad: diasSinActividad,
          nivel_actividad: nivel
        } as CustodioProfile;
      });
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch armados operativos
  const armadosQuery = useQuery({
    queryKey: ['operative-profiles', 'armados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armados_operativos')
        .select(`
          id,
          nombre,
          telefono,
          email,
          zona_base,
          estado,
          disponibilidad,
          tipo_armado,
          origen,
          proveedor_id,
          licencia_portacion,
          fecha_vencimiento_licencia,
          rating_promedio,
          tasa_confirmacion,
          numero_servicios,
          fecha_ultimo_servicio,
          score_total,
          created_at,
          preferencia_tipo_servicio
        `)
        .neq('estado', 'archivado')
        .order('nombre');
      
      if (error) throw error;
      
      return (data || []).map(a => {
        const { diasSinActividad, nivel } = calculateActivityLevel(a.fecha_ultimo_servicio);
        return {
          ...a,
          dias_sin_actividad: diasSinActividad,
          nivel_actividad: nivel
        } as ArmadoProfile;
      });
    },
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch archived profiles (from personal_archivados if exists, otherwise empty)
  const archivadosQuery = useQuery({
    queryKey: ['operative-profiles', 'archivados'],
    queryFn: async () => {
      // For now, return empty array since table doesn't exist yet
      // Will be populated after migration is created
      return [] as ArchivedProfile[];
    },
    staleTime: 5 * 60 * 1000
  });
  
  // Calculate stats
  const stats: ProfileStats = {
    totalCustodios: custodiosQuery.data?.length || 0,
    totalArmados: armadosQuery.data?.length || 0,
    totalArchivados: archivadosQuery.data?.length || 0,
    activosUltimos30Dias: custodiosQuery.data?.filter(c => c.nivel_actividad === 'activo').length || 0,
    inactivosMas60Dias: custodiosQuery.data?.filter(c => 
      c.nivel_actividad === 'inactivo' || c.nivel_actividad === 'sin_actividad'
    ).length || 0,
    documentosCompletos: 0 // TODO: Calculate when document compliance is implemented
  };
  
  return {
    custodios: custodiosQuery.data || [],
    armados: armadosQuery.data || [],
    archivados: archivadosQuery.data || [],
    stats,
    loading: custodiosQuery.isLoading || armadosQuery.isLoading,
    refetch: () => {
      custodiosQuery.refetch();
      armadosQuery.refetch();
      archivadosQuery.refetch();
    }
  };
}
