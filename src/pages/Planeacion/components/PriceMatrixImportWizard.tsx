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
  ArrowRight
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  parseExcelFile, 
  ExcelData, 
  MappingConfig, 
  getPriceMatrixDefaultMapping,
  validatePriceMatrixData,
  transformPriceMatrixDataForImport
} from '@/utils/excelImporter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PriceMatrixImportWizardProps {
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
  validationResult: { valid: boolean; errors: string[]; warnings: string[] } | null;
  importProgress: number;
  importResult: { imported: number; errors: number; } | null;
}

const AVAILABLE_FIELDS = [
  { value: 'cliente_nombre', label: 'Cliente' },
  { value: 'clave', label: 'Clave' },
  { value: 'tipo_servicio', label: 'Tipo' },
  { value: 'origen_texto', label: 'Origen' },
  { value: 'destino_texto', label: 'Destino' },
  { value: 'tipo_viaje', label: 'Tipo de Viaje' },
  { value: 'valor_bruto', label: 'Precio a Cliente' },
  { value: 'costo_custodio', label: 'Costo Custodio' },
  { value: 'costo_maximo_casetas', label: 'Costo Máximo en Casetas' },
  { value: 'pago_custodio_sin_arma', label: 'Pago Custodio Sin Arma' },
  { value: 'precio_custodio', label: 'Precio Custodio' },
  { value: 'costo_operativo', label: 'Costo Operativo' },
  { value: 'distancia_km', label: 'Distancia (KM)' },
  { value: 'dias_operacion', label: 'Días Operación' },
  { value: 'precio_desde_casa', label: 'Precio Desde Casa' },
  { value: 'precio_historico_2022', label: 'Precio Histórico 2022' },
  { value: 'precio_operativo_logistico', label: 'Precio Operativo Logístico' },
];

