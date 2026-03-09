import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EntregaTurno {
  id: string;
  created_at: string;
  turno_saliente: string;
  turno_entrante: string;
  monitoristas_salientes: any;
  monitoristas_entrantes: any;
  servicios_transferidos: any;
  servicios_cerrados: any;
  notas_generales: string | null;
  estado: string;
}

export function useRevertHandoff() {
  const qc = useQueryClient();

  // Today's active handoffs (CDMX)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  const { data: entregas = [], isLoading } = useQuery({
    queryKey: ['entregas-turno-activas', today],
    queryFn: async () => {
      const startOfDay = `${today}T00:00:00-06:00`;
      const endOfDay = `${today}T23:59:59-06:00`;

      const { data, error } = await supabase
        .from('bitacora_entregas_turno')
        .select('*')
        .eq('estado', 'activa')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EntregaTurno[];
    },
    refetchInterval: 30_000,
  });

  const revertir = useMutation({
    mutationFn: async (entregaId: string) => {
      // 1. Read the handoff record
      const { data: entrega, error: readErr } = await supabase
        .from('bitacora_entregas_turno')
        .select('*')
        .eq('id', entregaId)
        .single();

      if (readErr || !entrega) throw readErr || new Error('Entrega no encontrada');
      if (entrega.estado === 'revertida') throw new Error('Esta entrega ya fue revertida');

      const transferidos = (entrega.servicios_transferidos || []) as Array<{
        servicioId: string;
        fromMonitorista: string;
        toMonitorista: string;
      }>;

      // 2. For each transferred service: deactivate incoming assignment, restore outgoing
      for (const t of transferidos) {
        // Deactivate the assignment created by handoff (entrante)
        await supabase
          .from('bitacora_asignaciones_monitorista')
          .update({ activo: false, fin_turno: new Date().toISOString() })
          .eq('servicio_id', t.servicioId)
          .eq('monitorista_id', t.toMonitorista)
          .eq('activo', true);

        // Reactivate the original assignment (saliente)
        await supabase
          .from('bitacora_asignaciones_monitorista')
          .insert({
            servicio_id: t.servicioId,
            monitorista_id: t.fromMonitorista,
            turno: entrega.turno_saliente,
            activo: true,
            inicio_turno: new Date().toISOString(),
            notas_handoff: `Restaurado por reversión de entrega ${entregaId.slice(0, 8)}`,
          });
      }

      // 3. Mark handoff as reverted
      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateErr } = await supabase
        .from('bitacora_entregas_turno')
        .update({
          estado: 'revertida',
          revertida_por: user?.id,
          revertida_at: new Date().toISOString(),
        })
        .eq('id', entregaId);

      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      toast.success('Entrega de turno revertida exitosamente');
      qc.invalidateQueries({ queryKey: ['entregas-turno-activas'] });
      qc.invalidateQueries({ queryKey: ['monitorista-assignments'] });
      qc.invalidateQueries({ queryKey: ['bitacora-board'] });
    },
    onError: (err: any) => {
      toast.error(`Error al revertir: ${err.message}`);
    },
  });

  return { entregas, isLoading, revertir };
}
