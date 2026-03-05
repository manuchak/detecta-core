import React, { useState, useMemo } from 'react';
import { ServiceCardActive } from './ServiceCardActive';
import { ServiceCardEnDestino } from './ServiceCardEnDestino';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { BoardService, SpecialEventType } from '@/hooks/useBitacoraBoard';

interface BoardColumnEnCursoProps {
  services: BoardService[];
  onEventoEspecial: (servicioIdServicio: string, tipo: SpecialEventType) => void;
  onCheckpoint: (data: { servicioIdServicio: string; descripcion?: string; lat?: number; lng?: number; ubicacion_texto?: string; foto_urls?: string[] }) => void;
  onLlegadaDestino: (serviceUUID: string, servicioIdServicio: string) => void;
  onLiberar: (serviceUUID: string, servicioIdServicio: string) => void;
  onDoubleClick?: (service: BoardService) => void;
  isCheckpointPending: boolean;
  isEventoPending: boolean;
  isLlegadaPending: boolean;
  isLiberarPending: boolean;
}

export const BoardColumnEnCurso: React.FC<BoardColumnEnCursoProps> = ({
  services, onEventoEspecial, onCheckpoint, onLlegadaDestino, onLiberar, onDoubleClick,
  isCheckpointPending, isEventoPending, isLlegadaPending, isLiberarPending,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter.trim()) return services;
    const q = filter.toLowerCase();
    return services.filter(s =>
      (s.custodio_asignado || '').toLowerCase().includes(q) ||
      (s.nombre_cliente || '').toLowerCase().includes(q) ||
      (s.id_servicio || '').toLowerCase().includes(q)
    );
  }, [services, filter]);

  const activeCount = services.filter(s => s.phase === 'en_curso').length;
  const arrivedCount = services.filter(s => s.phase === 'en_destino').length;
  const isFiltered = filter.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-1 px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">En Curso</h3>
        <span className="text-[10px] text-muted-foreground/70 font-mono">
          {isFiltered ? `${filtered.length} de ${services.length}` : activeCount}
        </span>
        {arrivedCount > 0 && (
          <span className="text-[10px] text-chart-2 font-mono ml-auto">{arrivedCount} en destino</span>
        )}
      </div>

      <div className="relative mb-2 px-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar custodio, cliente, folio…"
          className="h-7 pl-8 text-xs bg-muted/30 border-muted-foreground/10"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          {filtered.length === 0 ? (
            <div className="text-xs text-muted-foreground/50 text-center py-8 col-span-full">
              {isFiltered ? 'Sin resultados' : 'Sin servicios en curso'}
            </div>
          ) : (
            filtered.map(s =>
              s.phase === 'en_destino' ? (
                <ServiceCardEnDestino
                  key={s.id}
                  service={s}
                  onLiberar={onLiberar}
                  onDoubleClick={onDoubleClick}
                  isPending={isLiberarPending}
                />
              ) : (
                <ServiceCardActive
                  key={s.id}
                  service={s}
                  onEventoEspecial={onEventoEspecial}
                  onCheckpoint={onCheckpoint}
                  onLlegadaDestino={onLlegadaDestino}
                  onDoubleClick={onDoubleClick}
                  isCheckpointPending={isCheckpointPending}
                  isEventoPending={isEventoPending}
                  isLlegadaPending={isLlegadaPending}
                />
              )
            )
          )}
        </div>
      </div>
    </div>
  );
};
