import React, { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coffee, Bath, Eye, User, Loader2, AlertTriangle } from 'lucide-react';
import type { TipoPausa } from '@/hooks/useMonitoristaPause';
import { getPauseLabel, getPauseDurationMinutes } from '@/hooks/useMonitoristaPause';

interface PreviewData {
  assignments: any[];
  available: Array<{ id: string; display_name: string; count: number }>;
  distribution?: Array<{ servicio_id: string; asignado_a: string }>;
}

interface PauseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoPausa: TipoPausa | null;
  onConfirm: (tipo: TipoPausa) => void;
  isPending: boolean;
  previewFn: (tipo: TipoPausa) => Promise<PreviewData>;
}

const PAUSE_ICONS: Record<TipoPausa, React.ReactNode> = {
  comida: <Coffee className="h-4 w-4" />,
  bano: <Bath className="h-4 w-4" />,
  descanso: <Eye className="h-4 w-4" />,
};

export const PauseConfirmDialog: React.FC<PauseConfirmDialogProps> = ({
  open,
  onOpenChange,
  tipoPausa,
  onConfirm,
  isPending,
  previewFn,
}) => {
  const [checked, setChecked] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!open) {
      setChecked(false);
      setPreview(null);
      return;
    }
    if (!tipoPausa) return;

    setLoadingPreview(true);
    previewFn(tipoPausa)
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setLoadingPreview(false));
  }, [open, tipoPausa, previewFn]);

  if (!tipoPausa) return null;

  const duracion = getPauseDurationMinutes(tipoPausa);
  const noAvailable = preview && preview.available.length === 0;
  const noServices = preview && preview.assignments.length === 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {PAUSE_ICONS[tipoPausa]}
            Iniciar pausa: {getPauseLabel(tipoPausa)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tiempo máximo: <strong>{duracion} minutos</strong>. Tus servicios serán redistribuidos temporalmente al staff en turno.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          {loadingPreview ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Calculando redistribución…</span>
            </div>
          ) : noServices ? (
            <div className="flex items-center gap-2 p-3 rounded-md border border-muted bg-muted/30">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">No tienes servicios asignados actualmente.</span>
            </div>
          ) : noAvailable ? (
            <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-destructive">No hay monitoristas disponibles para cubrir tu pausa.</span>
            </div>
          ) : preview ? (
            <>
              <div className="p-3 rounded-md border bg-muted/20 space-y-2">
                <p className="text-xs font-medium">
                  {preview.assignments.length} servicio{preview.assignments.length !== 1 ? 's' : ''} se redistribuirán <strong>automáticamente</strong> a:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.available
                    .filter(a => a.count > 0)
                    .map(a => (
                      <Badge key={a.id} variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                        <User className="h-2.5 w-2.5" />
                        {a.display_name.split(' ')[0]} +{a.count}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md border border-chart-4/30 bg-chart-4/5">
                <Checkbox
                  id="pause-confirm"
                  checked={checked}
                  onCheckedChange={(v) => setChecked(v === true)}
                />
                <Label
                  htmlFor="pause-confirm"
                  className="text-xs text-muted-foreground cursor-pointer leading-tight"
                >
                  Confirmo que inicio mi pausa de {getPauseLabel(tipoPausa).toLowerCase()} (máx {duracion} min). La redistribución es automática y se revertirá al retomar.
                </Label>
              </div>
            </>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(tipoPausa)}
            disabled={isPending || !checked || noAvailable || noServices}
          >
            {isPending ? 'Procesando…' : 'Iniciar pausa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
