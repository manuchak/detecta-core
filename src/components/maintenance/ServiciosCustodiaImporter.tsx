import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info,
  Database,
  RefreshCw
} from 'lucide-react';
import { parseExcelFile, ExcelData, MappingConfig } from '@/utils/excelImporter';
import { 
  importCustodianServices, 
  CustodianServiceImportResult, 
  CustodianServiceImportProgress,
  getCustodianServicesDefaultMapping 
} from '@/services/custodianServicesImportService';
import { toast } from 'sonner';

interface ServiciosCustodiaImporterProps {
  onImportComplete?: () => void;
}

type ImporterState = 'idle' | 'processing' | 'completed' | 'error';

interface ImporterData {
  state: ImporterState;
  file: File | null;
  excelData: ExcelData | null;
  mapping: MappingConfig;
  progress: CustodianServiceImportProgress | null;
  results: CustodianServiceImportResult | null;
}

export const ServiciosCustodiaImporter: React.FC<ServiciosCustodiaImporterProps> = ({
  onImportComplete
}) => {
  const [importerData, setImporterData] = useState<ImporterData>({
    state: 'idle',
    file: null,
    excelData: null,
    mapping: {},
    progress: null,
    results: null
  });

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Por favor selecciona un archivo CSV o Excel válido');
      return;
    }

    try {
      setImporterData(prev => ({ ...prev, state: 'processing', file }));
      
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

      // Transform data based on mapping
      const mappedData = excelData.rows.map(row => {
        const mappedRow: any = {};
        Object.entries(mapping).forEach(([excelKey, dbField]) => {
          mappedRow[dbField] = row[excelKey];
        });
        return mappedRow;
      });

      // Start import process
      const results = await importCustodianServices(
        mappedData,
        (progress) => {
          setImporterData(prev => ({ ...prev, progress }));
        }
      );

      setImporterData(prev => ({
        ...prev,
        state: results.success ? 'completed' : 'error',
        excelData,
        mapping,
        results
      }));

      if (results.success) {
        toast.success(`Importación completada: ${results.imported} nuevos, ${results.updated} actualizados`);
        onImportComplete?.();
      } else {
        toast.warning(`Importación con errores: ${results.imported} nuevos, ${results.updated} actualizados, ${results.failed} fallidos`);
      }

    } catch (error) {
      toast.error(`Error al procesar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setImporterData(prev => ({ 
        ...prev, 
        state: 'error',
        results: {
          success: false,
          imported: 0,
          updated: 0,
          failed: 0,
          errors: [error instanceof Error ? error.message : 'Error desconocido'],
          warnings: []
        }
      }));
    }
  }, [onImportComplete]);

  const resetImporter = () => {
    setImporterData({
      state: 'idle',
      file: null,
      excelData: null,
      mapping: {},
      progress: null,
      results: null
    });
  };

  const renderIdleState = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Actualizar Servicios de Custodia</h4>
          <p className="text-muted-foreground mb-4">
            Cargar archivo CSV/Excel para actualizar la tabla servicios_custodia
          </p>
        </div>
        <input
          type="file"
          id="csv-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
        <label htmlFor="csv-upload">
          <Button asChild variant="outline" className="cursor-pointer">
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Seleccionar Archivo CSV/Excel
            </span>
          </Button>
        </label>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div><strong>Funcionalidad UPSERT:</strong> Los registros existentes serán actualizados, los nuevos serán insertados.</div>
            <div><strong>Identificador:</strong> Se usa 'id_servicio' como clave única para determinar si actualizar o insertar.</div>
            <div><strong>Campos importantes:</strong> id_servicio, nombre_cliente, origen, destino, fecha_hora_cita, estado, nombre_custodio.</div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderProcessingState = () => (
    <div className="space-y-4 text-center">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <FileText className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <div>
        <h4 className="text-lg font-semibold">Procesando Importación</h4>
        <p className="text-muted-foreground">
          {importerData.progress?.message || 'Preparando importación...'}
        </p>
      </div>
      
      {importerData.file && (
        <div className="text-sm text-muted-foreground">
          Archivo: <Badge variant="outline">{importerData.file.name}</Badge>
        </div>
      )}
      
      {importerData.progress && (
        <div className="space-y-2">
          <Progress 
            value={(importerData.progress.current / importerData.progress.total) * 100} 
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            {importerData.progress.current} de {importerData.progress.total} registros procesados
          </p>
        </div>
      )}
    </div>
  );

  const renderCompletedState = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h4 className="text-lg font-semibold text-green-700 dark:text-green-300">
          Importación Completada Exitosamente
        </h4>
      </div>

      {importerData.results && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-center">Nuevos</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {importerData.results.imported}
              </div>
              <p className="text-xs text-muted-foreground">registros insertados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-center">Actualizados</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {importerData.results.updated}
              </div>
              <p className="text-xs text-muted-foreground">registros modificados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-center">Errores</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {importerData.results.failed}
              </div>
              <p className="text-xs text-muted-foreground">registros fallidos</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={resetImporter}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Nueva Importación
        </Button>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h4 className="text-lg font-semibold text-red-700 dark:text-red-300">
          Error en la Importación
        </h4>
      </div>

      {importerData.results && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">Nuevos</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importerData.results.imported}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">Actualizados</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importerData.results.updated}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">Errores</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importerData.results.failed}
                </div>
              </CardContent>
            </Card>
          </div>

          {importerData.results.errors && importerData.results.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Errores encontrados:</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importerData.results.errors.slice(0, 5).map((error, idx) => (
                    <div key={idx} className="text-xs">{error}</div>
                  ))}
                  {importerData.results.errors.length > 5 && (
                    <div className="text-xs font-medium">
                      ... y {importerData.results.errors.length - 5} errores más
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={resetImporter}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Importación y Actualización de Servicios
        </CardTitle>
        <CardDescription>
          Sistema de carga masiva con capacidad de upsert para la tabla servicios_custodia
        </CardDescription>
      </CardHeader>
      <CardContent>
        {importerData.state === 'idle' && renderIdleState()}
        {importerData.state === 'processing' && renderProcessingState()}
        {importerData.state === 'completed' && renderCompletedState()}
        {importerData.state === 'error' && renderErrorState()}
      </CardContent>
    </Card>
  );
};

export default ServiciosCustodiaImporter;