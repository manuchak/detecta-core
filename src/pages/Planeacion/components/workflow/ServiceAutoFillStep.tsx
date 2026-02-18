import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Shield, Settings, CheckCircle, ArrowLeft, Cpu, MapPin, DollarSign, AlertTriangle, User, RefreshCw, XCircle, Loader2 } from 'lucide-react';
import { GadgetQuantitySelector } from '@/components/planeacion/GadgetQuantitySelector';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useServiceIdValidation } from '@/hooks/useServiceIdValidation';

interface RouteData {
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  precio_sugerido?: number;
  precio_custodio?: number;
  pago_custodio_sin_arma?: number;
  costo_operativo?: number;
  margen_estimado?: number;
  distancia_km?: number;
  tipo_servicio?: string;
  incluye_armado?: boolean;
  es_ruta_reparto?: boolean;
  puntos_intermedios?: Array<{
    orden: number;
    nombre: string;
    direccion: string;
    tiempo_estimado_parada_min: number;
    observaciones?: string;
  }>;
  numero_paradas?: number;
}

interface GadgetCantidad {
  tipo: string;
  cantidad: number;
}

interface ServiceData extends RouteData {
  servicio_id: string;
  id_interno_cliente?: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  tipo_servicio: string;
  incluye_armado: boolean;
  requiere_gadgets: boolean;
  gadgets_seleccionados: string[];
  gadgets_cantidades?: GadgetCantidad[];
  observaciones?: string;
  fecha_recepcion: string;
  hora_recepcion: string;
}

interface ServiceAutoFillStepProps {
  routeData: RouteData;
  onComplete: (data: ServiceData) => void;
  onSaveAsPending?: (data: ServiceData) => void;
  onBack: () => void;
  initialDraft?: any;
  onDraftChange?: (draft: any) => void;
}

