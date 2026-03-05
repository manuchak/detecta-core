import React from 'react';
import { ServiceCardActive } from './ServiceCardActive';
import { ServiceCardEnDestino } from './ServiceCardEnDestino';
import { Badge } from '@/components/ui/badge';
import { Radio } from 'lucide-react';
import type { BoardService, SpecialEventType } from '@/hooks/useBitacoraBoard';

interface BoardColumnEnCursoProps {
  services: BoardService[];
  onEventoEspecial: (servicioIdServicio: string, tipo: SpecialEventType) => void;
  onCheckpoint: (data: { servicioIdServicio: string; descripcion?: string; lat?: number; lng?: number; ubicacion_texto?: string; foto_urls?: string[] }) => void;
  onLlegadaDestino: (serviceUUID: string, servicioIdServicio: string) => void;
  onLiberar: (serviceUUID: string, servicioIdServicio: string) => void;
  isCheckpointPending: boolean;
  isEventoPending: boolean;
  isLlegadaPending: boolean;
  isLiberarPending: boolean;
}

export const BoardColumnEnCurso: React.FC<BoardColumnEnCursoProps> = ({
  services, onEventoEspecial, onCheckpoint, onLlegadaDestino, onLiberar,
  isCheckpointPending, isEventoPending, isLlegadaPending, isLiberarPending,
}) => {
  const activeCount = services.filter(s => s.phase === 'en_curso').length;
  const arrivedCount = services.filter(s => s.phase === 'en_destino').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Radio className="h-4 w-4 text-chart-1" />
        <h3 className="text-sm font-semibold">En Curso</h3>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{activeCount}</Badge>
        {arrivedCount > 0 && (
          <Badge className="text-[10px] px-1.5 py-0 bg-chart-2/20 text-chart-2 border-chart-2/30">{arrivedCount} en destino</Badge>
        )}
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          {services.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8 col-span-full">
              Sin servicios en curso
            </div>
          ) : (
            services.map(s =>
              s.phase === 'en_destino' ? (
                <ServiceCardEnDestino
                  key={s.id}
                  service={s}
                  onLiberar={onLiberar}
                  isPending={isLiberarPending}
                />
              ) : (
                <ServiceCardActive
                  key={s.id}
                  service={s}
                  onEventoEspecial={onEventoEspecial}
                  onCheckpoint={onCheckpoint}
                  onLlegadaDestino={onLlegadaDestino}
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
