import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPinOff, DollarSign, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const MOTIVOS_POSICIONAMIENTO_FALSO = [
  { value: 'cliente_no_disponible', label: 'Cliente no disponible' },
  { value: 'cambio_planes_cliente', label: 'Cambio de planes del cliente' },
  { value: 'problema_operativo_cliente', label: 'Problema operativo del cliente' },
  { value: 'carga_no_lista', label: 'Carga no lista' },
  { value: 'documentacion_pendiente', label: 'Documentación pendiente' },
  { value: 'otro', label: 'Otro motivo' },
];

interface FalsePositioningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    id_servicio?: string;
    cliente_nombre?: string;
    nombre_cliente?: string;
  } | null;
  onConfirm: (data: {
    serviceId: string;
    horaLlegada: string;
    motivo: string;
    motivoDetalle?: string;
    cobroPosicionamiento: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function FalsePositioningDialog({
  open,
  onOpenChange,
  service,
  onConfirm,
  isLoading = false
}: FalsePositioningDialogProps) {
  const [horaLlegada, setHoraLlegada] = useState('');
  const [motivo, setMotivo] = useState('');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [cobroPosicionamiento, setCobroPosicionamiento] = useState(true);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setHoraLlegada(format(new Date(), 'HH:mm'));
      setMotivo('');
      setMotivoDetalle('');
      setCobroPosicionamiento(true);
    }
  }, [open]);

  // Prevent card click interference when dialog is open
  useEffect(() => {
    if (open) {
      document.body.dataset.dialogOpen = "1";
    } else {
      const timeout = setTimeout(() => {
        delete document.body.dataset.dialogOpen;
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [open]);
  
  const handleConfirm = async () => {
    if (!service || !motivo) return;
    
    const motivoLabel = MOTIVOS_POSICIONAMIENTO_FALSO.find(m => m.value === motivo)?.label || motivo;
    const motivoFinal = motivo === 'otro' && motivoDetalle.trim() 
      ? motivoDetalle.trim() 
      : motivoLabel;
    
    await onConfirm({
      serviceId: service.id,
      horaLlegada,
      motivo: motivoFinal,
      motivoDetalle: motivo === 'otro' ? motivoDetalle : undefined,
      cobroPosicionamiento
    });
  };
  
  const clienteName = service?.cliente_nombre || service?.nombre_cliente || 'Cliente';
  const canSubmit = motivo && (motivo !== 'otro' || motivoDetalle.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinOff className="w-5 h-5 text-violet-600" />
            Posicionamiento en Falso
          </DialogTitle>
          <DialogDescription>
            El custodio llegó al punto de origen pero el cliente canceló el servicio.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Service info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">{clienteName}</p>
            {service?.id_servicio && (
              <p className="text-xs text-muted-foreground font-mono">{service.id_servicio}</p>
            )}
          </div>
          
          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Esta acción marcará el servicio como cancelado con posicionamiento en falso. 
              El custodio será liberado para otras asignaciones.
            </p>
          </div>
          
          {/* Hora de llegada */}
          <div className="space-y-2">
            <Label htmlFor="hora-llegada" className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Hora de llegada del custodio
            </Label>
            <Input
              id="hora-llegada"
              type="time"
              value={horaLlegada}
              onChange={(e) => setHoraLlegada(e.target.value)}
              className="w-32"
            />
          </div>
          
          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo de la cancelación del cliente</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_POSICIONAMIENTO_FALSO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Detalle si es "otro" */}
          {motivo === 'otro' && (
            <div className="space-y-2">
              <Label htmlFor="motivo-detalle">Especificar motivo</Label>
              <Textarea
                id="motivo-detalle"
                placeholder="Describe el motivo de cancelación..."
                value={motivoDetalle}
                onChange={(e) => setMotivoDetalle(e.target.value)}
                className="resize-none h-20"
              />
            </div>
          )}
          
          {/* Cobro de posicionamiento */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <div>
                <Label htmlFor="cobro-switch" className="text-sm font-medium cursor-pointer">
                  Cobrar posicionamiento
                </Label>
                <p className="text-xs text-muted-foreground">
                  Se facturará el traslado al cliente
                </p>
              </div>
            </div>
            <Switch
              id="cobro-switch"
              checked={cobroPosicionamiento}
              onCheckedChange={setCobroPosicionamiento}
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
            disabled={!canSubmit || isLoading}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar posicionamiento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
