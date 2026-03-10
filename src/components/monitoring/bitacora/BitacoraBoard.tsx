import React, { useState, useCallback, useMemo } from 'react';
import { useBitacoraBoard } from '@/hooks/useBitacoraBoard';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { BoardColumnPorIniciar } from './BoardColumnPorIniciar';
import { BoardColumnEnCurso } from './BoardColumnEnCurso';
import { BoardColumnEventoEspecial } from './BoardColumnEventoEspecial';
import { MonitoristaAssignmentBar } from './MonitoristaAssignmentBar';
import { ServiceDetailDrawer } from './ServiceDetailDrawer';
import { useMonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';
import { useUserRole } from '@/hooks/useUserRole';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye } from 'lucide-react';

export const BitacoraBoard: React.FC = () => {
  const {
    pendingServices,
    enCursoServices,
    eventoEspecialServices,
    isLoading,
    iniciarServicio,
    registrarCheckpoint,
    iniciarEventoEspecial,
    cerrarEventoEspecial,
    registrarLlegadaDestino,
    liberarCustodio,
    revertirEnDestino,
    getEventsForService,
  } = useBitacoraBoard();

  const { monitoristas, assignmentsByMonitorista } = useMonitoristaAssignment();
  const { hasAnyRole } = useUserRole();
  const isAdminOrCoord = hasAnyRole(['admin', 'owner', 'monitoring_supervisor', 'coordinador_operaciones']);

  const [selectedService, setSelectedService] = useState<BoardService | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterMonitoristaId, setFilterMonitoristaId] = useState<string>('all');

  const handleDoubleClick = useCallback((service: BoardService) => {
    setSelectedService(service);
    setDrawerOpen(true);
  }, []);

  // Compute filtered service IDs when a monitorista is selected
  const filteredServiceIds = useMemo(() => {
    if (filterMonitoristaId === 'all') return null;
    const assignments = assignmentsByMonitorista[filterMonitoristaId] || [];
    return new Set(assignments.map(a => a.servicio_id));
  }, [filterMonitoristaId, assignmentsByMonitorista]);

  const filterFn = useCallback((s: BoardService) => {
    if (!filteredServiceIds) return true;
    return filteredServiceIds.has(s.id_servicio);
  }, [filteredServiceIds]);

  const displayPending = useMemo(() => pendingServices.filter(filterFn), [pendingServices, filterFn]);
  const displayEnCurso = useMemo(() => enCursoServices.filter(filterFn), [enCursoServices, filterFn]);
  const displayEventoEspecial = useMemo(() => eventoEspecialServices.filter(filterFn), [eventoEspecialServices, filterFn]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Collect active service IDs and labels for coordinator assignment dialog
  const activeServiceIds = [...enCursoServices, ...eventoEspecialServices].map(s => s.id_servicio);
  const serviceLabelMap = Object.fromEntries(
    [...pendingServices, ...enCursoServices, ...eventoEspecialServices].map(s => [
      s.id_servicio,
      `${s.id_servicio.slice(0, 8)} — ${s.nombre_cliente || ''}`.trim(),
    ])
  );
  const serviceHoraCitaMap = Object.fromEntries(
    [...pendingServices, ...enCursoServices, ...eventoEspecialServices].map(s => [
      s.id_servicio,
      s.fecha_hora_cita || '',
    ])
  );

  return (
    <div className="space-y-3">
      <MonitoristaAssignmentBar
        activeServiceIds={activeServiceIds}
        serviceLabelMap={serviceLabelMap}
        serviceHoraCitaMap={serviceHoraCitaMap}
      />

      <div className="grid grid-cols-[minmax(200px,1fr)_minmax(400px,2.5fr)_minmax(200px,1fr)] gap-2 h-[calc(var(--content-height-with-tabs,calc(100vh-120px)))]">
        {/* Column 1: Por Iniciar */}
        <BoardColumnPorIniciar
          services={pendingServices}
          onIniciar={(id) => iniciarServicio.mutate(id)}
          onDoubleClick={handleDoubleClick}
          isPending={iniciarServicio.isPending}
        />

        {/* Column 2: En Curso + En Destino */}
        <BoardColumnEnCurso
          services={enCursoServices}
          onEventoEspecial={(sid, tipo) => iniciarEventoEspecial.mutate({ servicioIdServicio: sid, tipo })}
          onCheckpoint={(data) => registrarCheckpoint.mutate(data)}
          onLlegadaDestino={(uuid, sid) => registrarLlegadaDestino.mutate({ serviceUUID: uuid, servicioIdServicio: sid })}
          onLiberar={(uuid, sid) => liberarCustodio.mutate({ serviceUUID: uuid, servicioIdServicio: sid })}
          onRevertir={(uuid, sid) => revertirEnDestino.mutate({ serviceUUID: uuid, servicioIdServicio: sid })}
          onDoubleClick={handleDoubleClick}
          isCheckpointPending={registrarCheckpoint.isPending}
          isEventoPending={iniciarEventoEspecial.isPending}
          isLlegadaPending={registrarLlegadaDestino.isPending}
          isLiberarPending={liberarCustodio.isPending}
          isRevertirPending={revertirEnDestino.isPending}
        />

        {/* Column 3: Evento Especial */}
        <BoardColumnEventoEspecial
          services={eventoEspecialServices}
          onCerrar={(eventoId) => cerrarEventoEspecial.mutate(eventoId)}
          onDoubleClick={handleDoubleClick}
          isPending={cerrarEventoEspecial.isPending}
        />
      </div>

      <ServiceDetailDrawer
        service={selectedService}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        getEventsForService={getEventsForService}
      />
    </div>
  );
};