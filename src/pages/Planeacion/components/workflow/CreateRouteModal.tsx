import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useRouteAudit } from '@/hooks/useRouteAudit';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  origin?: string;
  destination?: string;
  onRouteCreated: (route: any) => void;
  freeTextMode?: boolean;
}

const DIAS_SEMANA = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miércoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sábado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
];

export function CreateRouteModal({
  open,
  onOpenChange,
  clientName,
  origin = '',
  destination = '',
  onRouteCreated,
  freeTextMode = false
}: CreateRouteModalProps) {
  const { logRouteAction, checkDailyLimit, logging } = useRouteAudit();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [canCreateToday, setCanCreateToday] = useState<boolean | null>(null);
  
  const [formData, setFormData] = useState({
    origen_texto: origin,
    destino_texto: destination,
    valor_bruto: '',
    precio_custodio: '',
    costo_operativo: '',
    distancia_km: '',
    tipo_servicio: 'Punto A-B',
    dias_operacion: [] as string[],
    justificacion: '',
    es_ruta_reparto: false,
    puntos_intermedios: [] as Array<{
      orden: number;
      nombre: string;
      direccion: string;
      tiempo_estimado_parada_min: number;
      observaciones?: string;
    }>
  });

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      // Check daily limit when opening modal
      const canCreate = await checkDailyLimit();
      setCanCreateToday(canCreate);
    }
    onOpenChange(newOpen);
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      dias_operacion: prev.dias_operacion.includes(day)
        ? prev.dias_operacion.filter(d => d !== day)
        : [...prev.dias_operacion, day]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.origen_texto || formData.origen_texto.trim().length === 0) {
      toast.error('El origen es requerido');
      return false;
    }
    if (!formData.destino_texto || formData.destino_texto.trim().length === 0) {
      toast.error('El destino es requerido');
      return false;
    }
    if (!formData.valor_bruto || parseFloat(formData.valor_bruto) <= 0) {
      toast.error('El valor bruto debe ser mayor a 0');
      return false;
    }
    if (!formData.precio_custodio || parseFloat(formData.precio_custodio) <= 0) {
      toast.error('El precio custodio debe ser mayor a 0');
      return false;
    }
    if (!formData.distancia_km || parseFloat(formData.distancia_km) <= 0) {
      toast.error('La distancia debe ser mayor a 0');
      return false;
    }
    if (!formData.justificacion || formData.justificacion.trim().length < 20) {
      toast.error('La justificación debe tener al menos 20 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // 🔍 Pre-insert type validation
    console.log('🔍 [CreateRouteModal] Pre-insert validation:', {
      dias_operacion_value: formData.dias_operacion,
      dias_operacion_type: typeof formData.dias_operacion,
      is_array: Array.isArray(formData.dias_operacion),
      will_stringify: true,
      cliente: clientName,
      origen: formData.origen_texto,
      destino: formData.destino_texto
    });

    if (canCreateToday === false) {
      toast.error('Has alcanzado el límite diario de creación de rutas');
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const routeData = {
        cliente_nombre: clientName,
        origen_texto: formData.origen_texto.trim(),
        destino_texto: formData.destino_texto.trim(),
        valor_bruto: parseFloat(formData.valor_bruto),
        precio_custodio: parseFloat(formData.precio_custodio),
        costo_operativo: formData.costo_operativo ? parseFloat(formData.costo_operativo) : null,
        distancia_km: parseFloat(formData.distancia_km),
        tipo_servicio: formData.tipo_servicio,
        // IMPORTANTE: dias_operacion debe ser JSON string porque la columna en DB es TEXT
        // La BD almacena: '["lunes","martes"]' (string JSON)
        // NO enviar: ['lunes','martes'] (array directo) ❌
        dias_operacion: JSON.stringify(formData.dias_operacion),
        es_ruta_reparto: formData.es_ruta_reparto || false,
        puntos_intermedios: formData.es_ruta_reparto && formData.puntos_intermedios
          ? JSON.stringify(formData.puntos_intermedios)
          : '[]',
        activo: true,
        created_by: user.id
      };

      // Insert route
      const { data: newRoute, error: insertError } = await supabase
        .from('matriz_precios_rutas')
        .insert(routeData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Log the audit
      await logRouteAction({
        route_id: newRoute.id,
        action_type: 'created',
        new_data: routeData,
        justification: formData.justificacion
      });

      // Refrescar queries activas para sincronizar el estado INMEDIATAMENTE
      await queryClient.refetchQueries({ 
        queryKey: ['origenes-con-frecuencia', clientName],
        type: 'active' // Solo refrescar queries que están siendo observadas
      });

      await queryClient.refetchQueries({ 
        queryKey: ['destinos-from-pricing', clientName],
        type: 'active'
      });

      await queryClient.refetchQueries({ 
        queryKey: ['clientes-from-pricing'],
        type: 'active'
      });

      // Invalidar queries no activas para que se refresquen cuando se monten
      await queryClient.invalidateQueries({ queryKey: ['matriz_precios_rutas'] });

      // Delay más largo para asegurar que los datos se propaguen
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Ruta creada exitosamente', {
        description: 'La ruta ha sido registrada y está lista para usar'
      });

      // Call parent callback with new route
      onRouteCreated(newRoute);
      
      // Reset form and close
      setFormData({
        origen_texto: '',
        destino_texto: '',
        valor_bruto: '',
        precio_custodio: '',
        costo_operativo: '',
        distancia_km: '',
        tipo_servicio: 'Punto A-B',
        dias_operacion: [],
        justificacion: '',
        es_ruta_reparto: false,
        puntos_intermedios: []
      });
      onOpenChange(false);

    } catch (err) {
      console.error('❌ [CreateRouteModal] Error creating route:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown',
        errorDetails: err instanceof Error ? err.stack : null,
        formData: {
          cliente: clientName,
          origen: formData.origen_texto,
          destino: formData.destino_texto,
          dias_operacion_type: typeof formData.dias_operacion,
          dias_operacion: formData.dias_operacion
        }
      });
      
      toast.error('Error al crear la ruta', {
        description: err instanceof Error 
          ? `${err.message}. Revisa la consola para más detalles.`
          : 'Error desconocido. Contacta a soporte técnico.'
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Ruta</DialogTitle>
          <DialogDescription>
            Complete la información para registrar una nueva ruta en la matriz de precios
          </DialogDescription>
        </DialogHeader>

        {canCreateToday === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Has alcanzado el límite diario de creación de rutas (5 rutas por día). 
              Intenta nuevamente mañana o contacta a un coordinador.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client field (read-only) */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-muted-foreground">Cliente</Label>
              <p className="text-sm font-medium">{clientName}</p>
            </div>
          </div>

          {/* Origin and Destination fields (free text) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origen_texto">Origen *</Label>
              <Input
                id="origen_texto"
                type="text"
                placeholder="Ej: QUERETARO, QUERETARO"
                value={formData.origen_texto}
                onChange={(e) => setFormData(prev => ({ ...prev, origen_texto: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destino_texto">Destino *</Label>
              <Input
                id="destino_texto"
                type="text"
                placeholder="Ej: CELAYA, GUANAJUATO"
                value={formData.destino_texto}
                onChange={(e) => setFormData(prev => ({ ...prev, destino_texto: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Pricing fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_bruto">Valor Bruto (MXN) *</Label>
              <Input
                id="valor_bruto"
                type="number"
                step="0.01"
                placeholder="2500.00"
                value={formData.valor_bruto}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_bruto: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio_custodio">Precio Custodio (MXN) *</Label>
              <Input
                id="precio_custodio"
                type="number"
                step="0.01"
                placeholder="800.00"
                value={formData.precio_custodio}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_custodio: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costo_operativo">Costo Operativo (MXN)</Label>
            <Input
              id="costo_operativo"
              type="number"
              step="0.01"
              placeholder="150.00"
              value={formData.costo_operativo}
              onChange={(e) => setFormData(prev => ({ ...prev, costo_operativo: e.target.value }))}
            />
          </div>

          {/* Service details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distancia_km">Distancia (KM) *</Label>
              <Input
                id="distancia_km"
                type="number"
                step="0.1"
                placeholder="25.5"
                value={formData.distancia_km}
                onChange={(e) => setFormData(prev => ({ ...prev, distancia_km: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_servicio">Tipo de Servicio *</Label>
              <Select
                value={formData.tipo_servicio}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_servicio: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Punto A-B">Punto A-B</SelectItem>
                  <SelectItem value="Reparto">Reparto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Operating days */}
          <div className="space-y-2">
            <Label>Días de Operación</Label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map(dia => (
                <Button
                  key={dia.value}
                  type="button"
                  variant={formData.dias_operacion.includes(dia.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDayToggle(dia.value)}
                >
                  {dia.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justificacion">
              Justificación de Creación * 
              <span className="text-xs text-muted-foreground ml-2">
                (mínimo 20 caracteres)
              </span>
            </Label>
            <Textarea
              id="justificacion"
              placeholder="Explique por qué es necesario crear esta ruta. Ej: Cliente nuevo con operación recurrente, ruta no existente en matriz actual..."
              value={formData.justificacion}
              onChange={(e) => setFormData(prev => ({ ...prev, justificacion: e.target.value }))}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.justificacion.length} / 20 caracteres mínimos
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Esta acción quedará registrada en el sistema de auditoría con tu usuario, 
              fecha y hora. Los coordinadores revisarán periódicamente las rutas creadas.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating || logging}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={creating || logging || canCreateToday === false}
            >
              {(creating || logging) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Ruta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
