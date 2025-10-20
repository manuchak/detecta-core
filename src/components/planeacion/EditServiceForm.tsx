import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, X, AlertTriangle, MapPin, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface EditableService {
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  empresa_cliente?: string;
  email_cliente?: string;
  telefono_cliente?: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio: string;
  requiere_armado: boolean;
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
  // 🔍 DEBUG: Log render attempt
  console.log('[EditServiceForm] 🎨 Render attempt', {
    hasService: !!service,
    serviceId: service?.id_servicio,
    serviceData: service ? {
      id: service.id,
      id_servicio: service.id_servicio,
      nombre_cliente: service.nombre_cliente,
      origen: service.origen,
      destino: service.destino
    } : null,
    isLoading
  });

  const [formData, setFormData] = useState<Partial<EditableService>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [requiresArmadoChanged, setRequiresArmadoChanged] = useState(false);

  // Initialize form data when service changes
  useEffect(() => {
    if (service) {
      setFormData({
        id_servicio: service.id_servicio,
        nombre_cliente: service.nombre_cliente,
        origen: service.origen,
        destino: service.destino,
        fecha_hora_cita: service.fecha_hora_cita,
        tipo_servicio: service.tipo_servicio,
        requiere_armado: service.requiere_armado,
        observaciones: service.observaciones || ''
      });
      setHasChanges(false);
      setRequiresArmadoChanged(false);
    }
  }, [service]);

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

  // Validar que el ID de servicio no exista en la base de datos
  const validateServiceId = async (newId: string): Promise<boolean> => {
    if (newId === service?.id_servicio) return true;
    
    try {
      const { data, error } = await supabase
        .from('pc_servicios')
        .select('id')
        .eq('folio', newId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        toast.error(`El ID de servicio "${newId}" ya existe`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating service ID:', error);
      toast.error('Error al validar ID de servicio');
      return false;
    }
  };

  const handleInputChange = async (field: keyof EditableService, value: any) => {
    if (field === 'id_servicio') {
      const isValid = await validateServiceId(value);
      if (!isValid) return;
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
  };

  const handleSave = async () => {
    if (!service || !hasChanges) return;

    try {
      if (formData.id_servicio && formData.id_servicio !== service.id_servicio) {
        const isValid = await validateServiceId(formData.id_servicio);
        if (!isValid) return;
      }
      
      await onSave(service.id, formData);
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm('¿Estás seguro de descartar los cambios?');
      if (!confirm) return;
    }
    onCancel();
  };

  if (!service) {
    console.warn('[EditServiceForm] ⚠️ Service is null/undefined - cannot render form');
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 font-medium">⚠️ Error: No se puede cargar el servicio</p>
        <p className="text-xs text-red-500 mt-2">El servicio no está disponible. Por favor, cierra e intenta de nuevo.</p>
      </div>
    );
  }

  const formatDateTime = (dateTimeString: string) => {
    try {
      return format(new Date(dateTimeString), 'yyyy-MM-dd\'T\'HH:mm');
    } catch {
      return dateTimeString;
    }
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
              </Label>
              <Input
                id="id_servicio"
                value={formData.id_servicio || ''}
                onChange={(e) => handleInputChange('id_servicio', e.target.value)}
                placeholder="ID del servicio"
                disabled={!canEditServiceId()}
                className={!canEditServiceId() ? 'bg-muted cursor-not-allowed' : ''}
              />
              {!canEditServiceId() && (
                <p className="text-xs text-muted-foreground">
                  El ID no puede editarse porque el servicio ya inició o está completado
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
                placeholder="Nombre del cliente"
              />
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destino">Destino *</Label>
              <Input
                id="destino"
                value={formData.destino || ''}
                onChange={(e) => handleInputChange('destino', e.target.value)}
                placeholder="Dirección de destino"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fecha_hora_cita">Fecha y Hora *</Label>
              <Input
                id="fecha_hora_cita"
                type="datetime-local"
                value={formatDateTime(formData.fecha_hora_cita || '')}
                onChange={(e) => handleInputChange('fecha_hora_cita', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo_servicio">Tipo de Servicio</Label>
              <Select
                value={formData.tipo_servicio || ''}
                onValueChange={(value) => handleInputChange('tipo_servicio', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custodia">Custodia</SelectItem>
                  <SelectItem value="traslado">Traslado</SelectItem>
                  <SelectItem value="escolta">Escolta</SelectItem>
                  <SelectItem value="vigilancia">Vigilancia</SelectItem>
                </SelectContent>
              </Select>
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
              />
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
          disabled={!hasChanges || isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