export function ServiceAutoFillStep({ routeData, onComplete, onSaveAsPending, onBack, initialDraft, onDraftChange }: ServiceAutoFillStepProps) {
  const [servicioId, setServicioId] = useState(initialDraft?.servicio_id || '');
  const [idInternoCliente, setIdInternoCliente] = useState(initialDraft?.id_interno_cliente || '');
  const [fechaProgramada, setFechaProgramada] = useState(
    initialDraft?.fecha_programada || format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [horaInicio, setHoraInicio] = useState(initialDraft?.hora_ventana_inicio || '08:00');
  const [tipoServicio, setTipoServicio] = useState(initialDraft?.tipo_servicio || 'custodia_sin_arma');
  const [incluyeArmado, setIncluyeArmado] = useState(initialDraft?.incluye_armado || false);
  const [gadgetsCantidades, setGadgetsCantidades] = useState<Record<string, number>>(() => {
    // Initialize from gadgets_cantidades array or fallback to gadgets_seleccionados
    if (initialDraft?.gadgets_cantidades) {
      return initialDraft.gadgets_cantidades.reduce((acc: Record<string, number>, g: GadgetCantidad) => {
        acc[g.tipo] = g.cantidad;
        return acc;
      }, {});
    }
    if (initialDraft?.gadgets_seleccionados) {
      return initialDraft.gadgets_seleccionados.reduce((acc: Record<string, number>, id: string) => {
        acc[id] = 1;
        return acc;
      }, {});
    }
    return {};
  });
  const [observaciones, setObservaciones] = useState(initialDraft?.observaciones || '');
  
  // Derived: convert Record to array for compatibility
  const gadgetsSeleccionados = Object.keys(gadgetsCantidades).filter(k => gadgetsCantidades[k] > 0);
  const gadgetsCantidadesArray: GadgetCantidad[] = Object.entries(gadgetsCantidades)
    .filter(([_, cantidad]) => cantidad > 0)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }));
  const totalGadgets = gadgetsCantidadesArray.reduce((sum, g) => sum + g.cantidad, 0);
  
  
  // Campos de recepción de solicitud (auto-llenados con fecha/hora actual)
  const [fechaRecepcion, setFechaRecepcion] = useState(
    initialDraft?.fecha_recepcion || format(new Date(), 'yyyy-MM-dd')
  );
  const [horaRecepcion, setHoraRecepcion] = useState(
    initialDraft?.hora_recepcion || format(new Date(), 'HH:mm')
  );

  // Hook para validación de IDs
  const { validateSingleId, isValidating } = useServiceIdValidation();
  const [validationResult, setValidationResult] = useState<any>(null);
  const [hasValidated, setHasValidated] = useState(false);

  // Effect to generate a service ID if none exists
  useEffect(() => {
    if (!servicioId.trim()) {
      // Generate a new UUID for the service
      const newServiceId = crypto.randomUUID();
      setServicioId(newServiceId);
    }
  }, [servicioId]);
  const validateServiceId = useCallback(async (id: string) => {
    if (!id?.trim()) {
      setValidationResult(null);
      setHasValidated(false);
      return;
    }

    setHasValidated(true);
    const result = await validateSingleId(id.trim(), true);
    setValidationResult(result);
  }, [validateSingleId]);

  // Debounce para validación automática
  useEffect(() => {
    if (!servicioId?.trim()) {
      setValidationResult(null);
      setHasValidated(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      validateServiceId(servicioId);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [servicioId, validateServiceId]);

  // Sincronizar estado con initialDraft cuando cambia (restauración de draft)
  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.servicio_id !== undefined) {
        setServicioId(initialDraft.servicio_id);
      }
      if (initialDraft.id_interno_cliente !== undefined) {
        setIdInternoCliente(initialDraft.id_interno_cliente);
      }
      if (initialDraft.fecha_programada !== undefined) {
        setFechaProgramada(initialDraft.fecha_programada);
      }
      if (initialDraft.hora_ventana_inicio !== undefined) {
        setHoraInicio(initialDraft.hora_ventana_inicio);
      }
      if (initialDraft.tipo_servicio !== undefined) {
        setTipoServicio(initialDraft.tipo_servicio);
      }
      if (initialDraft.incluye_armado !== undefined) {
        setIncluyeArmado(initialDraft.incluye_armado);
      }
      if (initialDraft.gadgets_cantidades !== undefined) {
        const newCantidades = initialDraft.gadgets_cantidades.reduce((acc: Record<string, number>, g: GadgetCantidad) => {
          acc[g.tipo] = g.cantidad;
          return acc;
        }, {});
        setGadgetsCantidades(newCantidades);
      } else if (initialDraft.gadgets_seleccionados !== undefined) {
        // Backward compatibility: convert old array format to quantities
        const newCantidades = initialDraft.gadgets_seleccionados.reduce((acc: Record<string, number>, id: string) => {
          acc[id] = 1;
          return acc;
        }, {});
        setGadgetsCantidades(newCantidades);
      }
      if (initialDraft.observaciones !== undefined) {
        setObservaciones(initialDraft.observaciones);
      }
      if (initialDraft.fecha_recepcion !== undefined) {
        setFechaRecepcion(initialDraft.fecha_recepcion);
      }
      if (initialDraft.hora_recepcion !== undefined) {
        setHoraRecepcion(initialDraft.hora_recepcion);
      }
    }
  }, [initialDraft]);

  const handleServiceIdChange = (value: string) => {
    setServicioId(value);
    // Reset validation when user is typing
    if (hasValidated && validationResult) {
      setValidationResult(null);
      setHasValidated(false);
    }
    
    // Notify draft change
    if (onDraftChange) {
      onDraftChange({
        servicio_id: value,
        id_interno_cliente: idInternoCliente,
        fecha_programada: fechaProgramada,
        hora_ventana_inicio: horaInicio,
        tipo_servicio: tipoServicio,
        incluye_armado: incluyeArmado,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones,
        fecha_recepcion: fechaRecepcion,
        hora_recepcion: horaRecepcion
      });
    }
  };

  const handleIdInternoChange = (value: string) => {
    setIdInternoCliente(value);
    if (onDraftChange) {
      onDraftChange({
        servicio_id: servicioId,
        id_interno_cliente: value,
        fecha_programada: fechaProgramada,
        hora_ventana_inicio: horaInicio,
        tipo_servicio: tipoServicio,
        incluye_armado: incluyeArmado,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones,
        fecha_recepcion: fechaRecepcion,
        hora_recepcion: horaRecepcion
      });
    }
  };

  const handleFechaProgramadaChange = (value: string) => {
    setFechaProgramada(value);
    if (onDraftChange) {
      onDraftChange({
        servicio_id: servicioId,
        id_interno_cliente: idInternoCliente,
        fecha_programada: value,
        hora_ventana_inicio: horaInicio,
        tipo_servicio: tipoServicio,
        incluye_armado: incluyeArmado,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones,
        fecha_recepcion: fechaRecepcion,
        hora_recepcion: horaRecepcion
      });
    }
  };

  const handleHoraInicioChange = (value: string) => {
    setHoraInicio(value);
    if (onDraftChange) {
      onDraftChange({
        servicio_id: servicioId,
        id_interno_cliente: idInternoCliente,
        fecha_programada: fechaProgramada,
        hora_ventana_inicio: value,
        tipo_servicio: tipoServicio,
        incluye_armado: incluyeArmado,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones,
        fecha_recepcion: fechaRecepcion,
        hora_recepcion: horaRecepcion
      });
    }
  };

  const handleTipoServicioChange = (value: string) => {
    setTipoServicio(value);
    // Lógica bidireccional: actualizar automáticamente el switch de armado
    let newIncluyeArmado = incluyeArmado;
    if (value === 'custodia_sin_arma') {
      setIncluyeArmado(false);
      newIncluyeArmado = false;
      toast.info('Servicio sin arma: custodio armado desactivado automáticamente');
    } else if (value === 'custodia_armada' || value === 'custodia_armada_reforzada') {
      setIncluyeArmado(true);
      newIncluyeArmado = true;
      toast.info('Servicio armado: custodio armado activado automáticamente');
    }
    
    if (onDraftChange) {
      onDraftChange({
        servicio_id: servicioId,
        id_interno_cliente: idInternoCliente,
        fecha_programada: fechaProgramada,
        hora_ventana_inicio: horaInicio,
        tipo_servicio: value,
        incluye_armado: newIncluyeArmado,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones,
        fecha_recepcion: fechaRecepcion,
        hora_recepcion: horaRecepcion
      });
    }
  };

  const handleIncluyeArmadoChange = (checked: boolean) => {
    if (tipoServicio === 'custodia_sin_arma') return;
    
    setIncluyeArmado(checked);
    let newTipoServicio = tipoServicio;
    if (checked) {
      if (tipoServicio === 'custodia_sin_arma') {
        setTipoServicio('custodia_armada');
        newTipoServicio = 'custodia_armada';
      }
    } else {
      setTipoServicio('custodia_sin_arma');
      newTipoServicio = 'custodia_sin_arma';
    }
    
    if (onDraftChange) {
      onDraftChange({
        servicio_id: servicioId,
        id_interno_cliente: idInternoCliente,
        fecha_programada: fechaProgramada,
        hora_ventana_inicio: horaInicio,
        tipo_servicio: newTipoServicio,
        incluye_armado: checked,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones,
        fecha_recepcion: fechaRecepcion,
        hora_recepcion: horaRecepcion
      });
    }
  };

  const handleObservacionesChange = (value: string) => {
    setObservaciones(value);
    if (onDraftChange) {
      onDraftChange({
        servicio_id: servicioId,
        id_interno_cliente: idInternoCliente,
        fecha_programada: fechaProgramada,
        hora_ventana_inicio: horaInicio,
        tipo_servicio: tipoServicio,
        incluye_armado: incluyeArmado,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones: value,
        fecha_recepcion: fechaRecepcion,
        hora_recepcion: horaRecepcion
      });
    }
  };

  const handleFechaRecepcionChange = (value: string) => {
    setFechaRecepcion(value);
    if (onDraftChange) {
      onDraftChange({
        servicio_id: servicioId,
        id_interno_cliente: idInternoCliente,
        fecha_programada: fechaProgramada,
        hora_ventana_inicio: horaInicio,
        tipo_servicio: tipoServicio,
        incluye_armado: incluyeArmado,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones,
        fecha_recepcion: value,
        hora_recepcion: horaRecepcion
      });
    }
  };

  const handleHoraRecepcionChange = (value: string) => {
    setHoraRecepcion(value);
    if (onDraftChange) {
      onDraftChange({
        servicio_id: servicioId,
        id_interno_cliente: idInternoCliente,
        fecha_programada: fechaProgramada,
        hora_ventana_inicio: horaInicio,
        tipo_servicio: tipoServicio,
        incluye_armado: incluyeArmado,
        gadgets_seleccionados: gadgetsSeleccionados,
        observaciones,
        fecha_recepcion: fechaRecepcion,
        hora_recepcion: value
      });
    }
  };

  // Auto-fill basado en la ruta y tipo de servicio de la matriz de precios
  useEffect(() => {
    // Detectar si incluye armado basado en tipo_servicio de la matriz
    let isArmedService = false;
    
    if (routeData.tipo_servicio) {
      // Si tipo_servicio está definido, usarlo para determinar si es armado
      const servicioUpper = routeData.tipo_servicio.toUpperCase();
      isArmedService = servicioUpper === 'ARMADA' || 
                      servicioUpper === 'CON ARMA' || 
                      servicioUpper === 'ARMADO';
    } else if (routeData.incluye_armado !== undefined) {
      // Fallback: usar incluye_armado si está disponible
      isArmedService = routeData.incluye_armado;
    }
    // Si no hay información, por defecto es custodia sin arma
    
    if (isArmedService) {
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
    if (!servicioId.trim()) {
      toast.error('El ID del servicio es requerido');
      return;
    }

    if (validationResult && !validationResult.is_valid) {
      toast.error('Debe usar un ID válido antes de continuar');
      return;
    }

    const serviceData: ServiceData = {
      ...routeData,
      servicio_id: servicioId.trim(),
      id_interno_cliente: idInternoCliente.trim() || undefined,
      fecha_programada: fechaProgramada,
      hora_ventana_inicio: horaInicio,
      tipo_servicio: tipoServicio,
      incluye_armado: incluyeArmado,
      requiere_gadgets: gadgetsSeleccionados.length > 0,
      gadgets_seleccionados: gadgetsSeleccionados,
      gadgets_cantidades: gadgetsCantidadesArray,
      observaciones: observaciones.trim() || undefined,
      fecha_recepcion: fechaRecepcion,
      hora_recepcion: horaRecepcion
    };

    onComplete(serviceData);
  };

  const handleSaveAsPending = () => {
    if (!servicioId.trim()) {
      toast.error('El ID del servicio es requerido');
      return;
    }

    if (validationResult && !validationResult.is_valid) {
      toast.error('Debe usar un ID válido antes de guardar como pendiente');
      return;
    }

    const serviceData: ServiceData = {
      ...routeData,
      servicio_id: servicioId.trim(),
      id_interno_cliente: idInternoCliente.trim() || undefined,
      fecha_programada: fechaProgramada,
      hora_ventana_inicio: horaInicio,
      tipo_servicio: tipoServicio,
      incluye_armado: incluyeArmado,
      requiere_gadgets: gadgetsSeleccionados.length > 0,
      gadgets_seleccionados: gadgetsSeleccionados,
      gadgets_cantidades: gadgetsCantidadesArray,
      observaciones: observaciones.trim() || undefined,
      fecha_recepcion: fechaRecepcion,
      hora_recepcion: horaRecepcion
    };

    if (onSaveAsPending) {
      onSaveAsPending(serviceData);
    }
  };

  const gadgetOptions = [
    { id: 'candado_satelital', label: 'Candado Satelital', description: 'Dispositivo de bloqueo con rastreo GPS', allowMultiple: true, maxQuantity: 5 },
    { id: 'gps_portatil', label: 'GPS Portátil', description: 'Dispositivo de rastreo portátil', allowMultiple: true, maxQuantity: 10 },
    { id: 'gps_portatil_caja_imantada', label: 'GPS Portátil con Caja Imantada', description: 'GPS portátil con instalación magnética', allowMultiple: true, maxQuantity: 5 }
  ];

  const handleGadgetCantidadChange = (gadgetId: string, cantidad: number) => {
    setGadgetsCantidades(prev => {
      const newCantidades = { ...prev };
      if (cantidad <= 0) {
        delete newCantidades[gadgetId];
      } else {
        newCantidades[gadgetId] = cantidad;
      }
      
      // Notify draft change
      if (onDraftChange) {
        const gadgetsArray = Object.entries(newCantidades)
          .filter(([_, qty]) => qty > 0)
          .map(([tipo, qty]) => ({ tipo, cantidad: qty }));
        
        onDraftChange({
          servicio_id: servicioId,
          id_interno_cliente: idInternoCliente,
          fecha_programada: fechaProgramada,
          hora_ventana_inicio: horaInicio,
          tipo_servicio: tipoServicio,
          incluye_armado: incluyeArmado,
          gadgets_seleccionados: Object.keys(newCantidades).filter(k => newCantidades[k] > 0),
          gadgets_cantidades: gadgetsArray,
          observaciones,
          fecha_recepcion: fechaRecepcion,
          hora_recepcion: horaRecepcion
        });
      }
      
      return newCantidades;
    });
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
          {/* Minimal Route Summary */}
          <div className="bg-muted/50 rounded-lg p-6 mb-6 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background border">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cliente
                  </div>
                  <div className="font-semibold text-foreground">{routeData.cliente_nombre}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background border">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Origen
                  </div>
                  <div className="font-semibold text-foreground">{routeData.origen_texto}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background border">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Destino
                  </div>
                  <div className="font-semibold text-foreground">{routeData.destino_texto}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background border">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Precio Base
                  </div>
                  <div className="font-semibold text-foreground">${routeData.precio_sugerido?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Service Configuration */}
          <div className="space-y-8">
            {/* Service ID - Enhanced with Real-time Validation */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="servicio-id" className="text-lg font-bold">
                    ID del Servicio (Sistema de Facturación)
                    <span className="text-destructive ml-2 text-xl">*</span>
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Ingrese el ID único del sistema de facturación
                  </div>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="servicio-id"
                  placeholder="Ingrese el ID del sistema de facturación (ej: INV-2024-001234)"
                  value={servicioId}
                  onChange={(e) => handleServiceIdChange(e.target.value)}
                  className={`h-14 text-lg font-mono pr-12 ${
                    !servicioId.trim() 
                      ? 'border-destructive border-2 bg-destructive/5'
                      : isValidating
                      ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10'
                      : validationResult?.is_valid === false
                      ? 'border-destructive border-2 bg-destructive/5'
                      : validationResult?.is_valid === true
                      ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10'
                      : 'border-input'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidating ? (
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                  ) : validationResult?.is_valid === false ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : validationResult?.is_valid === true ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : null}
                </div>
              </div>

              {/* Validation Messages */}
              {!servicioId.trim() && (
                <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Este campo es obligatorio - ingrese el ID del sistema de facturación
                </div>
              )}
              
              {isValidating && servicioId.trim() && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando ID en el sistema...
                </div>
              )}

              {validationResult?.is_valid === false && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                    <XCircle className="h-4 w-4" />
                    {validationResult.type === 'duplicate_service' 
                      ? 'ID ya existe en el sistema' 
                      : validationResult.type === 'finished_service' 
                      ? 'ID ya existe - pertenece a un servicio finalizado'
                      : validationResult.message}
                  </div>
                  {validationResult.existing_service && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                      <div className="font-medium text-destructive mb-1">ID ya registrado:</div>
                      <div className="space-y-1 text-muted-foreground">
                        <div>• Cliente: {validationResult.existing_service.cliente}</div>
                        <div>• Estado: {validationResult.existing_service.estado}</div>
                        <div>• Fecha: {new Date(validationResult.existing_service.fecha).toLocaleDateString()}</div>
                        {validationResult.existing_service.tabla && (
                          <div>• Tabla: {validationResult.existing_service.tabla}</div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-destructive font-medium">
                        {validationResult.type === 'finished_service' 
                          ? 'Los IDs de servicios finalizados no se pueden reutilizar. Use un ID diferente.'
                          : 'Verifique con el sistema de facturación o use un ID diferente'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {validationResult?.is_valid === true && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  ID válido y disponible para usar
                </div>
              )}
            </div>

            {/* ID Interno del Cliente */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="id-interno-cliente" className="text-lg font-bold">
                    ID Interno del Cliente (Opcional)
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Código de referencia interno del cliente para este servicio
                  </div>
                </div>
              </div>
              <Input
                id="id-interno-cliente"
                placeholder="Ej: Av. Insurgentes Sur 1234, Col. Del Valle, CDMX 03100"
                value={idInternoCliente}
                onChange={(e) => handleIdInternoChange(e.target.value)}
                className="h-14 text-lg"
                maxLength={200}
              />
            </div>

            {/* Enhanced Date/Time Fields - Single Row Layout */}
            <div className="space-y-6">
              {/* Reception Info */}
              <div className="bg-gray-100/80 rounded-lg p-6 border border-gray-300 border-l-4 border-l-gray-600">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-background border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Recepción de Solicitud</h3>
                    <p className="text-sm text-muted-foreground">
                      Información de cuando se recibió la solicitud
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-recepcion" className="font-semibold">
                      Fecha de Recepción <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fecha-recepcion"
                      type="date"
                      value={fechaRecepcion}
                      onChange={(e) => handleFechaRecepcionChange(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hora-recepcion" className="font-semibold">
                      Hora de Recepción <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="hora-recepcion"
                      type="time"
                      value={horaRecepcion}
                      onChange={(e) => handleHoraRecepcionChange(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Scheduling */}
              <div className="bg-gray-100/80 rounded-lg p-6 border border-gray-300 border-l-4 border-l-gray-600">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-background border">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Programación de Cita</h3>
                    <p className="text-sm text-muted-foreground">
                      Fecha y hora programada para el servicio
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha" className="font-semibold flex items-center gap-2">
                      Fecha Programada <span className="text-destructive">*</span>
                      <Badge variant="outline" className="text-xs">
                        Optimizado
                      </Badge>
                    </Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={fechaProgramada}
                      onChange={(e) => handleFechaProgramadaChange(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hora-inicio" className="font-semibold flex items-center gap-2">
                      Hora de Cita <span className="text-destructive">*</span>
                      {getAutoFillBadge('horario')}
                    </Label>
                    <Input
                      id="hora-inicio"
                      type="time"
                      value={horaInicio}
                      onChange={(e) => handleHoraInicioChange(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
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
              <Select 
                value={tipoServicio} 
                onValueChange={handleTipoServicioChange}
              >
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
                  {tipoServicio === 'custodia_sin_arma' 
                    ? 'Este tipo de servicio no incluye custodio armado'
                    : 'Custodio certificado con portación de arma'
                  }
                </div>
              </div>
              <Switch
                checked={incluyeArmado}
                disabled={tipoServicio === 'custodia_sin_arma'}
                onCheckedChange={handleIncluyeArmadoChange}
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
              
              <div className="space-y-2">
                {gadgetOptions.map((gadget) => (
                  <GadgetQuantitySelector
                    key={gadget.id}
                    gadget={gadget}
                    cantidad={gadgetsCantidades[gadget.id] || 0}
                    onCantidadChange={(cantidad) => handleGadgetCantidadChange(gadget.id, cantidad)}
                  />
                ))}
              </div>
              
              {totalGadgets > 0 && (
                <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded border-l-2 border-primary">
                  <strong>{totalGadgets}</strong> dispositivo(s) en total ({gadgetsSeleccionados.length} tipo(s))
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
                onChange={(e) => handleObservacionesChange(e.target.value)}
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
                <div className="text-sm text-muted-foreground">ID del Servicio</div>
                <div className="font-medium text-primary">{servicioId || 'Pendiente'}</div>
              </div>
              
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
                <div className="text-sm text-muted-foreground">Gadgets de Seguridad</div>
                {totalGadgets > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {gadgetsCantidadesArray.map(({ tipo, cantidad }) => {
                      const gadget = gadgetOptions.find(g => g.id === tipo);
                      return (
                        <Badge key={tipo} variant="default" className="text-xs">
                          {cantidad > 1 ? `${cantidad}x ` : ''}{gadget?.label}
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
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handleSaveAsPending}
            disabled={!servicioId.trim()}
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            <Clock className="h-4 w-4 mr-2" />
            Guardar como Pendiente
          </Button>
          
          <Button 
            onClick={handleContinue} 
            size="lg" 
            className="gap-2"
            disabled={!servicioId.trim()}
          >
            Continuar a Asignación
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}