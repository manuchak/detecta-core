import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, X, Plus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RouteData {
  id?: string;
  cliente_nombre: string;
  destino_texto: string;
  origen_texto?: string;
  tipo_servicio?: string;
  tipo_viaje?: string;
  dias_operacion?: string;
  valor_bruto: number;
  precio_custodio: number;
  costo_operativo: number;
  costo_custodio?: number;
  costo_maximo_casetas?: number;
  pago_custodio_sin_arma?: number;
  distancia_km?: number;
  porcentaje_utilidad: number;
  fecha_vigencia: string;
  activo: boolean;
  observaciones?: string;
  clave?: string;
}

interface RouteManagementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoute?: RouteData | null;
  onRouteUpdated: () => void;
}

export const RouteManagementForm = ({ 
  open, 
  onOpenChange, 
  editingRoute, 
  onRouteUpdated 
}: RouteManagementFormProps) => {
  const [formData, setFormData] = useState<RouteData>({
    cliente_nombre: '',
    destino_texto: '',
    origen_texto: '',
    tipo_servicio: '',
    tipo_viaje: '',
    dias_operacion: '',
    valor_bruto: 0,
    precio_custodio: 0,
    costo_operativo: 0,
    costo_custodio: 0,
    costo_maximo_casetas: 0,
    pago_custodio_sin_arma: 0,
    distancia_km: 0,
    porcentaje_utilidad: 0,
    fecha_vigencia: new Date().toISOString().split('T')[0],
    activo: true,
    observaciones: '',
    clave: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (editingRoute) {
      setFormData({
        ...editingRoute,
        fecha_vigencia: editingRoute.fecha_vigencia?.split('T')[0] || new Date().toISOString().split('T')[0]
      });
    } else {
      // Reset form for new route
      setFormData({
        cliente_nombre: '',
        destino_texto: '',
        origen_texto: '',
        tipo_servicio: '',
        tipo_viaje: '',
        dias_operacion: '',
        valor_bruto: 0,
        precio_custodio: 0,
        costo_operativo: 0,
        costo_custodio: 0,
        costo_maximo_casetas: 0,
        pago_custodio_sin_arma: 0,
        distancia_km: 0,
        porcentaje_utilidad: 0,
        fecha_vigencia: new Date().toISOString().split('T')[0],
        activo: true,
        observaciones: '',
        clave: ''
      });
    }
  }, [editingRoute, open]);

  const checkPermissions = async () => {
    try {
      const { data, error } = await supabase.rpc('puede_acceder_planeacion');
      if (error) throw error;
      setHasPermission(data);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission) {
      toast.error('No tienes permisos para gestionar rutas');
      return;
    }

    setLoading(true);
    
    try {
      // Calculate margin if not provided
      const calculatedMargin = formData.valor_bruto - formData.precio_custodio - formData.costo_operativo;
      const calculatedPercentage = formData.valor_bruto > 0 ? (calculatedMargin / formData.valor_bruto) * 100 : 0;

      const routeData = {
        ...formData,
        margen_neto_calculado: calculatedMargin,
        porcentaje_utilidad: calculatedPercentage,
        updated_at: new Date().toISOString()
      };

      if (editingRoute?.id) {
        // Update existing route
        const { error } = await supabase
          .from('matriz_precios_rutas')
          .update(routeData)
          .eq('id', editingRoute.id);
        
        if (error) throw error;
        
        toast.success('Ruta actualizada correctamente');
      } else {
        // Create new route
        const { error } = await supabase
          .from('matriz_precios_rutas')
          .insert([routeData]);
        
        if (error) throw error;
        
        toast.success('Nueva ruta creada correctamente');
      }

      onRouteUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving route:', error);
      toast.error(error.message || 'Error al guardar la ruta');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RouteData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!hasPermission) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso Denegado</DialogTitle>
            <DialogDescription>
              No tienes permisos para gestionar rutas en la matriz de precios.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingRoute ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingRoute ? 'Editar Ruta' : 'Nueva Ruta'}
          </DialogTitle>
          <DialogDescription>
            {editingRoute 
              ? 'Modifica los datos de la ruta existente'
              : 'Completa la información para crear una nueva ruta en la matriz de precios'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Información Básica</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cliente_nombre">Cliente *</Label>
                <Input
                  id="cliente_nombre"
                  value={formData.cliente_nombre}
                  onChange={(e) => handleInputChange('cliente_nombre', e.target.value)}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="destino_texto">Destino *</Label>
                <Input
                  id="destino_texto"
                  value={formData.destino_texto}
                  onChange={(e) => handleInputChange('destino_texto', e.target.value)}
                  placeholder="Destino de la ruta"
                  required
                />
              </div>

              <div>
                <Label htmlFor="origen_texto">Origen</Label>
                <Input
                  id="origen_texto"
                  value={formData.origen_texto || ''}
                  onChange={(e) => handleInputChange('origen_texto', e.target.value)}
                  placeholder="Origen de la ruta"
                />
              </div>

              <div>
                <Label htmlFor="clave">Clave</Label>
                <Input
                  id="clave"
                  value={formData.clave || ''}
                  onChange={(e) => handleInputChange('clave', e.target.value)}
                  placeholder="Código identificador"
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Detalles del Servicio</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipo_servicio">Tipo de Servicio</Label>
                <Select
                  value={formData.tipo_servicio || ''}
                  onValueChange={(value) => handleInputChange('tipo_servicio', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARMADA">ARMADA</SelectItem>
                    <SelectItem value="FORANEO">FORANEO</SelectItem>
                    <SelectItem value="LOCAL">LOCAL</SelectItem>
                    <SelectItem value="EXPRESS">EXPRESS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo_viaje">Tipo de Viaje</Label>
                <Input
                  id="tipo_viaje"
                  value={formData.tipo_viaje || ''}
                  onChange={(e) => handleInputChange('tipo_viaje', e.target.value)}
                  placeholder="Ej: Ida y vuelta"
                />
              </div>

              <div>
                <Label htmlFor="dias_operacion">Días de Operación</Label>
                <Input
                  id="dias_operacion"
                  value={formData.dias_operacion || ''}
                  onChange={(e) => handleInputChange('dias_operacion', e.target.value)}
                  placeholder="Ej: L-V"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Información Financiera</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valor_bruto">Valor Bruto *</Label>
                <Input
                  id="valor_bruto"
                  type="number"
                  step="0.01"
                  value={formData.valor_bruto}
                  onChange={(e) => handleInputChange('valor_bruto', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="precio_custodio">Precio Custodio *</Label>
                <Input
                  id="precio_custodio"
                  type="number"
                  step="0.01"
                  value={formData.precio_custodio}
                  onChange={(e) => handleInputChange('precio_custodio', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="costo_operativo">Costo Operativo *</Label>
                <Input
                  id="costo_operativo"
                  type="number"
                  step="0.01"
                  value={formData.costo_operativo}
                  onChange={(e) => handleInputChange('costo_operativo', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="costo_custodio">Costo Custodio</Label>
                <Input
                  id="costo_custodio"
                  type="number"
                  step="0.01"
                  value={formData.costo_custodio || 0}
                  onChange={(e) => handleInputChange('costo_custodio', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="costo_maximo_casetas">Máximo Casetas</Label>
                <Input
                  id="costo_maximo_casetas"
                  type="number"
                  step="0.01"
                  value={formData.costo_maximo_casetas || 0}
                  onChange={(e) => handleInputChange('costo_maximo_casetas', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="pago_custodio_sin_arma">Pago Sin Arma</Label>
                <Input
                  id="pago_custodio_sin_arma"
                  type="number"
                  step="0.01"
                  value={formData.pago_custodio_sin_arma || 0}
                  onChange={(e) => handleInputChange('pago_custodio_sin_arma', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Información Adicional</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distancia_km">Distancia (km)</Label>
                <Input
                  id="distancia_km"
                  type="number"
                  step="0.01"
                  value={formData.distancia_km || 0}
                  onChange={(e) => handleInputChange('distancia_km', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="fecha_vigencia">Fecha de Vigencia *</Label>
                <Input
                  id="fecha_vigencia"
                  type="date"
                  value={formData.fecha_vigencia}
                  onChange={(e) => handleInputChange('fecha_vigencia', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones || ''}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => handleInputChange('activo', checked)}
              />
              <Label htmlFor="activo">Ruta activa</Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : editingRoute ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};