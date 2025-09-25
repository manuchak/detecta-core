import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, CheckCircle, Clock, User, FileText, Phone, Mail } from 'lucide-react';
import { usePersonalProveedorArmados, type PersonalProveedorArmado, type VerificacionLicencia } from '@/hooks/usePersonalProveedorArmados';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExternalArmedVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedorId: string;
  proveedorNombre: string;
  servicioId: string;
  onConfirm: (personalData: {
    personalId: string;
    nombreCompleto: string;
    licenciaPortacion?: string;
    verificacionData: VerificacionLicencia;
  }) => void;
}

export const ExternalArmedVerificationModal: React.FC<ExternalArmedVerificationModalProps> = ({
  open,
  onOpenChange,
  proveedorId,
  proveedorNombre,
  servicioId,
  onConfirm
}) => {
  const { getPersonalDisponible, verificarLicencia } = usePersonalProveedorArmados();
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>('');
  const [selectedPersonal, setSelectedPersonal] = useState<PersonalProveedorArmado | null>(null);
  const [verificacion, setVerificacion] = useState<VerificacionLicencia | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const personalDisponible = getPersonalDisponible(proveedorId);

  useEffect(() => {
    if (!open) {
      setSelectedPersonalId('');
      setSelectedPersonal(null);
      setVerificacion(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedPersonalId) {
      const personal = personalDisponible.find(p => p.id === selectedPersonalId);
      setSelectedPersonal(personal || null);
      
      if (personal) {
        handleVerificarLicencia(personal.id);
      }
    } else {
      setSelectedPersonal(null);
      setVerificacion(null);
    }
  }, [selectedPersonalId, personalDisponible]);

  const handleVerificarLicencia = async (personalId: string) => {
    setVerifying(true);
    try {
      const result = await verificarLicencia(personalId);
      setVerificacion(result);
    } catch (error) {
      console.error('Error verificando licencia:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPersonal || !verificacion) return;

    if (!verificacion.valida) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        personalId: selectedPersonal.id,
        nombreCompleto: selectedPersonal.nombre_completo,
        licenciaPortacion: selectedPersonal.licencia_portacion,
        verificacionData: verificacion
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirmando asignación:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertBadgeColor = (nivel?: string) => {
    switch (nivel) {
      case 'vencida': return 'destructive';
      case 'critica': return 'destructive';
      case 'alta': return 'destructive';
      case 'media': return 'secondary';
      case 'baja': return 'outline';
      default: return 'outline';
    }
  };

  const getAlertIcon = (nivel?: string) => {
    switch (nivel) {
      case 'vencida': return <AlertTriangle className="h-4 w-4" />;
      case 'critica': return <AlertTriangle className="h-4 w-4" />;
      case 'alta': return <Clock className="h-4 w-4" />;
      case 'media': return <Clock className="h-4 w-4" />;
      case 'baja': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verificación de Personal Armado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="font-medium">Proveedor Externo</h3>
              <p className="text-sm text-muted-foreground">{proveedorNombre}</p>
            </div>
            <Badge variant="outline" className="bg-background">
              Servicio: {servicioId}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Seleccionar Personal Autorizado *
              </label>
              <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el personal que realizará el servicio" />
                </SelectTrigger>
                <SelectContent>
                  {personalDisponible.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No hay personal disponible para este proveedor
                    </div>
                  ) : (
                    personalDisponible.map((personal) => (
                      <SelectItem key={personal.id} value={personal.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {personal.nombre_completo}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPersonal && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    {selectedPersonal.nombre_completo}
                  </CardTitle>
                  <CardDescription>
                    Información del personal seleccionado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPersonal.cedula_rfc && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">RFC: {selectedPersonal.cedula_rfc}</span>
                      </div>
                    )}
                    {selectedPersonal.telefono_personal && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedPersonal.telefono_personal}</span>
                      </div>
                    )}
                    {selectedPersonal.email_personal && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedPersonal.email_personal}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {verifying ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">Verificando licencia...</span>
                      </div>
                    </div>
                  ) : verificacion ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estado de Licencia:</span>
                        <Badge 
                          variant={getAlertBadgeColor(verificacion.nivel_alerta)}
                          className="flex items-center gap-1"
                        >
                          {getAlertIcon(verificacion.nivel_alerta)}
                          {verificacion.valida ? 'Válida' : 'Inválida'}
                        </Badge>
                      </div>

                      {verificacion.licencia_portacion && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Licencia:</span>
                          <span className="text-sm font-mono">{verificacion.licencia_portacion}</span>
                        </div>
                      )}

                      {verificacion.fecha_vencimiento && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Vencimiento:</span>
                          <span className="text-sm">
                            {format(new Date(verificacion.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                      )}

                      {verificacion.dias_vencimiento !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Días restantes:</span>
                          <span className={`text-sm font-medium ${
                            verificacion.dias_vencimiento < 0 ? 'text-destructive' :
                            verificacion.dias_vencimiento <= 15 ? 'text-warning' : 'text-success'
                          }`}>
                            {verificacion.dias_vencimiento < 0 
                              ? `Vencida hace ${Math.abs(verificacion.dias_vencimiento)} días`
                              : `${verificacion.dias_vencimiento} días`
                            }
                          </span>
                        </div>
                      )}

                      {!verificacion.valida && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {verificacion.error || 'La licencia no es válida para realizar servicios'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPersonal || !verificacion?.valida || loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmar Asignación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};