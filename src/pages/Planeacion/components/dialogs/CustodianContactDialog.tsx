import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { MessageCircle, Phone, User, MapPin, Target, Clock, CheckCircle, XCircle, ClockIcon, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useCustodioTracking } from '@/hooks/useCustodioTracking';
import { useCustodioIndisponibilidades, type CrearIndisponibilidadData } from '@/hooks/useCustodioIndisponibilidades';
import type { CustodioEnriquecido } from '@/hooks/useCustodiosWithTracking';

// Catálogo estructurado de razones de rechazo
interface RejectionCategory {
  label: string;
  reasons: string[];
  requiresUnavailability?: string[];
}

const REJECTION_CATEGORIES: Record<string, RejectionCategory> = {
  'disponibilidad_personal': {
    label: 'Disponibilidad Personal',
    reasons: [
      'Asuntos familiares',
      'Cita médica',
      'Compromiso familiar',
      'Custodio cansado',
      'Enfermo',
      'Familiar enfermo',
      'Temas personales',
      'Vacaciones'
    ],
    requiresUnavailability: ['Enfermo', 'Familiar enfermo', 'Vacaciones', 'Cita médica']
  },
  'problemas_vehiculo': {
    label: 'Problemas del Vehículo',
    reasons: [
      'Auto en taller',
      'Falla mecánica',
      'No circula',
      'Va a verificar su auto',
      'Vehículo en servicio'
    ],
    requiresUnavailability: ['Auto en taller', 'Falla mecánica', 'Vehículo en servicio']
  },
  'preferencias_servicio': {
    label: 'Preferencias del Servicio',
    reasons: [
      'Cancela servicio',
      'Dáselo a otro compañero',
      'Me espero a otro servicio mejor',
      'No quiere servicio con armado',
      'Quiere solo que salga de la CDMX',
      'Solo quiere servicio foráneo'
    ]
  },
  'limitaciones_geograficas': {
    label: 'Limitaciones Geográficas/Operativas',
    reasons: [
      'Distancia del servicio',
      'No se encuentra en la ciudad',
      'No va a Nuevo Laredo',
      'Cita en el SAT'
    ],
    requiresUnavailability: ['No se encuentra en la ciudad', 'Cita en el SAT']
  },
  'problemas_economicos': {
    label: 'Problemas Económicos/Documentales',
    reasons: [
      'Costo del servicio',
      'No tengo capital',
      'Documentación incompleta',
      'No tiene su documentación completa'
    ],
    requiresUnavailability: ['Documentación incompleta', 'No tiene su documentación completa']
  },
  'comunicacion_otros': {
    label: 'Comunicación/Otros',
    reasons: [
      'No disponible',
      'No responde el medio',
      'Otro'
    ]
  }
};

export interface CustodianContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodian: CustodioEnriquecido;
  serviceDetails: {
    origen: string;
    destino: string;
    fecha_hora: string;
    tipo_servicio: string;
  };
  onResult: (result: {
    status: 'acepta' | 'rechaza' | 'contactar_despues' | 'sin_respuesta';
    razon_rechazo?: string;
    categoria_rechazo?: string; 
    detalles?: string;
    contactar_en?: string;
  }) => void;
}