export const PriceMatrixImportWizard: React.FC<PriceMatrixImportWizardProps> = ({
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
    validationResult: null,
    importProgress: 0,
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
      validationResult: null,
      importProgress: 0,
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
        headerRow: 1
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
      const defaultMapping = getPriceMatrixDefaultMapping(data.columns);
      
      setState(prev => ({
        ...prev,
        excelData: data,
        mapping: defaultMapping,
        step: 'mapping'
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingComplete = (mapping: MappingConfig) => {
    if (!state.excelData) return;
    
    const validationResult = validatePriceMatrixData(state.excelData, mapping);
    
    setState(prev => ({
      ...prev,
      mapping,
      validationResult,
      step: 'preview'
    }));
  };

  const handleImportConfirm = async () => {
    if (!state.excelData || !state.validationResult?.valid) return;

    setState(prev => ({ ...prev, step: 'import', importProgress: 0 }));

    try {
      const transformedData = transformPriceMatrixDataForImport(state.excelData, state.mapping);
      
      // Deduplicate data by cliente_nombre + destino_texto combination
      const deduplicatedData = transformedData.reduce((acc, current) => {
        const key = `${current.cliente_nombre || ''}_${current.destino_texto || ''}`;
        
        // If we haven't seen this combination before, add it
        if (!acc.some(item => 
          `${item.cliente_nombre || ''}_${item.destino_texto || ''}` === key
        )) {
          acc.push(current);
        }
        return acc;
      }, [] as typeof transformedData);
      
      console.log(`Original records: ${transformedData.length}, After deduplication: ${deduplicatedData.length}`);
      
      const batchSize = 50;
      let imported = 0;
      let errors = 0;

      for (let i = 0; i < deduplicatedData.length; i += batchSize) {
        const batch = deduplicatedData.slice(i, i + batchSize);
        
        try {
          const { error } = await supabase
            .from('matriz_precios_rutas')
            .upsert(batch, { 
              onConflict: 'cliente_nombre,destino_texto',
              ignoreDuplicates: false 
            });

          if (error) throw error;
          imported += batch.length;
        } catch (err) {
          console.error('Error importing batch:', err);
          errors += batch.length;
        }

        const progress = ((i + batchSize) / deduplicatedData.length) * 100;
        setState(prev => ({ ...prev, importProgress: Math.min(progress, 100) }));
      }

      setState(prev => ({
        ...prev,
        step: 'results',
        importResult: { imported, errors }
      }));

      if (imported > 0) {
        toast.success(`${imported} precios importados exitosamente`);
      }
      if (errors > 0) {
        toast.error(`${errors} registros con errores`);
      }

    } catch (err) {
      console.error('Import error:', err);
      toast.error('Error durante la importación');
      setState(prev => ({
        ...prev,
        step: 'preview',
        importProgress: 0
      }));
    }
  };

  const handleClose = () => {
    if (state.importResult?.imported && state.importResult.imported > 0) {
      onComplete?.();
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Matriz de Precios</DialogTitle>
          <DialogDescription>
            Sube tu archivo Excel con la matriz de precios para importar automáticamente
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        {state.step === 'upload' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Seleccionar Archivo
                </CardTitle>
                <CardDescription>
                  Sube tu archivo Excel con la matriz de precios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo
                      </p>
                      <p className="text-xs text-muted-foreground">Excel (.xlsx, .xls)</p>
                    </div>
                    <Input
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                  </label>
                </div>

                {state.file && (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{state.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(state.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {state.excelData && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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

                          <div className="space-y-2">
                            <Label>Fila de Encabezados</Label>
                            <Input
                              type="number"
                              min="1"
                              value={state.headerRow}
                              onChange={(e) => setState(prev => ({ ...prev, headerRow: parseInt(e.target.value) }))}
                            />
                          </div>
                        </div>

                        {/* Preview */}
                        {state.excelData.previewRows.length > 0 && (
                          <div className="space-y-2">
                            <Label>Vista Previa</Label>
                            <div className="border rounded-lg overflow-auto max-h-40">
                              <table className="w-full text-xs">
                                <tbody>
                                  {state.excelData.previewRows.slice(0, 5).map((row, index) => (
                                    <tr key={index} className={index === state.headerRow - 1 ? 'bg-primary/10 font-medium' : ''}>
                                      <td className="p-1 border-r text-muted-foreground w-8">{index + 1}</td>
                                      {(row as any[]).slice(0, 8).map((cell, cellIndex) => (
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
                          {isLoading ? 'Procesando...' : 'Continuar'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {state.step === 'mapping' && state.excelData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mapeo de Columnas
                </CardTitle>
                <CardDescription>
                  Asocia cada columna de Excel con los campos correspondientes en la base de datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Los campos marcados con <Badge variant="destructive" className="text-xs">*</Badge> son obligatorios
                  </div>
                  
                  <div className="grid gap-4">
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
                                  {['cliente_nombre', 'destino_texto', 'valor_bruto', 'precio_custodio'].includes(field.value) && (
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
              <Button onClick={() => handleMappingComplete(state.mapping)}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {state.step === 'preview' && state.excelData && state.validationResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista Previa de Datos
                </CardTitle>
                <CardDescription>
                  Revisa los datos antes de importar. Se encontraron {state.excelData.rows.length} filas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Validation Results */}
                  {state.validationResult.errors.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">Errores que deben corregirse:</div>
                          {state.validationResult.errors.map((error, index) => (
                            <div key={index} className="text-sm text-destructive">• {error}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {state.validationResult.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">Advertencias:</div>
                          {state.validationResult.warnings.map((warning, index) => (
                            <div key={index} className="text-sm text-warning">• {warning}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Data Preview */}
                  <div className="border rounded-lg overflow-auto max-h-60">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Cliente</th>
                          <th className="p-2 text-left">Destino</th>
                          <th className="p-2 text-left">Valor Bruto</th>
                          <th className="p-2 text-left">Precio Custodio</th>
                          <th className="p-2 text-left">Costo Op.</th>
                          <th className="p-2 text-left">KM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transformPriceMatrixDataForImport(state.excelData, state.mapping).slice(0, 10).map((row, index) => (
                          <tr key={index}>
                            <td className="p-2 border-t">{row.cliente_nombre || '-'}</td>
                            <td className="p-2 border-t">{row.destino_texto || '-'}</td>
                            <td className="p-2 border-t">${(row.valor_bruto || 0).toLocaleString()}</td>
                            <td className="p-2 border-t">${(row.precio_custodio || 0).toLocaleString()}</td>
                            <td className="p-2 border-t">${(row.costo_operativo || 0).toLocaleString()}</td>
                            <td className="p-2 border-t">{row.distancia_km || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button 
                onClick={handleImportConfirm} 
                disabled={!state.validationResult.valid}
              >
                Importar {state.excelData.rows.length} Registros
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {state.step === 'import' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="animate-pulse">
                    <FileText className="h-12 w-12 text-primary mx-auto" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Importando datos...</h3>
                    <p className="text-muted-foreground">Por favor espera mientras procesamos los datos</p>
                  </div>
                  <Progress value={state.importProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(state.importProgress)}% completado
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {state.step === 'results' && state.importResult && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-success mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">¡Importación Completada!</h3>
                    <p className="text-muted-foreground">
                      {state.importResult.imported} registros importados exitosamente
                      {state.importResult.errors > 0 && `, ${state.importResult.errors} con errores`}
                    </p>
                  </div>
                  <Button onClick={handleClose} className="w-full">
                    Finalizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};