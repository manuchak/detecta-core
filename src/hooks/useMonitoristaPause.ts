import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TipoPausa = 'comida' | 'bano' | 'descanso' | 'desayuno';

export interface PausaActiva {
  id: string;
  monitorista_id: string;
  tipo_pausa: TipoPausa;
  estado: string;
  servicios_redistribuidos: Array<{
    servicio_id: string;
    assignment_original_id: string;
    asignado_temporalmente_a: string;
  }>;
  inicio: string;
  fin_esperado: string;
  fin_real: string | null;
}

const PAUSE_DURATIONS: Record<TipoPausa, number> = {
  desayuno: 20,
  comida: 60,
  bano: 10,
  descanso: 10,
};

const PAUSE_LABELS: Record<TipoPausa, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  bano: 'Baño',
  descanso: 'Descanso visual',
};

export function getPauseLabel(tipo: TipoPausa): string {
  return PAUSE_LABELS[tipo] || tipo;
}

export function getPauseDurationMinutes(tipo: TipoPausa): number {
  return PAUSE_DURATIONS[tipo];
}

export function useMonitoristaPause() {
  const queryClient = useQueryClient();
  const queryKey = ['monitorista-pause'];

  // Current user
  const currentUserQuery = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    staleTime: Infinity,
  });

  const currentUserId = currentUserQuery.data;

  // Active pause for current user
  const pausaActivaQuery = useQuery({
    queryKey: [...queryKey, 'activa', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data, error } = await (supabase as any)
        .from('bitacora_pausas_monitorista')
        .select('*')
        .eq('monitorista_id', currentUserId)
        .eq('estado', 'activa')
        .order('inicio', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PausaActiva | null;
    },
    enabled: !!currentUserId,
    refetchInterval: 15_000,
  });

  // All active pauses (for coordinator view)
  const allPausasQuery = useQuery({
    queryKey: [...queryKey, 'all-activas'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bitacora_pausas_monitorista')
        .select('*')
        .eq('estado', 'activa');
      if (error) throw error;
      return (data || []) as PausaActiva[];
    },
    refetchInterval: 15_000,
  });

  // Timer countdown
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const pausaActiva = pausaActivaQuery.data;

  useEffect(() => {
    if (!pausaActiva) {
      setSegundosRestantes(null);
      return;
    }

    const calcRemaining = () => {
      const fin = new Date(pausaActiva.fin_esperado).getTime();
      const now = Date.now();
      return Math.floor((fin - now) / 1000);
    };

    setSegundosRestantes(calcRemaining());
    const interval = setInterval(() => {
      setSegundosRestantes(calcRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [pausaActiva]);

  const excedido = segundosRestantes !== null && segundosRestantes < 0;

  // Redistribute helper for preview only
  const distributeEquitably = useCallback(
    (serviceIds: string[], monitoristaIds: string[], currentLoads: Record<string, number>) => {
      const load = { ...currentLoads };
      for (const mId of monitoristaIds) {
        if (!(mId in load)) load[mId] = 0;
      }
      const result: Array<{ servicio_id: string; asignado_a: string }> = [];
      for (const sId of serviceIds) {
        const target = monitoristaIds.reduce((a, b) => (load[a] <= load[b] ? a : b));
        result.push({ servicio_id: sId, asignado_a: target });
        load[target]++;
      }
      return result;
    },
    []
  );

  // Preview redistribution (for confirm dialog) — client-side preview only
  const previewRedistribution = useCallback(
    async (tipo: TipoPausa) => {
      if (!currentUserId) return { assignments: [], available: [] };

      const { data: myAssignments } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('id, servicio_id, monitorista_id')
        .eq('monitorista_id', currentUserId)
        .eq('activo', true);

      if (!myAssignments || myAssignments.length === 0) {
        return { assignments: [], available: [] };
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['monitoring', 'monitoring_supervisor'])
        .eq('is_active', true);

      const allMonitoristas = [...new Set((roles || []).map(r => r.user_id))];

      const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data: heartbeats } = await (supabase as any)
        .from('monitorista_heartbeat')
        .select('user_id')
        .gte('last_ping', fiveMinAgo);
      const onlineIds = new Set((heartbeats || []).map((h: any) => h.user_id));
      const onShiftMonitoristas = allMonitoristas.filter(id => onlineIds.has(id));

      const { data: activePauses } = await (supabase as any)
        .from('bitacora_pausas_monitorista')
        .select('monitorista_id')
        .eq('estado', 'activa');

      const pausedIds = new Set((activePauses || []).map((p: any) => p.monitorista_id));
      const availableIds = onShiftMonitoristas.filter(id => id !== currentUserId && !pausedIds.has(id));

      if (availableIds.length === 0) {
        return { assignments: myAssignments, available: [] };
      }

      const { data: allActive } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('monitorista_id')
        .eq('activo', true)
        .in('monitorista_id', availableIds);

      const loads: Record<string, number> = {};
      for (const a of (allActive || [])) {
        loads[a.monitorista_id] = (loads[a.monitorista_id] || 0) + 1;
      }

      const { data: staffProfiles } = await supabase.rpc('get_monitoring_staff_profiles' as any);
      const profileMap = new Map(
        ((staffProfiles || []) as Array<{ id: string; display_name: string }>)
          .map(p => [p.id, p.display_name])
      );

      const distribution = distributeEquitably(
        myAssignments.map((a: any) => a.servicio_id),
        availableIds,
        loads
      );

      const available = availableIds.map(id => ({
        id,
        display_name: profileMap.get(id) || id.slice(0, 8),
        count: distribution.filter(d => d.asignado_a === id).length,
      }));

      return { assignments: myAssignments, available, distribution };
    },
    [currentUserId, distributeEquitably]
  );

  // Start pause via edge function (transactional)
  const iniciarPausa = useMutation({
    mutationFn: async (tipo: TipoPausa) => {
      const { data, error } = await supabase.functions.invoke('iniciar-pausa-monitorista', {
        body: { tipo_pausa: tipo },
      });
      if (error) {
        console.error('[useMonitoristaPause] iniciarPausa error:', error);
        throw new Error(error.message || 'Error al iniciar pausa');
      }
      if (data?.error) throw new Error(data.error);
      return data as { count: number; tipo: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      toast.success(`Pausa de ${getPauseLabel(result.tipo as TipoPausa)} iniciada · ${result.count} servicios redistribuidos`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al iniciar pausa'),
  });

  // End pause via edge function (transactional)
  const finalizarPausa = useMutation({
    mutationFn: async (params?: { pausa_id?: string; monitorista_id?: string }) => {
      const { data, error } = await supabase.functions.invoke('finalizar-pausa-monitorista', {
        body: params || {},
      });
      if (error) throw new Error(error.message || 'Error al finalizar pausa');
      if (data?.error) throw new Error(data.error);
      return data as { count: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      toast.success(`Pausa finalizada · ${result.count} servicios restaurados`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al retomar'),
  });

  // Repair orphan pauses (coordinator only)
  const repararPausaHuerfana = useMutation({
    mutationFn: async (monitoristaId?: string) => {
      const { data, error } = await supabase.functions.invoke('reparar-pausa-huerfana', {
        body: { monitorista_id: monitoristaId },
      });
      if (error) throw new Error(error.message || 'Error al reparar');
      if (data?.error) throw new Error(data.error);
      return data as { repaired: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      if (result.repaired > 0) {
        toast.success(`${result.repaired} asignaciones restauradas`);
      } else {
        toast.info('No se encontraron pausas huérfanas');
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Error al reparar'),
  });

  // Map of monitorista_id -> active pause (for coordinator chips)
  const pausasPorMonitorista = useMemo(() => {
    const map = new Map<string, PausaActiva>();
    for (const p of (allPausasQuery.data || [])) {
      map.set(p.monitorista_id, p);
    }
    return map;
  }, [allPausasQuery.data]);

  return {
    pausaActiva,
    segundosRestantes,
    excedido,
    iniciarPausa,
    finalizarPausa,
    repararPausaHuerfana,
    previewRedistribution,
    pausasPorMonitorista,
    isLoading: pausaActivaQuery.isLoading,
  };
}
