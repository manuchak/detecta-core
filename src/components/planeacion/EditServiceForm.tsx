import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, X, AlertTriangle, MapPin, User, Shield, Loader2 } from 'lucide-react';
import { RouteRiskBadge } from '@/components/security/routes/RouteRiskBadge';
import { format } from 'date-fns';
import { buildCDMXTimestamp, formatCDMXTime, getCDMXDate } from '@/utils/cdmxTimezone';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftIndicator';

// Hook personalizado para debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// Schema de validación con Zod para seguridad
const editServiceSchema = z.object({
  id_servicio: z.string()
    .trim()
    .min(1, 'El ID del servicio es requerido')
    .max(50, 'El ID no puede exceder 50 caracteres')
    .regex(
      /^[^<>'"`\\;=\s]+$/, 
      'No se permiten caracteres de inyección (<, >, \', ", `, \\, ;, =) ni espacios'
    ),
  id_interno_cliente: z.string()
    .max(200, 'La referencia no puede exceder 200 caracteres')
    .optional()
    .nullable(),
  nombre_cliente: z.string()
    .trim()
    .min(1, 'El nombre del cliente es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  origen: z.string()
    .trim()
    .min(1, 'El origen es requerido')
    .max(500, 'El origen no puede exceder 500 caracteres'),
  destino: z.string()
    .trim()
    .min(1, 'El destino es requerido')
    .max(500, 'El destino no puede exceder 500 caracteres'),
  fecha_hora_cita: z.string()
    .min(1, 'La fecha y hora son requeridas'),
  tipo_servicio: z.string()
    .min(1, 'El tipo de servicio es requerido'),
  requiere_armado: z.boolean(),
  observaciones: z.string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .optional()
});

export interface EditableService {
  id: string;
  id_servicio: string;
  id_interno_cliente?: string;
  nombre_cliente: string;
  empresa_cliente?: string;
  email_cliente?: string;
  telefono_cliente?: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio: string;
  requiere_armado: boolean;
  cantidad_armados_requeridos?: number;
  custodio_asignado?: string;
  armado_asignado?: string;
  observaciones?: string;
  estado_planeacion: string;
  servicio_iniciado?: boolean;
  estado_servicio?: string;
}

interface EditServiceFormProps {
  service: EditableService | null;
  onSave: (id: string, data: Partial<EditableService>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditServiceForm({
  service,
  onSave,
  onCancel,
  isLoading = false
}: EditServiceFormProps) {
  const [formData, setFormData] = useState<Partial<EditableService>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [requiresArmadoChanged, setRequiresArmadoChanged] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Estados para debouncing del ID de servicio
  const [serviceIdInput, setServiceIdInput] = useState('');
  const [isValidatingId, setIsValidatingId] = useState(false);
  const debouncedServiceId = useDebounce(serviceIdInput, 800);

  // Persistence for edit form - keyed by service ID
  const persistenceKey = service ? `edit-service-${service.id}` : 'edit-service-temp';
  const persistence = useFormPersistence<Partial<EditableService>>({
    key: persistenceKey,
    initialData: {},
    level: 'standard',
    enabled: !!service,
    isMeaningful: (data) => Object.keys(data).length > 0,
    ttl: 2 * 60 * 60 * 1000, // 2 hours
    debounceMs: 800,
  });

  // Sync formData with persistence
  useEffect(() => {
    if (service && hasChanges) {
      persistence.updateData(formData);
    }
  }, [formData, hasChanges, service]);

  // Initialize form data when service changes
  useEffect(() => {
    if (service) {
      // Check if we have a persisted draft for this service
      const persistedDraft = persistence.hasDraft ? persistence.data : null;
      
      if (persistedDraft && Object.keys(persistedDraft).length > 0 && persistedDraft.id_servicio === service.id_servicio) {
        // Restore from draft
        setFormData(persistedDraft);
        setServiceIdInput(persistedDraft.id_servicio || service.id_servicio);
        setHasChanges(true);
      } else {
        // Initialize from service
        setFormData({
          id_servicio: service.id_servicio,
          id_interno_cliente: service.id_interno_cliente || '',
          nombre_cliente: service.nombre_cliente,
          origen: service.origen,
          destino: service.destino,
          fecha_hora_cita: service.fecha_hora_cita,
          tipo_servicio: service.tipo_servicio,
          requiere_armado: service.requiere_armado,
          observaciones: service.observaciones || ''
        });
        setServiceIdInput(service.id_servicio);
        setHasChanges(false);
      }
      setRequiresArmadoChanged(false);
    }
  }, [service]);

  
  // Validación asíncrona con debounce para ID de servicio
  useEffect(() => {
    const validateDebouncedId = async () => {
      if (!debouncedServiceId || debouncedServiceId === service?.id_servicio) {
        setIsValidatingId(false);
        return;
      }
      
      setIsValidatingId(true);
      
      try {
        const { data, error } = await supabase
          .from('servicios_planificados')
          .select('id')
          .eq('id_servicio', debouncedServiceId)
          .neq('id', service?.id || '')
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          const errorMsg = `El ID de servicio "${debouncedServiceId}" ya existe`;
          setValidationErrors(prev => ({ ...prev, id_servicio: errorMsg }));
        } else {
          setValidationErrors(prev => {
            const { id_servicio, ...rest } = prev;
            return rest;
          });
        }
      } catch (error) {
        console.error('Error validating service ID:', error);
      } finally {
        setIsValidatingId(false);
      }
    };
    
    validateDebouncedId();
  }, [debouncedServiceId, service?.id_servicio]);

  // Determinar si el ID del servicio puede editarse
  const canEditServiceId = (): boolean => {
    if (!service) return false;
    
    if (service.servicio_iniciado === true) return false;
    
    const nonEditableStates = ['en_curso', 'completado', 'cancelado'];
    if (service.estado_servicio && nonEditableStates.includes(service.estado_servicio)) {
      return false;
    }
    
    return true;
  };

  // Validar campo individual con Zod
  const validateField = (field: string, value: any): string | null => {
    try {
      const fieldSchema = editServiceSchema.shape[field as keyof typeof editServiceSchema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0].message;
      }
      return 'Error de validación';
    }
  };

  // Validar que el ID de servicio no exista en la base de datos
  const validateServiceId = async (newId: string): Promise<boolean> => {
    if (newId === service?.id_servicio) return true;
    
    // Validar formato primero
    const formatError = validateField('id_servicio', newId);
    if (formatError) {
      setValidationErrors(prev => ({ ...prev, id_servicio: formatError }));
      toast.error(formatError);
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id')
        .eq('id_servicio', newId)
        .neq('id', service?.id || '')
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        const errorMsg = `El ID de servicio "${newId}" ya existe`;
        setValidationErrors(prev => ({ ...prev, id_servicio: errorMsg }));
        toast.error(errorMsg);
        return false;
      }
      
      setValidationErrors(prev => {
        const { id_servicio, ...rest } = prev;
        return rest;
      });
      return true;
    } catch (error) {
      toast.error('Error al validar ID de servicio');
      return false;
    }
  };

  const handleInputChange = useCallback((field: keyof EditableService, value: any) => {
    // Manejo especial para ID de servicio - solo validación de formato (sincrónica)
    if (field === 'id_servicio') {
      // Validación de formato inmediata (rápida, sin database)
      const formatError = validateField(field, value);
      if (formatError) {
        setValidationErrors(prev => ({ ...prev, [field]: formatError }));
      } else {
        setValidationErrors(prev => {
          const { [field]: removed, ...rest } = prev;
          return rest;
        });
      }
      
      // Actualizar input local (sin debounce para typing fluido)
      setServiceIdInput(value);
      
      // Actualizar formData
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        if (service) {
          const hasAnyChanges = Object.keys(newData).some(key => {
            const k = key as keyof EditableService;
            return newData[k] !== (service[k] || '');
          });
          setHasChanges(hasAnyChanges);
        }
        
        return newData;
      });
      
      // La validación de duplicados se hará con debounce en el useEffect
      return;
    }
    
    // Para otros campos, validación normal
    const error = validateField(field, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setValidationErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Check if requiere_armado changed
      if (field === 'requiere_armado' && service) {
        setRequiresArmadoChanged(value !== service.requiere_armado);
      }
      
      // Check if there are any changes
      if (service) {
        const hasAnyChanges = Object.keys(newData).some(key => {
          const k = key as keyof EditableService;
          return newData[k] !== (service[k] || '');
        });
        setHasChanges(hasAnyChanges);
      }
      
      return newData;
    });
  }, [service]);

  // Mapeo de campos a etiquetas legibles
  const fieldLabels: Record<string, string> = {
    id_servicio: 'ID del Servicio',
    id_interno_cliente: 'Referencia Cliente',
    nombre_cliente: 'Nombre del Cliente',
    origen: 'Origen',
    destino: 'Destino',
    fecha_hora_cita: 'Fecha y Hora',
    tipo_servicio: 'Tipo de Servicio',
    requiere_armado: 'Requiere Armado',
    observaciones: 'Observaciones'
  };

  const handleSave = async () => {
    if (!service || !hasChanges) return;

    try {
      // ========================================================================
      // Build changedFields FIRST, then validate only those fields
      // This prevents untouched fields (e.g. long id_interno_cliente) from
      // blocking saves when the planner only changed the time.
      // ========================================================================
      const changedFields: Partial<EditableService> = {};
      
      (Object.keys(formData) as Array<keyof EditableService>).forEach(key => {
        const formValue = formData[key];
        const serviceValue = service[key];
        
        const normalizedFormValue = formValue === '' ? null : formValue;
        const normalizedServiceValue = serviceValue === '' ? null : serviceValue;
        
        if (normalizedFormValue !== normalizedServiceValue) {
          // @ts-ignore - dynamic assignment
          changedFields[key] = formValue;
        }
      });

      // Only save if there are actual changes
      if (Object.keys(changedFields).length === 0) {
        toast.info('No hay cambios que guardar');
        return;
      }

      // Validate ONLY the changed fields using a partial schema
      const partialSchema = editServiceSchema.partial();
      const validationResult = partialSchema.safeParse(changedFields);
      
      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.errors.forEach(err => {
          const field = err.path[0] as string;
          errors[field] = err.message;
        });
        setValidationErrors(errors);
        
        const errorFieldNames = Object.keys(errors).map(f => fieldLabels[f] || f);
        toast.error(
          <div className="space-y-1">
            <p className="font-medium">Campos con errores:</p>
            <ul className="list-disc list-inside text-sm">
              {errorFieldNames.map(field => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>,
          { duration: 5000 }
        );
        
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const element = document.getElementById(firstErrorField);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => element.focus(), 300);
          }
        }
        
        return;
      }
      
      
      console.log('[EditServiceForm] Saving only changed fields:', Object.keys(changedFields));
      
      await onSave(service.id, changedFields);
      
      // Clear draft on successful save
      persistence.clearDraft(true);
      setValidationErrors({});
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  const handleCancel = async () => {
    if (hasChanges) {
      const shouldDiscard = await persistence.confirmDiscard();
      if (!shouldDiscard) return;
      persistence.clearDraft(true);
    }
    onCancel();
  };

  if (!service) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive font-medium">⚠️ Error: No se puede cargar el servicio</p>
        <p className="text-xs text-muted-foreground mt-2">El servicio no está disponible. Por favor, cierra e intenta de nuevo.</p>
      </div>
    );
  }

  // Formatea fecha ISO a formato datetime-local usando timezone CDMX
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    try {
      // Usar CDMX timezone para mostrar consistentemente
      const date = getCDMXDate(dateTimeString);
      const time = formatCDMXTime(dateTimeString, 'HH:mm');
      return `${date}T${time}`;
    } catch {
      return dateTimeString;
    }
  };

  // Convierte valor de datetime-local a timestamp con timezone CDMX para guardar
  const parseLocalDateTime = (localValue: string): string => {
    if (!localValue) return localValue;
    // datetime-local devuelve "2026-01-07T10:00", necesitamos agregar offset CDMX
    const [datePart, timePart] = localValue.split('T');
    if (!datePart || !timePart) return localValue;
    return buildCDMXTimestamp(datePart, timePart);
  };

  const armadoWarning = service.requiere_armado && !formData.requiere_armado && service.armado_asignado;
  const needsArmadoWarning = !service.requiere_armado && formData.requiere_armado;

  return (
    <div className="space-y-6">
      {/* Current Status Summary */}
      <Card className="border-slate-200/60 bg-slate-50/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-caption">Custodio</div>
                <div className="font-medium">
                  {service.custodio_asignado || <span className="text-orange-600">Sin asignar</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-caption">Armado</div>
                <div className="font-medium">
                  {service.armado_asignado || <span className="text-slate-500">No aplica</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div>
                <div className="text-caption">Estado</div>
                <Badge variant="outline" className="text-xs">
                  {service.estado_planeacion}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Messages */}
      {armadoWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-800">Atención: Armado será removido</div>
              <div className="text-red-700">
                Al desactivar "Requiere Armado", se removerá la asignación actual del armado ({service.armado_asignado}) 
                y el servicio cambiará a estado confirmado solo con custodio.
              </div>
            </div>
          </div>
        </div>
      )}

      {needsArmadoWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800">Atención: Se requerirá asignar armado</div>
              <div className="text-amber-700">
                Al activar "Requiere Armado", el servicio cambiará a estado "pendiente_asignacion" 
                hasta que se asigne un armado.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Client Information */}
        <div className="space-y-4">
          <h3 className="text-subtitle flex items-center gap-2">
            <User className="h-4 w-4" />
            Información del Cliente
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID del Servicio - EDITABLE si no ha iniciado */}
            <div className="space-y-2">
              <Label htmlFor="id_servicio" className="flex items-center gap-2">
                ID del Servicio *
                {!canEditServiceId() && (
                  <Badge variant="secondary" className="text-xs">
                    Bloqueado
                  </Badge>
                )}
                {isValidatingId && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Validando...
                  </Badge>
                )}
              </Label>
              <Input
                id="id_servicio"
                value={serviceIdInput}
                onChange={(e) => handleInputChange('id_servicio', e.target.value)}
                placeholder="Ej: SRV-2024-001"
                disabled={!canEditServiceId()}
                className={
                  !canEditServiceId() 
                    ? 'bg-muted cursor-not-allowed' 
                    : validationErrors.id_servicio 
                      ? 'border-destructive focus-visible:ring-destructive' 
                      : ''
                }
                maxLength={50}
              />
              {validationErrors.id_servicio && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.id_servicio}
                </p>
              )}
              {!canEditServiceId() && !validationErrors.id_servicio && (
                <p className="text-xs text-muted-foreground">
                  El ID no puede editarse porque el servicio ya inició o está completado
                </p>
              )}
              {canEditServiceId() && !validationErrors.id_servicio && !isValidatingId && (
                <p className="text-xs text-muted-foreground">
                  Acepta folios de sistemas externos. No usar: &lt; &gt; ' " ` \ ; =
                </p>
              )}
            </div>
            
            {/* Nombre Cliente - EDITABLE */}
            <div className="space-y-2">
              <Label htmlFor="nombre_cliente">Nombre Cliente *</Label>
              <Input
                id="nombre_cliente"
                value={formData.nombre_cliente || ''}
                onChange={(e) => handleInputChange('nombre_cliente', e.target.value)}
                placeholder="Nombre completo del cliente"
                maxLength={200}
                className={validationErrors.nombre_cliente ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {validationErrors.nombre_cliente && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.nombre_cliente}
                </p>
              )}
            </div>
            
            {/* Referencia Cliente / ID Interno - EDITABLE */}
            <div className="space-y-2">
              <Label htmlFor="id_interno_cliente" className="flex items-center gap-2">
                Referencia Cliente
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Facturación
                </Badge>
              </Label>
              <Input
                id="id_interno_cliente"
                value={formData.id_interno_cliente || ''}
                onChange={(e) => handleInputChange('id_interno_cliente', e.target.value)}
                placeholder="ID interno del cliente para facturación"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Referencia proporcionada por el cliente para efectos de facturación
              </p>
            </div>
            
            {/* Teléfono - SOLO LECTURA */}
            <div className="space-y-2">
              <Label htmlFor="telefono_cliente" className="flex items-center gap-2">
                Teléfono
                <Badge variant="secondary" className="text-xs">
                  Solo lectura
                </Badge>
              </Label>
              <Input
                id="telefono_cliente"
                value={service.telefono_cliente || 'No disponible'}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Este dato se carga desde la información del cliente en el sistema
              </p>
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="space-y-4">
          <h3 className="text-subtitle flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Información del Servicio
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origen">Origen *</Label>
              <Input
                id="origen"
                value={formData.origen || ''}
                onChange={(e) => handleInputChange('origen', e.target.value)}
                placeholder="Dirección de origen"
                maxLength={500}
                className={validationErrors.origen ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {validationErrors.origen && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.origen}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destino">Destino *</Label>
              <Input
                id="destino"
                value={formData.destino || ''}
                onChange={(e) => handleInputChange('destino', e.target.value)}
                placeholder="Dirección de destino"
                maxLength={500}
                className={validationErrors.destino ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {validationErrors.destino && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.destino}
                </p>
              )}
            </div>

            {/* Route Risk Assessment */}
            <div className="md:col-span-2">
              <RouteRiskBadge origen={formData.origen} destino={formData.destino} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fecha_hora_cita">Fecha y Hora *</Label>
              <Input
                id="fecha_hora_cita"
                type="datetime-local"
                value={formatDateTime(formData.fecha_hora_cita || '')}
                onChange={(e) => handleInputChange('fecha_hora_cita', parseLocalDateTime(e.target.value))}
                className={validationErrors.fecha_hora_cita ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {validationErrors.fecha_hora_cita && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.fecha_hora_cita}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo_servicio">Tipo de Servicio *</Label>
              <Select
                value={formData.tipo_servicio || ''}
                onValueChange={(value) => handleInputChange('tipo_servicio', value)}
              >
                <SelectTrigger 
                  id="tipo_servicio"
                  className={validationErrors.tipo_servicio ? 'border-destructive focus-visible:ring-destructive' : ''}
                >
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custodia">Custodia</SelectItem>
                  <SelectItem value="traslado">Traslado</SelectItem>
                  <SelectItem value="escolta">Escolta</SelectItem>
                  <SelectItem value="vigilancia">Vigilancia</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.tipo_servicio && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.tipo_servicio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Service Configuration */}
        <div className="space-y-4">
          <h3 className="text-subtitle flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Configuración del Servicio
          </h3>
          
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-4 border border-slate-200/60 rounded-lg bg-slate-50/30">
              <div className="space-y-1">
                <Label htmlFor="requiere_armado" className="text-sm font-medium">
                  Requiere Armado
                </Label>
                <div className="text-caption text-slate-600">
                  {formData.requiere_armado 
                    ? 'El servicio incluirá personal armado' 
                    : 'Solo servicio de custodia'}
                </div>
              </div>
              <Switch
                id="requiere_armado"
                checked={formData.requiere_armado || false}
                onCheckedChange={(checked) => handleInputChange('requiere_armado', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones || ''}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales del servicio"
                rows={3}
                maxLength={1000}
              />
              {validationErrors.observaciones && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.observaciones}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {(formData.observaciones?.length || 0)}/1000 caracteres
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading || Object.keys(validationErrors).length > 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
