import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  Info
} from 'lucide-react';
import { parseExcelFile, ExcelData, MappingConfig } from '@/utils/excelImporter';
import { 
  importCustodianServices, 
  CustodianServiceImportResult, 
  CustodianServiceImportProgress,
  getCustodianServicesDefaultMapping 
} from '@/services/custodianServicesImportService';
import { 
  validateDateArrayWithFeedback, 
  getSupportedDateFormats,
  DateValidationInfo 
} from '@/utils/dateValidationUtils';
import { toast } from 'sonner';

interface CustodianServicesImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type WizardStep = 'upload' | 'preview' | 'processing' | 'results';

interface WizardState {
  step: WizardStep;
  file: File | null;
  excelData: ExcelData | null;
  mapping: MappingConfig;
  progress: CustodianServiceImportProgress | null;
  results: CustodianServiceImportResult | null;
  dateValidation: DateValidationInfo[] | null;
}

export const CustodianServicesImportWizard: React.FC<CustodianServicesImportWizardProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [state, setState] = useState<WizardState>({
    step: 'upload',
    file: null,
    excelData: null,
    mapping: {},
    progress: null,
    results: null,
    dateValidation: null
  });

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Por favor selecciona un archivo CSV o Excel válido');
      return;
    }

    try {
      const excelData = await parseExcelFile(file);
      const defaultMapping = getCustodianServicesDefaultMapping();
      
      // Auto-map columns based on headers
      const mapping: MappingConfig = {};
      excelData.columns.forEach(col => {
        const matchedField = defaultMapping[col.header] || defaultMapping[col.header.toLowerCase()];
        if (matchedField) {
          mapping[col.key] = matchedField;
        }
      });

      // Validate dates in fecha_hora_cita if mapped
      let dateValidation = null;
      const fechaHoraCitaColumn = Object.keys(mapping).find(key => mapping[key] === 'fecha_hora_cita');
      if (fechaHoraCitaColumn) {
        const dateValues = excelData.rows.map(row => row[fechaHoraCitaColumn]);
        const validationResult = validateDateArrayWithFeedback(dateValues);
        dateValidation = validationResult.validations;
      }

      setState(prev => ({
        ...prev,
        step: 'preview',
        file,
        excelData,
        mapping,
        dateValidation
      }));
    } catch (error) {
      toast.error(`Error al procesar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleStartImport = async () => {
    if (!state.excelData) return;

    setState(prev => ({ ...prev, step: 'processing' }));

    try {
      // Transform data based on mapping
      const mappedData = state.excelData.rows.map(row => {
        const mappedRow: any = {};
        Object.entries(state.mapping).forEach(([excelKey, dbField]) => {
          mappedRow[dbField] = row[excelKey];
        });
        return mappedRow;
      });

      const results = await importCustodianServices(
        mappedData,
        (progress) => {
          setState(prev => ({ ...prev, progress }));
        }
      );

      setState(prev => ({
        ...prev,
        step: 'results',
        results
      }));

      if (results.success) {
        toast.success(`Importación completada: ${results.imported} nuevos, ${results.updated} actualizados`);
      } else {
        toast.warning(`Importación con errores: ${results.imported} nuevos, ${results.updated} actualizados, ${results.failed} fallidos`);
      }

    } catch (error) {
      toast.error(`Error durante la importación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setState(prev => ({ 
        ...prev, 
        step: 'results',
        results: {
          success: false,
          imported: 0,
          updated: 0,
          failed: state.excelData?.rows.length || 0,
          errors: [error instanceof Error ? error.message : 'Error desconocido'],
          warnings: []
        }
      }));
    }
  };

  const handleClose = () => {
    setState({
      step: 'upload',
      file: null,
      excelData: null,
      mapping: {},
      progress: null,
      results: null,
      dateValidation: null
    });
    onOpenChange(false);
    if (state.results?.success) {
      onComplete?.();
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Cargar Archivo CSV/Excel</h3>
          <p className="text-muted-foreground mb-4">
            Selecciona un archivo CSV o Excel con los datos de servicios de custodios
          </p>
        </div>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
        <label htmlFor="file-upload">
          <Button asChild variant="outline" className="cursor-pointer">
            <span>Seleccionar Archivo</span>
          </Button>
        </label>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Campos requeridos:</strong> ID Servicio, Nombre Cliente, Origen, Destino.
          <br />
          <strong>Funcionalidad:</strong> Los registros existentes serán actualizados, los nuevos serán insertados (UPSERT).
          <br />
          <strong>Formatos de fecha soportados:</strong> YYYY-MM-DD HH:MM, DD/MM/YYYY, DD-MM-YYYY HH:MM (transformación automática)
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vista Previa</h3>
          <p className="text-muted-foreground">
            {state.excelData?.rows.length} registros encontrados
          </p>
        </div>
        <Badge variant="outline">
          {state.file?.name}
        </Badge>
      </div>

      {state.excelData && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-4">
            <h4 className="font-medium mb-2">Mapeo de Columnas</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {state.excelData.columns.slice(0, 6).map(col => (
                <div key={col.key} className="flex items-center gap-2">
                  <span className="font-mono bg-background px-2 py-1 rounded">
                    {col.header}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-primary">
                    {state.mapping[col.key] || 'No mapeado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4">
            <h4 className="font-medium mb-2">Primeros 3 registros</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {state.excelData.columns.slice(0, 6).map(col => (
                      <th key={col.key} className="text-left p-2">{col.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.excelData.rows.slice(0, 3).map((row, idx) => (
                    <tr key={idx} className="border-b">
                      {state.excelData!.columns.slice(0, 6).map(col => (
                        <td key={col.key} className="p-2 truncate max-w-32">
                          {row[col.key] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Date Validation Summary */}
      {state.dateValidation && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-4">
            <h4 className="font-medium mb-2">Validación de Fechas (fecha_hora_cita)</h4>
            <div className="space-y-2">
              {/* Summary stats */}
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Válidas: {state.dateValidation.filter(v => v.isValid).length}
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Errores: {state.dateValidation.filter(v => !v.isValid).length}
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  Se convertirán: {state.dateValidation.filter(v => v.willBeTransformed).length}
                </span>
              </div>
              
              {/* Show examples of transformations */}
              {state.dateValidation.filter(v => v.willBeTransformed).slice(0, 3).map((validation, idx) => (
                <div key={idx} className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded border-l-2 border-blue-500">
                  <span className="font-mono">{validation.originalValue}</span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="font-mono">{validation.transformedValue?.split('T')[0]} {validation.transformedValue?.split('T')[1]?.split('.')[0]}</span>
                  <div className="text-blue-600 mt-1">{validation.message}</div>
                </div>
              ))}
              
              {/* Show errors if any */}
              {state.dateValidation.filter(v => !v.isValid).slice(0, 2).map((validation, idx) => (
                <div key={idx} className="text-xs bg-red-50 dark:bg-red-950 p-2 rounded border-l-2 border-red-500">
                  <span className="font-mono">{validation.originalValue}</span>
                  <div className="text-red-600 mt-1">{validation.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}>
          Volver
        </Button>
        <Button onClick={handleStartImport}>
          Iniciar Importación
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-4 text-center">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <FileText className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Procesando Importación</h3>
        <p className="text-muted-foreground">
          {state.progress?.message || 'Preparando importación...'}
        </p>
      </div>
      {state.progress && (
        <div className="space-y-2">
          <Progress 
            value={(state.progress.current / state.progress.total) * 100} 
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            {state.progress.current} de {state.progress.total} registros procesados
          </p>
        </div>
      )}
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          {state.results?.success ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600" />
          )}
        </div>
        <h3 className="text-lg font-semibold">
          {state.results?.success ? 'Importación Completada' : 'Importación con Errores'}
        </h3>
      </div>

      {state.results && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Nuevos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {state.results.imported}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Actualizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {state.results.updated}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Errores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {state.results.failed}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {state.results?.errors && state.results.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Errores encontrados:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {state.results.errors.slice(0, 5).map((error, idx) => (
                <div key={idx} className="text-xs">{error}</div>
              ))}
              {state.results.errors.length > 5 && (
                <div className="text-xs font-medium">
                  ... y {state.results.errors.length - 5} errores más
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Servicios de Custodios</DialogTitle>
          <DialogDescription>
            Cargar y actualizar datos de servicios mediante archivo CSV o Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {state.step === 'upload' && renderUploadStep()}
          {state.step === 'preview' && renderPreviewStep()}
          {state.step === 'processing' && renderProcessingStep()}
          {state.step === 'results' && renderResultsStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};