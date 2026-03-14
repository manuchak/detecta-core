import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchTarifasKm, calcularCostoPlano } from '@/utils/tarifasKmUtils';

/** Tarifa por hora de estadía pagable al custodio (MXN). Centralizada para fácil ajuste. */
export const CXP_TARIFA_ESTADIA_HORA = 50;

/** Umbral de cortesía en horas antes de cobrar estadía al custodio. */
export const CXP_UMBRAL_CORTESIA_HORAS = 4;

export interface CxPCorteSemanal {
  id: string;
  tipo_operativo: 'custodio' | 'armado_interno';
  operativo_id: string | null;
  operativo_nombre: string;
  semana_inicio: string;
  semana_fin: string;
  total_servicios: number;
  monto_servicios: number;
  monto_estadias: number;
  monto_casetas: number;
  monto_hoteles: number;
  monto_apoyos_extra: number;
  monto_deducciones: number;
  monto_total: number;
  estado: 'borrador' | 'revision_ops' | 'aprobado_finanzas' | 'dispersado' | 'pagado' | 'cancelado';
  revisado_por: string | null;
  fecha_revision: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  documento_dispersion_url: string | null;
  metodo_pago: string | null;
  referencia_pago: string | null;
  fecha_pago: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CxPCorteDetalle {
  id: string;
  corte_id: string;
  servicio_custodia_id: number | null;
  concepto: string;
  descripcion: string | null;
  monto: number;
  referencia_id: string | null;
  created_at: string;
}

const QUERY_KEY = 'cxp-cortes-semanales';

export function useCxPCortesSemanales(estado?: string, semanaInicio?: string, semanaFin?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, estado, semanaInicio, semanaFin],
    queryFn: async () => {
      let query = supabase
        .from('cxp_cortes_semanales')
        .select('*')
        .order('semana_inicio', { ascending: false })
        .limit(200);

      if (estado && estado !== 'todos') {
        query = query.eq('estado', estado);
      }

      if (semanaInicio) {
        query = query.gte('semana_inicio', semanaInicio);
      }
      if (semanaFin) {
        query = query.lte('semana_fin', semanaFin);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CxPCorteSemanal[];
    },
    staleTime: 60_000,
  });
}

