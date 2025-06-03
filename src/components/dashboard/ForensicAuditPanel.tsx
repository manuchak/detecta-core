
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Database, TrendingUp, Users, MapPin } from "lucide-react";
import { useForensicAudit } from "@/hooks/useForensicAudit";

export const ForensicAuditPanel = () => {
  const { 
    forensicData, 
    comparisonData, 
    suspiciousPatterns, 
    isLoading, 
    hasDiscrepancies, 
    criticalIssues,
    highSeverityPatterns 
  } = useForensicAudit();

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Database className="h-5 w-5 mr-2" />
            Auditoría Forense en Progreso...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-blue-200 rounded w-3/4"></div>
            <div className="h-4 bg-blue-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Estado de Auditoría */}
      <Alert className={`border-2 ${hasDiscrepancies ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
        {hasDiscrepancies ? (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        <AlertTitle className={hasDiscrepancies ? 'text-red-800' : 'text-green-800'}>
          Estado de Auditoría Forense: {hasDiscrepancies ? 'DISCREPANCIAS DETECTADAS' : 'DATOS CONSISTENTES'}
        </AlertTitle>
        <AlertDescription className={hasDiscrepancies ? 'text-red-700' : 'text-green-700'}>
          {hasDiscrepancies ? (
            <>
              Se encontraron {criticalIssues.length} problemas críticos y {highSeverityPatterns.length} patrones de alta severidad.
              Se recomienda revisión inmediata de los datos.
            </>
          ) : (
            'Los datos del dashboard son consistentes con el análisis forense de la base de datos.'
          )}
        </AlertDescription>
      </Alert>

      {/* Métricas Principales de Auditoría */}
      {forensicData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Integridad de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Total Registros:</span>
                <span className="text-sm font-medium">{forensicData.total_registros_raw.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Enero-Actual:</span>
                <span className="text-sm font-medium">{forensicData.registros_enero_actual.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">IDs Únicos:</span>
                <span className="text-sm font-medium">{forensicData.servicios_unicos_id.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Duplicados:</span>
                <span className={`text-sm font-medium ${forensicData.registros_duplicados_id > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {forensicData.registros_duplicados_id.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Análisis Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">GMV Total:</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat('es-MX', { 
                    style: 'currency', 
                    currency: 'MXN',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(forensicData.gmv_total_sin_filtros)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">GMV Finalizados:</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat('es-MX', { 
                    style: 'currency', 
                    currency: 'MXN',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(forensicData.gmv_solo_finalizados)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Con Cobro Válido:</span>
                <span className="text-sm font-medium">{forensicData.registros_con_cobro_valido.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Sin Cobro:</span>
                <span className={`text-sm font-medium ${forensicData.registros_con_cobro_null > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {forensicData.registros_con_cobro_null.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Recursos Humanos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Custodios Distintos:</span>
                <span className="text-sm font-medium">{forensicData.custodios_distintos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Clientes Distintos:</span>
                <span className="text-sm font-medium">{forensicData.clientes_distintos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Sin Custodio:</span>
                <span className={`text-sm font-medium ${forensicData.registros_sin_custodio > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {forensicData.registros_sin_custodio.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Errores #N/A:</span>
                <span className={`text-sm font-medium ${forensicData.custodios_con_hash_na > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {forensicData.custodios_con_hash_na.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparación Dashboard vs Forense */}
      {comparisonData && comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Comparación Dashboard vs Auditoría Forense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comparisonData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.metric_name}</div>
                    <div className="text-sm text-gray-600">
                      Dashboard: {item.dashboard_value.toLocaleString()} | 
                      Forense: {item.forensic_value.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={item.status === 'OK' ? 'default' : item.status === 'MEDIA' ? 'secondary' : 'destructive'}
                      className="mb-1"
                    >
                      {item.status}
                    </Badge>
                    <div className="text-sm">
                      {item.discrepancy > 0 ? '+' : ''}{item.discrepancy.toLocaleString()} 
                      ({item.discrepancy_percent}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patrones Sospechosos */}
      {suspiciousPatterns && suspiciousPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <XCircle className="h-5 w-5 mr-2" />
              Patrones Sospechosos Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suspiciousPatterns.map((pattern, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{pattern.pattern_type}</div>
                    <Badge 
                      variant={pattern.severity === 'BAJA' ? 'secondary' : pattern.severity === 'MEDIA' ? 'default' : 'destructive'}
                    >
                      {pattern.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{pattern.pattern_description}</div>
                  <div className="text-sm font-medium">Casos encontrados: {pattern.count_found.toLocaleString()}</div>
                  {pattern.sample_data && (
                    <div className="text-xs text-gray-500 mt-1">Ejemplos: {pattern.sample_data}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
