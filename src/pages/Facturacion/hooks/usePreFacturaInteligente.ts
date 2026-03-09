import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServicioFacturacion } from './useServiciosFacturacion';
import { useReglasEstadias, resolveReglaEstadia } from './useReglasEstadias';
import { useClientesFiscales } from './useClientesFiscales';

export interface ConceptoFacturable {
  tipo: 'custodia' | 'casetas' | 'estadia' | 'pernocta' | 'gasto_extra';
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
  editable: boolean;
  detalle?: string;
  servicioId?: number;
}

export interface LineaPreFactura {
  servicioId: number;
  folio: string;
  fecha: string;
  ruta: string;
  conceptos: ConceptoFacturable[];
  subtotalServicio: number;
}

export interface ResumenPreFactura {
  lineas: LineaPreFactura[];
  totalCustodia: number;
  totalCasetas: number;
  totalEstadias: number;
  totalPernoctas: number;
  totalExtras: number;
  subtotal: number;
  serviciosConEstadia: number;
  serviciosConPernocta: number;
}

/**
 * Hook that auto-consolidates all billable concepts for a set of services.
 * Fetches route events + extraordinary expenses and applies client courtesy rules.
 */
export function usePreFacturaInteligente(
  servicios: ServicioFacturacion[],
  clienteNombre: string,
  enabled: boolean = false
) {
  const { data: clientesFiscales = [] } = useClientesFiscales();
  const clienteFiscal = clientesFiscales.find(
    c => c.nombre.toLowerCase() === clienteNombre.toLowerCase()
  );
  const { data: reglasEstadias = [] } = useReglasEstadias(clienteFiscal?.id);

  const servicioIds = servicios.map(s => s.id);
  const idServicioStrings = servicios.map(s => s.id_servicio || s.folio_saphiro).filter(Boolean);

  return useQuery({
    queryKey: ['pre-factura-inteligente', clienteNombre, servicioIds],
    queryFn: async (): Promise<ResumenPreFactura> => {
      // 1. Fetch route events for deltaDestino (estadía base)
      let eventosMap = new Map<string, any[]>();
      if (idServicioStrings.length > 0) {
        // Batch in chunks of 100
        for (let i = 0; i < idServicioStrings.length; i += 100) {
          const chunk = idServicioStrings.slice(i, i + 100);
          const { data: eventos } = await (supabase as any)
            .from('servicio_eventos_ruta')
            .select('servicio_id, tipo_evento, hora_inicio, hora_fin, duracion_segundos')
            .in('servicio_id', chunk);
          for (const ev of (eventos || [])) {
            const list = eventosMap.get(ev.servicio_id) || [];
            list.push(ev);
            eventosMap.set(ev.servicio_id, list);
          }
        }
      }

      // 2. Fetch extraordinary expenses billable to client
      let gastosMap = new Map<number, any[]>();
      if (servicioIds.length > 0) {
        for (let i = 0; i < servicioIds.length; i += 100) {
          const chunk = servicioIds.slice(i, i + 100);
          const { data: gastos } = await supabase
            .from('gastos_extraordinarios_servicio')
            .select('*')
            .in('servicio_custodia_id', chunk)
            .eq('cobrable_cliente', true);
          for (const g of (gastos || [])) {
            const list = gastosMap.get(g.servicio_custodia_id) || [];
            list.push(g);
            gastosMap.set(g.servicio_custodia_id, list);
          }
        }
      }

      // 3. Fetch detenciones billable to client
      let detencionesMap = new Map<number, any[]>();
      if (servicioIds.length > 0) {
        for (let i = 0; i < servicioIds.length; i += 100) {
          const chunk = servicioIds.slice(i, i + 100);
          const { data: det } = await supabase
            .from('detenciones_servicio')
            .select('*')
            .in('servicio_id', chunk)
            .eq('cobrable_cliente', true);
          for (const d of (det || [])) {
            const list = detencionesMap.get(d.servicio_id) || [];
            list.push(d);
            detencionesMap.set(d.servicio_id, list);
          }
        }
      }

      // Resolve courtesy rule for client (base values, may be overridden per-service by local/foráneo)
      const regla = resolveReglaEstadia(reglasEstadias);
      const baseHorasCortesia = regla?.horas_cortesia ?? clienteFiscal?.horas_cortesia ?? 0;
      const horasCortesiaLocal = clienteFiscal?.horas_cortesia_local ?? baseHorasCortesia;
      const horasCortesiaForaneo = clienteFiscal?.horas_cortesia_foraneo ?? baseHorasCortesia;
      const tarifaHoraExcedente = regla?.tarifa_hora_excedente ?? 0;
      const tarifaPernocta = regla?.tarifa_pernocta ?? clienteFiscal?.pernocta_tarifa ?? 0;

      // 4. Build lines per service
      const lineas: LineaPreFactura[] = servicios.map(svc => {
        const conceptos: ConceptoFacturable[] = [];
        const svcKey = svc.id_servicio || svc.folio_saphiro;

        // A) Custodia base
        conceptos.push({
          tipo: 'custodia',
          descripcion: `Custodia: ${svc.ruta}`,
          cantidad: 1,
          precioUnitario: svc.cobro_cliente || 0,
          importe: svc.cobro_cliente || 0,
          editable: true,
          servicioId: svc.id,
        });

        // B) Casetas
        const casetasVal = parseFloat(svc.casetas || '0') || 0;
        if (casetasVal > 0) {
          conceptos.push({
            tipo: 'casetas',
            descripcion: 'Casetas',
            cantidad: 1,
            precioUnitario: casetasVal,
            importe: casetasVal,
            editable: true,
            servicioId: svc.id,
          });
        }

        // C) Estadía from route events (deltaDestino)
        const evts = eventosMap.get(svcKey) || [];
        const llegada = evts.find((e: any) => e.tipo_evento === 'llegada_destino');
        const liberacion = evts.find((e: any) => e.tipo_evento === 'liberacion_custodio');
        
        let horasEstadia = 0;
        if (llegada?.hora_inicio && liberacion?.hora_inicio) {
          const deltaMin = (new Date(liberacion.hora_inicio).getTime() - new Date(llegada.hora_inicio).getTime()) / 60000;
          horasEstadia = Math.max(0, deltaMin / 60);
        }

        // Also add detenciones cobrables duration
        const dets = detencionesMap.get(svc.id) || [];
        const minutosDetenciones = dets.reduce((sum: number, d: any) => sum + (d.duracion_minutos || 0), 0);
        horasEstadia += minutosDetenciones / 60;

        // Resolve courtesy hours based on local/foráneo classification
        const horasCortesia = svc.local_foraneo === 'Foráneo'
          ? horasCortesiaForaneo
          : horasCortesiaLocal;

        const horasExcedentes = Math.max(0, horasEstadia - horasCortesia);
        if (horasExcedentes > 0 && tarifaHoraExcedente > 0) {
          const hrs = Math.round(horasExcedentes * 100) / 100;
          conceptos.push({
            tipo: 'estadia',
            descripcion: `Estadía excedente (${hrs}h)`,
            cantidad: hrs,
            precioUnitario: tarifaHoraExcedente,
            importe: Math.round(hrs * tarifaHoraExcedente * 100) / 100,
            editable: true,
            detalle: `Total: ${Math.round(horasEstadia * 100) / 100}h — Cortesía: ${horasCortesia}h — Excedente: ${hrs}h × $${tarifaHoraExcedente}/h`,
            servicioId: svc.id,
          });
        }

        // D) Pernocta
        const pernoctas = evts.filter((e: any) => e.tipo_evento === 'pernocta');
        if (pernoctas.length > 0 && tarifaPernocta > 0) {
          conceptos.push({
            tipo: 'pernocta',
            descripcion: `Pernocta (${pernoctas.length})`,
            cantidad: pernoctas.length,
            precioUnitario: tarifaPernocta,
            importe: pernoctas.length * tarifaPernocta,
            editable: true,
            servicioId: svc.id,
          });
        }

        // E) Gastos extra reembolsables
        const gastos = gastosMap.get(svc.id) || [];
        for (const g of gastos) {
          conceptos.push({
            tipo: 'gasto_extra',
            descripcion: `${g.tipo_gasto}: ${g.descripcion}`,
            cantidad: 1,
            precioUnitario: g.monto,
            importe: g.monto,
            editable: true,
            detalle: g.notas || undefined,
            servicioId: svc.id,
          });
        }

        const subtotalServicio = conceptos.reduce((s, c) => s + c.importe, 0);

        return {
          servicioId: svc.id,
          folio: svc.folio_saphiro || svc.id_servicio,
          fecha: svc.fecha_hora_cita?.split('T')[0] || '',
          ruta: svc.ruta,
          conceptos,
          subtotalServicio,
        };
      });

      // 5. Aggregate totals
      const allConceptos = lineas.flatMap(l => l.conceptos);
      const totalCustodia = allConceptos.filter(c => c.tipo === 'custodia').reduce((s, c) => s + c.importe, 0);
      const totalCasetas = allConceptos.filter(c => c.tipo === 'casetas').reduce((s, c) => s + c.importe, 0);
      const totalEstadias = allConceptos.filter(c => c.tipo === 'estadia').reduce((s, c) => s + c.importe, 0);
      const totalPernoctas = allConceptos.filter(c => c.tipo === 'pernocta').reduce((s, c) => s + c.importe, 0);
      const totalExtras = allConceptos.filter(c => c.tipo === 'gasto_extra').reduce((s, c) => s + c.importe, 0);

      return {
        lineas,
        totalCustodia,
        totalCasetas,
        totalEstadias,
        totalPernoctas,
        totalExtras,
        subtotal: totalCustodia + totalCasetas + totalEstadias + totalPernoctas + totalExtras,
        serviciosConEstadia: lineas.filter(l => l.conceptos.some(c => c.tipo === 'estadia')).length,
        serviciosConPernocta: lineas.filter(l => l.conceptos.some(c => c.tipo === 'pernocta')).length,
      };
    },
    enabled: enabled && servicios.length > 0,
    staleTime: 60_000,
  });
}
