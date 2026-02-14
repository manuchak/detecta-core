import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCSCartera } from './useCSCartera';
import { useCSQuejas } from './useCSQuejas';
import { useCSCapas } from './useCSCapa';

export type AlertLevel = 'critico' | 'warning' | 'info';
export type AlertType = 'sla_riesgo' | 'inactividad' | 'caida_gmv' | 'capa_vencida' | 'sin_contacto_30d';

export interface CSAlert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  description: string;
  clienteId?: string;
  clienteNombre?: string;
  actionLabel?: string;
}

export function useCSAlerts() {
  const { data: cartera } = useCSCartera();
  const { data: quejas } = useCSQuejas();
  const { data: capas } = useCSCapas();

  return useQuery({
    queryKey: ['cs-alerts', cartera?.length, quejas?.length, capas?.length],
    enabled: !!cartera && !!quejas && !!capas,
    queryFn: () => {
      const alerts: CSAlert[] = [];
      const now = Date.now();

      // 1. SLA en riesgo: quejas abiertas con >75% SLA consumido
      (quejas || [])
        .filter(q => q.estado !== 'cerrada')
        .forEach(q => {
          const created = new Date(q.created_at).getTime();
          const elapsed = (now - created) / (1000 * 60 * 60);
          const slaHours = q.sla_resolucion_horas || 72;
          const pct = elapsed / slaHours;
          if (pct >= 0.75) {
            alerts.push({
              id: `sla-${q.id}`,
              type: 'sla_riesgo',
              level: pct >= 1 ? 'critico' : 'warning',
              title: `SLA ${pct >= 1 ? 'vencido' : 'en riesgo'}: ${q.numero_queja}`,
              description: `${q.cliente?.nombre || 'Cliente'} — ${Math.round(elapsed)}h de ${slaHours}h (${Math.round(pct * 100)}%)`,
              clienteId: q.cliente_id,
              clienteNombre: q.cliente?.nombre || undefined,
              actionLabel: 'Ver queja',
            });
          }
        });

      // 2. Inactividad prolongada
      const activos = (cartera || []).filter(c => c.activo);
      activos.forEach(c => {
        if (c.dias_sin_contacto >= 60) {
          alerts.push({
            id: `inact-${c.id}`,
            type: 'inactividad',
            level: 'critico',
            title: `${c.dias_sin_contacto}d sin contacto`,
            description: `${c.nombre} — Sin actividad ni touchpoints recientes`,
            clienteId: c.id,
            clienteNombre: c.nombre,
            actionLabel: 'Registrar contacto',
          });
        } else if (c.dias_sin_contacto >= 45) {
          alerts.push({
            id: `inact-${c.id}`,
            type: 'inactividad',
            level: 'warning',
            title: `${c.dias_sin_contacto}d sin contacto`,
            description: `${c.nombre} — Requiere seguimiento pronto`,
            clienteId: c.id,
            clienteNombre: c.nombre,
            actionLabel: 'Registrar contacto',
          });
        }
      });

      // 3. CAPA vencida
      (capas || [])
        .filter(c => c.estado !== 'cerrado' && c.fecha_implementacion)
        .forEach(c => {
          if (new Date(c.fecha_implementacion!) < new Date()) {
            alerts.push({
              id: `capa-${c.id}`,
              type: 'capa_vencida',
              level: 'warning',
              title: `CAPA vencida: ${c.numero_capa}`,
              description: `${c.cliente?.nombre || 'Cliente'} — Fecha target superada`,
              clienteId: c.cliente_id,
              clienteNombre: c.cliente?.nombre || undefined,
              actionLabel: 'Ver CAPA',
            });
          }
        });

      // Sort: critico first, then warning
      alerts.sort((a, b) => {
        const order: Record<AlertLevel, number> = { critico: 0, warning: 1, info: 2 };
        return order[a.level] - order[b.level];
      });

      return alerts;
    },
  });
}
