import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientesFiscales } from './useClientesFiscales';

export interface EstadiaCalculada {
  servicioId: number;
  idServicio: string;
  folio: string;
  cliente: string;
  ruta: string;
  localForaneo: string;
  fechaServicio: string;
  horasEnDestino: number;
  horasCortesia: number;
  horasExcedentes: number;
  tarifaHora: number;
  cobroEstimado: number;
  facturado: boolean;
}

export function useEstadiasCalculadas(enabled: boolean = true) {
  const { data: clientes = [] } = useClientesFiscales();

  return useQuery({
    queryKey: ['estadias-calculadas', clientes.length],
    queryFn: async (): Promise<EstadiaCalculada[]> => {
      // 1. Get finalized services from the last 60 days
      const since = new Date();
      since.setDate(since.getDate() - 60);

      const { data: servicios, error: svcErr } = await supabase
        .from('servicios_custodia')
        .select('id, id_servicio, folio_cliente, nombre_cliente, ruta, local_foraneo, fecha_hora_cita, estado')
        .eq('estado', 'Finalizado')
        .gte('fecha_hora_cita', since.toISOString())
        .order('fecha_hora_cita', { ascending: false })
        .limit(500);

      if (svcErr || !servicios?.length) return [];

      // 2. Get route events for these services
      const idServicios = servicios
        .map(s => s.id_servicio || s.folio_cliente)
        .filter(Boolean) as string[];

      if (!idServicios.length) return [];

      const eventosMap = new Map<string, any[]>();
      for (let i = 0; i < idServicios.length; i += 100) {
        const chunk = idServicios.slice(i, i + 100);
        const { data: eventos } = await (supabase as any)
          .from('servicio_eventos_ruta')
          .select('servicio_id, tipo_evento, hora_inicio')
          .in('servicio_id', chunk)
          .in('tipo_evento', ['llegada_destino', 'liberacion_custodio']);

        for (const ev of (eventos || [])) {
          const list = eventosMap.get(ev.servicio_id) || [];
          list.push(ev);
          eventosMap.set(ev.servicio_id, list);
        }
      }

      // 3. Build client lookup
      const clienteMap = new Map<string, typeof clientes[0]>();
      clientes.forEach(c => clienteMap.set(c.nombre.toLowerCase(), c));

      // 4. Calculate stays
      const result: EstadiaCalculada[] = [];

      for (const svc of servicios) {
        const key = svc.id_servicio || svc.folio_cliente;
        if (!key) continue;
        const evts = eventosMap.get(key) || [];
        const llegada = evts.find((e: any) => e.tipo_evento === 'llegada_destino');
        const liberacion = evts.find((e: any) => e.tipo_evento === 'liberacion_custodio');

        if (!llegada?.hora_inicio || !liberacion?.hora_inicio) continue;

        const deltaHrs = (new Date(liberacion.hora_inicio).getTime() - new Date(llegada.hora_inicio).getTime()) / 3600000;
        if (deltaHrs <= 0) continue;

        const cf = clienteMap.get((svc.nombre_cliente || '').toLowerCase());
        const isForaneo = svc.local_foraneo === 'Foráneo';
        const cortesia = isForaneo
          ? (cf?.horas_cortesia_foraneo ?? cf?.horas_cortesia ?? 0)
          : (cf?.horas_cortesia_local ?? cf?.horas_cortesia ?? 0);

        const excedente = Math.max(0, deltaHrs - cortesia);
        if (excedente <= 0) continue;

        const tarifa = cf?.tarifa_hora_estadia ?? 0;

        result.push({
          servicioId: svc.id,
          idServicio: key,
          folio: svc.folio_saphiro || key,
          cliente: svc.cliente || 'N/A',
          ruta: svc.ruta || 'N/A',
          localForaneo: svc.local_foraneo || 'Local',
          fechaServicio: svc.fecha_hora_cita?.split('T')[0] || '',
          horasEnDestino: Math.round(deltaHrs * 100) / 100,
          horasCortesia: cortesia,
          horasExcedentes: Math.round(excedente * 100) / 100,
          tarifaHora: tarifa,
          cobroEstimado: Math.round(excedente * tarifa * 100) / 100,
          facturado: false, // TODO: cross with factura_partidas
        });
      }

      return result;
    },
    enabled: enabled && clientes.length > 0,
    staleTime: 2 * 60_000,
  });
}
