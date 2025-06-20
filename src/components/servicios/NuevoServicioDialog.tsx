
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Car, Settings } from 'lucide-react';

interface NuevoServicioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NuevoServicioDialog = ({ open, onOpenChange }: NuevoServicioDialogProps) => {
  const [formData, setFormData] = useState({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Crear Servicio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
