/**
 * Hook para gestionar rechazos de custodios
 * Los rechazos persisten por 7 días y excluyen custodios de asignaciones
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustodioRechazo {
  id: string;
  custodio_id: string;
  servicio_id: string | null;
  fecha_rechazo: string;
  motivo: string | null;
  reportado_por: string | null;
  vigencia_hasta: string;
  created_at: string;
}

/**
 * Obtiene la lista de custodios con rechazos vigentes
 */
export interface RechazadoDetalle {
  id: string;
  nombre: string;
  vigencia_hasta: string;
  motivo: string | null;
}

export function useRechazosVigentes(options?: { inclujeArmado?: boolean }) {
  return useQuery({
    queryKey: ['custodio-rechazos-vigentes', options?.inclujeArmado],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('custodio_rechazos')
        .select('custodio_id, motivo')
        .gt('vigencia_hasta', new Date().toISOString());

      if (error) {
        console.warn('⚠️ Error fetching rejections (non-blocking):', error);
        return []; // Fail-open: don't block assignment if query fails
      }

      const servicioRequiereArmado = options?.inclujeArmado ?? true;
      
      // Filtrado contextual: rechazos con motivo "armado" solo aplican a servicios con armado
      const rechazosAplicables = (data || []).filter(r => {
        const motivoLower = (r.motivo || '').toLowerCase();
        const esRechazoArmado = motivoLower.includes('armado');
        if (esRechazoArmado && !servicioRequiereArmado) return false;
        return true;
      });

      const uniqueIds = [...new Set(rechazosAplicables.map(r => r.custodio_id))];
      console.log(`🚫 ${uniqueIds.length} custodios con rechazos vigentes (contexto armado: ${servicioRequiereArmado})`);
      return uniqueIds;
    },
    staleTime: 60000, // 1 minute cache
  });
}

/**
 * Obtiene detalles de rechazos vigentes (con nombre del custodio) para UX de exclusión
 */
export function useRechazosVigentesDetallados(options?: { inclujeArmado?: boolean }) {
  return useQuery({
    queryKey: ['custodio-rechazos-vigentes-detallados', options?.inclujeArmado],
    queryFn: async (): Promise<RechazadoDetalle[]> => {
      const { data, error } = await supabase
        .from('custodio_rechazos')
        .select('custodio_id, motivo, vigencia_hasta')
        .gt('vigencia_hasta', new Date().toISOString());

      if (error) {
        console.warn('⚠️ Error fetching detailed rejections:', error);
        return [];
      }

      const servicioRequiereArmado = options?.inclujeArmado ?? true;
      const rechazosAplicables = (data || []).filter(r => {
        const motivoLower = (r.motivo || '').toLowerCase();
        const esRechazoArmado = motivoLower.includes('armado');
        if (esRechazoArmado && !servicioRequiereArmado) return false;
        return true;
      });

      // Deduplicate by custodio_id
      const uniqueMap = new Map<string, typeof rechazosAplicables[0]>();
      rechazosAplicables.forEach(r => {
        if (!uniqueMap.has(r.custodio_id)) uniqueMap.set(r.custodio_id, r);
      });

      // Fetch names from custodios_operativos
      const ids = [...uniqueMap.keys()];
      if (ids.length === 0) return [];

      const { data: custodios } = await supabase
        .from('custodios_operativos')
        .select('id, nombre')
        .in('id', ids);

      const nombreMap = new Map((custodios || []).map(c => [c.id, c.nombre]));

      return ids.map(id => {
        const rechazo = uniqueMap.get(id)!;
        return {
          id,
          nombre: nombreMap.get(id) || 'Desconocido',
          vigencia_hasta: rechazo.vigencia_hasta,
          motivo: rechazo.motivo,
        };
      });
    },
    staleTime: 60000,
  });
}

/**
 * Registra un rechazo de custodio
 */
export function useRegistrarRechazo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      custodioId,
      servicioId,
      motivo,
    }: {
      custodioId: string;
      servicioId?: string;
      motivo?: string;
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('custodio_rechazos')
        .insert({
          custodio_id: custodioId,
          servicio_id: servicioId || null,
          motivo: motivo || 'Rechazó durante asignación',
          reportado_por: user?.id || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error registering rejection:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh custodian lists
      queryClient.invalidateQueries({ queryKey: ['custodio-rechazos-vigentes'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad-equitativo'] });
      
      toast.success('Rechazo registrado', {
        description: 'El custodio no aparecerá en la lista por 7 días',
      });
    },
    onError: (error) => {
      toast.error('Error al registrar rechazo', {
        description: 'No se pudo guardar el rechazo. Intenta nuevamente.',
      });
    },
  });
}

/**
 * Hook combinado para filtrar custodios rechazados de una lista
 */
export function useFilterRechazados<T extends { id: string }>(custodios: T[], options?: { inclujeArmado?: boolean }) {
  const { data: rechazadosIds = [], isLoading } = useRechazosVigentes(options);

  const filtered = custodios.filter(c => !rechazadosIds.includes(c.id));

  return {
    filteredCustodios: filtered,
    rechazadosCount: custodios.length - filtered.length,
    isLoading,
  };
}
