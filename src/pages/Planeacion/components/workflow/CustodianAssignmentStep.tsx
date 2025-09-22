import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, MessageCircle, Phone, MapPin, Target, Clock, Car, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { CustodioPerformanceCard } from '@/components/planeacion/CustodioPerformanceCard';
import { CustodianContactDialog } from '../dialogs/CustodianContactDialog';
import { useCustodiosWithTracking, type CustodioEnriquecido } from '@/hooks/useCustodiosWithTracking';
import type { ServicioNuevo } from '@/utils/proximidadOperacional';

interface ServiceData {
  origen?: string;
  destino?: string;
  fecha_hora_cita?: string;
  tipo_servicio?: string;
  cliente_nombre?: string;
  destino_texto?: string;
  fecha_programada?: string;
  hora_ventana_inicio?: string;
  incluye_armado?: boolean;
  requiere_gadgets?: boolean;
  gadgets_seleccionados?: string[];
  observaciones?: string;
  fecha_recepcion?: string;
  hora_recepcion?: string;
}

interface AssignmentData extends ServiceData {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  estado_comunicacion?: 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder' | 'contactar_despues';
}

interface ComunicacionState {
  estado: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder' | 'contactar_despues';
  metodo?: 'whatsapp' | 'llamada' | 'dialog';
  timestamp?: Date;
  razon_rechazo?: string;
  categoria_rechazo?: string;
  detalles?: string;
  contactar_en?: string;
}

interface CustodianAssignmentStepProps {
  serviceData: ServiceData;
  onComplete: (data: AssignmentData) => void;
  onBack: () => void;
}

