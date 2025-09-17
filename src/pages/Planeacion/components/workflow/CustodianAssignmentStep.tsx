import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle, 
  ArrowLeft, 
  User,
  Shield,
  Target,
  PhoneCall
} from 'lucide-react';
import { useCustodios } from '@/hooks/usePlaneacion';
import { toast } from 'sonner';

interface ServiceData {
  cliente_nombre: string;
  destino_texto: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  hora_ventana_fin: string;
  tipo_servicio: string;
  requiere_gadgets: boolean;
  precio_sugerido?: number;
  observaciones?: string;
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

  const { data: custodios = [] } = useCustodios();

  // Filtrar custodios disponibles y calcular scoring
  const custodiosDisponibles = custodios
    .filter(custodio => 
      custodio.disponibilidad === 'disponible' &&
      custodio.estado === 'activo' &&
      (!serviceData.requiere_gadgets || custodio.tiene_gadgets)
    )
    .map(custodio => {
      // Calcular score simple basado en criterios
      let score = 100;
      
      // Preferencia por experiencia (usar rating_promedio como proxy)
      if (custodio.rating_promedio && custodio.rating_promedio > 4) score += 20;
      
      // Preferencia por certificaciones
      if (custodio.certificaciones && custodio.certificaciones.length > 0) score += 15;
      
      // Penalización por distancia (simulada)
      const distanciaEstimada = Math.random() * 50; // Simular distancia
      if (distanciaEstimada < 10) score += 30;
      else if (distanciaEstimada < 25) score += 10;
      else score -= 10;

      return {
        ...custodio,
        score: Math.max(0, Math.min(100, score)),
        distancia_km: Math.round(distanciaEstimada)
      };
    })
    .sort((a, b) => b.score - a.score);

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
    if (!selectedCustodio) {
      toast.error('Selecciona un custodio para completar la asignación');
      return;
    }

    const custodio = custodiosDisponibles.find(c => c.id === selectedCustodio);
    const comunicacion = comunicaciones[selectedCustodio];

    const assignmentData: AssignmentData = {
      ...serviceData,
      custodio_asignado_id: selectedCustodio,
      custodio_nombre: custodio?.nombre,
      estado_comunicacion: comunicacion?.estado === 'pendiente' ? 'sin_responder' : comunicacion?.estado
    };

    onComplete(assignmentData);
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: 'outline' | 'secondary' | 'default' | 'destructive', text: string }> = {
      pendiente: { variant: 'outline' as const, text: 'Pendiente' },
      enviado: { variant: 'secondary' as const, text: 'Enviado' },
      aceptado: { variant: 'default' as const, text: 'Aceptado' },
      rechazado: { variant: 'destructive' as const, text: 'Rechazado' },
      sin_responder: { variant: 'outline' as const, text: 'Sin responder' }
    };
    
    return variants[estado] || variants.pendiente;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, color: 'text-green-600' };
    if (score >= 60) return { variant: 'secondary' as const, color: 'text-yellow-600' };
    return { variant: 'outline' as const, color: 'text-red-600' };
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
                <div className="text-xs text-muted-foreground">{serviceData.hora_ventana_inicio} - {serviceData.hora_ventana_fin}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tipo</div>
                <Badge variant="outline">{serviceData.tipo_servicio.replace('_', ' ')}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Gadgets</div>
                <Badge variant={serviceData.requiere_gadgets ? "default" : "secondary"}>
                  {serviceData.requiere_gadgets ? 'Requeridos' : 'No necesarios'}
                </Badge>
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
            <Badge variant="outline">Ordenados por scoring</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {custodiosDisponibles.map((custodio) => {
              const comunicacion = comunicaciones[custodio.id];
              const estadoBadge = getEstadoBadge(comunicacion?.estado || 'sin_responder');
              const scoreBadge = getScoreBadge(custodio.score);
              const isSelected = selectedCustodio === custodio.id;

              return (
                <Card 
                  key={custodio.id} 
                  className={`transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {custodio.nombre?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{custodio.nombre}</span>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              ~{custodio.distancia_km}km
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Rating: {custodio.rating_promedio}/5
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Score: <span className={scoreBadge.color}>{custodio.score}</span>
                            </div>
                          </div>
                          
                          {custodio.certificaciones && custodio.certificaciones.length > 0 && (
                            <div className="flex gap-1">
                              {custodio.certificaciones.slice(0, 2).map((cert, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Estado de comunicación */}
                        <Badge variant={estadoBadge.variant}>
                          {estadoBadge.text}
                        </Badge>

                        {/* Botones de comunicación */}
                        {comunicacion?.estado === 'aceptado' ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Confirmado
                          </Badge>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWhatsApp(custodio.id, custodio.nombre)}
                              disabled={comunicacion?.estado === 'enviado'}
                              className="gap-1"
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
                              className="gap-1"
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

          {custodiosDisponibles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay custodios disponibles para este servicio</p>
              <p className="text-sm">Revisa los filtros o contacta al coordinador</p>
            </div>
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