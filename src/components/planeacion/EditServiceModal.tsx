import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, AlertTriangle, MapPin, Calendar, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

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
}

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: EditableService | null;
  onSave: (id: string, data: Partial<EditableService>) => Promise<void>;
  isLoading?: boolean;
}

export function EditServiceModal({
  open,
  onOpenChange,
  service,
  onSave,
  isLoading = false
}: EditServiceModalProps) {
  const [formData, setFormData] = useState<Partial<EditableService>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [requiresArmadoChanged, setRequiresArmadoChanged] = useState(false);

  // Initialize form data when service changes
  useEffect(() => {
    if (service && open) {
      setFormData({
        nombre_cliente: service.nombre_cliente,
        empresa_cliente: service.empresa_cliente || '',
        email_cliente: service.email_cliente || '',
        telefono_cliente: service.telefono_cliente || '',
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
  }, [service, open]);

  const handleInputChange = (field: keyof EditableService, value: any) => {
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
      await onSave(service.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm('¿Estás seguro de descartar los cambios?');
      if (!confirm) return;
    }
    onOpenChange(false);
  };

  if (!service) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Servicio - {service.id_servicio}
          </DialogTitle>
        </DialogHeader>

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
              <div className="space-y-2">
                <Label htmlFor="nombre_cliente">Nombre Cliente *</Label>
                <Input
                  id="nombre_cliente"
                  value={formData.nombre_cliente || ''}
                  onChange={(e) => handleInputChange('nombre_cliente', e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="empresa_cliente">Empresa</Label>
                <Input
                  id="empresa_cliente"
                  value={formData.empresa_cliente || ''}
                  onChange={(e) => handleInputChange('empresa_cliente', e.target.value)}
                  placeholder="Empresa del cliente"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email_cliente">Email</Label>
                <Input
                  id="email_cliente"
                  type="email"
                  value={formData.email_cliente || ''}
                  onChange={(e) => handleInputChange('email_cliente', e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono_cliente">Teléfono</Label>
                <Input
                  id="telefono_cliente"
                  value={formData.telefono_cliente || ''}
                  onChange={(e) => handleInputChange('telefono_cliente', e.target.value)}
                  placeholder="Teléfono del cliente"
                />
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

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}