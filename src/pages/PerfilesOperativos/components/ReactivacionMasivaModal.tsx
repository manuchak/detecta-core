import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, RefreshCw, User, Shield, Loader2 } from 'lucide-react';
import { useReactivacionMasiva } from '@/hooks/useReactivacionMasiva';
import type { BajaProfile } from '../hooks/useOperativeProfiles';

interface ReactivacionMasivaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operativos: BajaProfile[];
  onSuccess?: () => void;
}

export function ReactivacionMasivaModal({
  open,
  onOpenChange,
  operativos,
  onSuccess,
}: ReactivacionMasivaModalProps) {
  const [motivo, setMotivo] = useState('Rollback de baja por error');
  const [notas, setNotas] = useState('');
  const { reactivarMasivo, isLoading } = useReactivacionMasiva();

  const handleConfirm = async () => {
    if (!motivo.trim()) return;

    const result = await reactivarMasivo({
      operativos: operativos.map(op => ({
        id: op.id,
        tipo_personal: op.tipo_personal,
        nombre: op.nombre,
      })),
      motivo: motivo.trim(),
      notas: notas.trim() || undefined,
    });

    if (result.success) {
      setMotivo('Rollback de baja por error');
      setNotas('');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const custodiosCount = operativos.filter(o => o.tipo_personal === 'custodio').length;
  const armadosCount = operativos.filter(o => o.tipo_personal === 'armado').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reactivar Operativos
          </DialogTitle>
          <DialogDescription>
            Esta acción reactivará a los operativos seleccionados y registrará el cambio en el historial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <span className="font-medium">{operativos.length}</span> operativo{operativos.length > 1 ? 's' : ''} seleccionado{operativos.length > 1 ? 's' : ''}
            </div>
            <div className="flex gap-2 ml-auto">
              {custodiosCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <User className="h-3 w-3" />
                  {custodiosCount}
                </Badge>
              )}
              {armadosCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {armadosCount}
                </Badge>
              )}
            </div>
          </div>

          {/* List of operatives */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Operativos a reactivar
            </Label>
            <ScrollArea className="h-[120px] border rounded-md p-2">
              <div className="space-y-1">
                {operativos.map(op => (
                  <div 
                    key={`${op.tipo_personal}-${op.id}`}
                    className="flex items-center gap-2 text-sm py-1"
                  >
                    {op.tipo_personal === 'armado' ? (
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate">{op.nombre}</span>
                    <span className="text-xs text-muted-foreground">{op.zona_base || '-'}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de reactivación *</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Rollback de baja por error"
              rows={2}
            />
          </div>

          {/* Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Información adicional sobre esta reactivación..."
              rows={2}
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
            onClick={handleConfirm}
            disabled={isLoading || !motivo.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Confirmar Reactivación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
