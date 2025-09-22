import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Clock, Gauge, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  usePlanningOperationalConfig, 
  useUpdatePlanningOperationalConfig 
} from '@/hooks/usePlanningOperationalConfig';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function ParametrosOperacionalesTab() {
  const { data: config, isLoading } = usePlanningOperationalConfig();
  const updateConfig = useUpdatePlanningOperationalConfig();
  
  const [formData, setFormData] = useState({
    velocidad_promedio_kmh: 70,
    tiempo_descanso_minutos: 120,
    bloqueo_automatico_habilitado: true
  });

  // Actualizar form cuando se carga la configuración
  useEffect(() => {
    if (config) {
      setFormData({
        velocidad_promedio_kmh: config.velocidad_promedio_kmh,
        tiempo_descanso_minutos: config.tiempo_descanso_minutos,
        bloqueo_automatico_habilitado: config.bloqueo_automatico_habilitado
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!config?.id) {
      toast.error('No se pudo encontrar la configuración');
      return;
    }

    try {
      await updateConfig.mutateAsync({
        id: config.id,
        config: formData
      });
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData({
        velocidad_promedio_kmh: config.velocidad_promedio_kmh,
        tiempo_descanso_minutos: config.tiempo_descanso_minutos,
        bloqueo_automatico_habilitado: config.bloqueo_automatico_habilitado
      });
    }
  };

  const calcularEjemplo = () => {
    const km = 150;
    const horas = km / formData.velocidad_promedio_kmh;
    const minutosViaje = horas * 60;
    const tiempoTotal = minutosViaje + formData.tiempo_descanso_minutos;
    
    return {
      km,
      minutosViaje: Math.round(minutosViaje),
      tiempoDescanso: formData.tiempo_descanso_minutos,
      tiempoTotal: Math.round(tiempoTotal),
      horasTotal: (tiempoTotal / 60).toFixed(1)
    };
  };

  const ejemplo = calcularEjemplo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Parámetros Operacionales</h3>
        <Badge variant={formData.bloqueo_automatico_habilitado ? "default" : "secondary"}>
          {formData.bloqueo_automatico_habilitado ? 'Activo' : 'Inactivo'}
        </Badge>
        {config?.id === 'default' && (
          <Badge variant="outline" className="text-yellow-600">
            Configuración Temporal
          </Badge>
        )}
      </div>

      {config?.id === 'default' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Usando Configuración Temporal</h4>
              <p className="text-sm text-yellow-700 mt-1">
                La tabla de configuración aún no está disponible. Se están usando valores por defecto.
                Los cambios no se guardarán hasta que la base de datos esté completamente configurada.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuración Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gauge className="h-4 w-4" />
              <span>Configuración de Bloqueo Automático</span>
            </CardTitle>
            <CardDescription>
              Parámetros para calcular la disponibilidad automática de custodios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Switch principal */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Bloqueo Automático</Label>
                <p className="text-xs text-muted-foreground">
                  Habilitar validación automática de conflictos de horario
                </p>
              </div>
              <Switch
                checked={formData.bloqueo_automatico_habilitado}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, bloqueo_automatico_habilitado: checked }))
                }
              />
            </div>

            <Separator />

            {/* Velocidad promedio */}
            <div className="space-y-2">
              <Label htmlFor="velocidad" className="text-sm font-medium flex items-center space-x-2">
                <Gauge className="h-3 w-3" />
                <span>Velocidad Promedio (km/h)</span>
              </Label>
              <Input
                id="velocidad"
                type="number"
                min="1"
                max="150"
                value={formData.velocidad_promedio_kmh}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, velocidad_promedio_kmh: parseInt(e.target.value) || 0 }))
                }
                disabled={!formData.bloqueo_automatico_habilitado}
              />
              <p className="text-xs text-muted-foreground">
                Velocidad promedio estimada para calcular duración de servicios
              </p>
            </div>

            {/* Tiempo de descanso */}
            <div className="space-y-2">
              <Label htmlFor="descanso" className="text-sm font-medium flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>Tiempo de Descanso (minutos)</span>
              </Label>
              <Input
                id="descanso"
                type="number"
                min="0"
                max="480"
                value={formData.tiempo_descanso_minutos}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, tiempo_descanso_minutos: parseInt(e.target.value) || 0 }))
                }
                disabled={!formData.bloqueo_automatico_habilitado}
              />
              <p className="text-xs text-muted-foreground">
                Tiempo adicional después del servicio antes de la siguiente asignación
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={updateConfig.isPending || config?.id === 'default'}
                size="sm"
                className="flex-1"
              >
                {updateConfig.isPending ? 'Guardando...' : 
                 config?.id === 'default' ? 'No Disponible' : 'Guardar Cambios'}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
              >
                Restablecer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simulación y Ejemplo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Simulación de Cálculo</span>
            </CardTitle>
            <CardDescription>
              Ejemplo del cálculo automático con los parámetros actuales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center space-x-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span>Ejemplo: Servicio de {ejemplo.km} km</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiempo de viaje:</span>
                  <span>{ejemplo.minutosViaje} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiempo de descanso:</span>
                  <span>{ejemplo.tiempoDescanso} minutos</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Tiempo total de bloqueo:</span>
                  <span className="text-primary">{ejemplo.horasTotal} horas</span>
                </div>
              </div>
            </div>

            {formData.bloqueo_automatico_habilitado ? (
              <div className="flex items-center space-x-2 text-sm text-primary">
                <CheckCircle className="h-4 w-4" />
                <span>Sistema activo - Validará conflictos automáticamente</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Sistema desactivado - No validará conflictos</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-background border rounded p-3">
              <strong>¿Cómo funciona?</strong>
              <br />
              • Se calcula el tiempo de viaje usando la distancia teórica y velocidad promedio
              <br />
              • Se agrega el tiempo de descanso configurado
              <br />
              • El custodio queda bloqueado durante este período para nuevas asignaciones
              <br />
              • Se validan conflictos con servicios existentes antes de asignar
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado actual */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estado de la Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Última actualización:</strong> {new Date(config.updated_at).toLocaleString()}</p>
              <p><strong>ID de configuración:</strong> {config.id}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}