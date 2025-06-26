
import { useLeadsDiagnostic } from "@/hooks/useLeadsDiagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export const LeadsDiagnostic = () => {
  const { data: diagnostic, isLoading, error } = useLeadsDiagnostic();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Diagnóstico de Leads - Analizando...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Ejecutando diagnóstico...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error en Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!diagnostic) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Diagnóstico de Leads - Análisis de Causa Raíz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen de errores */}
        {diagnostic.errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">❌ Errores Encontrados:</h4>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              {diagnostic.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Estado de autenticación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">🔐 Autenticación</h4>
            <Badge variant={diagnostic.userAuth?.user ? "default" : "destructive"}>
              {diagnostic.userAuth?.user ? "✅ Autenticado" : "❌ No autenticado"}
            </Badge>
            {diagnostic.userAuth?.user && (
              <p className="text-sm mt-2 text-gray-600">
                Email: {diagnostic.userAuth.user.email}
              </p>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">👤 Roles</h4>
            {diagnostic.userRole?.data && diagnostic.userRole.data.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {diagnostic.userRole.data.map((roleItem: any, index: number) => (
                  <Badge key={index} variant="secondary">
                    {roleItem.role}
                  </Badge>
                ))}
              </div>
            ) : (
              <Badge variant="destructive">❌ Sin roles</Badge>
            )}
          </div>
        </div>

        {/* Información de la consulta */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2">📊 Resultados de Consulta</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {diagnostic.leadCount}
              </div>
              <div className="text-sm text-gray-600">Total Leads</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {diagnostic.directQuery?.error ? (
                  <span className="text-red-600">❌</span>
                ) : (
                  <span className="text-green-600">✅</span>
                )}
              </div>
              <div className="text-sm text-gray-600">Consulta Directa</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {diagnostic.sampleLeads?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Leads Visibles</div>
            </div>
          </div>
        </div>

        {/* Error específico de la consulta */}
        {diagnostic.directQuery?.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">🚨 Error Específico de la Consulta:</h4>
            <p className="text-red-700 font-mono text-sm">
              {diagnostic.directQuery.error.message}
            </p>
            <p className="text-red-600 text-sm mt-2">
              Código: {diagnostic.directQuery.error.code}
            </p>
          </div>
        )}

        {/* Muestra de leads si existen */}
        {diagnostic.sampleLeads && diagnostic.sampleLeads.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✅ Muestra de Leads Encontrados:</h4>
            <div className="space-y-2">
              {diagnostic.sampleLeads.slice(0, 3).map((lead: any, index: number) => (
                <div key={index} className="text-sm bg-white p-2 rounded border">
                  <strong>{lead.nombre}</strong> - {lead.email}
                  {lead.empresa && ` (${lead.empresa})`}
                  <br />
                  <span className="text-gray-500">
                    Estado: {lead.estado} | Fuente: {lead.fuente || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información técnica */}
        <details className="p-4 border rounded-lg">
          <summary className="font-semibold cursor-pointer">🔧 Información Técnica</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(diagnostic, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};
