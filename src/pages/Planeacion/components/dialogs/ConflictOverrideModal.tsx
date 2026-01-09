import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, User, Shield, Info } from 'lucide-react';

export interface ConflictDetails {
  servicios_hoy?: number;
  conflictos_detalle?: Array<{
    servicio_id: string;
    hora_inicio: string;
    hora_fin: string;
    cliente?: string;
  }>;
  razon_no_disponible?: string;
}

interface ConflictOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodioNombre: string;
  custodioId: string;
  conflictDetails?: ConflictDetails;
  onConfirm: (motivo: string, detalles?: string) => void;
}

const MOTIVOS_OVERRIDE = [
  {
    value: 'servicio_retorno',
    label: 'Servicio de retorno del mismo cliente',
    description: 'El cliente solicitó escolta de regreso después del servicio actual'
  },
  {
    value: 'continuidad_custodio',
    label: 'Cliente solicitó continuidad de custodio',
    description: 'El cliente requiere específicamente que continúe el mismo custodio'
  },
  {
    value: 'servicio_secuencial',
    label: 'Servicio secuencial sin traslape real',
    description: 'Los servicios son consecutivos y no hay conflicto de horarios'
  },
  {
    value: 'emergencia_operativa',
    label: 'Emergencia operativa',
    description: 'No hay otro custodio disponible y el servicio es urgente'
  },
  {
    value: 'otro',
    label: 'Otro motivo',
    description: 'Especificar en los detalles'
  }
];

export function ConflictOverrideModal({
  open,
  onOpenChange,
  custodioNombre,
  custodioId,
  conflictDetails,
  onConfirm
}: ConflictOverrideModalProps) {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [detallesAdicionales, setDetallesAdicionales] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const motivoInfo = MOTIVOS_OVERRIDE.find(m => m.value === motivoSeleccionado);
  const canSubmit = motivoSeleccionado && (motivoSeleccionado !== 'otro' || detallesAdicionales.trim());

  const handleConfirm = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      const motivoLabel = motivoInfo?.label || motivoSeleccionado;
      const detalles = motivoSeleccionado === 'otro' 
        ? detallesAdicionales 
        : detallesAdicionales || undefined;
      
      onConfirm(motivoLabel, detalles);
      
      // Reset state
      setMotivoSeleccionado('');
      setDetallesAdicionales('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMotivoSeleccionado('');
    setDetallesAdicionales('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Asignar custodio con conflicto
          </DialogTitle>
          <DialogDescription>
            Este custodio tiene un conflicto de horario detectado. Al continuar, 
            deberás justificar la asignación para auditoría.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información del custodio */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{custodioNombre}</p>
              <p className="text-xs text-muted-foreground">ID: {custodioId.slice(0, 8)}...</p>
            </div>
          </div>

          {/* Detalles del conflicto */}
          {conflictDetails && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-sm">Conflicto detectado</span>
              </div>
              
              {conflictDetails.razon_no_disponible && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {conflictDetails.razon_no_disponible}
                </p>
              )}
              
              {conflictDetails.servicios_hoy !== undefined && (
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  {conflictDetails.servicios_hoy} servicio(s) hoy
                </Badge>
              )}
              
              {conflictDetails.conflictos_detalle && conflictDetails.conflictos_detalle.length > 0 && (
                <div className="mt-2 space-y-1">
                  {conflictDetails.conflictos_detalle.slice(0, 3).map((conflicto, idx) => (
                    <div key={idx} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span>
                        {conflicto.servicio_id}: {conflicto.hora_inicio} - {conflicto.hora_fin}
                        {conflicto.cliente && ` (${conflicto.cliente})`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selector de motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del override *</Label>
            <Select value={motivoSeleccionado} onValueChange={setMotivoSeleccionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_OVERRIDE.map((motivo) => (
                  <SelectItem key={motivo.value} value={motivo.value}>
                    {motivo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {motivoInfo && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{motivoInfo.description}</span>
              </div>
            )}
          </div>

          {/* Detalles adicionales */}
          <div className="space-y-2">
            <Label htmlFor="detalles">
              Detalles adicionales {motivoSeleccionado === 'otro' && '*'}
            </Label>
            <Textarea
              id="detalles"
              placeholder="Proporciona contexto adicional sobre la asignación..."
              value={detallesAdicionales}
              onChange={(e) => setDetallesAdicionales(e.target.value)}
              rows={3}
            />
          </div>

          {/* Advertencia de auditoría */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Esta acción quedará registrada con tu usuario, fecha y motivo para auditoría operativa.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canSubmit || isSubmitting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar asignación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
