import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VapiAnalyticsDashboard } from './VapiAnalyticsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Settings, 
  BarChart3, 
  Phone,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap
} from "lucide-react";

export const VapiManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión VAPI</h1>
          <p className="text-muted-foreground mt-2">
            Sistema de entrevistas automáticas con inteligencia artificial
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sistema Activo
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Resumen General
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Detallado
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automatización</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">80%</div>
                <p className="text-xs text-muted-foreground">
                  Entrevistas automatizadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Ahorrado</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">70%</div>
                <p className="text-xs text-muted-foreground">
                  Reducción en procesamiento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Precisión</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">92%</div>
                <p className="text-xs text-muted-foreground">
                  Decisiones precisas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Escalabilidad</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">∞</div>
                <p className="text-xs text-muted-foreground">
                  Entrevistas simultáneas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Estado del Sistema
                </CardTitle>
                <CardDescription>
                  Funcionalidades y configuración actual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Asistente de IA</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhook Receiver</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Funcionando
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-decisiones</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Habilitado
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Detección Red Flags</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activa
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Scoring Automático</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operativo
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beneficios del Sistema</CardTitle>
                <CardDescription>
                  Impacto en el proceso de reclutamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Entrevistas 24/7</span>
                      <p className="text-xs text-muted-foreground">
                        Sin limitaciones de horario o disponibilidad
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Evaluación Objetiva</span>
                      <p className="text-xs text-muted-foreground">
                        Criterios consistentes para todos los candidatos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Documentación Completa</span>
                      <p className="text-xs text-muted-foreground">
                        Transcripción, grabación y análisis automático
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Reducción de Sesgo</span>
                      <p className="text-xs text-muted-foreground">
                        Evaluaciones basadas en datos objetivos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Process Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Proceso Automático</CardTitle>
              <CardDescription>
                Cómo funciona la evaluación automática de candidatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-sm">1. Llamada Automática</h4>
                  <p className="text-xs text-muted-foreground">
                    VAPI llama al candidato
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Bot className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-sm">2. Entrevista IA</h4>
                  <p className="text-xs text-muted-foreground">
                    Preguntas estructuradas
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-sm">3. Análisis</h4>
                  <p className="text-xs text-muted-foreground">
                    Evaluación automática
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h4 className="font-medium text-sm">4. Decisión</h4>
                  <p className="text-xs text-muted-foreground">
                    Aprobar/Rechazar/Revisar
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-medium text-sm">5. Actualización</h4>
                  <p className="text-xs text-muted-foreground">
                    Sistema actualizado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <VapiAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Ajustes y parámetros del asistente VAPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Criterios de Aprobación Automática</h4>
                    <div className="space-y-2 text-sm">
                      <div>• Score ≥ 8.5/10</div>
                      <div>• Aptitud General: "Excelente"</div>
                      <div>• 0 Red Flags detectados</div>
                      <div>• Referencias verificables: Sí</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Criterios de Rechazo Automático</h4>
                    <div className="space-y-2 text-sm">
                      <div>• Score &lt; 5.0/10</div>
                      <div>• 2+ Red Flags detectados</div>
                      <div>• Inconsistencias graves</div>
                      <div>• Problemas de comunicación</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Estado de Integración</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <h5 className="font-medium">VAPI API</h5>
                          <p className="text-sm text-muted-foreground">Conectado</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <h5 className="font-medium">Base de Datos</h5>
                          <p className="text-sm text-muted-foreground">Sincronizado</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <h5 className="font-medium">Webhooks</h5>
                          <p className="text-sm text-muted-foreground">Activos</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="mt-4">
                  <Button className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración Avanzada
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};