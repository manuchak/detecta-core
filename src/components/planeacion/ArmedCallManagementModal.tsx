import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Clock, User, Shield, MapPin, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { ArmedGuardOperativo } from '@/hooks/useArmedGuardsOperativos';
import { RejectionTypificationDialog } from './RejectionTypificationDialog';

interface ServiceData {
  id_servicio: string;
  fecha_hora_cita: string;
  origen: string;
  destino: string;
  nombre_cliente: string;
  tipo_servicio?: string;
}

interface ArmedCallManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  guard: ArmedGuardOperativo;
  serviceData: ServiceData;
  onAccept: (guardId: string) => void;
  onReject: (guardId: string, reason: string, unavailabilityDays?: number) => void;
}

export function ArmedCallManagementModal({ 
  isOpen, 
  onClose, 
  guard, 
  serviceData, 
  onAccept, 
  onReject 
}: ArmedCallManagementModalProps) {
  const [callStartTime] = useState(new Date());
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Update call duration every second
  React.useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
      setCallDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, callStartTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatServiceTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAccept = () => {
    onAccept(guard.id);
    onClose();
  };

  const handleReject = () => {
    setShowRejectionDialog(true);
  };

  const handleRejectionConfirm = (reason: string, unavailabilityDays?: number) => {
    onReject(guard.id, reason, unavailabilityDays);
    setShowRejectionDialog(false);
    onClose();
  };

  const getAvailabilityColor = () => {
    if (guard.conflicto_validacion) {
      switch (guard.categoria_disponibilidad_conflicto) {
        case 'libre': return 'bg-green-500';
        case 'parcialmente_ocupado': return 'bg-yellow-500';
        case 'ocupado_disponible': return 'bg-orange-500';
        default: return 'bg-gray-500';
      }
    }
    return guard.disponibilidad === 'disponible' ? 'bg-green-500' : 'bg-gray-500';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Llamada en Curso - {guard.nombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Call Timer */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Duración de llamada:</span>
                  </div>
                  <Badge variant="secondary" className="text-lg font-mono">
                    {formatDuration(callDuration)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guard Information */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Información del Armado
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{guard.nombre}</span>
                      <div className={`w-2 h-2 rounded-full ${getAvailabilityColor()}`} />
                    </div>
                    
                    {guard.telefono && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{guard.telefono}</span>
                      </div>
                    )}
                    
                    {guard.zona_base && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{guard.zona_base}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {guard.experiencia_anos} años exp.
                      </Badge>
                      <Badge variant="secondary">
                        ⭐ {guard.rating_promedio?.toFixed(1) || 'N/A'}
                      </Badge>
                    </div>

                    {guard.conflicto_validacion && (
                      <div className="text-xs text-muted-foreground">
                        <p>Servicios hoy: {guard.conflicto_validacion.servicios_hoy}</p>
                        <p>Horas trabajadas: {guard.conflicto_validacion.horas_trabajadas_hoy}h</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Detalles del Servicio
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">ID Servicio</p>
                      <p className="font-mono text-sm">{serviceData.id_servicio}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{serviceData.nombre_cliente}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                      <p className="text-sm">{formatServiceTime(serviceData.fecha_hora_cita)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Ruta</p>
                      <p className="text-sm">
                        <span className="font-medium">{serviceData.origen}</span>
                        {' → '}
                        <span className="font-medium">{serviceData.destino}</span>
                      </p>
                    </div>

                    {serviceData.tipo_servicio && (
                      <Badge variant="outline" className="capitalize">
                        {serviceData.tipo_servicio.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Acepta el Servicio
              </Button>
              
              <Button 
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Rechaza el Servicio
              </Button>
            </div>

            <div className="text-xs text-center text-muted-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Confirme la respuesta del armado antes de proceder
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RejectionTypificationDialog
        isOpen={showRejectionDialog}
        onClose={() => setShowRejectionDialog(false)}
        onConfirm={handleRejectionConfirm}
        guardName={guard.nombre}
      />
    </>
  );
}