export function useCxPCorteDetalle(corteId?: string) {
  return useQuery({
    queryKey: ['cxp-corte-detalle', corteId],
    queryFn: async () => {
      if (!corteId) return [];
      const { data, error } = await supabase
        .from('cxp_cortes_detalle')
        .select('*')
        .eq('corte_id', corteId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CxPCorteDetalle[];
    },
    enabled: !!corteId,
  });
}

export function useCreateCxPCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tipo_operativo: 'custodio' | 'armado_interno';
      operativo_id?: string;
      operativo_nombre: string;
      semana_inicio: string;
      semana_fin: string;
      notas?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      // 1) Fetch completed services for this operative in the week
      let montoServicios = 0;
      let totalServicios = 0;
      let montoCasetas = 0;
      const detalles: Array<{ concepto: string; descripcion: string; monto: number; servicio_custodia_id?: number; referencia_id?: string }> = [];

      if (data.tipo_operativo === 'custodio' && data.operativo_id) {
        // Query servicios_custodia where custodio matches
        const { data: servicios } = await supabase
          .from('servicios_custodia')
          .select('id, id_servicio, costo_custodio, casetas, nombre_cliente')
          .eq('id_custodio', data.operativo_id)
          .eq('estado', 'Finalizado')
          .gte('fecha_hora_cita', `${data.semana_inicio}T00:00:00`)
          .lte('fecha_hora_cita', `${data.semana_fin}T23:59:59`);

        if (servicios) {
          totalServicios = servicios.length;
          for (const s of servicios) {
            const costoBase = Number(s.costo_custodio) || 0;
            montoServicios += costoBase;
            detalles.push({
              concepto: 'servicio',
              descripcion: `Servicio ${s.id_servicio || s.id} - ${s.nombre_cliente || ''}`,
              monto: costoBase,
              servicio_custodia_id: s.id,
            });
            const caseta = Number(s.casetas) || 0;
            if (caseta > 0) {
              montoCasetas += caseta;
              detalles.push({
                concepto: 'caseta',
                descripcion: `Casetas servicio ${s.id_servicio || s.id}`,
                monto: caseta,
                servicio_custodia_id: s.id,
              });
            }
          }
        }
      } else if (data.tipo_operativo === 'armado_interno' && data.operativo_id) {
        // 1) Get all assignments for this armado (no date filter)
        const { data: asignaciones } = await supabase
          .from('asignacion_armados')
          .select('id, armado_id, servicio_custodia_id')
          .eq('armado_id', data.operativo_id)
          .eq('tipo_asignacion', 'interno')
          .in('estado_asignacion', ['completado', 'confirmado', 'pendiente']);

        // 2) Cross-ref with finalized services in the week
        const svcIds = (asignaciones || []).map(a => a.servicio_custodia_id).filter(Boolean) as string[];
        let svcsMap = new Map<string, { id: number; id_servicio: string; km_recorridos: number | null; nombre_cliente: string | null }>();
        if (svcIds.length > 0) {
          const { data: svcs } = await supabase
            .from('servicios_custodia')
            .select('id, id_servicio, km_recorridos, nombre_cliente')
            .in('id_servicio', svcIds)
            .eq('estado', 'Finalizado')
            .gte('fecha_hora_cita', `${data.semana_inicio}T00:00:00`)
            .lte('fecha_hora_cita', `${data.semana_fin}T23:59:59`);
          for (const s of svcs || []) {
            if (s.id_servicio) svcsMap.set(s.id_servicio, s);
          }
        }

        // 3) Calculate cost per service using km tarifas
        const tarifas = await fetchTarifasKm();
        for (const a of asignaciones || []) {
          if (!a.servicio_custodia_id) continue;
          const svc = svcsMap.get(a.servicio_custodia_id);
          if (!svc) continue;
          const km = Number(svc.km_recorridos) || 0;
          const { costo, tarifa } = calcularCostoPlano(km, tarifas);
          montoServicios += costo;
          totalServicios++;
          detalles.push({
            concepto: 'servicio',
            descripcion: `Servicio ${svc.id_servicio} — ${km} km × $${tarifa}/km`,
            monto: costo,
            servicio_custodia_id: svc.id,
          });
        }
      }

      // 2) Fetch detenciones pagables al custodio for these services
      //    If no manual detenciones exist, calculate automatically from route events
      let montoEstadias = 0;
      if (data.tipo_operativo === 'custodio' && detalles.length > 0) {
        const svcIds = detalles.filter(d => d.concepto === 'servicio' && d.servicio_custodia_id).map(d => d.servicio_custodia_id!);
        if (svcIds.length > 0) {
          // Try manual detenciones first
          const { data: dets } = await supabase
            .from('detenciones_servicio')
            .select('servicio_id, duracion_minutos, tipo_detencion')
            .in('servicio_id', svcIds)
            .eq('pagable_custodio', true);

          if (dets && dets.length > 0) {
            for (const d of dets) {
              const hrs = (d.duracion_minutos || 0) / 60;
              const monto = Math.round(hrs * CXP_TARIFA_ESTADIA_HORA * 100) / 100;
              montoEstadias += monto;
              detalles.push({
                concepto: 'estadia',
                descripcion: `Estadía ${d.tipo_detencion || ''} (${Math.round(hrs * 10) / 10}h)`,
                monto,
                servicio_custodia_id: d.servicio_id,
              });
            }
          } else {
            // Fallback: calculate from route events (llegada_destino → liberacion_custodio)
            // Get id_servicio for each svcId to match events
            const svcDetalles = detalles.filter(d => d.concepto === 'servicio' && d.servicio_custodia_id);
            const { data: svcRows } = await supabase
              .from('servicios_custodia')
              .select('id, id_servicio')
              .in('id', svcIds);

            if (svcRows && svcRows.length > 0) {
              const idServicioMap = new Map<string, number>();
              for (const s of svcRows) {
                if (s.id_servicio) idServicioMap.set(s.id_servicio, s.id);
              }
              const idServicios = Array.from(idServicioMap.keys());

              if (idServicios.length > 0) {
                const { data: eventos } = await (supabase as any)
                  .from('servicio_eventos_ruta')
                  .select('servicio_id, tipo_evento, hora_inicio')
                  .in('servicio_id', idServicios)
                  .in('tipo_evento', ['llegada_destino', 'liberacion_custodio']);

                if (eventos && eventos.length > 0) {
                  // Group events by servicio_id
                  const evMap = new Map<string, { llegada?: string; liberacion?: string }>();
                  for (const ev of eventos) {
                    const entry = evMap.get(ev.servicio_id) || {};
                    if (ev.tipo_evento === 'llegada_destino') entry.llegada = ev.hora_inicio;
                    if (ev.tipo_evento === 'liberacion_custodio') entry.liberacion = ev.hora_inicio;
                    evMap.set(ev.servicio_id, entry);
                  }

                  for (const [idSvc, times] of evMap) {
                    if (!times.llegada || !times.liberacion) continue;
                    const deltaHrs = (new Date(times.liberacion).getTime() - new Date(times.llegada).getTime()) / 3600000;
                    const excedente = Math.max(0, deltaHrs - CXP_UMBRAL_CORTESIA_HORAS);
                    if (excedente <= 0) continue;

                    const monto = Math.round(excedente * CXP_TARIFA_ESTADIA_HORA * 100) / 100;
                    montoEstadias += monto;
                    const custodiaId = idServicioMap.get(idSvc);
                    detalles.push({
                      concepto: 'estadia',
                      descripcion: `Estadía auto ${idSvc} (${Math.round(excedente * 10) / 10}h excedente de ${Math.round(deltaHrs * 10) / 10}h)`,
                      monto,
                      servicio_custodia_id: custodiaId,
                    });
                  }
                }
              }
            }
          }
        }
      }

      // 3) Fetch approved apoyos extraordinarios in the week
      let montoApoyos = 0;
      if (data.operativo_id) {
        const { data: apoyos } = await supabase
          .from('solicitudes_apoyo_extraordinario')
          .select('id, tipo_apoyo, monto_aprobado')
          .eq('custodio_id', data.operativo_id)
          .eq('estado', 'aprobado')
          .gte('fecha_solicitud', `${data.semana_inicio}T00:00:00`)
          .lte('fecha_solicitud', `${data.semana_fin}T23:59:59`);

        if (apoyos) {
          for (const a of apoyos) {
            const m = Number(a.monto_aprobado) || 0;
            montoApoyos += m;
            detalles.push({
              concepto: 'apoyo_extraordinario',
              descripcion: `Apoyo: ${a.tipo_apoyo}`,
              monto: m,
              referencia_id: a.id,
            });
          }
        }
      }

      // 4) Fetch hotel gastos
      let montoHoteles = 0;
      if (data.operativo_id) {
        const { data: hoteles } = await supabase
          .from('gastos_extraordinarios_servicio')
          .select('id, monto, descripcion')
          .eq('registrado_por', data.operativo_id)
          .eq('pagable_custodio', true)
          .in('tipo_gasto', ['hotel', 'pernocta'])
          .gte('created_at', `${data.semana_inicio}T00:00:00`)
          .lte('created_at', `${data.semana_fin}T23:59:59`);

        if (hoteles) {
          for (const h of hoteles) {
            const m = Number(h.monto) || 0;
            montoHoteles += m;
            detalles.push({
              concepto: 'hotel',
              descripcion: h.descripcion || 'Hotel/Pernocta',
              monto: m,
              referencia_id: h.id,
            });
          }
        }
      }

      const montoTotal = montoServicios + montoCasetas + montoEstadias + montoHoteles + montoApoyos;

      // 5) Insert corte header
      const { data: corte, error } = await supabase
        .from('cxp_cortes_semanales')
        .insert({
          tipo_operativo: data.tipo_operativo,
          operativo_id: data.operativo_id,
          operativo_nombre: data.operativo_nombre,
          semana_inicio: data.semana_inicio,
          semana_fin: data.semana_fin,
          total_servicios: totalServicios,
          monto_servicios: montoServicios,
          monto_estadias: montoEstadias,
          monto_casetas: montoCasetas,
          monto_hoteles: montoHoteles,
          monto_apoyos_extra: montoApoyos,
          monto_total: montoTotal,
          notas: data.notas,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // 5) Insert detail lines
      if (detalles.length > 0) {
        const lines = detalles.map(d => ({
          corte_id: corte.id,
          concepto: d.concepto,
          descripcion: d.descripcion,
          monto: d.monto,
          servicio_custodia_id: d.servicio_custodia_id,
          referencia_id: d.referencia_id,
        }));
        const { data: detInserted, error: detError } = await supabase
          .from('cxp_cortes_detalle')
          .insert(lines)
          .select('id');
        if (detError) throw detError;
        if (!detInserted || detInserted.length !== lines.length) {
          console.warn(`[CxP Corte] Solo ${detInserted?.length || 0}/${lines.length} detalles insertados`);
        }
      }

      return corte;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Corte semanal generado');
    },
    onError: () => toast.error('Error al generar corte semanal'),
  });
}

