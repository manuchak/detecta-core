import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Target, 
  CheckCircle, 
  ArrowLeft,
  MessageSquare,
  PhoneCall,
  MapPin,
  Shield,
  Star,
  Clock,
  TrendingUp,
  Route
} from 'lucide-react';
import { toast } from 'sonner';
import { useCustodiosConProximidad, type CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { ServicioNuevo } from '@/utils/proximidadOperacional';

interface ServiceData {
  cliente_nombre: string;
  destino_texto: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  tipo_servicio: string;
  incluye_armado: boolean;
  requiere_gadgets: boolean;
  gadgets_seleccionados: string[];
  observaciones?: string;
  fecha_recepcion: string;
  hora_recepcion: string;
}

interface AssignmentData extends ServiceData {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  estado_comunicacion?: 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder';
}

interface CustodianAssignmentStepProps {
  serviceData: ServiceData;
  onComplete: (data: AssignmentData) => void;
  onBack: () => void;
}

export function CustodianAssignmentStep({ serviceData, onComplete, onBack }: CustodianAssignmentStepProps) {
  const [selectedCustodio, setSelectedCustodio] = useState<string | null>(null);
  const [comunicaciones, setComunicaciones] = useState<Record<string, {
    estado: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder';
    metodo?: 'whatsapp' | 'llamada';
    timestamp?: Date;
  }>>({});

  // Preparar datos del servicio para la lógica de proximidad
  const servicioParaProximidad: ServicioNuevo = {
    origen_texto: `${serviceData.cliente_nombre} → ${serviceData.destino_texto}`,
    destino_texto: serviceData.destino_texto,
    fecha_programada: serviceData.fecha_programada,
    hora_ventana_inicio: serviceData.hora_ventana_inicio,
    tipo_servicio: serviceData.tipo_servicio,
    incluye_armado: serviceData.incluye_armado,
    requiere_gadgets: serviceData.requiere_gadgets
  };

  const { data: custodios = [] } = useCustodiosConProximidad(servicioParaProximidad);

  // Filtrado menos restrictivo - mostrar todos los custodios disponibles
  const custodiosDisponibles = custodios
    .map(custodio => ({
      ...custodio,
      // Usar el score de proximidad operacional o score base
      score: custodio.scoring_proximidad?.score_total || 50,
      distancia_km: custodio.scoring_proximidad?.detalles?.distancia_estimada || Math.round(Math.random() * 50)
    }))
    .filter(custodio => {
      // Solo filtrar custodios claramente no disponibles
      if (custodio.estado === 'inactivo' && custodio.fuente !== 'historico') {
        return false;
      }
      return true; // Incluir todos los demás
    });

  const handleWhatsApp = (custodioId: string, nombre: string) => {
    // Simular envío de WhatsApp
    setComunicaciones(prev => ({
      ...prev,
      [custodioId]: {
        estado: 'enviado',
        metodo: 'whatsapp',
        timestamp: new Date()
      }
    }));

    toast.success(`Mensaje de WhatsApp enviado a ${nombre}`);

    // Simular respuesta después de unos segundos
    setTimeout(() => {
      const respuestas = ['aceptado', 'rechazado', 'sin_responder'];
      const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)] as any;
      
      setComunicaciones(prev => ({
        ...prev,
        [custodioId]: {
          ...prev[custodioId],
          estado: respuesta
        }
      }));

      if (respuesta === 'aceptado') {
        setSelectedCustodio(custodioId);
        toast.success(`¡${nombre} ha aceptado el servicio!`);
      } else if (respuesta === 'rechazado') {
        toast.error(`${nombre} ha rechazado el servicio`);
      } else {
        toast.warning(`${nombre} no ha respondido`);
      }
    }, 3000);
  };

  const handleLlamada = (custodioId: string, nombre: string) => {
    // Simular llamada
    setComunicaciones(prev => ({
      ...prev,
      [custodioId]: {
        estado: 'enviado',
        metodo: 'llamada',
        timestamp: new Date()
      }
    }));

    toast.success(`Llamando a ${nombre}...`);

    // Simular resultado de llamada
    setTimeout(() => {
      const respuestas = ['aceptado', 'rechazado', 'sin_responder'];
      const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)] as any;
      
      setComunicaciones(prev => ({
        ...prev,
        [custodioId]: {
          ...prev[custodioId],
          estado: respuesta
        }
      }));

      if (respuesta === 'aceptado') {
        setSelectedCustodio(custodioId);
        toast.success(`¡${nombre} ha aceptado el servicio por teléfono!`);
      } else if (respuesta === 'rechazado') {
        toast.error(`${nombre} ha rechazado el servicio`);
      } else {
        toast.warning(`${nombre} no contestó la llamada`);
      }
    }, 2000);
  };

  const handleComplete = () => {
    if (!selectedCustodio) return;

    const custodio = custodiosDisponibles.find(c => c.id === selectedCustodio);
    const comunicacion = comunicaciones[selectedCustodio];

    const assignmentData: AssignmentData = {
      ...serviceData,
      custodio_asignado_id: selectedCustodio,
      custodio_nombre: custodio?.nombre,
      estado_comunicacion: (comunicacion?.estado === 'pendiente' ? 'sin_responder' : comunicacion?.estado) as 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder'
    };

    onComplete(assignmentData);
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: 'outline' | 'secondary' | 'default' | 'destructive', text: string }> = {
      pendiente: { variant: 'outline' as const, text: 'Pendiente' },
      enviado: { variant: 'secondary' as const, text: 'Enviado' },
      aceptado: { variant: 'default' as const, text: 'Aceptado' },
      rechazado: { variant: 'outline' as const, text: 'Rechazado' },
      sin_responder: { variant: 'outline' as const, text: 'Sin responder' }
    };
    
    return variants[estado] || variants.pendiente;
  };

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Cliente → Destino</div>
                <div className="font-medium">{serviceData.cliente_nombre} → {serviceData.destino_texto}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fecha y Hora</div>
                <div className="font-medium">{serviceData.fecha_programada}</div>
                <div className="text-xs text-muted-foreground">a las {serviceData.hora_ventana_inicio}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tipo</div>
                <Badge variant="outline">{serviceData.tipo_servicio.replace('_', ' ')}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Gadgets Específicos</div>
                {serviceData.gadgets_seleccionados.length > 0 ? (
                  <div className="space-y-1">
                    {serviceData.gadgets_seleccionados.map((gadgetId) => {
                      const gadgetNames = {
                        candado_satelital: 'Candado Satelital',
                        gps_portatil: 'GPS Portátil',
                        gps_portatil_caja_imantada: 'GPS Portátil c/Caja Imantada'
                      };
                      return (
                        <Badge key={gadgetId} variant="default" className="text-xs mr-1">
                          {gadgetNames[gadgetId as keyof typeof gadgetNames] || gadgetId}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <Badge variant="secondary">No requeridos</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Custodians */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Custodios Disponibles ({custodiosDisponibles.length})
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Route className="h-3 w-3" />
                Proximidad Operacional
              </Badge>
              {custodiosDisponibles.some(c => c.fuente === 'candidatos_custodios') && (
                <Badge variant="secondary" className="gap-1">
                  <span className="text-xs">🆕</span>
                  Incluye custodios nuevos
                </Badge>
              )}
              {custodiosDisponibles.some(c => c.fuente === 'historico') && (
                <Badge variant="outline" className="gap-1 border-orange-300 text-orange-700">
                  <span className="text-xs">📊</span>
                  Incluye históricos
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {custodiosDisponibles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No hay custodios disponibles</p>
              <p className="text-sm">
                No se encontraron custodios que cumplan con los criterios del servicio.
                <br />
                Intenta ajustar los requisitos de gadgets o contacta al coordinador.
              </p>
            </div>
          ) : (
            <>
              {/* Información sobre scoring de proximidad */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Badge className="text-xs gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                      <TrendingUp className="h-3 w-3" />
                      Óptimo
                    </Badge>
                    <span className="text-muted-foreground">Proximidad temporal y geográfica óptima</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                      <Target className="h-3 w-3" />
                      Compatible
                    </Badge>
                    <span className="text-muted-foreground">Adecuado para el servicio</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      Disponible
                    </Badge>
                    <span className="text-muted-foreground">Puede ser asignado</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {custodiosDisponibles.map((custodio) => {
                  const comunicacion = comunicaciones[custodio.id];
                  const estadoBadge = getEstadoBadge(comunicacion?.estado || 'sin_responder');
                  const isSelected = selectedCustodio === custodio.id;

                  return (
                    <div
                      key={custodio.id} 
                      className={`group relative transition-all duration-200 rounded-xl border bg-card p-6 hover:shadow-sm ${
                        isSelected 
                          ? 'border-primary/40 bg-primary/[0.02] shadow-sm' 
                          : 'border-border/60 hover:border-border'
                      }`}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <CheckCircle className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="h-11 w-11 shrink-0">
                          <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                            {custodio.nombre?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          {/* Name and essential badges */}
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-foreground truncate">
                              {custodio.nombre}
                            </h3>
                            
                            {/* Only show priority badge if high priority */}
                            {custodio.prioridad_asignacion === 'alta' && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                                Óptimo
                              </Badge>
                            )}
                            
                            {/* New custodian indicator */}
                            {custodio.fuente === 'candidatos_custodios' && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                          
                          {/* Key metrics in a clean horizontal layout */}
                          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              <span>{custodio.distancia_km ? `${custodio.distancia_km}km` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="h-4 w-4 text-primary" />
                              <span>{custodio.score}%</span>
                            </div>
                            {custodio.rating_promedio && (
                              <div className="flex items-center gap-1.5">
                                <Shield className="h-4 w-4" />
                                <span>{custodio.rating_promedio}/5</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Communication status - only show if active */}
                          {comunicacion && comunicacion.estado !== 'sin_responder' && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`h-2 w-2 rounded-full ${
                                comunicacion.estado === 'aceptado' ? 'bg-primary' :
                                comunicacion.estado === 'enviado' ? 'bg-muted-foreground animate-pulse' :
                                'bg-muted-foreground/40'
                              }`} />
                              <span className="text-sm text-muted-foreground">
                                {estadoBadge.text}
                                {comunicacion.metodo && (
                                  <span className="ml-1">
                                    · {comunicacion.metodo === 'whatsapp' ? 'WhatsApp' : 'Llamada'}
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!comunicacion || comunicacion.estado === 'sin_responder' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleWhatsApp(custodio.id, custodio.nombre)}
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                              >
                                <MessageSquare className="h-4 w-4" />
                                WhatsApp
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLlamada(custodio.id, custodio.nombre)}
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                              >
                                <PhoneCall className="h-4 w-4" />
                                Llamar
                              </Button>
                            </>
                          ) : comunicacion.estado === 'aceptado' ? (
                            <Button
                              onClick={() => setSelectedCustodio(custodio.id)}
                              size="sm"
                              className="gap-1.5"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Seleccionar
                            </Button>
                          ) : comunicacion.estado === 'enviado' ? (
                            <div className="text-sm text-muted-foreground px-3 py-1.5">
                              Esperando...
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground px-3 py-1.5">
                              {estadoBadge.text}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Assignment Summary */}
      {selectedCustodio && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Asignación Confirmada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    Custodio: {custodiosDisponibles.find(c => c.id === selectedCustodio)?.nombre}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confirmado vía {comunicaciones[selectedCustodio]?.metodo}
                  </div>
                </div>
                <Badge variant="default">Listo para crear servicio</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Regresar
        </Button>
        
        <Button 
          onClick={handleComplete}
          disabled={!selectedCustodio}
          size="lg" 
          className="gap-2"
        >
          Completar Solicitud
          <CheckCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}