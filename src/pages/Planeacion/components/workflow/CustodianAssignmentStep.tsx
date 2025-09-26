import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, MessageCircle, Phone, MapPin, Target, Clock, Car, AlertCircle, CheckCircle2, Shield, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { CustodioPerformanceCard } from '@/components/planeacion/CustodioPerformanceCard';
import { CustodianContactDialog } from '../dialogs/CustodianContactDialog';
import { useCustodiosConProximidad, type CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { ServicioNuevo } from '@/utils/proximidadOperacional';

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
  
  // Estado para el diálogo de contacto
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactingCustodian, setContactingCustodian] = useState<CustodioConProximidad | null>(null);

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

  // Usar el hook mejorado con validación preventiva
  const { data: custodiosCategorizados, isLoading: loading } = useCustodiosConProximidad(servicioNuevo);

  // PRIORIZAR custodios por disponibilidad real (CORRECCIÓN APLICADA)
  // 1. Disponibles (sin conflictos) PRIMERO
  // 2. Parcialmente ocupados SEGUNDO  
  // 3. Filtrar completamente ocupados/con conflictos
  const custodiosDisponibles = useMemo(() => {
    if (!custodiosCategorizados) return [];
    
    // PRIORIZAR: Disponibles primero, luego parcialmente ocupados
    // FILTRAR: Ocupados y no disponibles (como Israel Mayo con conflictos)
    const priorizados = [
      // 🟢 PRIORIDAD ALTA: Custodios ideales (sin servicios)
      ...custodiosCategorizados.disponibles.sort((a, b) => (b.score_total || 0) - (a.score_total || 0)),
      
      // 🟡 PRIORIDAD MEDIA: Parcialmente ocupados (1 servicio)
      ...custodiosCategorizados.parcialmenteOcupados.sort((a, b) => (b.score_total || 0) - (a.score_total || 0))
    ];
    
    // NO INCLUIR ocupados ni no disponibles - esto resuelve el problema de Israel Mayo
    console.log('🎯 Custodios priorizados:', {
      disponibles: custodiosCategorizados.disponibles.length,
      parcialmenteOcupados: custodiosCategorizados.parcialmenteOcupados.length,
      ocupados_filtrados: custodiosCategorizados.ocupados.length,
      noDisponibles_filtrados: custodiosCategorizados.noDisponibles.length,
      total_mostrados: priorizados.length
    });
    
    return priorizados;
  }, [custodiosCategorizados]);

  // Inicializar estados de comunicación SOLO para custodios disponibles
  useEffect(() => {
    if (!custodiosDisponibles.length) return;
    
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

  const handleOpenContactDialog = (custodian: CustodioConProximidad) => {
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
      
      // Auto-advance: proceder inmediatamente al siguiente paso
      console.log('🚀 Custodio aceptó, avanzando automáticamente al siguiente paso:', {
        custodianId,
        custodianName: custodian?.nombre,
        serviceId: serviceData.servicio_id
      });
      
      const assignmentData: AssignmentData = {
        ...serviceData,
        custodio_asignado_id: custodianId,
        custodio_nombre: custodian?.nombre,
        estado_comunicacion: 'aceptado'
      };
      
      // Llamar onComplete inmediatamente
      onComplete(assignmentData);
      
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

    // YA NO HAY CONFLICTOS - todos los custodios mostrados están disponibles

    const assignmentData: AssignmentData = {
      ...serviceData,
      custodio_asignado_id: selectedCustodio,
      custodio_nombre: custodio?.nombre,
      estado_comunicacion: (comunicacion?.estado === 'pendiente' ? 'sin_responder' : comunicacion?.estado) as 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder' | 'contactar_despues'
    };

    onComplete(assignmentData);
  };

  const getAvailabilityCategory = (custodio: CustodioConProximidad) => {
    if (!custodiosCategorizados) return 'disponible';
    
    if (custodiosCategorizados.disponibles.includes(custodio)) return 'disponible';
    if (custodiosCategorizados.parcialmenteOcupados.includes(custodio)) return 'parcialmente_ocupado';
    if (custodiosCategorizados.ocupados.includes(custodio)) return 'ocupado';
    
    return 'no_disponible';
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{custodiosDisponibles.length}</div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {custodiosCategorizados?.disponibles.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">🟢 Ideales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {custodiosCategorizados?.parcialmenteOcupados.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">🟡 Ocupados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  {(custodiosCategorizados?.ocupados.length || 0) + (custodiosCategorizados?.noDisponibles.length || 0)}
                </div>
                <p className="text-sm text-muted-foreground">🔴 Filtrados (con conflictos)</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Custodians List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Custodios Priorizados (Disponibles Sin Conflictos)</span>
            {custodiosDisponibles.length > 0 && (
              <Badge variant="secondary">
                {custodiosDisponibles.length} priorizados
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {custodiosDisponibles.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay custodios disponibles sin conflictos</h3>
              <p className="text-muted-foreground mb-4">
                Todos los custodios tienen conflictos horarios, están ocupados o fuera de límites operacionales.
                {custodiosCategorizados && (
                  <span className="block mt-2 text-sm">
                    Ocupados: {custodiosCategorizados.ocupados.length} • 
                    Con conflictos: {custodiosCategorizados.noDisponibles.length}
                  </span>
                )}
              </p>
              <Button variant="outline" onClick={onBack}>
                Volver atrás y ajustar horario
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {custodiosDisponibles.map((custodio) => {
                const comunicacion = comunicaciones[custodio.id!] || { estado: 'pendiente' };
                const badge = getEstadoBadge(comunicacion.estado);
                const isSelected = selectedCustodio === custodio.id;
                const availabilityCategory = getAvailabilityCategory(custodio);

                return (
                  <div
                    key={custodio.id}
                    className="border rounded-lg p-4 transition-all hover:shadow-md border-border hover:border-primary/50"
                  >
                    <CustodioPerformanceCard 
                      custodio={custodio}
                      compact={true}
                      selected={isSelected}
                      onSelect={() => setSelectedCustodio(custodio.id!)}
                      availabilityStatus={availabilityCategory}
                      disabled={false} // Todos están disponibles
                    />

                    {/* Status badges */}
                    <div className="flex items-center justify-between mt-3">
                      <Badge {...badge}>
                        {badge.text}
                      </Badge>
                      
                      <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Sin conflictos
                      </Badge>
                    </div>

                    {/* Contact Buttons */}
                    {comunicacion.estado === 'pendiente' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenContactDialog(custodio)}
                          className="flex items-center gap-1.5 flex-1"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenContactDialog(custodio)}
                          className="flex items-center gap-1.5 flex-1"
                        >
                          <Phone className="h-4 w-4" />
                          Llamar
                        </Button>
                      </div>
                    )}

                    {/* Rejection Details */}
                    {comunicacion.estado === 'rechazado' && comunicacion.razon_rechazo && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="text-xs text-red-800">
                          <strong>Razón:</strong> {comunicacion.razon_rechazo}
                        </div>
                      </div>
                    )}

                    {/* Contact After Details */}
                    {comunicacion.estado === 'contactar_despues' && comunicacion.contactar_en && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-xs text-yellow-800">
                          <strong>Contactar:</strong> {comunicacion.contactar_en}
                        </div>
                      </div>
                    )}

                    {/* Información de equidad si existe */}
                    {custodio.datos_equidad && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-xs text-blue-800">
                          Servicios hoy: {custodio.datos_equidad.servicios_hoy} • 
                          Score equidad: {custodio.datos_equidad.score_equidad}/100 •
                          Balance: {custodio.datos_equidad.balance_recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack}>
              Volver
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {selectedCustodio ? 'Custodio seleccionado' : 'Selecciona un custodio'}
            </div>
            
            <Button
              onClick={handleComplete}
              disabled={!selectedCustodio}
              className="min-w-[120px]"
            >
              {selectedCustodio ? 'Continuar' : 'Selecciona custodio'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      {contactingCustodian && (
        <CustodianContactDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          custodian={contactingCustodian}
          serviceDetails={{
            origen: serviceData.origen || '',
            destino: serviceData.destino || '',
            fecha_hora: serviceData.fecha_hora_cita || '',
            tipo_servicio: serviceData.tipo_servicio || ''
          }}
          onResult={(result) => handleContactResult(contactingCustodian.id!, result)}
        />
      )}
    </div>
  );
}