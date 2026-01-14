import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Plus, Edit, HelpCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftIndicator';

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
  hasPermission?: boolean; // Nueva prop para recibir permisos desde el componente padre
}

const RouteManagementFormComponent = ({ 
  open, 
  onOpenChange, 
  editingRoute, 
  onRouteUpdated,
  hasPermission = false
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

  // Memoizar datos iniciales del formulario para evitar recreaciones constantes
  const initialFormData = useMemo((): RouteData => ({
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
  }), []);

  // Persistence for new routes only (not when editing)
  const isCreatingNew = open && !editingRoute;
  const persistence = useFormPersistence<RouteData>({
    key: 'route-management-form',
    initialData: initialFormData,
    level: 'standard',
    enabled: isCreatingNew, // Only persist when creating new
    isMeaningful: (data) => !!(data.cliente_nombre?.trim() || data.destino_texto?.trim()),
    ttl: 4 * 60 * 60 * 1000, // 4 hours for complex forms
    debounceMs: 1000,
  });

  // Sync formData with persistence when creating new
  useEffect(() => {
    if (isCreatingNew && persistence.hasUnsavedChanges) {
      persistence.updateData(formData);
    }
  }, [formData, isCreatingNew, persistence.hasUnsavedChanges]);

  // Optimizar inicialización del formulario y permisos
  useEffect(() => {
    if (!open) return; // Solo ejecutar cuando el modal esté abierto
    
    // Solo verificar permisos si no se pasaron como prop
    if (hasPermission === undefined) {
      console.log('🔐 Verificando permisos en RouteManagementForm...');
      const checkPerms = async () => {
        try {
          const { data, error } = await supabase.rpc('puede_acceder_planeacion');
          if (error) throw error;
          console.log('✅ Permisos verificados:', data);
          // Si no tiene permisos, cerrar el modal inmediatamente
          if (!data) {
            onOpenChange(false);
            toast.error('No tienes permisos para gestionar rutas');
          }
        } catch (error) {
          console.error('❌ Error verificando permisos:', error);
          onOpenChange(false);
          toast.error('Error al verificar permisos');
        }
      };
      checkPerms();
    }
    
    if (editingRoute) {
      setFormData({
        ...editingRoute,
        fecha_vigencia: editingRoute.fecha_vigencia?.split('T')[0] || new Date().toISOString().split('T')[0]
      });
    } else {
      // Check for draft when creating new
      setFormData(initialFormData);
    }
  }, [editingRoute, open, initialFormData, hasPermission, onOpenChange]);

  // Handle restore draft
  const handleRestoreDraft = useCallback(() => {
    const draft = persistence.restoreDraft();
    if (draft) {
      setFormData(draft);
      toast.success('Borrador restaurado');
    }
  }, [persistence]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
        
        // Clear draft on successful creation
        persistence.clearDraft(true);
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
  }, [hasPermission, formData, editingRoute, onRouteUpdated, onOpenChange, persistence]);

  const handleInputChange = useCallback((field: keyof RouteData, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Sync with persistence
      if (!editingRoute) {
        persistence.updateData(newData);
      }
      return newData;
    });
  }, [editingRoute, persistence]);

  // Handle close with discard confirmation
  const handleClose = useCallback(async (open: boolean) => {
    if (!open && !editingRoute && persistence.hasDraft) {
      const shouldDiscard = await persistence.confirmDiscard();
      if (!shouldDiscard) return;
    }
    onOpenChange(open);
  }, [editingRoute, persistence, onOpenChange]);

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

  // Helper to check if form has meaningful data
  const formHasMeaningfulData = !!(formData.cliente_nombre?.trim() || formData.destino_texto?.trim());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingRoute ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingRoute ? 'Editar Ruta' : 'Nueva Ruta'}
            {!editingRoute && persistence.hasDraft && (
              <DraftIndicator 
                hasDraft={persistence.hasDraft}
                hasUnsavedChanges={persistence.hasUnsavedChanges}
                lastSaved={persistence.lastSaved}
                getTimeSinceSave={persistence.getTimeSinceSave}
                variant="minimal"
              />
            )}
          </DialogTitle>
          <DialogDescription>
            {editingRoute 
              ? 'Modifica los datos de la ruta existente'
              : 'Completa la información para crear una nueva ruta en la matriz de precios'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Draft restoration banner */}
        {!editingRoute && persistence.hasDraft && !formHasMeaningfulData && (
          <Alert className="bg-blue-50/80 border-blue-200">
            <RotateCcw className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                Tienes un borrador guardado ({persistence.getTimeSinceSave()})
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestoreDraft}
                className="ml-2 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Restaurar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <TooltipProvider>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Información Básica</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="cliente_nombre">Cliente *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Nombre completo del cliente o empresa que contrata el servicio</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="cliente_nombre"
                    value={formData.cliente_nombre}
                    onChange={(e) => handleInputChange('cliente_nombre', e.target.value)}
                    placeholder="Ej: OXXO, Walmart, Coca-Cola"
                    required
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="destino_texto">Destino *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ubicación o ciudad de destino del servicio</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="destino_texto"
                    value={formData.destino_texto}
                    onChange={(e) => handleInputChange('destino_texto', e.target.value)}
                    placeholder="Ej: Guadalajara, CDMX, Monterrey"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="origen_texto">Origen</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Punto de partida del servicio (opcional)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="origen_texto"
                    value={formData.origen_texto || ''}
                    onChange={(e) => handleInputChange('origen_texto', e.target.value)}
                    placeholder="Ej: Tijuana, León, Puebla"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="clave">Clave</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Código único para identificar la ruta (ej: CLI001, R-GDL-001)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="clave"
                    value={formData.clave || ''}
                    onChange={(e) => handleInputChange('clave', e.target.value)}
                    placeholder="Ej: CLI001, R-GDL-001"
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="tipo_servicio">Tipo de Servicio</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clasificación del servicio según distancia y tipo de escolta</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="tipo_viaje">Tipo de Viaje</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Modalidad del viaje (ej: Ida y vuelta, Solo ida, Redondo)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="tipo_viaje"
                    value={formData.tipo_viaje || ''}
                    onChange={(e) => handleInputChange('tipo_viaje', e.target.value)}
                    placeholder="Ej: Ida y vuelta, Solo ida"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="dias_operacion">Días de Operación</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Días de la semana que opera la ruta (ej: L-V, L-S, Diario)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="dias_operacion"
                    value={formData.dias_operacion || ''}
                    onChange={(e) => handleInputChange('dias_operacion', e.target.value)}
                    placeholder="Ej: L-V, L-S, Diario"
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="valor_bruto">Valor Bruto *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Precio total que se cobra al cliente (en pesos mexicanos)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="valor_bruto"
                    type="number"
                    step="0.01"
                    value={formData.valor_bruto}
                    onChange={(e) => handleInputChange('valor_bruto', parseFloat(e.target.value) || 0)}
                    placeholder="15000.00"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="precio_custodio">Precio Custodio *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Costo del servicio de custodia/escolta</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="precio_custodio"
                    type="number"
                    step="0.01"
                    value={formData.precio_custodio}
                    onChange={(e) => handleInputChange('precio_custodio', parseFloat(e.target.value) || 0)}
                    placeholder="8000.00"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="costo_operativo">Costo Operativo *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Costos operativos totales (combustible, mantenimiento, etc.)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="costo_operativo"
                    type="number"
                    step="0.01"
                    value={formData.costo_operativo}
                    onChange={(e) => handleInputChange('costo_operativo', parseFloat(e.target.value) || 0)}
                    placeholder="5000.00"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="costo_custodio">Costo Custodio</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Costo adicional específico del custodio</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="costo_custodio"
                    type="number"
                    step="0.01"
                    value={formData.costo_custodio || 0}
                    onChange={(e) => handleInputChange('costo_custodio', parseFloat(e.target.value) || 0)}
                    placeholder="2000.00"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="costo_maximo_casetas">Máximo Casetas</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Costo máximo permitido para casetas de peaje</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="costo_maximo_casetas"
                    type="number"
                    step="0.01"
                    value={formData.costo_maximo_casetas || 0}
                    onChange={(e) => handleInputChange('costo_maximo_casetas', parseFloat(e.target.value) || 0)}
                    placeholder="1500.00"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="pago_custodio_sin_arma">Pago Sin Arma</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Pago al custodio cuando no porta arma</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="pago_custodio_sin_arma"
                    type="number"
                    step="0.01"
                    value={formData.pago_custodio_sin_arma || 0}
                    onChange={(e) => handleInputChange('pago_custodio_sin_arma', parseFloat(e.target.value) || 0)}
                    placeholder="1000.00"
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
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="distancia_km">Distancia (km)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Distancia total del recorrido en kilómetros</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="distancia_km"
                    type="number"
                    step="0.01"
                    value={formData.distancia_km || 0}
                    onChange={(e) => handleInputChange('distancia_km', parseFloat(e.target.value) || 0)}
                    placeholder="450.5"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="fecha_vigencia">Fecha de Vigencia *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fecha hasta la cual es válida esta tarifa</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Notas adicionales, restricciones o comentarios especiales</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones || ''}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Ej: Horario específico, restricciones de carga, contacto especial..."
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Si está activa, la ruta aparecerá disponible para cotizaciones</p>
                  </TooltipContent>
                </Tooltip>
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
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const RouteManagementForm = memo(RouteManagementFormComponent);