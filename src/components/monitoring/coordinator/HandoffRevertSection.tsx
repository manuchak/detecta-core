import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmTransitionDialog } from '@/components/monitoring/bitacora/ConfirmTransitionDialog';
import { ArrowRightLeft, CheckCircle2, Clock, Users } from 'lucide-react';
import { useRevertHandoff } from '@/hooks/useRevertHandoff';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const HandoffRevertSection: React.FC = () => {
  const { entregas, revertir } = useRevertHandoff();
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const targetEntrega = entregas.find(e => e.id === confirmTarget);

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 px-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <ArrowRightLeft className="h-4 w-4 text-chart-4" />
            </div>
            <CardTitle className="text-sm font-semibold">Entregas de Turno</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] tabular-nums">
            {entregas.length} revertibles
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {entregas.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              No hay entregas de turno activas hoy
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entregas.map(e => {
              const salientes = Array.isArray(e.monitoristas_salientes) ? e.monitoristas_salientes : [];
              const entrantes = Array.isArray(e.monitoristas_entrantes) ? e.monitoristas_entrantes : [];
              const transferidos = Array.isArray(e.servicios_transferidos) ? e.servicios_transferidos : [];

              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{e.turno_saliente}</span>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                      <span>{e.turno_entrante}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(e.created_at), 'HH:mm', { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {salientes.length} → {entrantes.length}
                      </span>
                      <Badge variant="default" className="text-[9px] px-1.5 py-0">
                        {transferidos.length} servicios
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-8 gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmTarget(e.id)}
                    disabled={revertir.isPending}
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    Revertir
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <ConfirmTransitionDialog
        open={!!confirmTarget}
        onOpenChange={(v) => !v && setConfirmTarget(null)}
        title="Revertir Entrega de Turno"
        description={`¿Confirmas que deseas revertir esta entrega de turno (${targetEntrega?.turno_saliente} → ${targetEntrega?.turno_entrante})? Se restaurarán las asignaciones originales de los monitoristas salientes.`}
        confirmLabel="Revertir Entrega"
        destructive
        isPending={revertir.isPending}
        requireDoubleConfirm
        doubleConfirmLabel="Confirmo que esta reversión es necesaria y que notifiqué al equipo"
        onConfirm={() => {
          if (confirmTarget) {
            revertir.mutate(confirmTarget);
            setConfirmTarget(null);
          }
        }}
      />
    </Card>
  );
};