export function useUpdateCxPCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CxPCorteSemanal> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('cxp_cortes_semanales')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Corte actualizado');
    },
    onError: () => toast.error('Error al actualizar corte'),
  });
}

export function useDeleteCxPCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verify it's a draft before deleting
      const { data: corte, error: fetchErr } = await supabase
        .from('cxp_cortes_semanales')
        .select('estado')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;
      if (corte.estado !== 'borrador') throw new Error('Solo se pueden eliminar cortes en estado borrador');

      // Delete details first (FK dependency)
      const { data: detDeleted, error: detErr } = await supabase
        .from('cxp_cortes_detalle')
        .delete()
        .eq('corte_id', id)
        .select('id');
      if (detErr) throw detErr;

      // Delete the corte
      const { data: corteDeleted, error } = await supabase
        .from('cxp_cortes_semanales')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!corteDeleted || corteDeleted.length === 0) throw new Error('No se pudo eliminar el corte — posible bloqueo de permisos');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Corte borrador eliminado');
    },
    onError: (err: any) => toast.error(err?.message || 'Error al eliminar corte'),
  });
}

export const ESTADO_CORTE_LABELS: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'outline' },
  revision_ops: { label: 'Revisión Ops', color: 'default' },
  aprobado_finanzas: { label: 'Aprobado Finanzas', color: 'secondary' },
  dispersado: { label: 'Dispersado', color: 'secondary' },
  pagado: { label: 'Pagado', color: 'secondary' },
  cancelado: { label: 'Cancelado', color: 'destructive' },
};
