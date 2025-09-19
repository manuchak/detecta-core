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
      rechazado: { variant: 'outline' as const, text: 'Rechazado' }, // Cambiar de destructive a outline
      sin_responder: { variant: 'outline' as const, text: 'Sin responder' }
    };
    
    return variants[estado] || variants.pendiente;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, color: 'text-emerald-600' };
    if (score >= 60) return { variant: 'secondary' as const, color: 'text-blue-600' };
    return { variant: 'outline' as const, color: 'text-muted-foreground' };
  };

  const getPrioridadBadge = (prioridad: 'alta' | 'media' | 'baja' | undefined) => {
    switch (prioridad) {
      case 'alta':
        return { variant: 'default' as const, text: 'Óptimo', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'media':
        return { variant: 'secondary' as const, text: 'Compatible', icon: Target, color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'baja':
        return { variant: 'outline' as const, text: 'Disponible', icon: Clock, color: 'bg-gray-50 text-gray-600 border-gray-200' };
      default:
        return { variant: 'outline' as const, text: 'Evaluando', icon: Target, color: 'bg-gray-50 text-gray-600 border-gray-200' };
    }
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
                  const scoreBadge = getScoreBadge(custodio.score);
                  const prioridadBadge = getPrioridadBadge(custodio.prioridad_asignacion);
                  const isSelected = selectedCustodio === custodio.id;

                  return (
                    <Card 
                      key={custodio.id} 
                      className={`transition-all duration-200 hover:shadow-md ${
                        isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'hover:border-border'
                      } ${custodio.fuente === 'historico' ? 'border-dashed bg-muted/30' : ''}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {custodio.nombre?.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="space-y-3 flex-1">
                              {/* Header con nombre y badges */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-base">{custodio.nombre}</h3>
                                
                                {custodio.fuente === 'candidatos_custodios' && (
                                  <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    NUEVO
                                  </Badge>
                                )}
                                
                                {custodio.fuente === 'historico' && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                    HISTÓRICO
                                  </Badge>
                                )}
                                
                                {/* Badge de prioridad más prominente */}
                                <Badge className={`text-xs gap-1 ${prioridadBadge.color}`}>
                                  <prioridadBadge.icon className="h-3 w-3" />
                                  {prioridadBadge.text}
                                </Badge>
                                
                                {isSelected && (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              
                              {/* Métricas principales */}
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Distancia:</span>
                                  <span className="font-medium">{custodio.distancia_km ? `${custodio.distancia_km}km` : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Shield className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Rating:</span>
                                  <span className="font-medium">{custodio.rating_promedio || 'N/A'}/5</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Score:</span>
                                  <span className={`font-semibold ${scoreBadge.color}`}>{custodio.score}</span>
                                </div>
                              </div>
                              
                              {/* Razones de recomendación */}
                              {custodio.razones_recomendacion && custodio.razones_recomendacion.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {custodio.razones_recomendacion.slice(0, 3).map((razon, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      {razon}
                                    </Badge>
                                  ))}
                                  {custodio.razones_recomendacion.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{custodio.razones_recomendacion.length - 3} más
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {/* Advertencia para históricos */}
                              {custodio.fuente === 'historico' && (
                                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                  ⚠️ Requiere validación de disponibilidad
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {/* Estado de comunicación */}
                            <Badge variant={estadoBadge.variant} className="shrink-0">
                              {estadoBadge.text}
                            </Badge>

                            {/* Botones de comunicación */}
                            {comunicacion?.estado === 'aceptado' ? (
                              <Badge className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                                <CheckCircle className="h-3 w-3" />
                                Confirmado
                              </Badge>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleWhatsApp(custodio.id, custodio.nombre)}
                                  disabled={comunicacion?.estado === 'enviado'}
                                  className="gap-1 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  {comunicacion?.metodo === 'whatsapp' && comunicacion.estado === 'enviado' 
                                    ? 'Enviado...' 
                                    : 'WhatsApp'
                                  }
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleLlamada(custodio.id, custodio.nombre)}
                                  disabled={comunicacion?.estado === 'enviado'}
                                  className="gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                >
                                  <PhoneCall className="h-3 w-3" />
                                  {comunicacion?.metodo === 'llamada' && comunicacion.estado === 'enviado'
                                    ? 'Llamando...'
                                    : 'Llamar'
                                  }
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {comunicacion?.timestamp && (
                          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Último contacto: {comunicacion.timestamp.toLocaleTimeString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
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