import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Shield, Settings, CheckCircle, ArrowLeft, Cpu } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface RouteData {
  cliente_nombre: string;
  destino_texto: string;
  precio_sugerido?: number;
  precio_custodio?: number;
  costo_operativo?: number;
  margen_estimado?: number;
  distancia_km?: number;
}

interface ServiceData extends RouteData {
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

interface ServiceAutoFillStepProps {
  routeData: RouteData;
  onComplete: (data: ServiceData) => void;
  onBack: () => void;
}

export function ServiceAutoFillStep({ routeData, onComplete, onBack }: ServiceAutoFillStepProps) {
  const [fechaProgramada, setFechaProgramada] = useState(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [tipoServicio, setTipoServicio] = useState('custodia_sin_arma');
  const [incluyeArmado, setIncluyeArmado] = useState(false);
  const [gadgetsSeleccionados, setGadgetsSeleccionados] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState('');
  
  // Campos de recepción de solicitud (auto-llenados con fecha/hora actual)
  const [fechaRecepcion, setFechaRecepcion] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [horaRecepcion, setHoraRecepcion] = useState(
    format(new Date(), 'HH:mm')
  );

  // Auto-fill basado en la ruta y precio
  useEffect(() => {
    // Detectar si incluye armado basado en precio diferenciado
    const hasArmedService = routeData.precio_custodio && routeData.precio_custodio > 0;
    
    if (hasArmedService) {
      setIncluyeArmado(true);
      setTipoServicio('custodia_armada');
    } else {
      setIncluyeArmado(false);
      setTipoServicio('custodia_sin_arma');
    }

    // Determinar servicio reforzado basado en distancia y precio
    if (routeData.distancia_km && routeData.distancia_km > 200 && routeData.precio_sugerido && routeData.precio_sugerido > 20000) {
      setTipoServicio('custodia_armada_reforzada');
      setIncluyeArmado(true);
    }

    // Ajustar hora de inicio basado en distancia
    if (routeData.distancia_km && routeData.distancia_km > 100) {
      setHoraInicio('07:00');
    }
  }, [routeData]);

  const handleContinue = () => {
    const serviceData: ServiceData = {
      ...routeData,
      fecha_programada: fechaProgramada,
      hora_ventana_inicio: horaInicio,
      tipo_servicio: tipoServicio,
      incluye_armado: incluyeArmado,
      requiere_gadgets: gadgetsSeleccionados.length > 0,
      gadgets_seleccionados: gadgetsSeleccionados,
      observaciones: observaciones.trim() || undefined,
      fecha_recepcion: fechaRecepcion,
      hora_recepcion: horaRecepcion
    };

    onComplete(serviceData);
  };

  const gadgetOptions = [
    { id: 'candado_satelital', label: 'Candado Satelital', description: 'Dispositivo de bloqueo con rastreo GPS' },
    { id: 'gps_portatil', label: 'GPS Portátil', description: 'Dispositivo de rastreo portátil' },
    { id: 'gps_portatil_caja_imantada', label: 'GPS Portátil con Caja Imantada', description: 'GPS portátil con instalación magnética' }
  ];

  const handleGadgetToggle = (gadgetId: string, checked: boolean) => {
    if (checked) {
      setGadgetsSeleccionados(prev => [...prev, gadgetId]);
    } else {
      setGadgetsSeleccionados(prev => prev.filter(id => id !== gadgetId));
    }
  };

  const tiposServicio = [
    { value: 'custodia_sin_arma', label: 'Custodia Sin Arma', description: 'Custodio civil sin portación' },
    { value: 'custodia_armada', label: 'Custodia Armada', description: 'Custodio armado certificado' },
    { value: 'custodia_armada_reforzada', label: 'Custodia Reforzada', description: 'Dos custodios armados' }
  ];

  const getAutoFillBadge = (field: string) => {
    const badges: Record<string, { text: string; reason: string }> = {
      tipo_servicio: {
        text: 'Auto-detectado',
        reason: `Basado en distancia: ${routeData.distancia_km}km`
      },
      gadgets: {
        text: 'Recomendado',
        reason: `Servicio premium: $${routeData.precio_sugerido?.toLocaleString()}`
      },
      horario: {
        text: 'Optimizado',
        reason: 'Horario sugerido para este tipo de servicio'
      }
    };

    if (badges[field]) {
      return (
        <Badge variant="outline" className="ml-2" title={badges[field].reason}>
          {badges[field].text}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            2. Configuración del Servicio (Auto-Fill)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Route Summary */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Cliente</div>
                <div className="font-medium">{routeData.cliente_nombre}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Destino</div>
                <div className="font-medium">{routeData.destino_texto}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Precio Base</div>
                <div className="font-medium">${routeData.precio_sugerido?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Service Configuration */}
          <div className="space-y-6">
            {/* Reception Date and Time */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Recepción de Solicitud
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="fecha-recepcion">Fecha de Recepción *</Label>
                  <Input
                    id="fecha-recepcion"
                    type="date"
                    value={fechaRecepcion}
                    onChange={(e) => setFechaRecepcion(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hora-recepcion">Hora de Recepción *</Label>
                  <Input
                    id="hora-recepcion"
                    type="time"
                    value={horaRecepcion}
                    onChange={(e) => setHoraRecepcion(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Scheduled Date and Time */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Programación de Cita
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha Programada *
                  </Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={fechaProgramada}
                    onChange={(e) => setFechaProgramada(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hora-inicio" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora de Cita *
                    {getAutoFillBadge('horario')}
                  </Label>
                  <Input
                    id="hora-inicio"
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Tipo de Custodia *
                {getAutoFillBadge('tipo_servicio')}
              </Label>
              <Select value={tipoServicio} onValueChange={setTipoServicio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposServicio.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div>
                        <div className="font-medium">{tipo.label}</div>
                        <div className="text-xs text-muted-foreground">{tipo.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Armed Service Switch */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Incluye Custodio Armado
                  {incluyeArmado && getAutoFillBadge('tipo_servicio')}
                </Label>
                <div className="text-sm text-muted-foreground">
                  Custodio certificado con portación de arma
                </div>
              </div>
              <Switch
                checked={incluyeArmado}
                onCheckedChange={(checked) => {
                  setIncluyeArmado(checked);
                  if (checked) {
                    setTipoServicio(tipoServicio === 'custodia_armada_reforzada' ? 'custodia_armada_reforzada' : 'custodia_armada');
                  } else {
                    setTipoServicio('custodia_sin_arma');
                  }
                }}
              />
            </div>

            {/* Gadgets Selection */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Gadgets de Seguridad
                </Label>
                <div className="text-sm text-muted-foreground">
                  Selecciona los dispositivos de seguridad requeridos para este servicio
                </div>
              </div>
              
              <div className="space-y-3">
                {gadgetOptions.map((gadget) => (
                  <div key={gadget.id} className="flex items-start space-x-3 p-3 rounded-lg bg-background/50 border">
                    <Checkbox
                      id={gadget.id}
                      checked={gadgetsSeleccionados.includes(gadget.id)}
                      onCheckedChange={(checked) => handleGadgetToggle(gadget.id, checked as boolean)}
                    />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor={gadget.id} className="text-sm font-medium cursor-pointer">
                        {gadget.label}
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        {gadget.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {gadgetsSeleccionados.length > 0 && (
                <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded border-l-2 border-primary">
                  <strong>{gadgetsSeleccionados.length}</strong> dispositivo(s) seleccionado(s)
                </div>
              )}
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Notas adicionales, instrucciones especiales, etc."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Summary */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Resumen del Servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Solicitud Recibida</div>
                <div className="font-medium">
                  {format(new Date(fechaRecepcion), 'EEEE, dd MMMM yyyy', { locale: es })}
                </div>
                <div className="text-sm text-muted-foreground">
                  a las {horaRecepcion}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Programado para</div>
                <div className="font-medium">
                  {format(new Date(fechaProgramada), 'EEEE, dd MMMM yyyy', { locale: es })}
                </div>
                <div className="text-sm text-muted-foreground">
                  a las {horaInicio}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Tipo de Custodia</div>
                <Badge variant="outline">
                  {tiposServicio.find(t => t.value === tipoServicio)?.label}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Incluye Armado</div>
                <Badge variant={incluyeArmado ? "default" : "secondary"}>
                  {incluyeArmado ? 'Sí' : 'No'}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Gadgets Seleccionados</div>
                {gadgetsSeleccionados.length > 0 ? (
                  <div className="space-y-1">
                    {gadgetsSeleccionados.map((gadgetId) => {
                      const gadget = gadgetOptions.find(g => g.id === gadgetId);
                      return (
                        <Badge key={gadgetId} variant="default" className="text-xs">
                          {gadget?.label}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <Badge variant="secondary">Ninguno</Badge>
                )}
              </div>
              
              {observaciones && (
                <div>
                  <div className="text-sm text-muted-foreground">Observaciones</div>
                  <div className="text-sm bg-muted rounded p-2">
                    {observaciones}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Regresar
        </Button>
        
        <Button onClick={handleContinue} size="lg" className="gap-2">
          Continuar a Asignación
          <CheckCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}