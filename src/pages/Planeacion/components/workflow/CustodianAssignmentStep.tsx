import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, MessageCircle, Phone, MapPin, Target, Clock, Car, AlertCircle, CheckCircle2, Shield, Settings, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { CustodioPerformanceCard } from '@/components/planeacion/CustodioPerformanceCard';
import { CustodianContactDialog } from '../dialogs/CustodianContactDialog';
import { useCustodiosWithTracking, type CustodioEnriquecido } from '@/hooks/useCustodiosWithTracking';
import { useServiciosPlanificados, type ConflictInfo } from '@/hooks/useServiciosPlanificados';
import type { ServicioNuevo } from '@/utils/proximidadOperacional';
import { safeUuidForDatabase } from '@/utils/uuidHelpers';

interface ServiceData {
  servicio_id?: string;
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
  const [custodianConflicts, setCustodianConflicts] = useState<Record<string, ConflictInfo[]>>({});
  
  // Estado para el diálogo de contacto
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactingCustodian, setContactingCustodian] = useState<CustodioEnriquecido | null>(null);

  const { checkCustodianConflicts } = useServiciosPlanificados();

  // Preparar datos del servicio para el hook
  const servicioNuevo: ServicioNuevo = useMemo(() => ({
    origen_texto: serviceData.origen || serviceData.cliente_nombre || 'No especificado',
    destino_texto: serviceData.destino || serviceData.destino_texto || 'No especificado',
    fecha_programada: serviceData.fecha_programada || serviceData.fecha_hora_cita || new Date().toISOString(),
    hora_ventana_inicio: serviceData.hora_ventana_inicio || '09:00',
    tipo_servicio: serviceData.tipo_servicio || 'custodia',
    incluye_armado: serviceData.incluye_armado || false,
    requiere_gadgets: serviceData.requiere_gadgets || false
  }), [
    serviceData.origen,
    serviceData.cliente_nombre,
    serviceData.destino,
    serviceData.destino_texto,
    serviceData.fecha_programada,
    serviceData.fecha_hora_cita,
    serviceData.hora_ventana_inicio,
    serviceData.tipo_servicio,
    serviceData.incluye_armado,
    serviceData.requiere_gadgets
  ]);

  const { custodios: custodiosDisponibles, loading } = useCustodiosWithTracking({
    servicioNuevo
  });

  // Inicializar estados de comunicación y verificar conflictos
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

    // Check conflicts for all custodians
    checkConflictsForCustodians();
  }, [custodiosDisponibles]);

  const checkConflictsForCustodians = async () => {
    if (!serviceData.fecha_hora_cita && !serviceData.fecha_programada) return;

    const targetDate = serviceData.fecha_hora_cita || serviceData.fecha_programada;
    const conflictsMap: Record<string, ConflictInfo[]> = {};

    for (const custodio of custodiosDisponibles) {
      if (custodio.id) {
        try {
          // Only pass servicio_id if it's a valid UUID format
          const excludeServiceId = safeUuidForDatabase(serviceData.servicio_id);
          
          const result = await checkCustodianConflicts(
            custodio.id,
            targetDate!,
            excludeServiceId
          );
          
          if (result.hasConflicts) {
            conflictsMap[custodio.id] = result.conflicts;
            console.debug(`Custodian ${custodio.nombre} has ${result.conflicts.length} conflicts:`, result.conflicts);
          }
        } catch (error) {
          console.warn(`Error checking conflicts for custodian ${custodio.nombre}:`, error);
        }
      }
    }

    setCustodianConflicts(conflictsMap);
  };

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
      
      // Auto-advance: proceder automáticamente al siguiente paso
      setTimeout(() => {
        const assignmentData: AssignmentData = {
          ...serviceData,
          custodio_asignado_id: custodianId,
          custodio_nombre: custodian?.nombre,
          estado_comunicacion: 'aceptado'
        };
        onComplete(assignmentData);
      }, 1500); // Breve delay para mostrar el mensaje de éxito
      
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
    const conflicts = custodianConflicts[selectedCustodio] || [];

    // Check for conflicts before proceeding
    if (conflicts.length > 0) {
      toast.error('No se puede asignar custodio con conflictos de horario', {
        description: `Este custodio tiene ${conflicts.length} servicio(s) conflictivo(s). Resuelve los conflictos primero.`
      });
      return;
    }

    const assignmentData: AssignmentData = {
      ...serviceData,
      custodio_asignado_id: selectedCustodio,
      custodio_nombre: custodio?.nombre,
      estado_comunicacion: (comunicacion?.estado === 'pendiente' ? 'sin_responder' : comunicacion?.estado) as 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder' | 'contactar_despues'
    };

    onComplete(assignmentData);
  };

  const getConflictBadge = (conflicts: ConflictInfo[]) => {
    if (conflicts.length === 0) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Sin conflictos
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {conflicts.length} conflicto{conflicts.length > 1 ? 's' : ''}
      </Badge>
    );
  };

  const ConflictsList = ({ conflicts }: { conflicts: ConflictInfo[] }) => {
    if (conflicts.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">Servicios en conflicto:</span>
        </div>
        <div className="space-y-2 max-h-20 overflow-y-auto">
          {conflicts.map((conflict, index) => (
            <div key={index} className="text-xs text-red-700 bg-white p-2 rounded border">
              <div className="font-medium">{conflict.id_servicio}</div>
              <div className="text-red-600">
                {conflict.cliente} • {new Date(conflict.fecha_hora_cita).toLocaleString('es-MX')}
              </div>
              <div className="text-red-500">{conflict.origen} → {conflict.destino}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: 'outline' | 'secondary' | 'success' | 'destructive', text: string }> = {
      pendiente: { variant: 'outline' as const, text: 'Pendiente' },
      enviado: { variant: 'secondary' as const, text: 'Enviado' },
      aceptado: { variant: 'success' as const, text: 'Aceptado' },
      rechazado: { variant: 'destructive' as const, text: 'Rechazado' },
      sin_responder: { variant: 'outline' as const, text: 'Sin responder' },
      contactar_despues: { variant: 'secondary' as const, text: 'Contactar después' }
    };
    
    return variants[estado] || variants.pendiente;
  };

  const getBorderColor = (estado: string, isSelected: boolean) => {
    const baseClasses = "border rounded-lg p-4 transition-all";
    
    switch (estado) {
      case 'aceptado':
        return `${baseClasses} border-green-500 bg-green-50 ${isSelected ? 'ring-2 ring-green-200' : 'hover:border-green-600'}`;
      case 'rechazado':
        return `${baseClasses} border-red-500 bg-red-50 ${isSelected ? 'ring-2 ring-red-200' : 'hover:border-red-600'}`;
      case 'contactar_despues':
        return `${baseClasses} border-yellow-500 bg-yellow-50 ${isSelected ? 'ring-2 ring-yellow-200' : 'hover:border-yellow-600'}`;
      case 'sin_responder':
        return `${baseClasses} border-gray-400 bg-gray-50 ${isSelected ? 'ring-2 ring-gray-200' : 'hover:border-gray-500'}`;
      default: // pendiente
        return `${baseClasses} ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`;
    }
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
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>ID:</strong> {serviceData.servicio_id || 'No especificado'}
                </span>
              </div>
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
                const conflicts = custodianConflicts[custodio.id!] || [];
                const isSelected = selectedCustodio === custodio.id;
                const hasConflicts = conflicts.length > 0;

                return (
                  <div
                    key={custodio.id}
                    className={`${getBorderColor(comunicacion.estado, isSelected)} ${hasConflicts ? 'border-red-300 bg-red-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Custodian Info - Compact Version */}
                      <div className="flex-1">
                        <CustodioPerformanceCard
                          custodio={custodio}
                          compact={true}
                          selected={isSelected && !hasConflicts}
                          onSelect={() => {
                            if (custodio.id && !hasConflicts) {
                              setSelectedCustodio(custodio.id);
                            } else if (hasConflicts) {
                              toast.warning('No se puede seleccionar custodio con conflictos de horario');
                            }
                          }}
                        />
                        
                        {/* Conflict display */}
                        <ConflictsList conflicts={conflicts} />
                      </div>

                      {/* Actions Column */}
                      <div className="flex flex-col items-end gap-2 min-w-[200px]">
                        {/* Conflict Badge */}
                        {getConflictBadge(conflicts)}
                        
                        {/* Status Badge */}
                        <Badge variant={badge.variant}>
                          {badge.text}
                        </Badge>

                        {/* Contact Buttons */}
                        {comunicacion.estado === 'pendiente' && !hasConflicts && (
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

                        {/* Conflict Warning for Contact Buttons */}
                        {comunicacion.estado === 'pendiente' && hasConflicts && (
                          <div className="text-xs text-red-600 text-center max-w-[180px]">
                            <X className="h-4 w-4 mx-auto mb-1" />
                            No disponible por conflictos
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
          disabled={!selectedCustodio || (selectedCustodio && custodianConflicts[selectedCustodio]?.length > 0)}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirmar Asignación
        </Button>
      </div>

      {/* Help text for conflicts */}
      {selectedCustodio && custodianConflicts[selectedCustodio]?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">No se puede confirmar la asignación</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            El custodio seleccionado tiene conflictos de horario. Resuelve los conflictos o selecciona otro custodio.
          </p>
        </div>
      )}

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