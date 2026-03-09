import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmTransitionDialog } from '@/components/monitoring/bitacora/ConfirmTransitionDialog';
import { RotateCcw, CheckCircle2, MapPin, User, Clock } from 'lucide-react';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  services: BoardService[];
  onRevert: (uuid: string, idServicio: string) => void;
  isReverting: boolean;
}

export const DestinoCorrectionSection: React.FC<Props> = ({ services, onRevert, isReverting }) => {
  const [confirmTarget, setConfirmTarget] = useState<BoardService | null>(null);

  const enDestino = services.filter(s => s.phase === 'en_destino');

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 px-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <RotateCcw className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-sm font-semibold">Correcciones en Destino</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] tabular-nums">
            {enDestino.length} en destino
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {enDestino.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              No hay servicios en destino para corregir
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {enDestino.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.nombre_cliente || s.id_servicio.slice(0, 10)}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {s.custodio_asignado || 'Sin custodio'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {s.destino?.slice(0, 25) || '—'}
                    </span>
                    {s.lastEventAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(s.lastEventAt, 'HH:mm', { locale: es })}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-8 gap-1.5 text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                  onClick={() => setConfirmTarget(s)}
                  disabled={isReverting}
                >
                  <RotateCcw className="h-3 w-3" />
                  Revertir
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmTransitionDialog
        open={!!confirmTarget}
        onOpenChange={(v) => !v && setConfirmTarget(null)}
        title="Revertir a En Ruta"
        description={`¿Confirmas que deseas devolver el servicio de "${confirmTarget?.nombre_cliente || ''}" a estado "En Ruta"? Esto eliminará el evento de llegada a destino.`}
        confirmLabel="Revertir a En Ruta"
        destructive={false}
        isPending={isReverting}
        requireDoubleConfirm
        doubleConfirmLabel="Confirmo que esta corrección es necesaria"
        onConfirm={() => {
          if (confirmTarget) {
            onRevert(confirmTarget.id, confirmTarget.id_servicio);
            setConfirmTarget(null);
          }
        }}
      />
    </Card>
  );
};
