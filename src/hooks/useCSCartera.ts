import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

export type CarteraSegment = 'activos' | 'sin_servicio' | 'en_riesgo' | 'dados_baja';

export interface CarteraCliente {
  id: string;
  nombre: string;
  razon_social: string;
  activo: boolean;
  motivo_baja: string | null;
  fecha_baja: string | null;
  ultimo_servicio: string | null;
  servicios_90d: number;
  gmv_90d: number;
  quejas_abiertas: number;
  csat: number | null;
  dias_sin_contacto: number;
  salud: 'verde' | 'amarillo' | 'rojo';
  segment: CarteraSegment;
}

function calcSalud(c: { quejas_abiertas: number; dias_sin_contacto: number; servicios_90d: number }): 'verde' | 'amarillo' | 'rojo' {
  if (c.quejas_abiertas >= 2 || (c.dias_sin_contacto > 60 && c.servicios_90d === 0)) return 'rojo';
  if (c.quejas_abiertas >= 1 || c.dias_sin_contacto > 30) return 'amarillo';
  return 'verde';
}

function calcSegment(c: { activo: boolean; salud: 'verde' | 'amarillo' | 'rojo'; servicios_90d: number }): CarteraSegment {
  if (!c.activo) return 'dados_baja';
  if (c.salud === 'rojo') return 'en_riesgo';
  if (c.servicios_90d === 0) return 'sin_servicio';
  return 'activos';
}

export function useCSCartera() {
  return useQuery({
    queryKey: ['cs-cartera'],
    queryFn: async () => {
      const now = Date.now();
      const cutoff90d = format(subDays(new Date(), 90), 'yyyy-MM-dd');

      const [clientesRes, legacyRes, planRes, quejasRes, touchpointsRes] = await Promise.all([
        supabase.from('pc_clientes').select('id, nombre, razon_social, activo, motivo_baja, fecha_baja').order('nombre'),
        supabase.from('servicios_custodia').select('nombre_cliente, cobro_cliente, fecha_hora_cita'),
        supabase.from('servicios_planificados').select('nombre_cliente, cobro_posicionamiento, fecha_hora_cita'),
        supabase.from('cs_quejas').select('cliente_id, estado, calificacion_cierre'),
        supabase.from('cs_touchpoints').select('cliente_id, created_at'),
      ]);

      if (clientesRes.error) throw clientesRes.error;
      if (legacyRes.error) throw legacyRes.error;
      if (planRes.error) throw planRes.error;
      if (quejasRes.error) throw quejasRes.error;
      if (touchpointsRes.error) throw touchpointsRes.error;

      const clientes = clientesRes.data || [];
      const planData = (planRes.data || []).map(s => ({ nombre_cliente: s.nombre_cliente, cobro_cliente: s.cobro_posicionamiento, fecha_hora_cita: s.fecha_hora_cita }));
      const allServicios = [...(legacyRes.data || []), ...planData];
      const seen = new Set<string>();
      const servicios = allServicios.filter(s => {
        const key = `${s.nombre_cliente?.toLowerCase().trim()}|${s.fecha_hora_cita}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const quejas = quejasRes.data || [];
      const touchpoints = touchpointsRes.data || [];

      const result: CarteraCliente[] = clientes.map(c => {
        const nombreNorm = c.nombre?.toLowerCase().trim();
        const cServicios = servicios.filter(s => s.nombre_cliente?.toLowerCase().trim() === nombreNorm);
        
        const fechas = cServicios.map(s => s.fecha_hora_cita).filter(Boolean).sort();
        const ultimo_servicio = fechas[fechas.length - 1] || null;
        const servicios_90d = cServicios.filter(s => s.fecha_hora_cita && s.fecha_hora_cita >= cutoff90d).length;
        const gmv_90d = cServicios
          .filter(s => s.fecha_hora_cita && s.fecha_hora_cita >= cutoff90d)
          .reduce((sum, s) => sum + (Number(s.cobro_cliente) || 0), 0);

        const cQuejas = quejas.filter(q => q.cliente_id === c.id);
        const quejas_abiertas = cQuejas.filter(q => q.estado !== 'cerrada').length;
        const conCsat = cQuejas.filter(q => q.calificacion_cierre);
        const csat = conCsat.length
          ? conCsat.reduce((s, q) => s + (q.calificacion_cierre || 0), 0) / conCsat.length
          : null;

        const cTouchpoints = touchpoints.filter(t => t.cliente_id === c.id);
        const lastTp = cTouchpoints.length
          ? cTouchpoints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        let lastContact: number | null = null;
        if (ultimo_servicio) lastContact = new Date(ultimo_servicio).getTime();
        if (lastTp) {
          const tpTime = new Date(lastTp).getTime();
          lastContact = lastContact ? Math.max(lastContact, tpTime) : tpTime;
        }
        const dias_sin_contacto = lastContact ? Math.floor((now - lastContact) / (1000 * 60 * 60 * 24)) : 999;

        const salud = calcSalud({ quejas_abiertas, dias_sin_contacto, servicios_90d });
        const segment = calcSegment({ activo: c.activo, salud, servicios_90d });

        return {
          id: c.id,
          nombre: c.nombre,
          razon_social: c.razon_social,
          activo: c.activo,
          motivo_baja: (c as any).motivo_baja || null,
          fecha_baja: (c as any).fecha_baja || null,
          ultimo_servicio,
          servicios_90d,
          gmv_90d,
          quejas_abiertas,
          csat,
          dias_sin_contacto,
          salud,
          segment,
        };
      });

      return result;
    },
  });
}

export function useDeactivateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await supabase
        .from('pc_clientes')
        .update({ activo: false, motivo_baja: motivo, fecha_baja: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cliente dado de baja correctamente');
      qc.invalidateQueries({ queryKey: ['cs-cartera'] });
      qc.invalidateQueries({ queryKey: ['cs-loyalty-funnel'] });
      qc.invalidateQueries({ queryKey: ['cs-retention-metrics'] });
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}

export function useReactivateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pc_clientes')
        .update({ activo: true, motivo_baja: null, fecha_baja: null } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cliente reactivado correctamente');
      qc.invalidateQueries({ queryKey: ['cs-cartera'] });
      qc.invalidateQueries({ queryKey: ['cs-loyalty-funnel'] });
      qc.invalidateQueries({ queryKey: ['cs-retention-metrics'] });
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}
