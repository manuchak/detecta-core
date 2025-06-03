
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Database, 
  Shield, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Clock
} from "lucide-react";
import { ForensicAuditPanel } from "@/components/dashboard/ForensicAuditPanel";
import { TiempoRetrasoCard } from "@/components/dashboard/TiempoRetrasoCard";
import { useForensicAudit } from "@/hooks/useForensicAudit";

export const ForensicAuditPage = () => {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const { 
    forensicData, 
    comparisonData, 
    suspiciousPatterns, 
    isLoading, 
    hasDiscrepancies, 
    criticalIssues,
    highSeverityPatterns 
  } = useForensicAudit();

  const handleRefresh = () => {
    setLastRefresh(new Date());
    window.location.reload(); // Force refresh of all data
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl shadow-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/90 via-red-700/90 to-red-800/90 rounded-2xl"></div>
          
          <div className="relative px-8 py-12 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mr-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Auditoría Forense
                </h1>
                <p className="text-red-100 text-lg font-medium">
                  Análisis exhaustivo de integridad de datos
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-8 mt-8">
              <div className="flex items-center text-white/90">
                <Database className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Análisis completo</span>
              </div>
              <div className="flex items-center text-white/90">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Detección de anomalías</span>
              </div>
              <div className="flex items-center text-white/90">
                <BarChart3 className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Comparación datos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-slate-800">
                <Database className="h-5 w-5 mr-2" />
                Panel de Control de Auditoría
              </CardTitle>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-sm">
                  Última actualización: {lastRefresh.toLocaleTimeString()}
                </Badge>
                <Button onClick={handleRefresh} size="sm" disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-slate-900">
                  {forensicData?.total_registros_raw?.toLocaleString() || '-'}
                </div>
                <div className="text-sm text-slate-600">Total Registros</div>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-slate-900">
                  {forensicData?.servicios_unicos_id?.toLocaleString() || '-'}
                </div>
                <div className="text-sm text-slate-600">Servicios Únicos</div>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <AlertTriangle className={`h-8 w-8 mx-auto mb-2 ${hasDiscrepancies ? 'text-red-600' : 'text-green-600'}`} />
                <div className="text-2xl font-bold text-slate-900">
                  {criticalIssues.length}
                </div>
                <div className="text-sm text-slate-600">Problemas Críticos</div>
              </div>
              
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <Shield className={`h-8 w-8 mx-auto mb-2 ${highSeverityPatterns.length > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                <div className="text-2xl font-bold text-slate-900">
                  {highSeverityPatterns.length}
                </div>
                <div className="text-sm text-slate-600">Patrones Sospechosos</div>
              </div>
            </div>

            {/* Status Alert */}
            <Alert className={`border-2 ${hasDiscrepancies ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
              {hasDiscrepancies ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <AlertTitle className={hasDiscrepancies ? 'text-red-800' : 'text-green-800'}>
                Estado General: {hasDiscrepancies ? 'REQUIERE ATENCIÓN' : 'SISTEMA SALUDABLE'}
              </AlertTitle>
              <AlertDescription className={hasDiscrepancies ? 'text-red-700' : 'text-green-700'}>
                {hasDiscrepancies ? (
                  `Se detectaron ${criticalIssues.length} problemas críticos y ${highSeverityPatterns.length} patrones de alta severidad que requieren revisión inmediata.`
                ) : (
                  'Todos los sistemas operan dentro de parámetros normales. No se detectaron anomalías críticas.'
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Análisis de Tiempo de Retraso */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TiempoRetrasoCard />
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Clock className="h-5 w-5 mr-2" />
                  Resumen de Puntualidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {forensicData?.servicios_puntuales || 0}
                    </div>
                    <div className="text-sm text-green-700">Servicios Puntuales</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {forensicData?.servicios_con_retraso_positivo || 0}
                    </div>
                    <div className="text-sm text-red-700">Con Retraso</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {forensicData?.servicios_con_retraso_negativo || 0}
                    </div>
                    <div className="text-sm text-blue-700">Antes de Tiempo</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-gray-600 mb-1">
                      {forensicData?.promedio_retraso_minutos?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-sm text-gray-700">Promedio (min)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Panel Principal de Auditoría Forense */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Database className="h-6 w-6 mr-3" />
            Análisis Forense Detallado
          </h2>
          <ForensicAuditPanel />
        </div>
      </div>
    </div>
  );
};

export default ForensicAuditPage;
