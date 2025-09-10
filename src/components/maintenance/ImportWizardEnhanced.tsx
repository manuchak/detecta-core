import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download, Save, FolderOpen } from "lucide-react";
import { parseExcelFile } from "@/utils/excelImporter";
import { importCustodianServices, CustodianServiceImportResult, CustodianServiceImportProgress } from "@/services/custodianServicesImportService";
import { validateCustodianServicesData, getQuickValidationSample, ValidationResult } from "@/services/custodianServicesValidationService";
import { useSavedMappings, SavedMapping } from "@/hooks/useSavedMappings";
import { ValidationStep } from "./ValidationStep";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface ImportWizardEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type WizardStep = 'upload' | 'mapping' | 'validation' | 'preview' | 'processing' | 'results';

interface WizardState {
  step: WizardStep;
  file: File | null;
  parsedData: any[] | null;
  mapping: Record<string, string>;
  validation: ValidationResult | null;
  progress: CustodianServiceImportProgress | null;
  result: CustodianServiceImportResult | null;
}

const DATABASE_FIELDS = {
  'Identificación': [
    'id_servicio', 'gm_transport_id', 'folio_cliente', 'id_custodio', 'id_cotizacion'
  ],
  'Cliente y Servicio': [
    'nombre_cliente', 'tipo_servicio', 'estado', 'local_foraneo', 'ruta'
  ],
  'Ubicaciones': [
    'origen', 'destino'
  ],
  'Fechas y Horarios': [
    'fecha_hora_cita', 'fecha_hora_asignacion', 'hora_presentacion', 'hora_inicio_custodia', 
    'hora_arribo', 'hora_finalizacion', 'tiempo_punto_origen', 'duracion_servicio',
    'fecha_contratacion', 'fecha_primer_servicio', 'created_at', 'updated_time'
  ],
  'Custodio': [
    'nombre_custodio', 'telefono', 'contacto_emergencia', 'telefono_emergencia', 'proveedor'
  ],
  'Vehículo y Seguridad': [
    'auto', 'placa', 'armado', 'nombre_armado', 'telefono_armado'
  ],
  'Transporte': [
    'cantidad_transportes', 'nombre_operador_transporte', 'telefono_operador',
    'placa_carga', 'tipo_unidad', 'tipo_carga', 'nombre_operador_adicional',
    'telefono_operador_adicional', 'placa_carga_adicional', 'tipo_unidad_adicional', 'tipo_carga_adicional'
  ],
  'Equipamiento': [
    'gadget_solicitado', 'gadget', 'tipo_gadget'
  ],
  'Métricas': [
    'km_teorico', 'km_recorridos', 'km_extras', 'tiempo_estimado', 'tiempo_retraso', 'presentacion'
  ],
  'Financiero': [
    'costo_custodio', 'casetas', 'cobro_cliente'
  ],
  'Observaciones': [
    'comentarios_adicionales', 'creado_via', 'creado_por'
  ]
};

