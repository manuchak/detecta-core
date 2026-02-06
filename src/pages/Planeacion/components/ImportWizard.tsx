import { useState, useEffect, useCallback } from 'react';
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
import ImportMappingStep from './ImportMappingStep';
import ImportPreviewStep from './ImportPreviewStep';
import ImportResultsStep from './ImportResultsStep';
import { parseExcelFile, ExcelData, MappingConfig, getDefaultMapping } from '@/utils/excelImporter';
import { ImportResult, ImportProgress, importServicios } from '@/services/importService';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftIndicator';

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'import' | 'results';

interface WizardState {
  step: WizardStep;
  excelData: ExcelData | null;
  mapping: MappingConfig;
  importResult: ImportResult | null;
  importProgress: ImportProgress | null;
  selectedSheet: string;
  headerRow: number;
  fileName: string;
}

const initialState: WizardState = {
  step: 'upload',
  excelData: null,
  mapping: {},
  importResult: null,
  importProgress: null,
  selectedSheet: '',
  headerRow: 1,
  fileName: '',
};

export default function ImportWizard({
  open,
  onOpenChange,
  onComplete
}: ImportWizardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistence hook for robust draft recovery
  const persistence = useFormPersistence<WizardState>({
    key: 'import_wizard_servicios',
    initialData: initialState,
    level: 'robust',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    isMeaningful: (data) => !!(data.fileName || Object.keys(data.mapping).length > 0),
    calculateProgress: (data) => {
      const progress: Record<WizardStep, number> = {
        upload: 0,
        mapping: 25,
        preview: 50,
        import: 75,
        results: 100
      };
      return progress[data.step] || 0;
    },
  });

  const { data: state, updateData, hasDraft, hasUnsavedChanges, lastSaved, getTimeSinceSave, clearDraft } = persistence;

  const resetWizard = useCallback(() => {
    clearDraft(true);
    setFile(null);
    setError(null);
    setIsLoading(false);
  }, [clearDraft]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(uploadedFile);
      setFile(uploadedFile);
      updateData({
        excelData: data,
        selectedSheet: data.selectedSheet,
        headerRow: data.headerRow,
        fileName: uploadedFile.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetAndHeaderConfirm = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file, state.selectedSheet, state.headerRow);
      const defaultMapping = getDefaultMapping(data.columns);
      
      updateData({
        excelData: data,
        mapping: defaultMapping,
        step: 'mapping'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingComplete = (mapping: MappingConfig) => {
    updateData({ mapping, step: 'preview' });
  };

  const handleImportConfirm = () => {
    updateData({ step: 'import' });
  };

  const handleImportProgress = (progress: ImportProgress) => {
    updateData({ importProgress: progress });
  };

  const handleImportComplete = (result: ImportResult) => {
    updateData({ importResult: result, step: 'results' });
    // Clear draft on successful import
    if (result.imported > 0) {
      clearDraft(true);
    }
  };

  const handleClose = useCallback(async () => {
    if (state.importResult?.imported && state.importResult.imported > 0) {
      onComplete?.();
      resetWizard();
    } else if (hasUnsavedChanges && state.step !== 'upload') {
      const discard = await persistence.confirmDiscard();
      if (!discard) return;
      resetWizard();
    }
    onOpenChange(false);
  }, [state.importResult, state.step, hasUnsavedChanges, onComplete, onOpenChange, resetWizard, persistence]);

  const goToPreviousStep = () => {
    const stepOrder: WizardStep[] = ['upload', 'mapping', 'preview', 'import', 'results'];
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex > 0) {
      updateData({ step: stepOrder[currentIndex - 1] });
    }
  };

  const stepProgress: Record<WizardStep, number> = {
    upload: 0,
    mapping: 25,
    preview: 50,
    import: 75,
    results: 100
  };

  const stepIcons = {
    upload: Upload,
    mapping: FileText,
    preview: Eye,
    import: ArrowRight,
    results: CheckCircle
  };

  const StepIcon = stepIcons[state.step];

  // Refresh preview when sheet changes
  useEffect(() => {
    const refreshPreview = async () => {
      if (!file || !state.selectedSheet || state.step !== 'upload') return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await parseExcelFile(file, state.selectedSheet);
        updateData({
          excelData: { ...(state.excelData || data), ...data },
          headerRow: 1,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la hoja seleccionada');
      } finally {
        setIsLoading(false);
      }
    };
    refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedSheet]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <StepIcon className="h-5 w-5" />
              Importar Servicios desde Excel
            </DialogTitle>
            <DraftIndicator
              hasDraft={hasDraft}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSaved={lastSaved}
              getTimeSinceSave={getTimeSinceSave}
              variant="minimal"
            />
          </div>
          <DialogDescription>
            Sube un archivo Excel con datos históricos de servicios para importar al sistema
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Paso {Object.keys(stepProgress).indexOf(state.step) + 1} de 5</span>
            <span>{stepProgress[state.step]}%</span>
          </div>
          <Progress value={stepProgress[state.step]} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {/* Upload Step */}
          {state.step === 'upload' && (
            <div className="space-y-6 py-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Subir Archivo Excel</h3>
                <p className="text-muted-foreground mb-6">
                  Selecciona un archivo .xlsx con los datos históricos de servicios
                </p>
              </div>

              {!file ? (
                <div className="border-2 border-dashed border-muted rounded-lg p-8">
                  <div className="text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="excel-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      <Upload className="h-4 w-4" />
                      {isLoading ? 'Procesando...' : 'Seleccionar Archivo'}
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="secondary">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </Badge>
                  </div>

                  {state.excelData && (
                    <div className="space-y-4">
                      {/* Sheet Selection */}
                      {state.excelData.sheets.length > 1 && (
                        <div className="space-y-2">
                          <Label>Seleccionar Hoja de Trabajo</Label>
                          <Select 
                            value={state.selectedSheet} 
                            onValueChange={(value) => updateData({ selectedSheet: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una hoja" />
                            </SelectTrigger>
                            <SelectContent>
                              {state.excelData.sheets.map(sheet => (
                                <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Header Row Selection */}
                      <div className="space-y-2">
                        <Label>Fila de Encabezados</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={state.headerRow}
                          onChange={(e) => updateData({ headerRow: parseInt(e.target.value) || 1 })}
                          className="w-24"
                        />
                        <p className="text-xs text-muted-foreground">
                          Especifica en qué fila se encuentran los encabezados de las columnas
                        </p>
                      </div>

                      {/* Preview */}
                      <div className="space-y-2">
                        <Label>Vista Previa</Label>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto max-h-40">
                            <table className="w-full text-xs">
                              <tbody>
                                {state.excelData.previewRows.slice(0, 10).map((row, rowIndex) => (
                                  <tr 
                                    key={rowIndex} 
                                    className={rowIndex === state.headerRow - 1 ? 'bg-primary/10 font-medium' : ''}
                                  >
                                    <td className="p-1 text-center text-muted-foreground border-r w-8">
                                      {rowIndex + 1}
                                    </td>
                                    {row.slice(0, 6).map((cell, cellIndex) => (
                                      <td key={cellIndex} className="p-1 border-r text-center">
                                        {cell?.toString() || ''}
                                      </td>
                                    ))}
                                    {row.length > 6 && (
                                      <td className="p-1 text-muted-foreground">...</td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          La fila resaltada será usada como encabezados
                        </p>
                      </div>

                      <Button 
                        onClick={handleSheetAndHeaderConfirm}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? 'Procesando...' : 'Continuar'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Formato esperado:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Los encabezados pueden estar en cualquier fila</li>
                  <li>• Columnas recomendadas: Cliente, Fecha, Origen, Destino, Tipo</li>
                  <li>• Formato de archivo: Excel (.xlsx)</li>
                  <li>• Máximo 10,000 registros por importación</li>
                </ul>
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {state.step === 'mapping' && state.excelData && (
            <ImportMappingStep
              data={state.excelData}
              mapping={state.mapping}
              onComplete={handleMappingComplete}
              onBack={goToPreviousStep}
            />
          )}

          {/* Preview Step */}
          {state.step === 'preview' && state.excelData && (
            <ImportPreviewStep
              data={state.excelData}
              mapping={state.mapping}
              onConfirm={handleImportConfirm}
              onBack={goToPreviousStep}
              importFunction={importServicios}
            />
          )}

          {/* Import Step */}
          {state.step === 'import' && state.excelData && (
            <div className="space-y-6 py-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Importando Datos</h3>
                <p className="text-muted-foreground">
                  {state.importProgress?.message || 'Procesando registros...'}
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
            <ImportResultsStep
              result={state.importResult}
              onClose={handleClose}
              onStartOver={resetWizard}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={state.step === 'results' ? handleClose : goToPreviousStep}
            disabled={state.step === 'upload' || state.step === 'import'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {state.step === 'results' ? 'Cerrar' : 'Anterior'}
          </Button>

          <Button
            onClick={handleClose}
            variant="ghost"
            disabled={state.step === 'import'}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
