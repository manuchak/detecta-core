import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentTurno } from './useMonitoristaAssignment';

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

  // Redistribute helper: distribute service IDs to available monitoristas
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

  // Preview redistribution (for confirm dialog)
  const previewRedistribution = useCallback(
    async (tipo: TipoPausa) => {
      if (!currentUserId) return { assignments: [], available: [] };

      // Get my active assignments
      const { data: myAssignments } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('id, servicio_id, monitorista_id')
        .eq('monitorista_id', currentUserId)
        .eq('activo', true);

      if (!myAssignments || myAssignments.length === 0) {
        return { assignments: [], available: [] };
      }

      // Get all monitoring users
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['monitoring', 'monitoring_supervisor'])
        .eq('is_active', true);

      const allMonitoristas = [...new Set((roles || []).map(r => r.user_id))];

      // Exclude self and others currently on pause
      const { data: activePauses } = await (supabase as any)
        .from('bitacora_pausas_monitorista')
        .select('monitorista_id')
        .eq('estado', 'activa');

      const pausedIds = new Set((activePauses || []).map((p: any) => p.monitorista_id));
      const availableIds = allMonitoristas.filter(id => id !== currentUserId && !pausedIds.has(id));

      if (availableIds.length === 0) {
        return { assignments: myAssignments, available: [] };
      }

      // Get current loads
      const { data: allActive } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('monitorista_id')
        .eq('activo', true)
        .in('monitorista_id', availableIds);

      const loads: Record<string, number> = {};
      for (const a of (allActive || [])) {
        loads[a.monitorista_id] = (loads[a.monitorista_id] || 0) + 1;
      }

      // Get profiles via SECURITY DEFINER RPC (bypasses RLS on profiles)
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

  // Start pause mutation
  const iniciarPausa = useMutation({
    mutationFn: async (tipo: TipoPausa) => {
      if (!currentUserId) throw new Error('No autenticado');

      const duracionMin = PAUSE_DURATIONS[tipo];
      const finEsperado = new Date(Date.now() + duracionMin * 60_000).toISOString();

      // Get my active assignments
      const { data: myAssignments, error: fetchErr } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('id, servicio_id, monitorista_id, turno')
        .eq('monitorista_id', currentUserId)
        .eq('activo', true);
      if (fetchErr) throw fetchErr;

      if (!myAssignments || myAssignments.length === 0) {
        throw new Error('No tienes servicios asignados');
      }

      // Get available monitoristas (exclude self + paused)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['monitoring', 'monitoring_supervisor'])
        .eq('is_active', true);

      const allMonitoristas = [...new Set((roles || []).map(r => r.user_id))];

      const { data: activePauses } = await (supabase as any)
        .from('bitacora_pausas_monitorista')
        .select('monitorista_id')
        .eq('estado', 'activa');

      const pausedIds = new Set((activePauses || []).map((p: any) => p.monitorista_id));
      const availableIds = allMonitoristas.filter(id => id !== currentUserId && !pausedIds.has(id));

      if (availableIds.length === 0) {
        throw new Error('No hay monitoristas disponibles para cubrir tu pausa');
      }

      // Get current loads
      const { data: allActive } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('monitorista_id')
        .eq('activo', true)
        .in('monitorista_id', availableIds);

      const loads: Record<string, number> = {};
      for (const a of (allActive || [])) {
        loads[a.monitorista_id] = (loads[a.monitorista_id] || 0) + 1;
      }

      // Distribute
      const distribution = distributeEquitably(
        myAssignments.map((a: any) => a.servicio_id),
        availableIds,
        loads
      );

      const nowTs = new Date().toISOString();
      const turno = getCurrentTurno();
      const redistribuidos: PausaActiva['servicios_redistribuidos'] = [];

      // Deactivate originals and create temporary assignments
      for (const orig of myAssignments) {
        const target = distribution.find(d => d.servicio_id === orig.servicio_id);
        if (!target) continue;

        // Deactivate original
        await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: nowTs })
          .eq('id', orig.id);

        // Create temporary
        const { data: newAssignment, error: insertErr } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert({
            servicio_id: orig.servicio_id,
            monitorista_id: target.asignado_a,
            asignado_por: currentUserId,
            turno,
            notas_handoff: `pausa_interina`,
          })
          .select('id')
          .single();
        if (insertErr) throw insertErr;

        redistribuidos.push({
          servicio_id: orig.servicio_id,
          assignment_original_id: orig.id,
          asignado_temporalmente_a: target.asignado_a,
        });
      }

      // Insert pause record
      const { error: pauseErr } = await (supabase as any)
        .from('bitacora_pausas_monitorista')
        .insert({
          monitorista_id: currentUserId,
          tipo_pausa: tipo,
          servicios_redistribuidos: redistribuidos,
          fin_esperado: finEsperado,
        });
      if (pauseErr) throw pauseErr;

      return { count: redistribuidos.length, tipo };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      toast.success(`Pausa de ${getPauseLabel(result.tipo)} iniciada · ${result.count} servicios redistribuidos`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al iniciar pausa'),
  });

  // End pause mutation (Retomar)
  const finalizarPausa = useMutation({
    mutationFn: async () => {
      if (!pausaActiva || !currentUserId) throw new Error('No hay pausa activa');

      const nowTs = new Date().toISOString();
      const turno = getCurrentTurno();
      const redistribuidos = pausaActiva.servicios_redistribuidos;

      // Deactivate temporary assignments and restore originals
      for (const item of redistribuidos) {
        // Deactivate temporary assignment for this service
        await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: nowTs })
          .eq('servicio_id', item.servicio_id)
          .eq('monitorista_id', item.asignado_temporalmente_a)
          .eq('activo', true);

        // Re-create assignment for original monitorista
        await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert({
            servicio_id: item.servicio_id,
            monitorista_id: currentUserId,
            asignado_por: currentUserId,
            turno,
            notas_handoff: 'retorno_pausa',
          });
      }

      // Mark pause as finalizada
      await (supabase as any)
        .from('bitacora_pausas_monitorista')
        .update({ estado: 'finalizada', fin_real: nowTs })
        .eq('id', pausaActiva.id);

      return redistribuidos.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      toast.success(`Pausa finalizada · ${count} servicios restaurados`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al retomar'),
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
    previewRedistribution,
    pausasPorMonitorista,
    isLoading: pausaActivaQuery.isLoading,
  };
}
