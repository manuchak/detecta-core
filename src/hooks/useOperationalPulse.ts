import { useMemo } from 'react';
import { useServiciosTurnoLive } from './useServiciosTurnoLive';
import { useMonitoristaAssignment } from './useMonitoristaAssignment';

export interface PulseServicePhase {
  porSalir: number;
  enRuta: number;
  enDestino: number;
  enEvento: number;
  completados: number;
  enAlerta: number;
}

export interface PulseMonitorista {
  id: string;
  nombre: string;
  enTurno: boolean;
  serviciosAsignados: number;
  eventosRegistrados: number;
  ultimaActividad: string | null;
}

export interface PulseAlertService {
  id: string;
  cliente: string;
  custodio: string | null;
  minutosInactivo: number;
  nivel: 'warning' | 'critical';
  origen: string;
  destino: string;
}

export interface OperationalPulse {
  fases: PulseServicePhase;
  monitoristas: {
    activos: number;
    totalEnTurno: number;
    listado: PulseMonitorista[];
  };
  touchpoints: {
    promedioGlobalMin: number;
    porMonitorista: { nombre: string; promedioMin: number }[];
  };
  alertas: {
    servicios: PulseAlertService[];
    criticalCount: number;
    warningCount: number;
  };
  totalServiciosActivos: number;
  ultimaActualizacion: Date;
  isLoading: boolean;
  rawServicios: import('./useServiciosTurnoLive').RadarService[];
  rawEventsByService: Record<string, import('./useEventosRuta').EventoRuta[]>;
}

export function useOperationalPulse(): OperationalPulse {
  const { servicios, resumen, isLoading: radarLoading, eventsByService } = useServiciosTurnoLive();
  const {
    monitoristas,
    assignmentsByMonitorista,
    isLoading: monLoading,
  } = useMonitoristaAssignment();

  const pulse = useMemo<OperationalPulse>(() => {
    // --- Fases ---
    const activeServices = servicios.filter(s => s.phase !== 'por_iniciar' && (s.phase as string) !== 'completado');
    const fases: PulseServicePhase = {
      porSalir: resumen.porIniciar,
      enRuta: activeServices.filter(s => s.phase === 'en_curso' && s.alertLevel === 'normal').length,
      enDestino: activeServices.filter(s => s.phase === 'en_destino').length,
      enEvento: resumen.enEvento,
      completados: resumen.completados,
      enAlerta: resumen.alerta,
    };

    // --- Alertas ---
    const alertServices: PulseAlertService[] = activeServices
      .filter(s => (s.alertLevel === 'warning' || s.alertLevel === 'critical') && s.minutesSinceLastAction <= 1440)
      .sort((a, b) => b.minutesSinceLastAction - a.minutesSinceLastAction)
      .map(s => ({
        id: s.id,
        cliente: s.nombre_cliente,
        custodio: s.custodio_asignado,
        minutosInactivo: s.minutesSinceLastAction,
        nivel: s.alertLevel as 'warning' | 'critical',
        origen: s.origen,
        destino: s.destino,
      }));

    // --- Monitoristas ---
    const enTurno = monitoristas.filter(m => m.en_turno);
    const listado: PulseMonitorista[] = monitoristas
      .sort((a, b) => (b.en_turno ? 1 : 0) - (a.en_turno ? 1 : 0))
      .map(m => ({
        id: m.id,
        nombre: m.display_name,
        enTurno: m.en_turno,
        serviciosAsignados: (assignmentsByMonitorista[m.id] || []).length,
        eventosRegistrados: m.event_count || 0,
        ultimaActividad: m.last_activity || null,
      }));

    // --- Touchpoints ---
    // Global average: minutesSinceLastAction across active services
    const activeWithAction = activeServices.filter(s => s.minutesSinceLastAction > 0);
    const promedioGlobal = activeWithAction.length > 0
      ? Math.round(activeWithAction.reduce((sum, s) => sum + s.minutesSinceLastAction, 0) / activeWithAction.length)
      : 0;

    // Per monitorista: average events per service (event_count / services assigned)
    const porMonitorista = enTurno
      .filter(m => (assignmentsByMonitorista[m.id] || []).length > 0)
      .map(m => {
        const svcs = (assignmentsByMonitorista[m.id] || []).length;
        const evts = m.event_count || 0;
        // Approximate interval: if they have events, how spread are they
        const avgMin = svcs > 0 && evts > 0 ? Math.round((120 / evts) * svcs) : 0; // 2h window / events * services
        return { nombre: m.display_name, promedioMin: Math.min(avgMin, 60) };
      })
      .sort((a, b) => a.promedioMin - b.promedioMin);

    return {
      fases,
      monitoristas: {
        activos: enTurno.length,
        totalEnTurno: monitoristas.length,
        listado,
      },
      touchpoints: {
        promedioGlobalMin: promedioGlobal,
        porMonitorista,
      },
      alertas: {
        servicios: alertServices,
        criticalCount: alertServices.filter(a => a.nivel === 'critical').length,
        warningCount: alertServices.filter(a => a.nivel === 'warning').length,
      },
      totalServiciosActivos: activeServices.length,
      ultimaActualizacion: new Date(),
      isLoading: radarLoading || monLoading,
      rawServicios: servicios,
      rawEventsByService: eventsByService,
    };
  }, [servicios, resumen, monitoristas, assignmentsByMonitorista, radarLoading, monLoading, eventsByService]);

  return pulse;
}
