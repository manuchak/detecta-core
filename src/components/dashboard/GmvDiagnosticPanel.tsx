
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGmvDiagnostic } from "@/hooks/useGmvDiagnostic";
import { Loader2, Database, AlertTriangle, CheckCircle } from "lucide-react";

export const GmvDiagnosticPanel = () => {
  const { diagnosticData, isLoading, error } = useGmvDiagnostic();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Diagnóstico GMV 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
            <span>Ejecutando diagnóstico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error en Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              Error al ejecutar el diagnóstico: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalGmv = diagnosticData.reduce((sum, month) => sum + month.gmv_servicios_unicos, 0);
  const mesesConDatos = diagnosticData.filter(month => month.gmv_servicios_unicos > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Diagnóstico GMV 2025
          <Badge variant="outline" className="ml-2">
            {mesesConDatos.length} meses con datos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${totalGmv.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700">GMV Total 2025</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {mesesConDatos.length}
            </div>
            <div className="text-sm text-green-700">Meses con Datos</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {diagnosticData.reduce((sum, month) => sum + month.servicios_unicos, 0)}
            </div>
            <div className="text-sm text-purple-700">Servicios Únicos</div>
          </div>
        </div>

        {/* Estado por mes */}
        {mesesConDatos.length === 0 ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              No se encontraron datos válidos para ningún mes de 2025. 
              Verifica que existan servicios con estado "Finalizado" y cobro válido.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              Se encontraron datos válidos en {mesesConDatos.length} mes(es). 
              El problema del gráfico puede estar en la lógica de renderizado.
            </AlertDescription>
          </Alert>
        )}

        {/* Detalle por mes */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Detalle Mensual:</h4>
          <div className="grid gap-2">
            {diagnosticData.map((month) => (
              <div
                key={month.month}
                className={`p-3 rounded-lg border ${
                  month.gmv_servicios_unicos > 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{month.month_name}</span>
                  <Badge variant={month.gmv_servicios_unicos > 0 ? "default" : "secondary"}>
                    ${month.gmv_servicios_unicos.toLocaleString()}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {month.servicios_unicos} servicios únicos de {month.total_registros} registros
                  {month.sample_services.length > 0 && (
                    <div className="mt-1">
                      IDs muestra: {month.sample_services.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
