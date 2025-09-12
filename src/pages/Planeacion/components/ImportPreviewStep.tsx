import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  AlertTriangle, 
  CheckCircle 
} from 'lucide-react';
import { ExcelData, MappingConfig, transformDataForImport } from '@/utils/excelImporter';

interface ImportPreviewStepProps<TProgress = any, TResult = any> {
  data: ExcelData;
  mapping: MappingConfig;
  onConfirm: () => void;
  onBack: () => void;
  importFunction: (data: any[], onProgress?: (progress: TProgress) => void) => Promise<TResult>;
}

export default function ImportPreviewStep<TProgress = any, TResult = any>({
  data,
  mapping,
  onConfirm,
  onBack,
  importFunction
}: ImportPreviewStepProps<TProgress, TResult>) {
  const [transformedData, setTransformedData] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<TProgress | null>(null);
  const [importResult, setImportResult] = useState<TResult | null>(null);

  useEffect(() => {
    const transformed = transformDataForImport(data, mapping);
    setTransformedData(transformed);
    setPreviewRows(transformed.slice(0, 5)); // Show first 5 rows as preview
  }, [data, mapping]);

  const handleStartImport = async () => {
    setIsImporting(true);
    
    try {
      const result = await importFunction(transformedData, (progress) => {
        setImportProgress(progress);
      });
      
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        failed: transformedData.length,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
        warnings: []
      } as TResult);
    } finally {
      setIsImporting(false);
    }
  };

  const mappedFields = Object.entries(mapping)
    .filter(([_, dbField]) => dbField !== '')
    .map(([_, dbField]) => dbField);

  if (isImporting) {
    return (
      <div className="space-y-6 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Importando Datos</h3>
          <p className="text-muted-foreground">
            {(importProgress as any)?.message || 'Procesando registros...'}
          </p>
        </div>

        {importProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso: {(importProgress as any).current || 0} de {(importProgress as any).total || 0}</span>
              <span>{Math.round(((importProgress as any).current || 0) / ((importProgress as any).total || 1) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300" 
                style={{ width: `${((importProgress as any).current || 0) / ((importProgress as any).total || 1) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (importResult) {
    return (
      <div className="space-y-6 py-6">
        <div className="text-center">
          {(importResult as any).success ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          ) : (
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          )}
          <h3 className="text-lg font-semibold mb-2">
            {(importResult as any).success ? 'Importación Completada' : 'Importación Completada con Errores'}
          </h3>
          <p className="text-muted-foreground">
            {(importResult as any).imported || 0} registros importados correctamente
            {(importResult as any).failed > 0 && `, ${(importResult as any).failed} registros fallaron`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-green-600">Exitosos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(importResult as any).imported || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-destructive">Fallidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(importResult as any).failed || 0}</div>
            </CardContent>
          </Card>
        </div>

        {(importResult as any).errors && (importResult as any).errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Errores encontrados:</div>
                {(importResult as any).errors.slice(0, 5).map((error: string, index: number) => (
                  <div key={index} className="text-sm">• {error}</div>
                ))}
                {(importResult as any).errors.length > 5 && (
                  <div className="text-sm">... y {(importResult as any).errors.length - 5} errores más</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button onClick={onConfirm}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Finalizar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Vista Previa de Datos</h3>
        <p className="text-muted-foreground">
          Revisa los datos que se van a importar antes de continuar
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total de Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transformedData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campos Mapeados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappedFields.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Archivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">{data.fileName}</div>
          </CardContent>
        </Card>
      </div>

      {/* Field Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campos que se Importarán</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {mappedFields.map((field) => (
              <Badge key={field} variant="secondary">
                {field.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Vista Previa (Primeros 5 registros)
          </CardTitle>
          <CardDescription>
            Verifica que los datos se estén interpretando correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {mappedFields.map((field) => (
                    <th key={field} className="text-left p-2 font-medium">
                      {field.replace('_', ' ').toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={index} className="border-b">
                    {mappedFields.map((field) => (
                      <td key={field} className="p-2">
                        <div className="max-w-32 truncate">
                          {row[field]?.toString() || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {transformedData.length > 5 && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              ... y {transformedData.length - 5} registros más
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium">Antes de continuar:</div>
            <div className="text-sm">• Asegúrate de que los datos se ven correctos en la vista previa</div>
            <div className="text-sm">• Esta acción creará {transformedData.length} nuevos registros en la base de datos</div>
            <div className="text-sm">• Los datos duplicados no se validarán automáticamente</div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        <Button onClick={handleStartImport}>
          Iniciar Importación
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}