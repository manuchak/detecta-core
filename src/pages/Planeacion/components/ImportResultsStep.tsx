import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  X,
  Download,
  Info
} from 'lucide-react';
import { ImportResult } from '@/services/importService';

interface ImportResultsStepProps {
  result: ImportResult;
  onClose: () => void;
  onStartOver: () => void;
  onSwitchToUpdateMode?: () => void;
}

export default function ImportResultsStep({
  result,
  onClose,
  onStartOver,
  onSwitchToUpdateMode
}: ImportResultsStepProps) {
  const handleDownloadErrorLog = () => {
    if (result.errors.length === 0) return;

    const errorLog = [
      'Reporte de Errores de Importación',
      '='.repeat(40),
      `Fecha: ${new Date().toLocaleString()}`,
      `Total de errores: ${result.errors.length}`,
      '',
      'Errores encontrados:',
      ...result.errors.map((error, index) => `${index + 1}. ${error}`)
    ].join('\n');

    const blob = new Blob([errorLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errores_importacion_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="text-center">
        {result.success ? (
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
        ) : (
          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-600 mb-4" />
        )}
        <h3 className="text-xl font-semibold mb-2">
          {result.success ? 'Importación Exitosa' : 'Importación Completada con Problemas'}
        </h3>
        <p className="text-muted-foreground">
          {result.success 
            ? `Se importaron ${result.imported} registros correctamente`
            : `${result.imported} registros importados, ${result.failed} registros fallaron`
          }
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Registros Exitosos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{result.imported}</div>
            <div className="text-sm text-green-600">
              Registros importados correctamente
            </div>
          </CardContent>
        </Card>

        <Card className={result.failed > 0 ? "border-red-200 bg-red-50" : "border-gray-200"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-base flex items-center gap-2 ${result.failed > 0 ? 'text-red-700' : 'text-gray-600'}`}>
              <AlertTriangle className="h-4 w-4" />
              Registros Fallidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${result.failed > 0 ? 'text-red-700' : 'text-gray-600'}`}>
              {result.failed}
            </div>
            <div className={`text-sm ${result.failed > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              Registros que no se pudieron importar
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Switch to Update Mode */}
      {result.suggestedAction === 'switch_to_update' && onSwitchToUpdateMode && (
        <Alert className="border-blue-500 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-1">
                  💡 Solución Rápida
                </div>
                <p className="text-sm text-blue-800">
                  Los IDs ya existen en la base de datos. ¿Quieres cambiar a modo <strong>Actualizar</strong> para modificarlos?
                </p>
              </div>
              <Button 
                onClick={onSwitchToUpdateMode}
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              >
                🔄 Cambiar a Modo Actualizar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {result.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="font-medium">¡Importación completada exitosamente!</div>
            <div className="mt-1">
              Todos los registros se importaron correctamente. Puedes encontrar los nuevos servicios en la lista principal.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Advertencias encontradas:</div>
              {result.warnings.slice(0, 3).map((warning, index) => (
                <div key={index} className="text-sm">• {warning}</div>
              ))}
              {result.warnings.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  ... y {result.warnings.length - 3} advertencias más
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Errores Encontrados ({result.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {result.errors.slice(0, 10).map((error, index) => (
                <div key={index} className="text-sm p-3 bg-red-50 rounded border-l-4 border-red-200">
                  {error}
                </div>
              ))}
              {result.errors.length > 10 && (
                <div className="text-sm text-muted-foreground text-center p-2">
                  ... y {result.errors.length - 10} errores más
                </div>
              )}
            </div>
            
            {result.errors.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadErrorLog}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Reporte de Errores
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos Pasos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {result.imported > 0 && (
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Revisa los servicios importados en la lista principal</span>
              </div>
            )}
            
            {result.failed > 0 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <span>Corrige los errores en el archivo Excel y vuelve a importar los registros fallidos</span>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <span>Verifica que los clientes referenciados existan en el sistema</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <span>Considera asignar custodios a los servicios importados</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onClose} size="lg">
          <CheckCircle className="h-4 w-4 mr-2" />
          Finalizar
        </Button>
        
        <Button variant="outline" onClick={onStartOver} size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Importar Otro Archivo
        </Button>
      </div>
    </div>
  );
}