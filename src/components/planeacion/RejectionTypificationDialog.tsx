import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, MapPin, Clock, Heart, FileX, X } from 'lucide-react';

interface RejectionTypificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, unavailabilityDays?: number) => void;
  guardName: string;
}

const rejectionReasons = [
  {
    id: 'ocupado_otro_servicio',
    label: 'Ocupado con otro servicio',
    icon: Clock,
    description: 'Ya tiene un servicio programado en el mismo horario'
  },
  {
    id: 'fuera_de_zona',
    label: 'Fuera de zona de cobertura',
    icon: MapPin,
    description: 'La zona del servicio está fuera de su área de trabajo'
  },
  {
    id: 'problema_personal',
    label: 'Problema personal/familiar',
    icon: Heart,
    description: 'Situación personal que impide realizar el servicio'
  },
  {
    id: 'indisponible_fisicamente',
    label: 'Indisponible físicamente',
    icon: AlertTriangle,
    description: 'Condición física que impide realizar el servicio'
  },
  {
    id: 'documentos_vencidos',
    label: 'Documentación vencida',
    icon: FileX,
    description: 'Licencia de portación u otros documentos vencidos'
  },
  {
    id: 'no_disponible',
    label: 'No disponible - sin especificar',
    icon: X,
    description: 'No especificó motivo o no contestó'
  }
];

const unavailabilityOptions = [
  { days: 1, label: '1 día' },
  { days: 3, label: '3 días' },
  { days: 7, label: '1 semana' },
  { days: 15, label: '2 semanas' },
  { days: 30, label: '1 mes' }
];

export function RejectionTypificationDialog({
  isOpen,
  onClose,
  onConfirm,
  guardName
}: RejectionTypificationDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [observations, setObservations] = useState('');
  const [markAsUnavailable, setMarkAsUnavailable] = useState(false);
  const [unavailabilityDays, setUnavailabilityDays] = useState<number>();

  const handleConfirm = () => {
    if (!selectedReason) return;
    
    // Validar que si markAsUnavailable está activo, unavailabilityDays tenga un valor
    if (markAsUnavailable && !unavailabilityDays) {
      return;
    }
    
    const reason = rejectionReasons.find(r => r.id === selectedReason)?.label || selectedReason;
    const fullReason = observations ? `${reason}. Obs: ${observations}` : reason;
    
    onConfirm(fullReason, markAsUnavailable ? unavailabilityDays : undefined);
    
    // Reset form
    setSelectedReason('');
    setObservations('');
    setMarkAsUnavailable(false);
    setUnavailabilityDays(undefined);
  };

  const selectedReasonData = rejectionReasons.find(r => r.id === selectedReason);
  const canMarkUnavailable = ['problema_personal', 'indisponible_fisicamente', 'documentos_vencidos'].includes(selectedReason);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg z-[70]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-destructive" />
            Tipificar Rechazo - {guardName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>Motivo del Rechazo</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el motivo del rechazo..." />
              </SelectTrigger>
              <SelectContent>
                {rejectionReasons.map((reason) => {
                  const Icon = reason.icon;
                  return (
                    <SelectItem key={reason.id} value={reason.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{reason.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {selectedReasonData && (
              <Card className="border-muted">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">
                    {selectedReasonData.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Unavailability Option */}
          {canMarkUnavailable && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      Marcar como No Disponible
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Quitar de listados por período prolongado
                    </p>
                  </div>
                  <Switch
                    checked={markAsUnavailable}
                    onCheckedChange={setMarkAsUnavailable}
                  />
                </div>

                {markAsUnavailable && (
                  <div className="space-y-2 animate-fade-in">
                    <Label className="text-sm">Período de indisponibilidad:</Label>
                    <div className="flex flex-wrap gap-2">
                      {unavailabilityOptions.map((option) => (
                        <Button
                          key={option.days}
                          variant={unavailabilityDays === option.days ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUnavailabilityDays(option.days)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    
                    {unavailabilityDays && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Se ocultará de listados por {unavailabilityDays} día{unavailabilityDays > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observations */}
          <div className="space-y-2">
            <Label>Observaciones Adicionales (Opcional)</Label>
            <Textarea
              placeholder="Detalles adicionales sobre el rechazo..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="min-h-20 resize-none"
              maxLength={300}
            />
            <div className="text-xs text-muted-foreground text-right">
              {observations.length}/300
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedReason}
              className="flex-1"
              variant="destructive"
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}