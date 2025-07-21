import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  TrendingUp,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConfiguracionOperacional {
  ratio_rechazo_promedio: number;
  disponibilidad_custodios_horas: number;
  eficiencia_operacional: number;
  tiempo_respuesta_promedio_minutos: number;
}

interface ConfiguracionServicios {
  local: { duracion: number; complejidad: number };
  foraneo: { duracion: number; complejidad: number };
  express: { duracion: number; complejidad: number };
}

interface AdvancedConfigPanelProps {
  onConfigChange?: (config: ConfiguracionOperacional & { servicios: ConfiguracionServicios }) => void;
}

export const AdvancedConfigPanel: React.FC<AdvancedConfigPanelProps> = ({ onConfigChange }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para configuración operacional
  const [config, setConfig] = useState<ConfiguracionOperacional>({
    ratio_rechazo_promedio: 0.25,
    disponibilidad_custodios_horas: 16,
    eficiencia_operacional: 0.85,
    tiempo_respuesta_promedio_minutos: 30
  });

  // Estados para configuración de servicios
  const [serviciosConfig, setServiciosConfig] = useState<ConfiguracionServicios>({
    local: { duracion: 6, complejidad: 3 },
    foraneo: { duracion: 14, complejidad: 7 },
    express: { duracion: 4, complejidad: 5 }
  });

  // Cargar configuración desde la base de datos
  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      // Cargar métricas operacionales (tomar valores promedio globales)
      const { data: metricasOp, error: errorMetricas } = await supabase
        .from('metricas_operacionales_zona')
        .select('*')
        .limit(1)
        .single();

      if (metricasOp && !errorMetricas) {
        setConfig({
          ratio_rechazo_promedio: metricasOp.ratio_rechazo_promedio,
          disponibilidad_custodios_horas: metricasOp.disponibilidad_custodios_horas,
          eficiencia_operacional: metricasOp.eficiencia_operacional,
          tiempo_respuesta_promedio_minutos: metricasOp.tiempo_respuesta_promedio_minutos
        });
      }

      // Cargar configuración de servicios
      const { data: servicios, error: errorServicios } = await supabase
        .from('servicios_segmentados')
        .select('tipo_servicio, duracion_promedio_horas, complejidad_score')
        .limit(3);

      if (servicios && !errorServicios) {
        const nuevaConfigServicios: ConfiguracionServicios = {
          local: { duracion: 6, complejidad: 3 },
          foraneo: { duracion: 14, complejidad: 7 },
          express: { duracion: 4, complejidad: 5 }
        };

        servicios.forEach(servicio => {
          const tipo = servicio.tipo_servicio as keyof ConfiguracionServicios;
          if (nuevaConfigServicios[tipo]) {
            nuevaConfigServicios[tipo] = {
              duracion: servicio.duracion_promedio_horas,
              complejidad: servicio.complejidad_score
            };
          }
        });

        setServiciosConfig(nuevaConfigServicios);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Guardar configuración en la base de datos
  const guardarConfiguracion = async () => {
    setSaving(true);
    try {
      // Actualizar métricas operacionales globalmente
      const { error: errorMetricas } = await supabase
        .from('metricas_operacionales_zona')
        .update(config)
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Actualizar todos los registros

      if (errorMetricas) throw errorMetricas;

      // Actualizar configuración de servicios
      for (const [tipo, configTipo] of Object.entries(serviciosConfig)) {
        const { error: errorServicio } = await supabase
          .from('servicios_segmentados')
          .update({
            duracion_promedio_horas: configTipo.duracion,
            complejidad_score: configTipo.complejidad
          })
          .eq('tipo_servicio', tipo);

        if (errorServicio) throw errorServicio;
      }

      // Notificar cambio a componente padre
      if (onConfigChange) {
        onConfigChange({ ...config, servicios: serviciosConfig });
      }

      toast({
        title: "Configuración guardada",
        description: "Los cambios se aplicarán en el próximo análisis",
        variant: "default"
      });
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const resetearConfiguracion = () => {
    setConfig({
      ratio_rechazo_promedio: 0.25,
      disponibilidad_custodios_horas: 16,
      eficiencia_operacional: 0.85,
      tiempo_respuesta_promedio_minutos: 30
    });
    setServiciosConfig({
      local: { duracion: 6, complejidad: 3 },
      foraneo: { duracion: 14, complejidad: 7 },
      express: { duracion: 4, complejidad: 5 }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuración Avanzada del Algoritmo
          <Badge variant="outline" className="ml-auto">Fase 1</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuración Operacional */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Parámetros Operacionales
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ratio-rechazo">
                Ratio de Rechazo ({(config.ratio_rechazo_promedio * 100).toFixed(0)}%)
              </Label>
              <Slider
                id="ratio-rechazo"
                min={0}
                max={0.5}
                step={0.05}
                value={[config.ratio_rechazo_promedio]}
                onValueChange={([value]) => 
                  setConfig(prev => ({ ...prev, ratio_rechazo_promedio: value }))
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Porcentaje de servicios que los custodios rechazan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eficiencia">
                Eficiencia Operacional ({(config.eficiencia_operacional * 100).toFixed(0)}%)
              </Label>
              <Slider
                id="eficiencia"
                min={0.5}
                max={1}
                step={0.05}
                value={[config.eficiencia_operacional]}
                onValueChange={([value]) => 
                  setConfig(prev => ({ ...prev, eficiencia_operacional: value }))
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Factor de eficiencia en la ejecución de servicios
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horas-disponibles">Horas Disponibles/Día</Label>
              <Input
                id="horas-disponibles"
                type="number"
                min={8}
                max={24}
                value={config.disponibilidad_custodios_horas}
                onChange={(e) => 
                  setConfig(prev => ({ 
                    ...prev, 
                    disponibilidad_custodios_horas: parseInt(e.target.value) || 16 
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Horas promedio que un custodio está disponible
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiempo-respuesta">Tiempo Respuesta (min)</Label>
              <Input
                id="tiempo-respuesta"
                type="number"
                min={10}
                max={120}
                value={config.tiempo_respuesta_promedio_minutos}
                onChange={(e) => 
                  setConfig(prev => ({ 
                    ...prev, 
                    tiempo_respuesta_promedio_minutos: parseInt(e.target.value) || 30 
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Tiempo promedio para llegar al punto de servicio
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Configuración de Tipos de Servicio */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Configuración por Tipo de Servicio
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(serviciosConfig).map(([tipo, configTipo]) => (
              <Card key={tipo} className="p-4">
                <h4 className="font-medium capitalize mb-3">{tipo}</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Duración (horas)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={configTipo.duracion}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 1;
                        setServiciosConfig(prev => ({
                          ...prev,
                          [tipo]: { ...prev[tipo as keyof ConfiguracionServicios], duracion: valor }
                        }));
                      }}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Complejidad (1-10)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={configTipo.complejidad}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 1;
                        setServiciosConfig(prev => ({
                          ...prev,
                          [tipo]: { ...prev[tipo as keyof ConfiguracionServicios], complejidad: valor }
                        }));
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Impacto Estimado */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Impacto Estimado de la Configuración
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">
                <strong>Capacidad Efectiva:</strong> {((1 - config.ratio_rechazo_promedio) * config.eficiencia_operacional * 100).toFixed(1)}%
              </p>
              <p className="text-blue-600 text-xs">
                De la capacidad nominal de custodios
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <strong>Servicios/Día por Custodio:</strong>
              </p>
              <p className="text-blue-600 text-xs">
                Local: {(config.disponibilidad_custodios_horas / serviciosConfig.local.duracion).toFixed(1)} • 
                Foráneo: {(config.disponibilidad_custodios_horas / serviciosConfig.foraneo.duracion).toFixed(1)} • 
                Express: {(config.disponibilidad_custodios_horas / serviciosConfig.express.duracion).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <Button 
            onClick={guardarConfiguracion} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetearConfiguracion}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
        </div>

        {/* Advertencia */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Nota importante:</p>
            <p>Los cambios en la configuración afectarán los cálculos de déficit y recomendaciones. 
            Asegúrate de que los valores reflejen la realidad operacional de tu organización.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};