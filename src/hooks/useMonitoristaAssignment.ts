import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MonitoristaAssignment {
  id: string;
  servicio_id: string;
  monitorista_id: string;
  asignado_por: string | null;
  turno: string;
  activo: boolean;
  inicio_turno: string;
  fin_turno: string | null;
  notas_handoff: string | null;
  created_at: string;
}

export interface MonitoristaProfile {
  id: string;
  display_name: string;
  role: string;
}

export function useMonitoristaAssignment() {
  const queryClient = useQueryClient();
  const queryKey = ['monitorista-assignments'];

  // Get current user's active assignments
  const myAssignments = useQuery({
    queryKey: [...queryKey, 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('*')
        .eq('monitorista_id', user.id)
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MonitoristaAssignment[];
    },
    refetchInterval: 30_000,
  });

  // All active assignments (coordinator view)
  const allAssignments = useQuery({
    queryKey: [...queryKey, 'all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MonitoristaAssignment[];
    },
    refetchInterval: 30_000,
  });

  // Fetch users with monitoring roles + profiles
  const monitoristas = useQuery({
    queryKey: [...queryKey, 'monitoristas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['monitoring', 'monitoring_supervisor'])
        .eq('is_active', true);
      if (error) throw error;
      if (!data || data.length === 0) return [] as MonitoristaProfile[];

      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name]));
      // Deduplicate by user_id, prefer monitoring_supervisor role
      const byUser = new Map<string, MonitoristaProfile>();
      for (const r of data) {
        const existing = byUser.get(r.user_id);
        if (!existing || r.role === 'monitoring_supervisor') {
          byUser.set(r.user_id, {
            id: r.user_id,
            display_name: profileMap.get(r.user_id) || r.user_id.slice(0, 8),
            role: r.role,
          });
        }
      }
      return Array.from(byUser.values());
    },
    refetchInterval: 60_000,
  });

  const assignService = useMutation({
    mutationFn: async (params: { servicioId: string; monitoristaId: string; turno?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .insert({
          servicio_id: params.servicioId,
          monitorista_id: params.monitoristaId,
          asignado_por: user?.id || null,
          turno: params.turno || 'matutino',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Servicio asignado');
    },
    onError: () => toast.error('Error al asignar servicio'),
  });

  const reassignService = useMutation({
    mutationFn: async (params: { assignmentId: string; newMonitoristaId: string; servicioId: string; turno: string }) => {
      const nowTs = new Date().toISOString();
      // Close old assignment
      await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: nowTs })
        .eq('id', params.assignmentId);
      // Create new
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .insert({
          servicio_id: params.servicioId,
          monitorista_id: params.newMonitoristaId,
          asignado_por: user?.id || null,
          turno: params.turno,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Servicio reasignado');
    },
    onError: () => toast.error('Error al reasignar servicio'),
  });

  const handoffTurno = useMutation({
    mutationFn: async (params: { fromMonitoristaId: string; toMonitoristaId: string; notas: string; turno: string }) => {
      const nowTs = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      // Get all active assignments for outgoing monitorist
      const { data: activeAssignments, error: fetchErr } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .select('*')
        .eq('monitorista_id', params.fromMonitoristaId)
        .eq('activo', true);
      if (fetchErr) throw fetchErr;

      // Auto-close stale services (no events in 6h) before transferring
      const sixHoursAgo = new Date(Date.now() - 6 * 3600_000).toISOString();
      let closedCount = 0;
      const assignmentsToTransfer: any[] = [];

      for (const a of (activeAssignments || [])) {
        // Check if this service has any recent events
        const { data: recentEvents } = await (supabase as any)
          .from('servicio_eventos_ruta')
          .select('id')
          .eq('servicio_id', a.servicio_id)
          .gte('hora_inicio', sixHoursAgo)
          .limit(1);

        if (!recentEvents || recentEvents.length === 0) {
          // No recent activity — auto-close the service
          await (supabase as any)
            .from('servicios_planificados')
            .update({ hora_fin_real: nowTs, estado_planeacion: 'completado' })
            .eq('id_servicio', a.servicio_id)
            .is('hora_fin_real', null);

          await (supabase as any)
            .from('servicio_eventos_ruta')
            .insert({
              servicio_id: a.servicio_id,
              tipo_evento: 'fin_servicio',
              descripcion: 'Cerrado automáticamente en cambio de turno (>6h sin actividad)',
              registrado_por: user?.id || null,
              hora_inicio: nowTs,
              hora_fin: nowTs,
            });

          // Close the assignment, don't transfer
          await (supabase as any)
            .from('bitacora_asignaciones_monitorista')
            .update({ activo: false, fin_turno: nowTs, notas_handoff: params.notas })
            .eq('id', a.id);

          closedCount++;
        } else {
          assignmentsToTransfer.push(a);
        }
      }

      // Close remaining assignments and transfer to incoming monitorist
      for (const a of assignmentsToTransfer) {
        await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: nowTs, notas_handoff: params.notas })
          .eq('id', a.id);

        const { error } = await (supabase as any)
          .from('bitacora_asignaciones_monitorista')
          .insert({
            servicio_id: a.servicio_id,
            monitorista_id: params.toMonitoristaId,
            asignado_por: user?.id || null,
            turno: params.turno,
            notas_handoff: params.notas,
          });
        if (error) throw error;
      }

      return { closedCount, transferredCount: assignmentsToTransfer.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['bitacora-board-active'] });
      const parts: string[] = ['Turno entregado'];
      if (result.transferredCount > 0) parts.push(`${result.transferredCount} transferidos`);
      if (result.closedCount > 0) parts.push(`${result.closedCount} cerrados por inactividad`);
      toast.success(parts.join(' · '));
    },
    onError: () => toast.error('Error en cambio de turno'),
  });

  const endTurno = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await (supabase as any)
        .from('bitacora_asignaciones_monitorista')
        .update({ activo: false, fin_turno: new Date().toISOString() })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Compute assigned service IDs for quick lookup
  const assignedServiceIds = new Set(
    (allAssignments.data || []).map(a => a.servicio_id)
  );

  // Group assignments by monitorista
  const assignmentsByMonitorista = (allAssignments.data || []).reduce<Record<string, MonitoristaAssignment[]>>(
    (acc, a) => {
      if (!acc[a.monitorista_id]) acc[a.monitorista_id] = [];
      acc[a.monitorista_id].push(a);
      return acc;
    },
    {}
  );

  return {
    myAssignments: myAssignments.data || [],
    allAssignments: allAssignments.data || [],
    monitoristas: monitoristas.data || [],
    assignedServiceIds,
    assignmentsByMonitorista,
    isLoading: myAssignments.isLoading,
    assignService,
    reassignService,
    handoffTurno,
    endTurno,
  };
}
