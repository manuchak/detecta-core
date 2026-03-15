import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

export interface StaleService {
  id: string;
  id_servicio: string;
  nombre_cliente: string | null;
  custodio_asignado: string | null;
  hora_inicio_real: string;
  ultima_actividad: string;
}

interface ProtectedService {
  id_servicio: string;
  nombre_cliente: string | null;
  razon: string;
}

const BATCH_SIZE = 100;

const SPECIAL_EVENT_TYPES = ['combustible', 'baño', 'descanso', 'pernocta', 'incidencia', 'trafico'];

export function useStaleServiceCleanup() {
  const queryClient = useQueryClient();
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState({ closed: 0, total: 0 });

  const staleQuery = useQuery({
    queryKey: ['stale-services'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('detectar_servicios_estancados');
      if (error) throw error;
      return (data || []) as StaleService[];
    },
  });

  /**
   * Pre-flight check: identify services that should NOT be closed
   * because they have en_destino=true, recent start, or active special events.
   */
  const checkProtectedServices = useCallback(async (services: StaleService[]): Promise<{
    safe: StaleService[];
    protected: ProtectedService[];
  }> => {
    if (services.length === 0) return { safe: [], protected: [] };

    const serviceIds = services.map(s => s.id_servicio);
    const twelveHoursAgo = new Date(Date.now() - 12 * 3600_000).toISOString();

    // Gate 1 & 2: Check en_destino and hora_inicio_real
    const { data: svcStates } = await (supabase as any)
      .from('servicios_planificados')
      .select('id_servicio, en_destino, hora_inicio_real')
      .in('id_servicio', serviceIds)
      .is('hora_fin_real', null);

    const stateMap = new Map<string, any>();
    for (const s of (svcStates || [])) {
      stateMap.set(s.id_servicio, s);
    }

    // Gate 3: Active special events (hora_fin IS NULL)
    const { data: activeEvents } = await (supabase as any)
      .from('servicio_eventos_ruta')
      .select('servicio_id, tipo_evento')
      .in('servicio_id', serviceIds)
      .is('hora_fin', null)
      .in('tipo_evento', SPECIAL_EVENT_TYPES);

    const activeEventMap = new Set<string>();
    const activeEventTypeMap = new Map<string, string>();
    for (const e of (activeEvents || [])) {
      activeEventMap.add(e.servicio_id);
      activeEventTypeMap.set(e.servicio_id, e.tipo_evento);
    }

    const safe: StaleService[] = [];
    const protectedServices: ProtectedService[] = [];

    for (const svc of services) {
      const state = stateMap.get(svc.id_servicio);
      const isEnDestino = state?.en_destino === true;
      const hasRecentStart = state?.hora_inicio_real && state.hora_inicio_real > twelveHoursAgo;
      const hasActiveEvent = activeEventMap.has(svc.id_servicio);

      if (isEnDestino) {
        protectedServices.push({ id_servicio: svc.id_servicio, nombre_cliente: svc.nombre_cliente, razon: 'en_destino' });
      } else if (hasRecentStart) {
        protectedServices.push({ id_servicio: svc.id_servicio, nombre_cliente: svc.nombre_cliente, razon: 'inicio_reciente (<12h)' });
      } else if (hasActiveEvent) {
        protectedServices.push({ id_servicio: svc.id_servicio, nombre_cliente: svc.nombre_cliente, razon: `evento_activo: ${activeEventTypeMap.get(svc.id_servicio)}` });
      } else {
        safe.push(svc);
      }
    }

    return { safe, protected: protectedServices };
  }, []);

  const closeAll = useCallback(async () => {
    const total = staleQuery.data?.length || 0;
    if (total === 0) return;

    setIsClosing(true);
    setProgress({ closed: 0, total });

    try {
      // Pre-flight: identify protected services
      const { safe, protected: protectedSvcs } = await checkProtectedServices(staleQuery.data || []);

      if (protectedSvcs.length > 0) {
        toast.warning(
          `⚠️ ${protectedSvcs.length} servicio(s) protegidos (en_destino, inicio reciente o evento activo) no serán cerrados`,
          { duration: 6000 }
        );
        for (const p of protectedSvcs) {
          console.warn(`[StaleCleanup] PROTEGIDO: ${p.id_servicio} (${p.nombre_cliente}) — ${p.razon}`);
        }
      }

      if (safe.length === 0) {
        toast.info('No hay servicios seguros para cerrar — todos están protegidos');
        return;
      }

      // Proceed with RPC for safe services only
      let totalClosed = 0;
      const adjustedTotal = safe.length;
      setProgress({ closed: 0, total: adjustedTotal });

      while (true) {
        const { data, error } = await (supabase as any).rpc('cerrar_servicios_estancados', { p_limit: BATCH_SIZE });
        if (error) throw error;

        const batchClosed = data?.cerrados ?? 0;
        if (batchClosed === 0) break;

        totalClosed += batchClosed;
        setProgress({ closed: totalClosed, total: adjustedTotal });
        toast.info(`Cerrados ${totalClosed} de ${adjustedTotal}...`);
      }

      // Delta check: warn if RPC closed more than expected safe count
      if (totalClosed > adjustedTotal) {
        toast.warning(
          `⚠️ El RPC cerró ${totalClosed} servicios pero solo ${adjustedTotal} eran seguros. Verifique bitácora.`,
          { duration: 8000 }
        );
      }

      toast.success(`Se cerraron ${totalClosed} servicios estancados (${protectedSvcs.length} protegidos excluidos)`);
      queryClient.invalidateQueries({ queryKey: ['stale-services'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
    } catch (error: any) {
      toast.error('Error al cerrar servicios: ' + error.message);
    } finally {
      setIsClosing(false);
      setProgress({ closed: 0, total: 0 });
    }
  }, [staleQuery.data, queryClient, checkProtectedServices]);

  return {
    staleServices: staleQuery.data || [],
    isLoading: staleQuery.isLoading,
    error: staleQuery.error,
    refetch: staleQuery.refetch,
    closeAll,
    isClosing,
    progress,
  };
}
