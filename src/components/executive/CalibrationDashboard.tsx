import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, TrendingUp, Target, Brain, Activity } from 'lucide-react';

const CalibrationDashboard = () => {
  // Mock data for demonstration
  const mockCalibrationData = {
    currentAccuracy: 87.5,
    systemConfidence: 82.3,
    dataQuality: 'excellent',
    modelAgreement: 91.2,
    trendStability: 78.9,
    regimeDetected: 'normal',
    recommendations: [
      '✅ Sistema funcionando óptimamente',
      '📊 Calidad de datos excelente',
      '🎯 Alta precisión en predicciones'
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calibración del Sistema de Forecasting</h2>
          <p className="text-muted-foreground">
            Monitoreo y evaluación de precisión en tiempo real
          </p>
        </div>
      </div>

      {/* Current Performance Alert */}
      <Alert className="border-green-200 bg-green-50">
        <Activity className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong>Precisión actual del sistema:</strong> {mockCalibrationData.currentAccuracy}% 
          <span className="block mt-1 text-sm">
            💡 Sistema funcionando correctamente
          </span>
        </AlertDescription>
      </Alert>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precisión General</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockCalibrationData.currentAccuracy}%
            </div>
            <Progress 
              value={mockCalibrationData.currentAccuracy} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Incertidumbre: ±5.2%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confianza del Sistema</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockCalibrationData.systemConfidence}%
            </div>
            <Progress 
              value={mockCalibrationData.systemConfidence} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Datos de alta calidad y consenso entre modelos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calidad de Datos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="default">Excelente</Badge>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Consenso modelos:</span>
                <span>{mockCalibrationData.modelAgreement}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Estabilidad:</span>
                <span>{mockCalibrationData.trendStability}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Régimen Detectado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="default">Normal</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Confianza: 85%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Prediction */}
      <Card>
        <CardHeader>
          <CardTitle>Predicción Actual del Sistema</CardTitle>
          <CardDescription>
            Ensemble de modelos avanzados con análisis estacional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Servicios Proyectados</p>
              <p className="text-3xl font-bold text-blue-600">
                1,180
              </p>
              <p className="text-xs text-muted-foreground">
                Rango: 1,050 - 1,320
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">GMV Proyectado</p>
              <p className="text-3xl font-bold text-green-600">
                $7.67M
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confianza</p>
              <p className="text-3xl font-bold">
                85%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockCalibrationData.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                {rec.includes('🔴') ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                )}
                <span className="text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Modelos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Seasonal (Principal)</span>
                <Badge variant="default">MAPE: 8.5%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Linear Regression</span>
                <Badge variant="secondary">MAPE: 12.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Holt-Winters</span>
                <Badge variant="secondary">MAPE: 10.8%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Consenso entre Modelos</span>
                  <span className="text-sm font-medium">{mockCalibrationData.modelAgreement}%</span>
                </div>
                <Progress value={mockCalibrationData.modelAgreement} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Estabilidad de Tendencia</span>
                  <span className="text-sm font-medium">{mockCalibrationData.trendStability}%</span>
                </div>
                <Progress value={mockCalibrationData.trendStability} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Implementación</CardTitle>
          <CardDescription>
            Funcionalidades del sistema de forecasting avanzado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Implementado</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Análisis estacional por día de la semana</li>
                <li>• Corrección de desfase de datos (1 día)</li>
                <li>• Proyección con patrones históricos</li>
                <li>• Dashboard de calibración</li>
                <li>• Validación en tiempo real</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🚧 En Desarrollo</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Modelos avanzados (Prophet, ARIMA)</li>
                <li>• Backtesting sistemático completo</li>
                <li>• Detección de régimen automática</li>
                <li>• Ensemble inteligente adaptativo</li>
                <li>• Alertas de precisión automáticas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalibrationDashboard;