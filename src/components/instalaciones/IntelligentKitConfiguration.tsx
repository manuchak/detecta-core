import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Cpu, 
  CreditCard, 
  HardDrive, 
  Star, 
  AlertCircle, 
  CheckCircle,
  Package,
  Loader2
} from 'lucide-react';
import { useEnhancedKitsInstalacion } from '@/hooks/useEnhancedKitsInstalacion';

interface IntelligentKitConfigurationProps {
  programacionId: string;
  formData: {
    vehiculo_marca: string;
    vehiculo_modelo: string;
    tipo_instalacion: string;
    sensores_requeridos: string[];
  };
  onAutoAssign: () => void;
  onManualConfig: (config: any) => void;
  isAutoAssigning: boolean;
}

export const IntelligentKitConfiguration = ({ 
  programacionId,
  formData,
  onAutoAssign,
  onManualConfig,
  isAutoAssigning
}: IntelligentKitConfigurationProps) => {
  const [selectedGps, setSelectedGps] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showManualConfig, setShowManualConfig] = useState(false);
  
  const { 
    obtenerRecomendacionesInteligentes, 
    isLoading 
  } = useEnhancedKitsInstalacion();

  useEffect(() => {
    loadRecommendations();
  }, [programacionId]);

  const loadRecommendations = async () => {
    try {
      const tipoVehiculo = `${formData.vehiculo_marca} ${formData.vehiculo_modelo}`;
      const recomendaciones = await obtenerRecomendacionesInteligentes(
        tipoVehiculo,
        formData.sensores_requeridos,
        formData.tipo_instalacion
      );
      setRecommendations(recomendaciones);
      
      // Auto-select best recommendation
      if (recomendaciones.length > 0) {
        setSelectedGps(recomendaciones[0].producto_id);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const renderScoreBar = (score: number) => (
    <div className="flex items-center gap-2">
      <Progress value={score} className="flex-1 h-2" />
      <span className="text-sm font-medium">{score}%</span>
    </div>
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">
              Analizando compatibilidad y generando recomendaciones inteligentes...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto Assignment Option */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Zap className="h-5 w-5" />
            Asignación Automática Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-600">
            Nuestro sistema analizará automáticamente los requisitos y asignará el mejor kit disponible 
            basado en compatibilidad, stock y precio.
          </p>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={onAutoAssign}
              disabled={isAutoAssigning}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isAutoAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando automáticamente...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Asignar Kit Automáticamente
                </>
              )}
            </Button>
            
            <span className="text-sm text-muted-foreground">o</span>
            
            <Button 
              variant="outline"
              onClick={() => setShowManualConfig(!showManualConfig)}
            >
              Configuración Manual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Configuration */}
      {showManualConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recomendaciones de GPS ({recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <Card 
                key={rec.producto_id} 
                className={`cursor-pointer transition-all ${
                  selectedGps === rec.producto_id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedGps(rec.producto_id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{rec.nombre}</h4>
                        {index === 0 && (
                          <Badge variant="default" className="bg-green-100 text-green-700">
                            <Star className="h-3 w-3 mr-1" />
                            Recomendado
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Marca: {rec.marca}</p>
                          <p className="text-muted-foreground">Modelo: {rec.modelo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stock: {rec.stock_disponible} unidades</p>
                          <p className="text-muted-foreground">Precio: ${rec.precio_venta.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Score de Compatibilidad:</span>
                          <span className={`font-bold ${getScoreColor(rec.score)}`}>
                            {rec.score}%
                          </span>
                        </div>
                        {renderScoreBar(rec.score)}
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Justificación:</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.justificacion.map((razon: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {razon}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {rec.sensores_compatibles.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Sensores Compatibles:</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.sensores_compatibles.slice(0, 3).map((sensor: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {sensor}
                              </Badge>
                            ))}
                            {rec.sensores_compatibles.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{rec.sensores_compatibles.length - 3} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col items-center gap-2">
                      {selectedGps === rec.producto_id && (
                        <CheckCircle className="h-6 w-6 text-blue-500" />
                      )}
                      
                      <div className="flex flex-col items-center gap-1">
                        <Cpu className="h-4 w-4 text-gray-500" />
                        {rec.requiere_microsd && (
                          <HardDrive className="h-4 w-4 text-gray-500" />
                        )}
                        <CreditCard className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {selectedGps && (
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => onManualConfig({ 
                    gps_seleccionado: selectedGps,
                    asignacion_automatica: false 
                  })}
                  size="lg"
                >
                  Continuar con Configuración Manual
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requirements Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Requisitos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Vehículo:</strong> {formData.vehiculo_marca} {formData.vehiculo_modelo}</p>
              <p><strong>Tipo de Instalación:</strong> {formData.tipo_instalacion}</p>
            </div>
            <div>
              <p><strong>Sensores Requeridos:</strong> {formData.sensores_requeridos.length}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.sensores_requeridos.map((sensor, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {sensor.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};