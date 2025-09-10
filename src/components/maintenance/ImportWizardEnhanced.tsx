import React, { useState, useCallback, useEffect } from 'react';
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
  const { savedMappings, currentMapping, saveMapping, deleteMapping, loadMapping, autoSaveMapping } = useSavedMappings();

  // Auto-load saved mapping when component mounts
  useEffect(() => {
    if (Object.keys(currentMapping).length > 0) {
      setState(prev => ({ ...prev, mapping: currentMapping }));
    }
  }, [currentMapping]);

  // Auto-save mapping whenever it changes
  useEffect(() => {
    if (Object.keys(state.mapping).length > 0) {
      autoSaveMapping(state.mapping);
    }
  }, [state.mapping, autoSaveMapping]);

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
    toast.success('Configuración cargada automáticamente');
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
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Importación de Servicios de Custodia
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Arrastra tu archivo o haz clic para seleccionar
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-all duration-300 group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="mb-2 text-lg font-semibold text-primary mt-4">
                  Selecciona tu archivo
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos compatibles: CSV, Excel (.xlsx, .xls)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 50MB
                </p>
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

      <Alert className="border-amber-200 bg-amber-50 text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="font-medium">
          <strong>Campo requerido:</strong> Tu archivo debe contener una columna con 'id_servicio' para identificar cada registro de manera única.
        </AlertDescription>
      </Alert>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Configuración automática</h3>
              <p className="text-sm text-blue-800">
                Tus configuraciones de mapeo se guardan automáticamente y se cargarán la próxima vez que uses el importador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMappingStep = () => {
    const csvFields = state.parsedData?.[0] ? Object.keys(state.parsedData[0]) : [];
    const mappedCount = Object.values(state.mapping).filter(v => v).length;
    const isValidMapping = Object.values(state.mapping).includes('id_servicio');

    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Configuración de Mapeo
          </h2>
          <p className="text-lg text-muted-foreground mt-2">
            Asocia las columnas de tu archivo con los campos de la base de datos
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="text-sm px-3 py-1">
              {mappedCount} campos configurados
            </Badge>
            {isValidMapping && (
              <Badge className="text-sm px-3 py-1 bg-green-100 text-green-800 border-green-300">
                ✓ Configuración válida
              </Badge>
            )}
          </div>
        </div>

        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Mapeo de Columnas</CardTitle>
            <CardDescription className="text-base">
              Las configuraciones se guardan automáticamente mientras trabajas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {Object.entries(DATABASE_FIELDS).map(([category, fields]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-gradient-to-r from-primary to-transparent flex-1"></div>
                      <h4 className="font-bold text-lg text-primary px-3">{category}</h4>
                      <div className="h-px bg-gradient-to-l from-primary to-transparent flex-1"></div>
                    </div>
                    <div className="grid gap-3 ml-6">
                      {fields.map(field => {
                        const csvField = Object.keys(state.mapping).find(k => state.mapping[k] === field);
                        const isMapped = !!csvField;
                        const isRequired = field === 'id_servicio';
                        
                        return (
                          <div key={field} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isMapped ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'
                          } ${isRequired ? 'ring-2 ring-red-200' : ''}`}>
                            <div className="w-40">
                              <div className="font-mono text-sm font-semibold text-gray-800">{field}</div>
                              {isRequired && (
                                <Badge variant="destructive" className="text-xs mt-1">
                                  Requerido
                                </Badge>
                              )}
                            </div>
                            <Select
                              value={csvField || 'none'}
                              onValueChange={(value) => {
                                if (value === 'none') {
                                  setState(prev => {
                                    const newMapping = { ...prev.mapping };
                                    Object.keys(newMapping).forEach(key => {
                                      if (newMapping[key] === field) {
                                        delete newMapping[key];
                                      }
                                    });
                                    return { ...prev, mapping: newMapping };
                                  });
                                } else {
                                  setState(prev => ({
                                    ...prev,
                                    mapping: { ...prev.mapping, [value]: field }
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className="w-64 bg-white border-2 font-medium">
                                <SelectValue placeholder="Seleccionar columna CSV" />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-50 border-2 shadow-xl">
                                <SelectItem value="none" className="font-medium text-gray-600">
                                  Sin configurar
                                </SelectItem>
                                {csvFields.map(csvField => (
                                  <SelectItem key={csvField} value={csvField} className="font-medium">
                                    {csvField}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isMapped && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                                ✓ Configurado
                              </Badge>
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

        {/* Configuraciones guardadas */}
        {savedMappings.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-blue-900">Configuraciones Guardadas</CardTitle>
              <CardDescription className="text-blue-800">
                Cargar una configuración previamente guardada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleLoadMapping}>
                <SelectTrigger className="w-full bg-white border-2">
                  <SelectValue placeholder="Seleccionar configuración guardada" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {savedMappings
                    .sort((a, b) => new Date(b.lastUsed || b.createdAt).getTime() - new Date(a.lastUsed || a.createdAt).getTime())
                    .map((mapping) => (
                    <SelectItem key={mapping.id} value={mapping.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span className="font-medium">{mapping.name}</span>
                        <span className="text-xs text-gray-500">
                          (última vez: {new Date(mapping.lastUsed || mapping.createdAt).toLocaleDateString()})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Nombre para guardar esta configuración"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleSaveMapping}
                  disabled={!mappingName.trim() || !isValidMapping}
                  className="font-medium"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}
            className="font-medium"
          >
            ← Atrás
          </Button>
          <Button 
            onClick={handleValidation}
            disabled={!isValidMapping}
            className="font-bold flex-1"
            size="lg"
          >
            Validar Datos →
          </Button>
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
      <div className="space-y-6">
        <div className="text-center py-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Vista Previa de Datos
          </h2>
          <p className="text-lg text-muted-foreground mt-2">
            Última revisión antes de procesar {state.parsedData?.length || 0} registros
          </p>
        </div>

        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Resumen de Importación</CardTitle>
            <CardDescription className="text-base">
              Confirma que todo se ve correcto antes de proceder
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{state.parsedData?.length || 0}</div>
                <div className="text-sm font-medium text-blue-800">Registros totales</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-2xl font-bold text-green-600">{mappedFields.length}</div>
                <div className="text-sm font-medium text-green-800">Campos mapeados</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <div className="text-lg font-bold text-purple-600 truncate">{state.file?.name}</div>
                <div className="text-sm font-medium text-purple-800">Archivo</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                <div className="text-2xl font-bold text-amber-600">
                  {((state.file?.size || 0) / 1024 / 1024).toFixed(1)}MB
                </div>
                <div className="text-sm font-medium text-amber-800">Tamaño</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-800">Muestra de Datos (primeros 5 registros)</h3>
              <ScrollArea className="h-64">
                <div className="rounded-lg border-2 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {mappedFields.slice(0, 6).map(([csvField, dbField]) => (
                          <th key={csvField} className="text-left p-3 font-bold border-r">
                            <div className="text-primary font-semibold">{dbField}</div>
                            <div className="text-xs text-gray-600 font-normal italic">{csvField}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.map((row, index) => (
                        <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          {mappedFields.slice(0, 6).map(([csvField]) => (
                            <td key={csvField} className="p-3 max-w-32 truncate border-r font-mono text-xs">
                              {String(row[csvField] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Alert className="border-amber-200 bg-amber-50 text-amber-800 border-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="font-medium text-base">
            <strong>¡Importante!</strong> Los registros existentes con el mismo ID de servicio serán actualizados. 
            Los registros nuevos se crearán. Esta operación no se puede deshacer.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setState(prev => ({ ...prev, step: 'validation' }))}
            className="font-medium"
          >
            ← Atrás
          </Button>
          <Button 
            onClick={handleStartImport}
            className="font-bold flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            size="lg"
          >
            🚀 Iniciar Importación
          </Button>
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="space-y-8 text-center py-12">
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Procesando Importación
          </h3>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Estamos importando tus datos. Este proceso puede tomar unos minutos...
          </p>
          <p className="text-sm text-amber-600 font-medium">
            ⚠️ No cierres esta ventana hasta que termine
          </p>
        </div>
      </div>

      {state.progress && (
        <Card className="max-w-md mx-auto border-2">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Progreso</span>
                <span className="text-primary font-bold">
                  {Math.round((state.progress.current / state.progress.total) * 100)}%
                </span>
              </div>
              
              <Progress 
                value={(state.progress.current / state.progress.total) * 100} 
                className="h-3"
              />
              
              <div className="text-center space-y-1">
                <p className="text-lg font-bold text-primary">
                  {state.progress.current.toLocaleString()} de {state.progress.total.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  registros procesados
                </p>
              </div>
              
              {state.progress.message && (
                <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                  {state.progress.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderResultsStep = () => {
    if (!state.result) return null;

    const hasErrors = state.result.failed > 0;
    const isSuccess = state.result.imported > 0 || state.result.updated > 0;

    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            {hasErrors && !isSuccess ? (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            ) : hasErrors ? (
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            )}
          </div>
          
          <h2 className="text-3xl font-bold mb-2">
            {hasErrors && !isSuccess ? (
              <span className="text-red-600">Importación Fallida</span>
            ) : hasErrors ? (
              <span className="text-yellow-600">Importación Parcial</span>
            ) : (
              <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                ¡Importación Exitosa!
              </span>
            )}
          </h2>
          
          <p className="text-lg text-muted-foreground">
            {hasErrors && !isSuccess 
              ? "No se pudieron importar los registros"
              : hasErrors 
                ? "Algunos registros se importaron correctamente"
                : "Todos los registros se procesaron correctamente"
            }
          </p>
        </div>

        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Resumen de Resultados</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">{state.result.imported}</div>
                <div className="text-sm font-semibold text-green-800 mt-1">Registros Nuevos</div>
                <div className="text-xs text-green-600 mt-1">Creados exitosamente</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{state.result.updated}</div>
                <div className="text-sm font-semibold text-blue-800 mt-1">Actualizados</div>
                <div className="text-xs text-blue-600 mt-1">Modificados exitosamente</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-3xl font-bold text-red-600">{state.result.failed}</div>
                <div className="text-sm font-semibold text-red-800 mt-1">Errores</div>
                <div className="text-xs text-red-600 mt-1">Registros fallidos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {state.result.errors.length > 0 && (
          <Card className="border-2 border-red-200">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Errores Detectados ({state.result.errors.length})
              </CardTitle>
              <CardDescription className="text-red-700">
                Revisa estos errores para entender qué registros no se pudieron procesar
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {state.result.errors.slice(0, 15).map((error, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded border-l-4 border-red-300">
                      <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-red-700">{index + 1}</span>
                      </div>
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  ))}
                  {state.result.errors.length > 15 && (
                    <div className="text-center p-2 bg-gray-50 rounded text-sm text-gray-600">
                      ... y {state.result.errors.length - 15} errores más
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  💡 <strong>Sugerencia:</strong> Revisa los errores, corrige los datos en tu archivo y ejecuta 
                  una nueva importación con los registros corregidos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isSuccess && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 text-lg mb-2">¡Proceso Completado!</h3>
                  <p className="text-green-800 font-medium">
                    Los datos han sido integrados exitosamente a tu base de datos. 
                    Los cambios ya están disponibles en tu sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}
            className="font-medium"
          >
            📁 Nueva Importación
          </Button>
          <Button 
            onClick={handleClose}
            className="font-bold flex-1"
            size="lg"
          >
            ✅ Finalizar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            Importador de Servicios de Custodia
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Progress indicator */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground">
                  Paso {['upload', 'mapping', 'validation', 'preview', 'processing', 'results'].indexOf(state.step) + 1} de 6
                </span>
                <span className="text-primary font-bold">
                  {Math.round(((['upload', 'mapping', 'validation', 'preview', 'processing', 'results'].indexOf(state.step) + 1) / 6) * 100)}% completado
                </span>
              </div>
              <Progress 
                value={((['upload', 'mapping', 'validation', 'preview', 'processing', 'results'].indexOf(state.step) + 1) / 6) * 100} 
                className="h-2"
              />
            </div>

            {state.step === 'upload' && renderUploadStep()}
            {state.step === 'mapping' && renderMappingStep()}
            {state.step === 'validation' && renderValidationStep()}
            {state.step === 'preview' && renderPreviewStep()}
            {state.step === 'processing' && renderProcessingStep()}
            {state.step === 'results' && renderResultsStep()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};