export function CustodianAssignmentStep({ serviceData, onComplete, onBack }: CustodianAssignmentStepProps) {
  const [selectedCustodio, setSelectedCustodio] = useState<string | null>(null);
  const [comunicaciones, setComunicaciones] = useState<Record<string, ComunicacionState>>({});
  
  // Estado para el diálogo de contacto
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactingCustodian, setContactingCustodian] = useState<CustodioEnriquecido | null>(null);

  // Preparar datos del servicio para el hook
  const servicioNuevo: ServicioNuevo = {
    origen_texto: serviceData.origen || serviceData.cliente_nombre || 'No especificado',
    destino_texto: serviceData.destino || serviceData.destino_texto || 'No especificado',
    fecha_programada: serviceData.fecha_programada || serviceData.fecha_hora_cita || new Date().toISOString(),
    hora_ventana_inicio: serviceData.hora_ventana_inicio || '09:00',
    tipo_servicio: serviceData.tipo_servicio || 'custodia',
    incluye_armado: serviceData.incluye_armado || false,
    requiere_gadgets: serviceData.requiere_gadgets || false
  };

  const { custodios: custodiosDisponibles, loading } = useCustodiosWithTracking({
    servicioNuevo
  });

  // Inicializar estados de comunicación
  useEffect(() => {
    const initialComunicaciones: Record<string, ComunicacionState> = {};
    custodiosDisponibles.forEach(custodio => {
      if (custodio.id && !comunicaciones[custodio.id]) {
        initialComunicaciones[custodio.id] = {
          estado: 'pendiente'
        };
      }
    });
    setComunicaciones(prev => ({ ...prev, ...initialComunicaciones }));
  }, [custodiosDisponibles]);

  const handleOpenContactDialog = (custodian: CustodioEnriquecido) => {
    setContactingCustodian(custodian);
    setContactDialogOpen(true);
  };

  const handleContactResult = (custodianId: string, result: {
    status: 'acepta' | 'rechaza' | 'contactar_despues' | 'sin_respuesta';
    razon_rechazo?: string;
    categoria_rechazo?: string;
    detalles?: string;
    contactar_en?: string;
  }) => {
    const custodian = custodiosDisponibles.find(c => c.id === custodianId);
    
    // Actualizar estado de comunicación
    setComunicaciones(prev => ({
      ...prev,
      [custodianId]: {
        estado: result.status === 'acepta' ? 'aceptado' : 
               result.status === 'rechaza' ? 'rechazado' :
               result.status === 'contactar_despues' ? 'contactar_despues' :
               'sin_responder',
        metodo: 'dialog',
        timestamp: new Date(),
        razon_rechazo: result.razon_rechazo,
        categoria_rechazo: result.categoria_rechazo,
        detalles: result.detalles,
        contactar_en: result.contactar_en
      }
    }));

    // Manejar resultado
    if (result.status === 'acepta') {
      setSelectedCustodio(custodianId);
      toast.success(`¡${custodian?.nombre} ha aceptado el servicio!`);
    } else if (result.status === 'rechaza') {
      toast.error(`${custodian?.nombre} ha rechazado el servicio: ${result.razon_rechazo}`);
    } else if (result.status === 'contactar_despues') {
      toast.info(`${custodian?.nombre} pide contactar ${result.contactar_en}`);
    } else {
      toast.warning(`${custodian?.nombre} no respondió`);
    }
  };

  const handleComplete = () => {
    if (!selectedCustodio) return;

    const custodio = custodiosDisponibles.find(c => c.id === selectedCustodio);
    const comunicacion = comunicaciones[selectedCustodio];

    const assignmentData: AssignmentData = {
      ...serviceData,
      custodio_asignado_id: selectedCustodio,
      custodio_nombre: custodio?.nombre,
      estado_comunicacion: (comunicacion?.estado === 'pendiente' ? 'sin_responder' : comunicacion?.estado) as 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder' | 'contactar_despues'
    };

    onComplete(assignmentData);
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: 'outline' | 'secondary' | 'default' | 'destructive', text: string }> = {
      pendiente: { variant: 'outline' as const, text: 'Pendiente' },
      enviado: { variant: 'secondary' as const, text: 'Enviado' },
      aceptado: { variant: 'default' as const, text: 'Aceptado' },
      rechazado: { variant: 'destructive' as const, text: 'Rechazado' },
      sin_responder: { variant: 'outline' as const, text: 'Sin responder' },
      contactar_despues: { variant: 'secondary' as const, text: 'Contactar después' }
    };
    
    return variants[estado] || variants.pendiente;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              3. Asignación de Custodio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Buscando custodios disponibles...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            3. Asignación de Custodio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Service Summary */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Resumen del Servicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Ruta:</strong> {serviceData.origen || serviceData.cliente_nombre} → {serviceData.destino || serviceData.destino_texto}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Fecha:</strong> {serviceData.fecha_programada || serviceData.fecha_hora_cita || 'Por definir'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Tipo:</strong> {serviceData.tipo_servicio || 'Custodia'}
                </span>
              </div>
              {serviceData.incluye_armado && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-amber-600">Requiere armado</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{custodiosDisponibles.length}</div>
                <p className="text-sm text-muted-foreground">Custodios disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(comunicaciones).filter(c => c.estado === 'aceptado').length}
                </div>
                <p className="text-sm text-muted-foreground">Aceptaciones</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(comunicaciones).filter(c => c.estado === 'rechazado').length}
                </div>
                <p className="text-sm text-muted-foreground">Rechazos</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Custodians List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Custodios Recomendados</span>
            {custodiosDisponibles.length > 0 && (
              <Badge variant="secondary">
                {custodiosDisponibles.length} disponibles
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {custodiosDisponibles.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay custodios disponibles</h3>
              <p className="text-muted-foreground mb-4">
                No se encontraron custodios disponibles para este servicio en este momento.
              </p>
              <Button variant="outline" onClick={onBack}>
                Volver atrás
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {custodiosDisponibles.map((custodio) => {
                const comunicacion = comunicaciones[custodio.id!] || { estado: 'pendiente' };
                const badge = getEstadoBadge(comunicacion.estado);
                const isSelected = selectedCustodio === custodio.id;

                return (
                  <div
                    key={custodio.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Custodian Info - Compact Version */}
                      <div className="flex-1">
                        <CustodioPerformanceCard
                          custodio={custodio}
                          compact={true}
                          selected={isSelected}
                          onSelect={() => custodio.id && setSelectedCustodio(custodio.id)}
                        />
                      </div>

                      {/* Actions Column */}
                      <div className="flex flex-col items-end gap-2 min-w-[200px]">
                        {/* Status Badge */}
                        <Badge variant={badge.variant}>
                          {badge.text}
                        </Badge>

                        {/* Contact Buttons */}
                        {comunicacion.estado === 'pendiente' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenContactDialog(custodio)}
                              className="flex items-center gap-1.5"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenContactDialog(custodio)}
                              className="flex items-center gap-1.5"
                            >
                              <Phone className="h-4 w-4" />
                              Llamar
                            </Button>
                          </div>
                        )}

                        {/* Rejection Details */}
                        {comunicacion.estado === 'rechazado' && comunicacion.razon_rechazo && (
                          <div className="text-xs text-muted-foreground text-right max-w-[180px]">
                            <strong>Razón:</strong> {comunicacion.razon_rechazo}
                            {comunicacion.detalles && (
                              <div className="mt-1 italic">{comunicacion.detalles}</div>
                            )}
                          </div>
                        )}

                        {/* Contact Later Details */}
                        {comunicacion.estado === 'contactar_despues' && comunicacion.contactar_en && (
                          <div className="text-xs text-muted-foreground text-right max-w-[180px]">
                            <strong>Contactar:</strong> {comunicacion.contactar_en}
                            {comunicacion.detalles && (
                              <div className="mt-1 italic">{comunicacion.detalles}</div>
                            )}
                          </div>
                        )}

                        {/* Timestamp */}
                        {comunicacion.timestamp && (
                          <div className="text-xs text-muted-foreground">
                            {comunicacion.timestamp.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button 
          onClick={handleComplete} 
          disabled={!selectedCustodio}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirmar Asignación
        </Button>
      </div>

      {/* Diálogo de Contacto */}
      {contactingCustodian && (
        <CustodianContactDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          custodian={contactingCustodian}
          serviceDetails={{
            origen: serviceData.origen || serviceData.cliente_nombre || 'No especificado',
            destino: serviceData.destino || serviceData.destino_texto || 'No especificado',
            fecha_hora: serviceData.fecha_programada || serviceData.fecha_hora_cita ? 
              new Date(serviceData.fecha_programada || serviceData.fecha_hora_cita!).toLocaleString() : 'No especificada',
            tipo_servicio: serviceData.tipo_servicio || 'No especificado'
          }}
          onResult={(result) => handleContactResult(contactingCustodian.id!, result)}
        />
      )}
    </div>
  );
}