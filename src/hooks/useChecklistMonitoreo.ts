/**
 * Hook para monitoreo de checklists de servicios del turno
 * Centraliza la consulta, filtrado y detección de alertas
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMinutes } from 'date-fns';
import type {
  ServicioConChecklist,
  ResumenChecklists,
  FiltroChecklist,
  AlertaChecklist,
  FotoValidada,
  ItemsInspeccion,
  EstadoChecklistMonitoreo,
} from '@/types/checklist';

const ITEMS_CRITICOS = ['llantas_ok', 'frenos_ok'] as const;

function calcularAlertas(
  servicio: Partial<ServicioConChecklist>,
  minutosParaCita: number
): AlertaChecklist[] {
  const alertas: AlertaChecklist[] = [];

  // Sin checklist y próximo a cita
  if (!servicio.checklistId && minutosParaCita <= 60 && minutosParaCita > 0) {
    alertas.push({
      tipo: 'sin_checklist_urgente',
      descripcion: `Servicio en ${minutosParaCita} min sin checklist`,
      severidad: minutosParaCita <= 30 ? 'critica' : 'alta',
    });
  }

  // Fotos con GPS fuera de rango
  const fotosFueraRango = servicio.fotosValidadas?.filter(
    (f) => f.validacion === 'fuera_rango'
  );
  if (fotosFueraRango && fotosFueraRango.length > 0) {
    alertas.push({
      tipo: 'gps_fuera_rango',
      descripcion: `${fotosFueraRango.length} foto(s) capturada(s) fuera de ubicación`,
      detalles: fotosFueraRango.map(
        (f) => `${f.angle}: ${f.distancia_origen_m}m`
      ),
      severidad: 'alta',
    });
  }

  // Fotos sin GPS
  const fotosSinGps = servicio.fotosValidadas?.filter(
    (f) => f.validacion === 'sin_gps'
  );
  if (fotosSinGps && fotosSinGps.length > 0) {
    alertas.push({
      tipo: 'gps_sin_datos',
      descripcion: `${fotosSinGps.length} foto(s) sin datos GPS`,
      detalles: fotosSinGps.map((f) => f.angle),
      severidad: 'media',
    });
  }

  // Items críticos fallidos
  if (servicio.itemsInspeccion?.vehiculo) {
    const fallidos = ITEMS_CRITICOS.filter(
      (k) => servicio.itemsInspeccion?.vehiculo[k] === false
    );
    if (fallidos.length > 0) {
      alertas.push({
        tipo: 'item_critico_fallido',
        descripcion: 'Inspección vehicular con fallas críticas',
        detalles: fallidos.map((k) => k.replace('_ok', '')),
        severidad: 'critica',
      });
    }
  }

  // Fotos incompletas
  const fotosCount = servicio.fotosValidadas?.length || 0;
  if (servicio.checklistId && fotosCount < 4) {
    alertas.push({
      tipo: 'fotos_incompletas',
      descripcion: `Solo ${fotosCount}/4 fotos registradas`,
      severidad: 'media',
    });
  }

  return alertas;
}

function determinarEstadoChecklist(
  checklistEstado: string | null,
  checklistId: string | null
): EstadoChecklistMonitoreo {
  if (!checklistId) return 'sin_checklist';
  if (checklistEstado === 'completo') return 'completo';
  if (checklistEstado === 'incompleto') return 'incompleto';
  return 'pendiente';
}

export function useChecklistMonitoreo(timeWindow: number = 8) {
  return useQuery({
    queryKey: ['checklist-monitoreo', timeWindow],
    queryFn: async () => {
      const ahora = new Date();
      const desde = new Date(ahora.getTime() - timeWindow * 60 * 60 * 1000);
      const hasta = new Date(ahora.getTime() + timeWindow * 60 * 60 * 1000);

      // Obtener servicios con checklist (LEFT JOIN simulado)
      const { data: servicios, error: svcError } = await supabase
        .from('servicios_planificados')
        .select(`
          id,
          id_servicio,
          nombre_cliente,
          custodio_asignado,
          custodio_id,
          fecha_hora_cita,
          estado_planeacion,
          origen,
          destino
        `)
        .gte('fecha_hora_cita', desde.toISOString())
        .lte('fecha_hora_cita', hasta.toISOString())
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .order('fecha_hora_cita', { ascending: true });

      if (svcError) throw svcError;

      // Obtener checklists para estos servicios
      const servicioIds = servicios?.map((s) => s.id) || [];
      const { data: checklists, error: chkError } = await supabase
        .from('checklist_servicio')
        .select('*')
        .in('servicio_id', servicioIds);

      if (chkError) throw chkError;

      // Obtener teléfonos de custodios
      const custodioIds = servicios?.map((s) => s.custodio_id).filter(Boolean) || [];
      const { data: custodios } = await supabase
        .from('pc_custodios')
        .select('id, tel')
        .in('id', custodioIds);

      const telefonoMap = new Map(custodios?.map((c) => [c.id, c.tel]) || []);
      const checklistMap = new Map(checklists?.map((c) => [c.servicio_id, c]) || []);

      // Procesar y enriquecer datos
      const serviciosEnriquecidos: ServicioConChecklist[] = (servicios || []).map(
        (svc) => {
          const checklist = checklistMap.get(svc.id);
          const fotosValidadas = (checklist?.fotos_validadas as FotoValidada[]) || [];
          const itemsInspeccion = checklist?.items_inspeccion as ItemsInspeccion | null;
          const minutosParaCita = differenceInMinutes(
            new Date(svc.fecha_hora_cita),
            ahora
          );

          // Calcular items fallidos
          const itemsFallidos: string[] = [];
          if (itemsInspeccion?.vehiculo) {
            Object.entries(itemsInspeccion.vehiculo).forEach(([key, val]) => {
              if (val === false) itemsFallidos.push(key);
            });
          }
          if (itemsInspeccion?.equipamiento) {
            Object.entries(itemsInspeccion.equipamiento).forEach(([key, val]) => {
              if (val === false) itemsFallidos.push(key);
            });
          }

          const servicioBase: Partial<ServicioConChecklist> = {
            checklistId: checklist?.id || null,
            fotosValidadas,
            itemsInspeccion,
          };

          const alertas = calcularAlertas(servicioBase, minutosParaCita);
          const alertasGps = fotosValidadas.filter(
            (f) => f.validacion === 'fuera_rango' || f.validacion === 'sin_gps'
          ).length;

          return {
            servicioId: svc.id,
            idServicio: svc.id_servicio || svc.id.slice(0, 8),
            nombreCliente: svc.nombre_cliente || 'Sin cliente',
            custodioAsignado: svc.custodio_asignado || 'Sin asignar',
            custodioTelefono: telefonoMap.get(svc.custodio_id) || null,
            fechaHoraCita: svc.fecha_hora_cita,
            estadoPlaneacion: svc.estado_planeacion || 'pendiente',
            origen: svc.origen,
            destino: svc.destino,
            checklistId: checklist?.id || null,
            checklistEstado: determinarEstadoChecklist(
              checklist?.estado || null,
              checklist?.id || null
            ),
            fechaChecklist: checklist?.fecha_checklist || null,
            fotosValidadas,
            itemsInspeccion,
            observaciones: checklist?.observaciones || null,
            firmaBase64: checklist?.firma_base64 || null,
            fotosCount: fotosValidadas.length,
            alertasGps,
            itemsFallidos,
            alertas,
            tieneAlerta: alertas.length > 0,
            minutosParaCita,
          };
        }
      );

      // Calcular resumen
      const resumen: ResumenChecklists = {
        completos: serviciosEnriquecidos.filter(
          (s) => s.checklistEstado === 'completo' && !s.tieneAlerta
        ).length,
        pendientes: serviciosEnriquecidos.filter(
          (s) =>
            s.checklistEstado === 'pendiente' ||
            s.checklistEstado === 'incompleto'
        ).length,
        sinChecklist: serviciosEnriquecidos.filter(
          (s) => s.checklistEstado === 'sin_checklist'
        ).length,
        conAlertas: serviciosEnriquecidos.filter((s) => s.tieneAlerta).length,
        total: serviciosEnriquecidos.length,
      };

      return { servicios: serviciosEnriquecidos, resumen };
    },
    refetchInterval: 30000, // Refetch cada 30 segundos
    staleTime: 15000,
  });
}

export function filtrarServicios(
  servicios: ServicioConChecklist[],
  filtro: FiltroChecklist
): ServicioConChecklist[] {
  switch (filtro) {
    case 'completos':
      return servicios.filter(
        (s) => s.checklistEstado === 'completo' && !s.tieneAlerta
      );
    case 'pendientes':
      return servicios.filter(
        (s) =>
          s.checklistEstado === 'pendiente' ||
          s.checklistEstado === 'incompleto'
      );
    case 'sin_checklist':
      return servicios.filter((s) => s.checklistEstado === 'sin_checklist');
    case 'alertas':
      return servicios.filter((s) => s.tieneAlerta);
    default:
      return servicios;
  }
}