export const CustodianContactDialog: React.FC<CustodianContactDialogProps> = ({
  open,
  onOpenChange,
  custodian,
  serviceDetails,
  onResult
}) => {
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'llamada' | null>(null);
  const [resultStatus, setResultStatus] = useState<'acepta' | 'rechaza' | 'contactar_despues' | 'sin_respuesta' | null>(null);
  const [rejectionCategory, setRejectionCategory] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [contactLater, setContactLater] = useState<string>('');
  const [unavailabilityEndDate, setUnavailabilityEndDate] = useState<string>('');
  const [unavailabilityNotes, setUnavailabilityNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [communicationId, setCommunicationId] = useState<string>('');
  const [showUnavailabilityForm, setShowUnavailabilityForm] = useState(false);

  const { logCommunication, logResponse } = useCustodioTracking();
  const { crearIndisponibilidad } = useCustodioIndisponibilidades();

  const handleContactStart = async (method: 'whatsapp' | 'llamada') => {
    console.log('🚀 handleContactStart llamado:', { method, custodian: custodian.nombre });
    setContactMethod(method);
    setIsProcessing(true);

    try {
      console.log('📝 Registrando comunicación...');
      // Registrar inicio de comunicación
      const communicationData = await logCommunication({
        custodio_id: custodian.id!,
        custodio_nombre: custodian.nombre,
        custodio_telefono: custodian.telefono || '',
        tipo_comunicacion: method,
        contenido: `Oferta de servicio: ${serviceDetails.origen} → ${serviceDetails.destino}`,
        metadata: {
          servicio_detalle: serviceDetails,
          metodo_contacto: method
        }
      });

      // Guardar el ID de comunicación para usarlo en la respuesta
      if (communicationData?.id) {
        setCommunicationId(communicationData.id);
      }

      toast.success(`Iniciando contacto por ${method === 'whatsapp' ? 'WhatsApp' : 'llamada'}...`);
    } catch (error) {
      console.error('Error logging communication:', error);
      toast.error('Error al registrar comunicación');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!resultStatus || !contactMethod || !communicationId) return;

    // Validar si se requiere fecha de indisponibilidad
    if (showUnavailabilityForm && !unavailabilityEndDate) {
      toast.error('Por favor especifica hasta cuándo estará indisponible el custodio');
      return;
    }

    setIsProcessing(true);

    try {
      // Crear indisponibilidad si es necesario
      if (showUnavailabilityForm && unavailabilityEndDate) {
        // Mapear razón específica a tipo de indisponibilidad
        const getTipoIndisponibilidad = (razon: string): 'falla_mecanica' | 'enfermedad' | 'familiar' | 'personal' | 'mantenimiento' | 'capacitacion' | 'otro' => {
          const razonLower = razon.toLowerCase();
          
          // Problemas de salud
          if (razonLower.includes('enfermo') || razonLower.includes('médica')) return 'enfermedad';
          
          // Vacaciones y asuntos personales
          if (razonLower.includes('vacaciones')) return 'personal';
          if (razonLower.includes('asuntos familiares') || razonLower.includes('familiar enfermo')) return 'familiar';
          
          // Problemas vehiculares
          if (razonLower.includes('falla mecánica') || razonLower.includes('taller')) return 'falla_mecanica';
          if (razonLower.includes('vehículo en servicio') || razonLower.includes('verificar su auto')) return 'mantenimiento';
          
          // Problemas geográficos/operativos y documentales
          if (razonLower.includes('no se encuentra en la ciudad') || 
              razonLower.includes('cita en el sat') || 
              razonLower.includes('documentación incompleta') || 
              razonLower.includes('documentación completa')) return 'personal';
          
          // Default
          return 'otro';
        };
        
        const tipoIndisponibilidad = getTipoIndisponibilidad(rejectionReason);
        
        const indisponibilidadData: CrearIndisponibilidadData = {
          custodio_id: custodian.id!,
          tipo_indisponibilidad: tipoIndisponibilidad,
          motivo: rejectionReason,
          fecha_fin_estimada: unavailabilityEndDate,
          severidad: 'media',
          requiere_seguimiento: true,
          notas: unavailabilityNotes || `Indisponibilidad registrada por rechazo de servicio: ${rejectionReason}`
        };

        await crearIndisponibilidad.mutateAsync(indisponibilidadData);
      }

      // Mapear nuestros estados a los tipos esperados por la API
      const tipoRespuestaMap: Record<string, 'aceptacion' | 'rechazo' | 'consulta'> = {
        'acepta': 'aceptacion',
        'rechaza': 'rechazo',
        'contactar_despues': 'consulta',
        'sin_respuesta': 'rechazo' // Tratamos sin respuesta como rechazo
      };

      const responseData = {
        communication_id: communicationId,
        custodio_id: custodian.id!,
        tipo_respuesta: tipoRespuestaMap[resultStatus],
        respuesta_texto: details || undefined,
        razon_rechazo: resultStatus === 'rechaza' ? 
          `${REJECTION_CATEGORIES[rejectionCategory as keyof typeof REJECTION_CATEGORIES]?.label}: ${rejectionReason}` 
          : resultStatus === 'sin_respuesta' ? 'Sin respuesta del custodio' : undefined,
        metadata: {
          estado_original: resultStatus,
          categoria_rechazo: rejectionCategory,
          razon_especifica: rejectionReason,
          contactar_en: contactLater,
          metodo_contacto: contactMethod,
          servicio_detalle: serviceDetails,
          indisponibilidad_hasta: unavailabilityEndDate || undefined
        }
      };

      await logResponse(responseData);

      // Log detallado para debugging del auto-advance
      console.log('📞 Resultado del contacto registrado:', {
        custodianId: custodian.id,
        custodianName: custodian.nombre,
        resultStatus,
        serviceDetails,
        timestamp: new Date().toISOString()
      });

      onResult({
        status: resultStatus,
        categoria_rechazo: rejectionCategory,
        razon_rechazo: rejectionReason,
        detalles: details,
        contactar_en: contactLater
      });

      const successMessage = showUnavailabilityForm 
        ? 'Resultado registrado e indisponibilidad creada exitosamente'
        : 'Resultado registrado exitosamente';
      
      toast.success(successMessage);
      
      // Cerrar diálogo inmediatamente si acepta para no bloquear el auto-advance
      if (resultStatus === 'acepta') {
        console.log('✅ Custodio aceptó - cerrando diálogo inmediatamente');
        onOpenChange(false);
        resetForm();
      } else {
        onOpenChange(false);
        resetForm();
      }

    } catch (error) {
      console.error('Error logging response:', error);
      toast.error('Error al registrar respuesta');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setContactMethod(null);
    setResultStatus(null);
    setRejectionCategory('');
    setRejectionReason('');
    setDetails('');
    setContactLater('');
    setUnavailabilityEndDate('');
    setUnavailabilityNotes('');
    setShowUnavailabilityForm(false);
    setCommunicationId('');
  };

  // Detectar si se requiere formulario de indisponibilidad
  useEffect(() => {
    if (resultStatus === 'rechaza' && rejectionCategory && rejectionReason) {
      const categoryData = REJECTION_CATEGORIES[rejectionCategory as keyof typeof REJECTION_CATEGORIES];
      const requiresUnavailability = categoryData?.requiresUnavailability?.includes(rejectionReason);
      setShowUnavailabilityForm(requiresUnavailability || false);
      
      // Auto-clear unavailability data if not required
      if (!requiresUnavailability) {
        setUnavailabilityEndDate('');
        setUnavailabilityNotes('');
      }
    } else {
      setShowUnavailabilityForm(false);
      setUnavailabilityEndDate('');
      setUnavailabilityNotes('');
    }
  }, [resultStatus, rejectionCategory, rejectionReason]);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contactar Custodio
          </DialogTitle>
          <DialogDescription>
            Realiza el contacto con el custodio y registra el resultado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Custodio */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">{custodian.nombre}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{custodian.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{custodian.zona_base || 'Sin zona definida'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* Score General del Custodio */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div className="flex flex-col">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Score General</span>
                        <span className="text-sm text-muted-foreground">Historial completo</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        custodian.score_total >= 8 ? 'text-green-600' : 
                        custodian.score_total >= 6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(custodian.score_total || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Score Operacional del Servicio */}
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div className="flex flex-col">
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Compatibilidad</span>
                        <span className="text-sm text-muted-foreground">Para este servicio</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        (custodian.scoring_proximidad?.score_operacional || 0) >= 80 ? 'text-green-600' : 
                        (custodian.scoring_proximidad?.score_operacional || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {custodian.scoring_proximidad?.score_operacional || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">/ 100</div>
                    </div>
                  </div>
                  {custodian.scoring_proximidad?.detalles?.distancia_estimada && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Distancia: {custodian.scoring_proximidad.detalles.distancia_estimada.toFixed(1)}km</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {custodian.performance_level || 'Nuevo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Servicio */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Detalles del Servicio</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Origen:</span>
                  <p className="font-medium">{serviceDetails.origen}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Destino:</span>
                  <p className="font-medium">{serviceDetails.destino}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha/Hora:</span>
                  <p className="font-medium">{serviceDetails.fecha_hora}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <p className="font-medium">{serviceDetails.tipo_servicio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Contacto */}
          {!contactMethod && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  console.log('👆 Click en botón WhatsApp');
                  handleContactStart('whatsapp');
                }}
                disabled={isProcessing}
                className="flex items-center gap-2"
                variant="outline"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                onClick={() => {
                  console.log('👆 Click en botón Llamar');
                  handleContactStart('llamada');
                }}
                disabled={isProcessing}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Phone className="h-4 w-4" />
                Llamar
              </Button>
            </div>
          )}

          {/* Formulario de Resultado */}
          {contactMethod && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold">
                  Resultado del contacto por {contactMethod === 'whatsapp' ? 'WhatsApp' : 'llamada'}
                </h4>

                {/* Estado del resultado */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant={resultStatus === 'acepta' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setResultStatus('acepta')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Acepta
                  </Button>
                  <Button
                    variant={resultStatus === 'rechaza' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setResultStatus('rechaza')}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Rechaza
                  </Button>
                  <Button
                    variant={resultStatus === 'contactar_despues' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setResultStatus('contactar_despues')}
                    className="flex items-center gap-2"
                  >
                    <ClockIcon className="h-4 w-4" />
                    Contactar después
                  </Button>
                  <Button
                    variant={resultStatus === 'sin_respuesta' ? 'outline' : 'outline'}
                    size="sm"
                    onClick={() => setResultStatus('sin_respuesta')}
                  >
                    Sin respuesta
                  </Button>
                </div>

                {/* Formulario para rechazos */}
                {resultStatus === 'rechaza' && (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <Label htmlFor="rejection-category">Categoría del rechazo</Label>
                    <Select value={rejectionCategory} onValueChange={setRejectionCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(REJECTION_CATEGORIES).map(([key, category]) => (
                          <SelectItem key={key} value={key}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {rejectionCategory && (
                      <>
                        <Label htmlFor="rejection-reason">Razón específica</Label>
                         <Select value={rejectionReason} onValueChange={setRejectionReason}>
                           <SelectTrigger>
                             <SelectValue placeholder="Selecciona la razón" />
                           </SelectTrigger>
                           <SelectContent>
                             {REJECTION_CATEGORIES[rejectionCategory as keyof typeof REJECTION_CATEGORIES]?.reasons.map((reason) => (
                               <SelectItem key={reason} value={reason}>
                                 {reason}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </>
                     )}

                     {/* Formulario de indisponibilidad para problemas del vehículo */}
                     {showUnavailabilityForm && (
                       <div className="mt-4 p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                         <div className="flex items-center gap-2 mb-3">
                           <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                           <h5 className="font-medium text-orange-800 dark:text-orange-200">
                             Registrar Indisponibilidad
                           </h5>
                         </div>
                         <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                           Este tipo de rechazo requiere registrar hasta cuándo estará indisponible el custodio.
                         </p>
                         
                         <div className="space-y-3">
                            <DateTimePicker
                              label="¿Hasta cuándo estará indisponible?"
                              placeholder="Selecciona fecha y hora de disponibilidad"
                              value={unavailabilityEndDate}
                              onChange={setUnavailabilityEndDate}
                              required
                              minDate={new Date()}
                              className="mt-1"
                            />
                           
                           <div>
                             <Label htmlFor="unavailability-notes">Notas adicionales (opcional)</Label>
                             <Textarea
                               id="unavailability-notes"
                               placeholder="Detalles sobre la reparación, taller, tiempo estimado, etc."
                               value={unavailabilityNotes}
                               onChange={(e) => setUnavailabilityNotes(e.target.value)}
                               rows={2}
                               className="mt-1"
                             />
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 )}

                {/* Campo para contactar después */}  
                {resultStatus === 'contactar_despues' && (
                  <div className="space-y-2">
                    <Label htmlFor="contact-later">¿Cuándo contactar?</Label>
                    <Input
                      id="contact-later"
                      placeholder="Ej: En 2 horas, mañana por la mañana, etc."
                      value={contactLater}
                      onChange={(e) => setContactLater(e.target.value)}
                    />
                  </div>
                )}

                {/* Campo de detalles adicionales */}
                <div className="space-y-2">
                  <Label htmlFor="details">Detalles adicionales (opcional)</Label>
                  <Textarea
                    id="details"
                    placeholder="Notas adicionales sobre la comunicación..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-4">
                   <Button
                     onClick={handleSubmitResult}
                     disabled={
                       !resultStatus || 
                       isProcessing ||
                       (resultStatus === 'rechaza' && (!rejectionCategory || !rejectionReason)) ||
                       (resultStatus === 'contactar_despues' && !contactLater) ||
                       (showUnavailabilityForm && !unavailabilityEndDate)
                     }
                     className="flex-1"
                   >
                     {isProcessing ? 'Registrando...' : 
                      showUnavailabilityForm ? 'Confirmar y Registrar Indisponibilidad' : 'Confirmar Resultado'}
                   </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isProcessing}
                  >
                    Reiniciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};