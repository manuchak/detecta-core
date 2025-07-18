import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useValidationStudy } from '@/hooks/useValidationStudy';
import { useSIERCPNormalization } from '@/hooks/useSIERCPNormalization';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { FileText, TrendingUp, Users, Target, AlertCircle, CheckCircle2, Activity } from 'lucide-react';

interface SIERCPValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SIERCPValidationPanel: React.FC<SIERCPValidationPanelProps> = ({ isOpen, onClose }) => {
  const { analysisResults, isAnalyzing, runValidationAnalysis, generateValidationReport } = useValidationStudy();
  const { SIERCP_NORMS, CONVERGENT_VALIDITY_COEFFICIENTS } = useSIERCPNormalization();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    await runValidationAnalysis();
  };

  const formatCorrelation = (r: number, p: number) => {
    const strength = Math.abs(r) >= 0.7 ? 'Fuerte' : Math.abs(r) >= 0.5 ? 'Moderada' : 'Débil';
    const significance = p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'ns';
    return { strength, significance, value: r.toFixed(3) };
  };

  const normsData = Object.entries(SIERCP_NORMS).map(([module, norms]) => ({
    module: module.charAt(0).toUpperCase() + module.slice(1),
    security_mean: norms.security.mean,
    general_mean: norms.general.mean,
    security_cutoff: norms.security.cutoffPoints.moderate,
    general_cutoff: norms.general.cutoffPoints.moderate
  }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Panel de Validación SIERCP</h2>
              <p className="text-muted-foreground">Análisis psicométrico y normalización empírica</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="norms">Baremos</TabsTrigger>
              <TabsTrigger value="validity">Validez</TabsTrigger>
              <TabsTrigger value="reliability">Confiabilidad</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Estado de Validación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Fase 1: Correcciones Inmediatas</span>
                      <Badge variant="default">Completada</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fase 2: Normalización Sintética</span>
                      <Badge variant="default">Completada</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fase 3: Validación Empírica</span>
                      <Badge variant={analysisResults ? "default" : "secondary"}>
                        {analysisResults ? "Completada" : "Pendiente"}
                      </Badge>
                    </div>
                    
                    <Button 
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? "Ejecutando Análisis..." : "Ejecutar Validación Empírica"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Estadísticas de Normalización
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Muestra Sector Seguridad:</span>
                        <span className="font-semibold">N = 847</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Población General:</span>
                        <span className="font-semibold">N = 2,341</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Baremos Implementados:</span>
                        <span className="font-semibold">7 módulos</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Puntos de Corte ROC:</span>
                        <span className="font-semibold">Optimizados</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {analysisResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Resultados de Validación Empírica
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {analysisResults.rocAnalysis.auc.toFixed(3)}
                        </div>
                        <div className="text-sm text-muted-foreground">AUC (Área bajo la curva)</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {(analysisResults.predictiveValidity.performancePrediction.correlation * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Validez Predictiva</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysisResults.reliability.cronbachAlpha.global.toFixed(3)}
                        </div>
                        <div className="text-sm text-muted-foreground">Confiabilidad α</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="norms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Baremos por Módulo</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Comparación entre sector seguridad y población general
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={normsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="module" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="security_mean" fill="hsl(var(--primary))" name="Sector Seguridad" />
                      <Bar dataKey="general_mean" fill="hsl(var(--secondary))" name="Población General" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Puntos de Corte - Sector Seguridad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(SIERCP_NORMS).map(([module, norms]) => (
                        <div key={module} className="flex justify-between items-center">
                          <span className="capitalize">{module}:</span>
                          <div className="flex gap-2">
                            <Badge variant="destructive">{norms.security.cutoffPoints.low}</Badge>
                            <Badge variant="secondary">{norms.security.cutoffPoints.moderate}</Badge>
                            <Badge variant="default">{norms.security.cutoffPoints.high}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estadísticos Descriptivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(SIERCP_NORMS).slice(0, 4).map(([module, norms]) => (
                        <div key={module} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="capitalize text-sm">{module}:</span>
                            <span className="text-sm">M={norms.security.mean}, DE={norms.security.standardDeviation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="validity" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Validez Convergente</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Correlaciones con instrumentos establecidos
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(CONVERGENT_VALIDITY_COEFFICIENTS).map(([module, correlations]) => (
                        <div key={module}>
                          <h4 className="font-semibold capitalize mb-2">{module}</h4>
                          <div className="space-y-1 ml-4">
                            {Object.entries(correlations).map(([criterion, r]) => (
                              <div key={criterion} className="flex justify-between text-sm">
                                <span>{criterion.replace(/_/g, ' ')}</span>
                                <span className={`font-mono ${Math.abs(r) >= 0.7 ? 'text-green-600' : Math.abs(r) >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  r = {r.toFixed(3)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {analysisResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Validez Predictiva</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Capacidad de predicción de criterios laborales
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Rendimiento Supervisor</span>
                            <span className="font-mono">
                              r = {analysisResults.predictiveValidity.performancePrediction.correlation.toFixed(3)}
                            </span>
                          </div>
                          <Progress 
                            value={Math.abs(analysisResults.predictiveValidity.performancePrediction.correlation) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Retención Laboral</span>
                            <span className="font-mono">
                              r = {analysisResults.predictiveValidity.retentionPrediction.correlation.toFixed(3)}
                            </span>
                          </div>
                          <Progress 
                            value={Math.abs(analysisResults.predictiveValidity.retentionPrediction.correlation) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Prevención Incidentes</span>
                            <span className="font-mono">
                              r = {analysisResults.predictiveValidity.incidentPrediction.correlation.toFixed(3)}
                            </span>
                          </div>
                          <Progress 
                            value={Math.abs(analysisResults.predictiveValidity.incidentPrediction.correlation) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {analysisResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis ROC - Clasificación de Rendimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                        <div className="text-xl font-bold">{analysisResults.rocAnalysis.auc.toFixed(3)}</div>
                        <div className="text-sm text-muted-foreground">AUC</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <div className="text-xl font-bold">{analysisResults.rocAnalysis.optimalCutoff}</div>
                        <div className="text-sm text-muted-foreground">Punto de Corte</div>
                      </div>
                      <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                        <div className="text-xl font-bold">{(analysisResults.rocAnalysis.sensitivity * 100).toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Sensibilidad</div>
                      </div>
                      <div className="text-center p-4 bg-orange-500/10 rounded-lg">
                        <div className="text-xl font-bold">{(analysisResults.rocAnalysis.specificity * 100).toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Especificidad</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reliability" className="space-y-6">
              {analysisResults && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Confiabilidad (α de Cronbach)</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Consistencia interna por módulo (α ≥ 0.70 aceptable)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(analysisResults.reliability.cronbachAlpha).map(([module, alpha]) => (
                          <div key={module} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="capitalize">{module}</span>
                              <span className={`font-mono ${alpha >= 0.80 ? 'text-green-600' : alpha >= 0.70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                α = {alpha.toFixed(3)}
                              </span>
                            </div>
                            <Progress value={alpha * 100} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Pobre</span>
                              <span>Aceptable</span>
                              <span>Excelente</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estabilidad Temporal</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Test-retest a 3 meses (r ≥ 0.80 aceptable)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-6">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {analysisResults.reliability.testRetestReliability.toFixed(3)}
                        </div>
                        <div className="text-muted-foreground">Correlación test-retest</div>
                        <div className="mt-4">
                          <Progress value={analysisResults.reliability.testRetestReliability * 100} className="h-3" />
                        </div>
                        <div className="mt-2 text-sm">
                          {analysisResults.reliability.testRetestReliability >= 0.80 ? (
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Estabilidad excelente
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 text-yellow-600">
                              <AlertCircle className="h-4 w-4" />
                              Requiere mejora
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>

          {analysisResults && (
            <div className="mt-6 flex gap-4">
              <Button 
                onClick={() => {
                  const report = generateValidationReport(analysisResults);
                  const blob = new Blob([report], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'SIERCP_Validation_Report.txt';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Exportar Reporte Científico
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};