import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Eye, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Database
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseExcelFile, ExcelData, MappingConfig } from '@/utils/excelImporter';
import { 
  importCustodianServices, 
  CustodianServiceImportResult, 
  CustodianServiceImportProgress
} from '@/services/custodianServicesImportService';
import { toast } from 'sonner';

interface ServiciosCustodiaImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'import' | 'results';

interface WizardState {
  step: WizardStep;
  file: File | null;
  excelData: ExcelData | null;
  mapping: MappingConfig;
  selectedSheet: string;
  headerRow: number;
  importProgress: CustodianServiceImportProgress | null;
  importResult: CustodianServiceImportResult | null;
}

const AVAILABLE_FIELDS = [
  // Core fields
  { value: 'id_servicio', label: 'ID Servicio', required: true },
  { value: 'fecha_hora_cita', label: 'Fecha Hora Cita', required: false },
  { value: 'gm_transport_id', label: 'GM Transport ID', required: false },
  { value: 'estado', label: 'Estado', required: false },
  { value: 'nombre_cliente', label: 'Nombre Cliente', required: false },
  { value: 'folio_cliente', label: 'Folio Cliente', required: false },
  { value: 'comentarios_adicionales', label: 'Comentarios Adicionales', required: false },
  
  // Service details
  { value: 'local_foraneo', label: 'Local/Foráneo', required: false },
  { value: 'ruta', label: 'Ruta', required: false },
  { value: 'tipo_servicio', label: 'Tipo Servicio', required: false },
  { value: 'origen', label: 'Origen', required: false },
  { value: 'destino', label: 'Destino', required: false },
  { value: 'km_teorico', label: 'KM Teórico', required: false },
  
  // Equipment/Gadget
  { value: 'gadget_solicitado', label: 'Gadget Solicitado', required: false },
  { value: 'gadget', label: 'Gadget', required: false },
  { value: 'tipo_gadget', label: 'Tipo Gadget', required: false },
  
  // Transport details
  { value: 'cantidad_transportes', label: 'Cantidad Transportes', required: false },
  { value: 'nombre_operador_transporte', label: 'Nombre Operador Transporte', required: false },
  { value: 'telefono_operador', label: 'Teléfono Operador', required: false },
  { value: 'placa_carga', label: 'Placa Carga', required: false },
  { value: 'tipo_unidad', label: 'Tipo Unidad', required: false },
  { value: 'tipo_carga', label: 'Tipo Carga', required: false },
  
  // Additional transport
  { value: 'nombre_operador_adicional', label: 'Nombre Operador Adicional', required: false },
  { value: 'telefono_operador_adicional', label: 'Teléfono Operador Adicional', required: false },
  { value: 'placa_carga_adicional', label: 'Placa Carga Adicional', required: false },
  { value: 'tipo_unidad_adicional', label: 'Tipo Unidad Adicional', required: false },
  { value: 'tipo_carga_adicional', label: 'Tipo Carga Adicional', required: false },
  
  // Assignment details
  { value: 'fecha_hora_asignacion', label: 'Fecha Hora Asignación', required: false },
  { value: 'id_custodio', label: 'ID Custodio', required: false },
  { value: 'nombre_custodio', label: 'Nombre Custodio', required: false },
  { value: 'telefono', label: 'Teléfono', required: false },
  { value: 'contacto_emergencia', label: 'Contacto Emergencia', required: false },
  { value: 'telefono_emergencia', label: 'Teléfono Emergencia', required: false },
  
  // Vehicle details
  { value: 'auto', label: 'Auto', required: false },
  { value: 'placa', label: 'Placa', required: false },
  { value: 'armado', label: 'Armado', required: false },
  { value: 'nombre_armado', label: 'Nombre Armado', required: false },
  { value: 'telefono_armado', label: 'Teléfono Armado', required: false },
  { value: 'proveedor', label: 'Proveedor', required: false },
  
  // Time tracking
  { value: 'hora_presentacion', label: 'Hora Presentación', required: false },
  { value: 'presentacion', label: 'Presentación', required: false },
  { value: 'hora_inicio_custodia', label: 'Hora Inicio Custodia', required: false },
  { value: 'tiempo_punto_origen', label: 'Tiempo Punto Origen', required: false },
  { value: 'hora_arribo', label: 'Hora Arribo', required: false },
  { value: 'hora_finalizacion', label: 'Hora Finalización', required: false },
  { value: 'duracion_servicio', label: 'Duración Servicio', required: false },
  
  // Financial details
  { value: 'id_cotizacion', label: 'ID Cotización', required: false },
  { value: 'tiempo_estimado', label: 'Tiempo Estimado', required: false },
  { value: 'km_recorridos', label: 'KM Recorridos', required: false },
  { value: 'km_extras', label: 'KM Extras', required: false },
  { value: 'costo_custodio', label: 'Costo Custodio', required: false },
  { value: 'casetas', label: 'Casetas', required: false },
  { value: 'cobro_cliente', label: 'Cobro Cliente', required: false },
  
  // Metadata
  { value: 'updated_time', label: 'Updated Time', required: false },
  { value: 'fecha_contratacion', label: 'Fecha Contratación', required: false },
  { value: 'fecha_primer_servicio', label: 'Fecha Primer Servicio', required: false },
  { value: 'creado_via', label: 'Creado Vía', required: false },
  { value: 'creado_por', label: 'Creado Por', required: false },
  { value: 'created_at', label: 'Created At', required: false },
  { value: 'tiempo_retraso', label: 'Tiempo Retraso (min)', required: false },
];

