import React from 'react';
import { useBitacoraBoard } from '@/hooks/useBitacoraBoard';
import { BoardColumnPorIniciar } from './BoardColumnPorIniciar';
import { BoardColumnEnCurso } from './BoardColumnEnCurso';
import { BoardColumnEventoEspecial } from './BoardColumnEventoEspecial';
import { MonitoristaAssignmentBar } from './MonitoristaAssignmentBar';
import { Loader2 } from 'lucide-react';

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
  } = useBitacoraBoard();

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

  return (
    <div className="space-y-3">
      <MonitoristaAssignmentBar
        activeServiceIds={activeServiceIds}
        serviceLabelMap={serviceLabelMap}
      />

      <div className="grid grid-cols-[minmax(200px,1fr)_minmax(400px,2.5fr)_minmax(200px,1fr)] gap-3 h-[calc(100vh-220px)]">
        {/* Column 1: Por Iniciar */}
        <BoardColumnPorIniciar
          services={pendingServices}
          onIniciar={(id) => iniciarServicio.mutate(id)}
          isPending={iniciarServicio.isPending}
        />

        {/* Column 2: En Curso + En Destino */}
        <BoardColumnEnCurso
          services={enCursoServices}
          onEventoEspecial={(sid, tipo) => iniciarEventoEspecial.mutate({ servicioIdServicio: sid, tipo })}
          onCheckpoint={(data) => registrarCheckpoint.mutate(data)}
          onLlegadaDestino={(uuid, sid) => registrarLlegadaDestino.mutate({ serviceUUID: uuid, servicioIdServicio: sid })}
          onLiberar={(uuid, sid) => liberarCustodio.mutate({ serviceUUID: uuid, servicioIdServicio: sid })}
          isCheckpointPending={registrarCheckpoint.isPending}
          isEventoPending={iniciarEventoEspecial.isPending}
          isLlegadaPending={registrarLlegadaDestino.isPending}
          isLiberarPending={liberarCustodio.isPending}
        />

        {/* Column 3: Evento Especial */}
        <BoardColumnEventoEspecial
          services={eventoEspecialServices}
          onCerrar={(eventoId) => cerrarEventoEspecial.mutate(eventoId)}
          isPending={cerrarEventoEspecial.isPending}
        />
      </div>
    </div>
  );
};
