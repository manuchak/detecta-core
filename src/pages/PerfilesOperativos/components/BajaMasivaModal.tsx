import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, UserX, Clock } from 'lucide-react';
import { useBajaMasiva } from '@/hooks/useBajaMasiva';

// Generic operative profile interface for bulk operations
interface OperativeProfile {
  id: string;
  nombre: string;
  zona_base: string | null;
  dias_sin_actividad: number;
}

interface BajaMasivaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operativos: OperativeProfile[];
  operativoTipo: 'custodio' | 'armado';
  onSuccess: () => void;
}

const LABELS = {
  custodio: {
    singular: 'custodio',
    plural: 'custodios',
  },
  armado: {
    singular: 'armado',
    plural: 'armados',
  },
};

export function BajaMasivaModal({
  open,
  onOpenChange,
  operativos,
  operativoTipo,
  onSuccess,
}: BajaMasivaModalProps) {
  const [notas, setNotas] = useState('');
  const { darDeBajaMasiva, isLoading } = useBajaMasiva();

  const labels = LABELS[operativoTipo];

  const handleConfirm = async () => {
    const result = await darDeBajaMasiva({
      operativoIds: operativos.map(o => o.id),
      operativoTipo,
      motivo: 'Dado de baja por inactividad (+90 días)',
      notas: notas || undefined,
    });

    if (result.success) {
      setNotas('');
      onOpenChange(false);
      onSuccess();
    }
  };

  const formatDiasSinActividad = (dias: number) => {
    if (dias >= 999) return 'Sin servicios';
    return `${dias} días`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar baja masiva
          </DialogTitle>
          <DialogDescription>
            Esta acción dará de baja permanente a {operativos.length} {operativos.length !== 1 ? labels.plural : labels.singular} por inactividad prolongada (+90 días sin servicio).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* List of operatives to be deactivated */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {operativoTipo === 'custodio' ? 'Custodios' : 'Armados'} a dar de baja:
            </Label>
            <ScrollArea className="h-[200px] rounded-md border p-3">
              <div className="space-y-2">
                {operativos.map((operativo) => (
                  <div
                    key={operativo.id}
                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{operativo.nombre}</span>
                      {operativo.zona_base && (
                        <Badge variant="outline" className="text-xs">
                          {operativo.zona_base}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDiasSinActividad(operativo.dias_sin_actividad)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Reason (fixed for bulk) */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-amber-700 dark:text-amber-400">Motivo: </span>
                <span className="text-amber-600 dark:text-amber-300">
                  Dado de baja por inactividad (+90 días sin servicio)
                </span>
              </div>
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <Label htmlFor="notas" className="text-sm font-medium">
              Notas adicionales (opcional)
            </Label>
            <Textarea
              id="notas"
              placeholder="Agregar observaciones sobre esta baja masiva..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>Procesando...</>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Confirmar baja ({operativos.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