export const ImportWizardEnhanced: React.FC<ImportWizardEnhancedProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [state, setState] = useState<WizardState>({
    step: 'upload',
    file: null,
    parsedData: null,
    mapping: {},
    validation: null,
    progress: null,
    result: null,
  });
  
  const [mappingName, setMappingName] = useState('');
  const { savedMappings, saveMapping, deleteMapping, loadMapping } = useSavedMappings();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const excelData = await parseExcelFile(file);
      setState(prev => ({
        ...prev,
        file,
        parsedData: excelData.rows,
        step: 'mapping'
      }));
    } catch (error) {
      toast.error('Error al procesar el archivo: ' + (error as Error).message);
    }
  }, []);

  const handleValidation = useCallback(() => {
    if (!state.parsedData) return;
    
    const sampleData = getQuickValidationSample(state.parsedData, 20);
    const validation = validateCustodianServicesData(sampleData, state.mapping);
    
    setState(prev => ({ ...prev, validation, step: 'validation' }));
  }, [state.parsedData, state.mapping]);

  const handleStartImport = useCallback(async () => {
    if (!state.parsedData) return;

    setState(prev => ({ ...prev, step: 'processing', progress: null }));

    try {
      const transformedData = state.parsedData.map(row => {
        const transformed: any = {};
        Object.entries(state.mapping).forEach(([csvField, dbField]) => {
          if (dbField && row[csvField] !== undefined) {
            transformed[dbField] = row[csvField];
          }
        });
        return transformed;
      });

      const result = await importCustodianServices(transformedData, (progress) => {
        setState(prev => ({ ...prev, progress }));
      });

      setState(prev => ({ ...prev, result, step: 'results' }));

      if (result.success) {
        toast.success(`Importación completada: ${result.imported} registros procesados`);
      } else {
        toast.error(`Importación con errores: ${result.failed} registros fallaron`);
      }
    } catch (error) {
      toast.error('Error durante la importación: ' + (error as Error).message);
      setState(prev => ({ ...prev, step: 'preview' }));
    }
  }, [state.parsedData, state.mapping]);

  const handleSaveMapping = useCallback(() => {
    if (!mappingName.trim()) {
      toast.error('Ingresa un nombre para el mapeo');
      return;
    }
    
    saveMapping(mappingName.trim(), state.mapping);
    setMappingName('');
    toast.success('Mapeo guardado correctamente');
  }, [mappingName, state.mapping, saveMapping]);

  const handleLoadMapping = useCallback((mappingId: string) => {
    const mapping = loadMapping(mappingId);
    setState(prev => ({ ...prev, mapping }));
    toast.success('Mapeo cargado correctamente');
  }, [loadMapping]);

  const handleClose = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      parsedData: null,
      mapping: {},
      validation: null,
      progress: null,
      result: null,
    });
    setMappingName('');
    onOpenChange(false);
    if (state.result?.imported > 0) {
      onComplete?.();
    }
  }, [onOpenChange, onComplete, state.result]);

  const renderUploadStep = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Seleccionar Archivo
          </CardTitle>
          <CardDescription>
            Sube tu archivo CSV o Excel con los datos de servicios de custodia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo
                </p>
                <p className="text-xs text-gray-500">CSV, Excel (.xlsx, .xls)</p>
              </div>
              <Input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Campos requeridos:</strong> Asegúrate de que tu archivo contenga al menos la columna 'id_servicio'
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderMappingStep = () => {
    const csvFields = state.parsedData?.[0] ? Object.keys(state.parsedData[0]) : [];
    const mappedCount = Object.values(state.mapping).filter(v => v).length;
    const isValidMapping = Object.values(state.mapping).includes('id_servicio');

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mapeo de Columnas</CardTitle>
            <CardDescription>
              Asigna cada columna de tu archivo a un campo de la base de datos ({mappedCount} campos mapeados)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {Object.entries(DATABASE_FIELDS).map(([category, fields]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-primary">{category}</h4>
                    <div className="grid gap-2 ml-4">
                      {fields.map(field => {
                        const csvField = Object.keys(state.mapping).find(k => state.mapping[k] === field);
                        return (
                          <div key={field} className="flex items-center gap-2">
                            <div className="w-32 text-sm font-mono">{field}</div>
                            <Select
                              value={csvField || ''}
                              onValueChange={(value) => {
                                setState(prev => ({
                                  ...prev,
                                  mapping: {
                                    ...prev.mapping,
                                    [value]: field
                                  }
                                }));
                              }}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Seleccionar columna CSV" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Sin mapear</SelectItem>
                                {csvFields.map(csvField => (
                                  <SelectItem key={csvField} value={csvField}>
                                    {csvField}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {field === 'id_servicio' && (
                              <Badge variant="destructive" className="text-xs">Requerido</Badge>
                            )}
                            {csvField && (
                              <Badge variant="outline" className="text-xs">Mapeado</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Guardar/Cargar Mapeos */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del mapeo"
                value={mappingName}
                onChange={(e) => setMappingName(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSaveMapping}
                disabled={!mappingName.trim() || !isValidMapping}
              >
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
            </div>
            
            {savedMappings.length > 0 && (
              <div className="flex gap-2">
                <Select onValueChange={handleLoadMapping}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Cargar mapeo guardado" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedMappings.map((mapping) => (
                      <SelectItem key={mapping.id} value={mapping.id}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {mapping.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}>
              Atrás
            </Button>
            <Button 
              onClick={handleValidation}
              disabled={!isValidMapping}
            >
              Validar Datos
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderValidationStep = () => {
    if (!state.validation) return null;

    return (
      <div className="space-y-6">
        <ValidationStep validation={state.validation} />
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'mapping' }))}>
            Atrás
          </Button>
          <Button 
            onClick={() => setState(prev => ({ ...prev, step: 'preview' }))}
            disabled={!state.validation.isValid}
          >
            {state.validation.isValid ? 'Continuar a Vista Previa' : 'Corregir Errores'}
          </Button>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => {
    const mappedFields = Object.entries(state.mapping).filter(([_, dbField]) => dbField);
    const sampleData = state.parsedData?.slice(0, 5) || [];

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Datos</CardTitle>
            <CardDescription>
              Revisión final antes de la importación ({state.parsedData?.length || 0} registros)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Archivo: {state.file?.name}</Badge>
                <Badge variant="outline">Registros: {state.parsedData?.length || 0}</Badge>
                <Badge variant="outline">Campos mapeados: {mappedFields.length}</Badge>
              </div>

              <ScrollArea className="h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {mappedFields.slice(0, 6).map(([csvField, dbField]) => (
                        <th key={csvField} className="text-left p-2 font-medium">
                          <div>{dbField}</div>
                          <div className="text-xs text-gray-500 font-normal">{csvField}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row, index) => (
                      <tr key={index} className="border-b">
                        {mappedFields.slice(0, 6).map(([csvField]) => (
                          <td key={csvField} className="p-2 max-w-32 truncate">
                            {String(row[csvField] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Esta acción actualizará los registros existentes basándose en el ID de servicio.
            Los registros con IDs duplicados serán sobrescritos.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'validation' }))}>
            Atrás
          </Button>
          <Button onClick={handleStartImport}>
            Iniciar Importación
          </Button>
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Procesando Importación</h3>
        <p className="text-gray-600">No cierres esta ventana...</p>
      </div>
      {state.progress && (
        <div className="space-y-2">
          <Progress value={(state.progress.current / state.progress.total) * 100} />
          <p className="text-sm text-gray-600">
            {state.progress.current} de {state.progress.total} registros procesados
          </p>
          {state.progress.message && (
            <p className="text-xs text-gray-500">{state.progress.message}</p>
          )}
        </div>
      )}
    </div>
  );

  const renderResultsStep = () => {
    if (!state.result) return null;

    const hasErrors = state.result.failed > 0;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {hasErrors ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {hasErrors ? 'Importación con Errores' : 'Importación Exitosa'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{state.result.imported}</div>
                <div className="text-sm text-gray-600">Nuevos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{state.result.updated}</div>
                <div className="text-sm text-gray-600">Actualizados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{state.result.failed}</div>
                <div className="text-sm text-gray-600">Errores</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {state.result.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Errores Encontrados</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {state.result.errors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-sm text-red-600">• {error}</p>
                  ))}
                  {state.result.errors.length > 10 && (
                    <p className="text-sm text-gray-500">... y {state.result.errors.length - 10} errores más</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}>
            Nueva Importación
          </Button>
          <Button onClick={handleClose}>
            Finalizar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Servicios de Custodia - Mejorado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Paso {['upload', 'mapping', 'validation', 'preview', 'processing', 'results'].indexOf(state.step) + 1} de 6
            </div>
            <div className="text-sm">
              {Math.round(((['upload', 'mapping', 'validation', 'preview', 'processing', 'results'].indexOf(state.step) + 1) / 6) * 100)}% completado
            </div>
          </div>
          <Progress value={((['upload', 'mapping', 'validation', 'preview', 'processing', 'results'].indexOf(state.step) + 1) / 6) * 100} />

          {state.step === 'upload' && renderUploadStep()}
          {state.step === 'mapping' && renderMappingStep()}
          {state.step === 'validation' && renderValidationStep()}
          {state.step === 'preview' && renderPreviewStep()}
          {state.step === 'processing' && renderProcessingStep()}
          {state.step === 'results' && renderResultsStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};