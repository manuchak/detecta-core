import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useMachineLearningPrediction } from "@/hooks/useMachineLearningPrediction";
import { Brain, Target, TrendingUp, Zap, Settings, BarChart3, Cpu, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useState } from "react";

export const MachineLearningPanel = () => {
  const { 
    mlPredictions, 
    zoneClusters, 
    modelValidation, 
    availableModels, 
    isLoading,
    trainingData 
  } = useMachineLearningPrediction();

  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [modelConfig, setModelConfig] = useState<Record<string, any>>({});

  const handleConfigureModel = (model: any) => {
    setSelectedModel(model);
    setModelConfig(model.hyperparameters || {});
  };

  const handleSaveConfig = () => {
    console.log('Guardando configuración del modelo:', selectedModel?.name, modelConfig);
    setSelectedModel(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Machine Learning Predictivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Entrenando modelos de Machine Learning...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sistema de Machine Learning
          </CardTitle>
          <CardDescription>
            Modelos predictivos avanzados para optimización de reclutamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Estadísticas de entrenamiento */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Datos de Entrenamiento</div>
                    <div className="text-2xl font-bold">{trainingData?.length || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-success" />
                  <div>
                    <div className="text-sm text-muted-foreground">Precisión del Modelo</div>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const accuracy = modelValidation?.accuracy || 0;
                        console.log('🎯 MachineLearningPanel - Precisión del modelo:', {
                          modelValidation,
                          accuracy
                        });
                        return accuracy > 0 ? `${Math.round(accuracy * 100)}%` : 'Calculando...';
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-warning" />
                  <div>
                    <div className="text-sm text-muted-foreground">Predicciones Activas</div>
                    <div className="text-2xl font-bold">{mlPredictions?.length || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-info" />
                  <div>
                    <div className="text-sm text-muted-foreground">Clusters Identificados</div>
                    <div className="text-2xl font-bold">{zoneClusters?.length || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="predictions" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="predictions">Predicciones ML</TabsTrigger>
              <TabsTrigger value="clusters">Clustering de Zonas</TabsTrigger>
              <TabsTrigger value="models">Modelos Disponibles</TabsTrigger>
              <TabsTrigger value="validation">Validación</TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mlPredictions?.map((prediction) => (
                  <Card key={prediction.zona_id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {prediction.zona_nombre}
                      </CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {prediction.model_used}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Demanda Predicha</span>
                        <Badge variant="default" className="text-lg px-3 py-1">
                          {prediction.predicted_demand}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Confianza</span>
                          <span>{Math.round(prediction.confidence_score * 100)}%</span>
                        </div>
                        <Progress value={prediction.confidence_score * 100} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Importancia de Características</h4>
                        <div className="space-y-1">
                          {Object.entries(prediction.feature_importance)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                            .map(([feature, importance]) => (
                            <div key={feature} className="flex items-center justify-between text-xs">
                              <span className="capitalize">{feature.replace('_', ' ')}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-8 bg-muted rounded-full h-1">
                                  <div 
                                    className="h-1 bg-primary rounded-full" 
                                    style={{ width: `${importance * 100}%` }}
                                  />
                                </div>
                                <span>{Math.round(importance * 100)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {mlPredictions && mlPredictions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Predicciones vs Confianza</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart data={mlPredictions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          dataKey="predicted_demand" 
                          name="Demanda Predicha"
                          domain={['dataMin', 'dataMax']}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="confidence_score" 
                          name="Confianza"
                          domain={[0, 1]}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value, name) => [
                            name === 'confidence_score' ? `${Math.round(Number(value) * 100)}%` : value,
                            name === 'confidence_score' ? 'Confianza' : 'Demanda'
                          ]}
                          labelFormatter={(_, payload) => {
                            if (payload && payload[0]) {
                              return payload[0].payload.zona_nombre;
                            }
                            return '';
                          }}
                        />
                        <Scatter 
                          dataKey="confidence_score" 
                          fill="hsl(var(--primary))"
                          name="Predicciones"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="clusters" className="space-y-4">
              {zoneClusters && zoneClusters.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[0, 1, 2, 3].map(clusterId => {
                      const clusterZones = zoneClusters.filter(z => z.cluster_id === clusterId);
                      if (clusterZones.length === 0) return null;
                      
                      const representative = clusterZones[0];
                      
                      return (
                        <Card key={clusterId}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Badge variant="outline">Cluster {clusterId + 1}</Badge>
                              <span className="text-sm">{clusterZones.length} zonas</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Demanda Promedio</span>
                                <div className="font-medium">{representative.cluster_characteristics.avg_demand}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Crecimiento</span>
                                <div className="font-medium">
                                  {Math.round(representative.cluster_characteristics.growth_rate * 100)}%
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Estacionalidad</span>
                                <div className="font-medium">
                                  {Math.round(representative.cluster_characteristics.seasonality_strength * 100)}%
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Volatilidad</span>
                                <div className="font-medium">
                                  {Math.round(representative.cluster_characteristics.volatility * 100)}%
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Estrategia Recomendada</h4>
                              <p className="text-xs text-muted-foreground">
                                {representative.recommended_strategy}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Zonas en este Cluster</h4>
                              <div className="flex flex-wrap gap-1">
                                {clusterZones.slice(0, 5).map(zone => (
                                  <Badge key={zone.zona_id} variant="secondary" className="text-xs">
                                    {zone.zona_nombre}
                                  </Badge>
                                ))}
                                {clusterZones.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{clusterZones.length - 5} más
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Perfil de Clusters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={[0, 1, 2, 3].map(clusterId => {
                          const clusterZones = zoneClusters.filter(z => z.cluster_id === clusterId);
                          if (clusterZones.length === 0) return null;
                          
                          const char = clusterZones[0].cluster_characteristics;
                          return {
                            cluster: `Cluster ${clusterId + 1}`,
                            demanda: char.avg_demand / 50 * 100, // Normalizar a 0-100
                            crecimiento: char.growth_rate * 100,
                            estacionalidad: char.seasonality_strength * 100,
                            volatilidad: char.volatility * 100
                          };
                        }).filter(Boolean)}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="cluster" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar 
                            name="Demanda" 
                            dataKey="demanda" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))" 
                            fillOpacity={0.1}
                          />
                          <Radar 
                            name="Crecimiento" 
                            dataKey="crecimiento" 
                            stroke="hsl(var(--success))" 
                            fill="hsl(var(--success))" 
                            fillOpacity={0.1}
                          />
                          <Radar 
                            name="Estacionalidad" 
                            dataKey="estacionalidad" 
                            stroke="hsl(var(--warning))" 
                            fill="hsl(var(--warning))" 
                            fillOpacity={0.1}
                          />
                          <Radar 
                            name="Volatilidad" 
                            dataKey="volatilidad" 
                            stroke="hsl(var(--destructive))" 
                            fill="hsl(var(--destructive))" 
                            fillOpacity={0.1}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                      No hay suficientes datos para realizar clustering
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableModels.map((model) => (
                  <Card key={model.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-sm">{model.name}</span>
                        <Badge variant={model.type === 'regression' ? 'default' : 
                                     model.type === 'classification' ? 'secondary' : 'outline'}>
                          {model.type}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Precisión</span>
                        <div className="flex items-center gap-2">
                          <Progress value={model.accuracy * 100} className="w-16 h-2" />
                          <span className="text-sm">{Math.round(model.accuracy * 100)}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Datos de Entrenamiento</span>
                        <span className="text-sm font-medium">{model.training_data_points}</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Hiperparámetros</span>
                        <div className="space-y-1">
                          {Object.entries(model.hyperparameters).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="capitalize">{key.replace('_', ' ')}</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3" />
                        <span>Último entrenamiento: {new Date(model.last_trained).toLocaleDateString()}</span>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleConfigureModel(model)}
                          >
                            <Settings className="h-3 w-3 mr-2" />
                            Configurar Modelo
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Configurar {model.name}</DialogTitle>
                            <DialogDescription>
                              Ajusta los hiperparámetros del modelo de {model.type}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {Object.entries(model.hyperparameters).map(([key, value]) => (
                              <div key={key} className="space-y-2">
                                <Label className="capitalize">{key.replace('_', ' ')}</Label>
                                {typeof value === 'number' ? (
                                  key.includes('rate') || key.includes('regularization') ? (
                                    <div className="space-y-2">
                                      <Slider
                                        value={[modelConfig[key] || value]}
                                        onValueChange={(vals) => setModelConfig(prev => ({...prev, [key]: vals[0]}))}
                                        max={key.includes('rate') ? 0.1 : 1}
                                        min={0.001}
                                        step={0.001}
                                        className="w-full"
                                      />
                                      <div className="text-xs text-muted-foreground text-right">
                                        {(modelConfig[key] || value).toFixed(3)}
                                      </div>
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      value={modelConfig[key] || value}
                                      onChange={(e) => setModelConfig(prev => ({...prev, [key]: Number(e.target.value)}))}
                                      min={1}
                                      max={key.includes('depth') ? 20 : key.includes('iter') ? 500 : 100}
                                    />
                                  )
                                ) : (
                                  <Input
                                    value={modelConfig[key] || value}
                                    onChange={(e) => setModelConfig(prev => ({...prev, [key]: e.target.value}))}
                                  />
                                )}
                              </div>
                            ))}
                            <div className="flex gap-2 pt-4">
                              <Button variant="outline" className="w-full" onClick={() => setSelectedModel(null)}>
                                Cancelar
                              </Button>
                              <Button className="w-full" onClick={handleSaveConfig}>
                                Guardar Configuración
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              {modelValidation ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Métricas de Validación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {Math.round(modelValidation.accuracy * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Precisión General</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success">
                            {modelValidation.r_squared.toFixed(3)}
                          </div>
                          <div className="text-sm text-muted-foreground">R² Score</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Error Cuadrático Medio</span>
                          <span>{modelValidation.mse.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Validaciones Cruzadas</span>
                          <span>{modelValidation.cross_validation_scores.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Scores de Validación Cruzada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={modelValidation.cross_validation_scores.map((score, index) => ({
                          fold: `Fold ${index + 1}`,
                          score: score * 100
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fold" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                          />
                          <Bar dataKey="score" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                      Datos insuficientes para validación de modelos
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};