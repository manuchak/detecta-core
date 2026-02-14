import { useMemo } from 'react';
import { useCSCartera } from './useCSCartera';
import { useCSTouchpoints } from './useCSTouchpoints';
import { subDays, isBefore, startOfDay, startOfMonth } from 'date-fns';

export interface CSMMetrics {
  csmId: string;
  csmName: string;
  clientesAsignados: number;
  touchpoints30d: number;
  touchpointsMes: number;
  avgDiasSinContacto: number;
  clientesRojo: number;
  followupsVencidos: number;
  quejasAbiertas: number;
  activityScore: number;
}

export function useCSStaffMetrics() {
  const { data: cartera, isLoading: carteraLoading } = useCSCartera();
  const { data: touchpoints, isLoading: tpLoading } = useCSTouchpoints();

  const metrics = useMemo(() => {
    if (!cartera || !touchpoints) return [];

    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);
    const mesInicio = startOfMonth(today);

    // Group clients by CSM
    const csmMap = new Map<string, { name: string; clients: typeof cartera }>();
    cartera.filter(c => c.csm_asignado).forEach(c => {
      const key = c.csm_asignado!;
      if (!csmMap.has(key)) csmMap.set(key, { name: c.csm_nombre || 'Sin nombre', clients: [] });
      csmMap.get(key)!.clients.push(c);
    });

    const result: CSMMetrics[] = [];

    csmMap.forEach((val, csmId) => {
      const { name, clients } = val;
      const activeClients = clients.filter(c => c.activo);

      // Touchpoints by this CSM
      const csmTps = touchpoints.filter(t => t.created_by === csmId);
      const tp30d = csmTps.filter(t => new Date(t.created_at) >= thirtyDaysAgo).length;
      const tpMes = csmTps.filter(t => new Date(t.created_at) >= mesInicio).length;

      // Avg days without contact
      const contactDays = activeClients.map(c => c.dias_sin_contacto).filter(d => d < 999);
      const avgDias = contactDays.length ? Math.round(contactDays.reduce((s, d) => s + d, 0) / contactDays.length) : 999;

      // Clients in red
      const clientesRojo = activeClients.filter(c => c.salud === 'rojo').length;

      // Overdue follow-ups
      const clienteIds = new Set(clients.map(c => c.id));
      const followupsVencidos = touchpoints.filter(t =>
        clienteIds.has(t.cliente_id) &&
        t.fecha_siguiente_accion &&
        isBefore(new Date(t.fecha_siguiente_accion), today)
      ).length;

      // Open complaints
      const quejasAbiertas = activeClients.reduce((s, c) => s + c.quejas_abiertas, 0);

      // Activity score: higher is better (more touchpoints, lower avg days)
      const activityScore = Math.max(0, 100 - avgDias + tp30d * 5 - clientesRojo * 10 - followupsVencidos * 5);

      result.push({
        csmId,
        csmName: name,
        clientesAsignados: clients.length,
        touchpoints30d: tp30d,
        touchpointsMes: tpMes,
        avgDiasSinContacto: avgDias,
        clientesRojo,
        followupsVencidos,
        quejasAbiertas,
        activityScore,
      });
    });

    return result.sort((a, b) => b.activityScore - a.activityScore);
  }, [cartera, touchpoints]);

  return { data: metrics, isLoading: carteraLoading || tpLoading };
}
