
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, MapPin, Car, Settings, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useServiceIdValidation } from '@/hooks/useServiceIdValidation';
import { cn } from '@/lib/utils';

interface NuevoServicioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NuevoServicioDialog = ({ open, onOpenChange }: NuevoServicioDialogProps) => {
  const { validateSingleId, isValidating } = useServiceIdValidation();
  
  const [formData, setFormData] = useState({
    id_servicio: '',
    nombre_cliente: '',
    empresa: '',
    telefono_contacto: '',
    email_contacto: '',
    direccion_cliente: '',
    tipo_servicio: '',
    cantidad_vehiculos: 1,
    prioridad: 'media',
    observaciones: ''
  });

  const [validationState, setValidationState] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message: string;
    type?: string;
  }>({
    status: 'idle',
    message: ''
  });

  // Validate ID when it changes
  useEffect(() => {
    const validateId = async () => {
      if (!formData.id_servicio.trim()) {
        setValidationState({ status: 'idle', message: '' });
        return;
      }

      setValidationState({ status: 'validating', message: 'Validando ID...' });
      
      const result = await validateSingleId(formData.id_servicio);
      
      if (result.is_valid) {
        setValidationState({ 
          status: 'valid', 
          message: 'ID disponible' 
        });
      } else {
        setValidationState({ 
          status: 'invalid', 
          message: result.message,
          type: result.type
        });
      }
    };

    const timeoutId = setTimeout(validateId, 500); // Debounce validation
    return () => clearTimeout(timeoutId);
  }, [formData.id_servicio, validateSingleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_servicio.trim()) {
      setValidationState({ status: 'invalid', message: 'ID de servicio es requerido' });
      return;
    }

    if (validationState.status !== 'valid') {
      return;
    }

    // TODO: Implementar creación de servicio
    console.log('Crear servicio:', formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Crear Nuevo Servicio de Monitoreo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="id_servicio">ID de Servicio *</Label>
                <div className="relative">
                  <Input
                    id="id_servicio"
                    value={formData.id_servicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_servicio: e.target.value }))}
                    placeholder="Ingresa un ID único para este servicio"
                    className={cn(
                      "pr-10",
                      validationState.status === 'valid' && "border-green-500 focus:border-green-500",
                      validationState.status === 'invalid' && "border-red-500 focus:border-red-500"
                    )}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {validationState.status === 'validating' && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {validationState.status === 'valid' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {validationState.status === 'invalid' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {validationState.message && (
                  <Alert className={cn(
                    validationState.status === 'valid' && "border-green-200 bg-green-50",
                    validationState.status === 'invalid' && "border-red-200 bg-red-50"
                  )}>
                    <AlertDescription className={cn(
                      validationState.status === 'valid' && "text-green-800",
                      validationState.status === 'invalid' && "text-red-800"
                    )}>
                      {validationState.message}
                      {validationState.type === 'finished_service' && (
                        <div className="mt-1 text-sm">
                          Los servicios finalizados no pueden reutilizar su ID.
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_cliente">Nombre del Cliente *</Label>
                <Input
                  id="nombre_cliente"
                  value={formData.nombre_cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono_contacto">Teléfono *</Label>
                <Input
                  id="telefono_contacto"
                  type="tel"
                  value={formData.telefono_contacto}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_contacto">Email *</Label>
                <Input
                  id="email_contacto"
                  type="email"
                  value={formData.email_contacto}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_contacto: e.target.value }))}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="direccion_cliente">Dirección Completa *</Label>
                <Textarea
                  id="direccion_cliente"
                  value={formData.direccion_cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion_cliente: e.target.value }))}
                  placeholder="Calle, número, colonia, ciudad, estado, código postal"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Servicio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Detalles del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_servicio">Tipo de Servicio *</Label>
                <Select value={formData.tipo_servicio} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_servicio: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitoreo_basico">Monitoreo Básico</SelectItem>
                    <SelectItem value="monitoreo_premium">Monitoreo Premium</SelectItem>
                    <SelectItem value="seguimiento_ejecutivo">Seguimiento Ejecutivo</SelectItem>
                    <SelectItem value="flotilla_comercial">Flotilla Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad_vehiculos">Cantidad de Vehículos *</Label>
                <Input
                  id="cantidad_vehiculos"
                  type="number"
                  min="1"
                  value={formData.cantidad_vehiculos}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad_vehiculos: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select value={formData.prioridad} onValueChange={(value) => setFormData(prev => ({ ...prev, prioridad: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones Adicionales</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Detalles adicionales, requerimientos especiales, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={validationState.status !== 'valid' || isValidating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isValidating ? 'Validando...' : 'Crear Servicio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
