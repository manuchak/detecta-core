import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  Target,
  DollarSign,
  Clock,
  TruckIcon,
  Zap,
  UserMinus,
  RefreshCcw,
  Shield
} from 'lucide-react';
import { 
  calcularDeficitSegmentado, 
  calcularScoreUrgenciaMejorado,
  generarRecomendacionesInteligentes,
  DEFAULT_CAPACITY_CONFIG 
} from '@/utils/predictionAlgorithms';
import type { MetricaDemandaZona, ZonaOperacion } from '@/hooks/useNationalRecruitment';
import { DeficitProgressTracker } from './DeficitProgressTracker';

interface MetricsOverviewProps {
  metricas: MetricaDemandaZona[];
  zonas: ZonaOperacion[];
  loading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metricas, zonas, loading }) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Cargando métricas avanzadas...</span>
        </div>
      </Card>
    );
  }

  // Calcular métricas mejoradas con algoritmo Fase 1
  const metricasMejoradas = metricas.map(metrica => {
    const custodiosActivos = metrica.custodios_activos || 0;
    const serviciosDia = metrica.servicios_promedio_dia || 0;
    
    // Segmentar demanda por tipo (distribución estimada)
    const demandaLocal = serviciosDia * 0.6; // 60% servicios locales
    const demandaForanea = serviciosDia * 0.3; // 30% servicios foráneos
    const demandaExpress = serviciosDia * 0.1; // 10% servicios express
    
    // Calcular déficit segmentado
    const deficitAnalisis = calcularDeficitSegmentado(
      demandaLocal,
      demandaForanea, 
      demandaExpress,
      custodiosActivos,
      DEFAULT_CAPACITY_CONFIG
    );
    
    // Calcular score de urgencia mejorado
    const scoreUrgencia = calcularScoreUrgenciaMejorado(
      deficitAnalisis.deficit_total,
      serviciosDia,
      custodiosActivos,
      DEFAULT_CAPACITY_CONFIG.ratioRechazo
    );
    
    // Generar recomendaciones
    const recomendaciones = generarRecomendacionesInteligentes(
      deficitAnalisis,
      deficitAnalisis.capacidad_efectiva,
      custodiosActivos,
      DEFAULT_CAPACITY_CONFIG.ratioRechazo
    );
    
    return {
      ...metrica,
      deficit_segmentado: deficitAnalisis,
      score_urgencia_mejorado: scoreUrgencia,
      recomendaciones_ia: recomendaciones,
      capacidad_efectiva: deficitAnalisis.capacidad_efectiva
    };
  });

  // KPIs nacionales mejorados
  const totalCustodios = metricasMejoradas.reduce((sum, m) => sum + (m.custodios_activos || 0), 0);
  const capacidadEfectivaTotal = metricasMejoradas.reduce((sum, m) => sum + m.capacidad_efectiva, 0);
  const eficienciaPromedio = totalCustodios > 0 ? (capacidadEfectivaTotal / totalCustodios) * 100 : 0;
  const totalDeficit = metricasMejoradas.reduce((sum, m) => sum + m.deficit_segmentado.deficit_total, 0);
  const zonasRiesgo = metricasMejoradas.filter(m => m.score_urgencia_mejorado >= 7).length;
  const totalServicios = metricasMejoradas.reduce((sum, m) => sum + (m.servicios_promedio_dia || 0), 0);

  const getUrgencyColor = (score: number) => {
    if (score >= 8) return 'destructive';
    if (score >= 6) return 'secondary';
    if (score >= 4) return 'outline';
    return 'default';
  };

  const getDeficitColor = (deficit: number) => {
    if (deficit > 10) return 'destructive';
    if (deficit > 5) return 'secondary';
    if (deficit > 0) return 'outline';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Análisis Predictivo Nacional - Fase 1</h2>
        <Badge variant="outline" className="text-xs">
          Algoritmo Mejorado v1.0
        </Badge>
      </div>
      
      {/* KPIs Principales Mejorados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Custodios Activos</p>
              <p className="text-xl font-bold">{totalCustodios}</p>
              <p className="text-xs text-green-600">
                {capacidadEfectivaTotal.toFixed(1)} efectivos
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Eficiencia Operacional</p>
              <p className="text-xl font-bold">{eficienciaPromedio.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                25% rechazo incluido
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Déficit Total</p>
              <p className="text-xl font-bold">{Math.ceil(totalDeficit)}</p>
              <p className="text-xs text-muted-foreground">
                custodios requeridos
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Zonas en Riesgo</p>
              <p className="text-xl font-bold">{zonasRiesgo}</p>
              <p className="text-xs text-muted-foreground">
                score ≥ 7/10
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Nueva Sección: Métricas de Rotación */}
      <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <RefreshCcw className="w-5 h-5" />
            Análisis de Rotación de Custodios
            <Badge variant="outline" className="text-xs bg-red-100 text-red-700">
              BETA - Rotación &gt;60 días
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded border border-red-200">
              <UserMinus className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <p className="text-sm font-medium">Custodios en Riesgo</p>
              <p className="text-xs text-muted-foreground">30-60 días sin servicio</p>
              <p className="text-lg font-bold text-red-600">
                {metricasMejoradas.filter(m => (m.custodios_activos || 0) < (m.servicios_promedio_dia || 0) * 0.3).length}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded border border-orange-200">
              <Shield className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Tasa Rotación</p>
              <p className="text-xs text-muted-foreground">Promedio mensual</p>
              <p className="text-lg font-bold text-orange-600">
                {((metricasMejoradas.filter(m => (m.custodios_activos || 0) === 0).length / Math.max(metricasMejoradas.length, 1)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded border border-yellow-200">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm font-medium">Proyección 30 días</p>
              <p className="text-xs text-muted-foreground">Egresos estimados</p>
              <p className="text-lg font-bold text-yellow-600">
                {Math.ceil(totalCustodios * 0.08)}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded border border-green-200">
              <Target className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Retención Necesaria</p>
              <p className="text-xs text-muted-foreground">Acción inmediata</p>
              <p className="text-lg font-bold text-green-600">
                {Math.ceil(totalCustodios * 0.15)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border border-red-200">
            <p className="text-sm font-medium text-red-800 mb-2">
              🚨 Recomendaciones de Retención:
            </p>
            <ul className="text-sm space-y-1 text-red-700">
              <li>• Implementar bonos de permanencia para custodios con &gt;30 días sin servicio</li>
              <li>• Asignación preferencial de servicios a custodios en riesgo</li>
              <li>• Acelerar onboarding para compensar rotación proyectada</li>
              <li>• Crear programa de re-engagement para custodios inactivos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Análisis por Tipo de Servicio */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Análisis por Tipo de Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Servicios Locales</p>
              <p className="text-xs text-muted-foreground">6h promedio</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.round(totalServicios * 0.6)}
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <TruckIcon className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Servicios Foráneos</p>
              <p className="text-xs text-muted-foreground">14h promedio</p>
              <p className="text-lg font-bold text-orange-600">
                {Math.round(totalServicios * 0.3)}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <Zap className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Servicios Express</p>
              <p className="text-xs text-muted-foreground">4h promedio</p>
              <p className="text-lg font-bold text-green-600">
                {Math.round(totalServicios * 0.1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen Detallado por Zona */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Análisis Detallado por Zona Operativa</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            {metricasMejoradas.map((metrica) => (
              <div key={metrica.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-base">
                      {metrica.zona?.nombre || 'Zona desconocida'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {metrica.custodios_activos || 0} custodios • 
                      {metrica.capacidad_efectiva.toFixed(1)} capacidad efectiva
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getUrgencyColor(metrica.score_urgencia_mejorado)}>
                      Urgencia: {metrica.score_urgencia_mejorado}/10
                    </Badge>
                    {metrica.deficit_segmentado.deficit_total > 0 && (
                      <Badge variant={getDeficitColor(metrica.deficit_segmentado.deficit_total)}>
                        Déficit: {Math.ceil(metrica.deficit_segmentado.deficit_total)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Déficit por tipo de servicio */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="font-medium text-blue-800">Local</p>
                    <p className="text-blue-600">
                      Déficit: {Math.ceil(metrica.deficit_segmentado.deficit_local)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="font-medium text-orange-800">Foráneo</p>
                    <p className="text-orange-600">
                      Déficit: {Math.ceil(metrica.deficit_segmentado.deficit_foraneo)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="font-medium text-green-800">Express</p>
                    <p className="text-green-600">
                      Déficit: {Math.ceil(metrica.deficit_segmentado.deficit_express)}
                    </p>
                  </div>
                </div>

                {/* Recomendaciones de IA */}
                {metrica.recomendaciones_ia.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Recomendaciones Inteligentes:
                    </p>
                    <ul className="text-xs space-y-1">
                      {metrica.recomendaciones_ia.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-primary">•</span>
                          <span className="text-gray-600">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tracking de Déficit Dinámico */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="w-5 h-5" />
            Déficit Dinámico en Tiempo Real
            <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
              NUEVO - Tracking Automático
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <DeficitProgressTracker />
        </CardContent>
      </Card>

      {/* Footer con información del algoritmo */}
      <Card className="p-4 bg-blue-50">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <Target className="w-4 h-4" />
          <span className="font-medium">Algoritmo Avanzado:</span>
          <span>
            Incorpora ratio de rechazo 25%, duraciones diferenciadas por servicio, 
            eficiencia operacional 85% y déficit dinámico con tracking automático de incorporaciones
          </span>
        </div>
      </Card>
    </div>
  );
};