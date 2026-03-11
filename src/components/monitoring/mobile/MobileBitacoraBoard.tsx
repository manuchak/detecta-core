import React, { useState, useCallback, useMemo } from 'react';
import { useBitacoraBoard } from '@/hooks/useBitacoraBoard';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { BoardColumnPorIniciar } from '../bitacora/BoardColumnPorIniciar';
import { BoardColumnEnCurso } from '../bitacora/BoardColumnEnCurso';
import { BoardColumnEventoEspecial } from '../bitacora/BoardColumnEventoEspecial';
import { ServiceDetailDrawer } from '../bitacora/ServiceDetailDrawer';
import { PauseOverlay } from '../bitacora/PauseOverlay';
import { useMonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';
import { useMonitoristaPause } from '@/hooks/useMonitoristaPause';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUB_TABS = [
  { id: 'pending', label: 'Por Iniciar' },
  { id: 'active', label: 'En Curso' },
  { id: 'events', label: 'Eventos' },
] as const;

type SubTabId = typeof SUB_TABS[number]['id'];

export const MobileBitacoraBoard: React.FC = () => {
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

  const { pausaActiva, segundosRestantes, excedido, finalizarPausa } = useMonitoristaPause();
  const showPauseOverlay = !!pausaActiva;

  const [subTab, setSubTab] = useState<SubTabId>('active');
  const [selectedService, setSelectedService] = useState<BoardService | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDoubleClick = useCallback((service: BoardService) => {
    setSelectedService(service);
    setDrawerOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const counts = {
    pending: pendingServices.length,
    active: enCursoServices.length,
    events: eventoEspecialServices.length,
  };

  return (
    <div className="space-y-3 py-2">
      {showPauseOverlay && (
        <PauseOverlay
          pausaActiva={pausaActiva}
          segundosRestantes={segundosRestantes}
          excedido={excedido}
          onRetomar={() => finalizarPausa.mutate({})}
          isRetomando={finalizarPausa.isPending}
        />
      )}

      {/* Sub-tab pills */}
      <div className="flex gap-2">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all touch-manipulation min-h-[36px]',
              subTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground'
            )}
          >
            {tab.label}
            <span className={cn(
              'text-[10px] font-mono px-1 rounded-full min-w-[18px] text-center',
              subTab === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Content per sub-tab — full height scroll */}
      <div className="min-h-[60vh]">
        {subTab === 'pending' && (
          <BoardColumnPorIniciar
            services={pendingServices}
            onIniciar={(id) => iniciarServicio.mutate(id)}
            onDoubleClick={handleDoubleClick}
            isPending={iniciarServicio.isPending}
          />
        )}

        {subTab === 'active' && (
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
        )}

        {subTab === 'events' && (
          <BoardColumnEventoEspecial
            services={eventoEspecialServices}
            onCerrar={(eventoId) => cerrarEventoEspecial.mutate(eventoId)}
            onDoubleClick={handleDoubleClick}
            isPending={cerrarEventoEspecial.isPending}
          />
        )}
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