export const ServiciosCustodiaImportWizard: React.FC<ServiciosCustodiaImportWizardProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [state, setState] = useState<WizardState>({
    step: 'upload',
    file: null,
    excelData: null,
    mapping: {},
    selectedSheet: '',
    headerRow: 1,
    importProgress: null,
    importResult: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetWizard = () => {
    setState({
      step: 'upload',
      file: null,
      excelData: null,
      mapping: {},
      selectedSheet: '',
      headerRow: 1,
      importProgress: null,
      importResult: null
    });
    setError(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file);
      setState(prev => ({
        ...prev,
        file,
        excelData: data,
        selectedSheet: data.selectedSheet,
        headerRow: data.headerRow || 1
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetAndHeaderConfirm = async () => {
    if (!state.file) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(state.file, state.selectedSheet, state.headerRow);
      
      setState(prev => ({
        ...prev,
        excelData: data,
        step: 'mapping'
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingComplete = () => {
    // Validate that required fields are mapped
    const requiredFields = AVAILABLE_FIELDS.filter(f => f.required);
    const mappedFields = Object.values(state.mapping).filter(Boolean);
    
    const missingRequired = requiredFields.filter(field => 
      !mappedFields.includes(field.value)
    );

    if (missingRequired.length > 0) {
      setError(`Campos requeridos faltantes: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    setError(null);
    setState(prev => ({ ...prev, step: 'preview' }));
  };

  const handleImportConfirm = async () => {
    if (!state.excelData) return;

    setState(prev => ({ ...prev, step: 'import' }));

    try {
      // Transform data based on mapping
      const mappedData = state.excelData.rows.map(row => {
        const mappedRow: any = {};
        Object.entries(state.mapping).forEach(([excelKey, dbField]) => {
          if (dbField) {
            mappedRow[dbField] = row[excelKey];
          }
        });
        return mappedRow;
      });

      const result = await importCustodianServices(
        mappedData,
        (progress) => {
          setState(prev => ({ ...prev, importProgress: progress }));
        }
      );

      setState(prev => ({
        ...prev,
        step: 'results',
        importResult: result
      }));

      if (result.success) {
        toast.success(`Importación exitosa: ${result.imported} nuevos, ${result.updated} actualizados`);
        onComplete?.();
      } else {
        toast.warning(`Importación con errores: ${result.imported} nuevos, ${result.updated} actualizados, ${result.failed} fallidos`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante la importación');
      setState(prev => ({ ...prev, step: 'preview' }));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetWizard();
  };

  const goToPreviousStep = () => {
    const stepOrder: WizardStep[] = ['upload', 'mapping', 'preview', 'import', 'results'];
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex > 0) {
      setState(prev => ({
        ...prev,
        step: stepOrder[currentIndex - 1]
      }));
    }
  };

  const stepProgress = {
    upload: 20,
    mapping: 40,
    preview: 60,
    import: 80,
    results: 100
  };

  // Auto-refresh preview when sheet changes
  useEffect(() => {
    const refreshPreview = async () => {
      if (!state.file || !state.selectedSheet || state.step !== 'upload') return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await parseExcelFile(state.file, state.selectedSheet);
        setState(prev => ({
          ...prev,
          excelData: {
            ...(prev.excelData || data),
            ...data,
          },
          headerRow: 1,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la hoja seleccionada');
      } finally {
        setIsLoading(false);
      }
    };
    refreshPreview();
  }, [state.selectedSheet]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Importar Servicios de Custodia
          </DialogTitle>
          <DialogDescription>
            Actualiza la tabla servicios_custodia mediante archivo CSV o Excel
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={stepProgress[state.step]} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Paso {Object.keys(stepProgress).indexOf(state.step) + 1} de 5</span>
            <span>{stepProgress[state.step]}% completado</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Step */}
        {state.step === 'upload' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Seleccionar Archivo
                </CardTitle>
                <CardDescription>
                  Sube tu archivo CSV o Excel con los datos de servicios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!state.file ? (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo
                        </p>
                        <p className="text-xs text-muted-foreground">CSV, Excel (.xlsx, .xls)</p>
                      </div>
                      <Input
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{state.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(state.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {state.excelData && (
                      <div className="space-y-4">
                        {state.excelData.sheets.length > 1 && (
                          <div className="space-y-2">
                            <Label>Hoja de Excel</Label>
                            <Select 
                              value={state.selectedSheet} 
                              onValueChange={(value) => setState(prev => ({ ...prev, selectedSheet: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar hoja" />
                              </SelectTrigger>
                              <SelectContent>
                                {state.excelData.sheets.map(sheet => (
                                  <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Fila de Encabezados</Label>
                          <Input
                            type="number"
                            min="1"
                            value={state.headerRow}
                            onChange={(e) => setState(prev => ({ ...prev, headerRow: parseInt(e.target.value) || 1 }))}
                            className="w-24"
                          />
                        </div>

                        {state.excelData.previewRows.length > 0 && (
                          <div className="space-y-2">
                            <Label>Vista Previa</Label>
                            <div className="border rounded-lg overflow-auto max-h-40">
                              <table className="w-full text-xs">
                                <tbody>
                                  {state.excelData.previewRows.slice(0, 5).map((row, index) => (
                                    <tr key={index} className={index === state.headerRow - 1 ? 'bg-primary/10 font-medium' : ''}>
                                      <td className="p-1 border-r text-muted-foreground w-8">{index + 1}</td>
                                      {(row as any[]).slice(0, 6).map((cell, cellIndex) => (
                                        <td key={cellIndex} className="p-1 border-r max-w-24 truncate">
                                          {cell?.toString() || ''}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <Button 
                          onClick={handleSheetAndHeaderConfirm} 
                          disabled={isLoading || !state.selectedSheet}
                          className="w-full"
                        >
                          {isLoading ? 'Procesando...' : 'Continuar al Mapeo'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Campo requerido:</strong> ID Servicio es obligatorio para el proceso de upsert.
                <br />
                <strong>Funcionalidad:</strong> Los registros existentes serán actualizados, los nuevos serán insertados.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Mapping Step */}
        {state.step === 'mapping' && state.excelData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mapeo de Columnas
                </CardTitle>
                <CardDescription>
                  Asocia cada columna de tu archivo con los campos de la base de datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Los campos marcados con <Badge variant="destructive" className="text-xs">*</Badge> son obligatorios
                  </div>
                  
                  <div className="grid gap-3">
                    {state.excelData.columns.map(col => (
                      <div key={col.key} className="grid grid-cols-3 gap-4 items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{col.header}</div>
                          <div className="text-sm text-muted-foreground">
                            Ejemplo: {col.sample || 'Sin datos'}
                          </div>
                        </div>
                        
                        <div>
                          <Select
                            value={state.mapping[col.key] || 'unmapped'}
                            onValueChange={(value) => {
                              setState(prev => ({
                                ...prev,
                                mapping: { ...prev.mapping, [col.key]: value === 'unmapped' ? '' : value }
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar campo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unmapped">No mapear</SelectItem>
                              {AVAILABLE_FIELDS.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                  {field.required && (
                                    <Badge variant="destructive" className="ml-2 text-xs">*</Badge>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="text-right">
                          {state.mapping[col.key] && (
                            <Badge variant="outline">Mapeado</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button onClick={handleMappingComplete}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {state.step === 'preview' && state.excelData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista Previa de Importación
                </CardTitle>
                <CardDescription>
                  Revisa los datos que serán importados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Se procesarán {state.excelData.rows.length} registros
                  </div>
                  
                  <div className="border rounded-lg overflow-auto max-h-60">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {Object.values(state.mapping).filter(Boolean).map(field => (
                            <th key={field} className="p-2 text-left border-r">
                              {AVAILABLE_FIELDS.find(f => f.value === field)?.label || field}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {state.excelData.rows.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            {Object.entries(state.mapping).filter(([_, field]) => field).map(([excelKey, field]) => (
                              <td key={`${index}-${field}`} className="p-2 border-r max-w-32 truncate">
                                {row[excelKey]?.toString() || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {state.excelData.rows.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      Mostrando 5 de {state.excelData.rows.length} registros
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button onClick={handleImportConfirm}>
                Iniciar Importación
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Import Step */}
        {state.step === 'import' && (
          <div className="space-y-6 py-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Procesando Importación</h3>
              <p className="text-muted-foreground">
                {state.importProgress?.message || 'Preparando importación...'}
              </p>
            </div>

            {state.importProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso: {state.importProgress.current} de {state.importProgress.total}</span>
                  <span>{Math.round((state.importProgress.current / state.importProgress.total) * 100)}%</span>
                </div>
                <Progress 
                  value={(state.importProgress.current / state.importProgress.total) * 100} 
                  className="h-3"
                />
              </div>
            )}
          </div>
        )}

        {/* Results Step */}
        {state.step === 'results' && state.importResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">
                {state.importResult.success ? 'Importación Completada' : 'Importación con Errores'}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-center">Nuevos</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {state.importResult.imported}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-center">Actualizados</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {state.importResult.updated}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-center">Errores</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {state.importResult.failed}
                  </div>
                </CardContent>
              </Card>
            </div>

            {state.importResult.errors && state.importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Errores encontrados:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {state.importResult.errors.slice(0, 5).map((error, idx) => (
                      <div key={idx} className="text-xs">{error}</div>
                    ))}
                    {state.importResult.errors.length > 5 && (
                      <div className="text-xs font-medium">
                        ... y {state.importResult.errors.length - 5} errores más
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center gap-2">
              <Button onClick={resetWizard} variant="outline">
                Nueva Importación
              </Button>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};