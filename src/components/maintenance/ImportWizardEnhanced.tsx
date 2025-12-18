import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download, Save, FolderOpen, Wand2, Sparkles } from "lucide-react";
import { parseExcelFile } from "@/utils/excelImporter";
import { importCustodianServices, CustodianServiceImportResult, CustodianServiceImportProgress } from "@/services/custodianServicesImportService";
import { validateCustodianServicesData, getQuickValidationSample, ValidationResult } from "@/services/custodianServicesValidationService";
import { validateDataBeforeImport, getValidationSummary } from '@/services/custodianServicesEarlyValidationService';
import { applyIntelligentMapping } from "@/services/intelligentMappingService";
import { useSavedMappings, SavedMapping } from "@/hooks/useSavedMappings";
import { useServiceIdValidation } from "@/hooks/useServiceIdValidation";
import { ValidationStep } from "./ValidationStep";
import { exportFailedRecordsToExcel } from "@/utils/failedRecordsExporter";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { parseRobustDate } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';

interface ImportWizardEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (results?: CustodianServiceImportResult, filename?: string) => void;
}

type WizardStep = 'upload' | 'mapping' | 'validation' | 'preview' | 'processing' | 'error-detail' | 'results';

interface WizardState {
  step: WizardStep;
  file: File | null;
  parsedData: any[] | null;
  mapping: Record<string, string>;
  validation: ValidationResult | null;
  progress: CustodianServiceImportProgress | null;
  result: CustodianServiceImportResult | null;
  fileName: string;
}

import { CUSTODIAN_SERVICE_FIELDS } from '@/config/custodianServiceFields';

export const ImportWizardEnhanced: React.FC<ImportWizardEnhancedProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const { validateMultipleIds, isValidating: isValidatingIds } = useServiceIdValidation();
  
  const [state, setState] = useState<WizardState>({
    step: 'upload',
    file: null,
    parsedData: null,
    mapping: {},
    validation: null,
    progress: null,
    result: null,
    fileName: '',
  });
  
  const [importMode, setImportMode] = useState<'auto' | 'create' | 'update'>('auto');
  
  // Detect if we're in update-only mode (only id_servicio and estado mapped)
  const isUpdateOnlyMode = useCallback(() => {
    const mappedDbFields = Object.values(state.mapping).filter(v => v && v !== 'unmapped');
    const hasIdServicio = mappedDbFields.includes('id_servicio');
    const hasEstado = mappedDbFields.includes('estado');
    const onlyTheseTwo = mappedDbFields.length === 2;
    return hasIdServicio && hasEstado && onlyTheseTwo;
  }, [state.mapping]);
  
  const { isVisible, hasLeftTab, resetTabTracking } = useTabVisibility();
  
  // Debug: Log step changes
  useEffect(() => {
    console.log('🎯 Wizard step changed to:', state.step, 'Result:', state.result);
  }, [state.step, state.result]);
  
  const [mappingName, setMappingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
      // First, get sheet info
      const initialData = await parseExcelFile(file);
      
      // Then parse the first sheet with actual data
      const firstSheet = initialData.sheets[0];
      const actualData = await parseExcelFile(file, firstSheet, 1);
      
      console.log('📁 Archivo procesado:', {
        fileName: actualData.fileName,
        sheets: actualData.sheets,
        columnas: actualData.columns.length,
        filas: actualData.rows.length,
        primerasColumnas: actualData.columns.slice(0, 5).map(c => c.header)
      });

      // Transform the data structure for compatibility
      const transformedRows = actualData.rows.map(row => {
        const transformedRow: any = {};
        actualData.columns.forEach((col, index) => {
          transformedRow[col.header] = row[`col_${index}`];
        });
        return transformedRow;
      });

      setState(prev => ({
        ...prev,
        file,
        parsedData: transformedRows,
        fileName: file.name,
        step: 'mapping'
      }));
      
      resetTabTracking();

      toast.success(`Archivo cargado: ${transformedRows.length} registros encontrados con ${actualData.columns.length} columnas`);
    } catch (error) {
      console.error('❌ Error al procesar archivo:', error);
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

    // Warn user about tab switching
    if (!isVisible) {
      toast.warning('Por favor mantén esta pestaña activa durante el proceso de importación');
    }

    setState(prev => ({ ...prev, step: 'processing', progress: null }));
    resetTabTracking();

    try {
      const transformedData = state.parsedData.map(row => {
        const transformed: any = {};
        Object.entries(state.mapping).forEach(([csvField, dbField]) => {
          if (dbField && row[csvField] !== undefined) {
            // Sanitize values - trim strings, especially id_servicio and estado
            let value = row[csvField];
            if (typeof value === 'string') {
              value = value.trim();
            }
            transformed[dbField] = value;
          }
        });
        return transformed;
      });

      // Early validation before starting import - use original CSV data and reversed mapping
      console.log('🔍 Running early validation...');
      const mappingDbToCsv = Object.fromEntries(
        Object.entries(state.mapping)
          .filter(([_, db]) => db !== 'unmapped' && db)
          .map(([csv, db]) => [db, csv])
      );
      const earlyValidation = await validateDataBeforeImport(state.parsedData, mappingDbToCsv);

      if (!earlyValidation.isValid) {
        toast.error(`Validación fallida: ${earlyValidation.errors.join(', ')}`);
        setState(prev => ({ 
          ...prev, 
          step: 'mapping',
          result: {
            success: false,
            imported: 0,
            updated: 0,
            failed: transformedData.length,
            errors: earlyValidation.errors,
            warnings: earlyValidation.warnings,
            failedRecords: []
          }
        }));
        return;
      }

      if (earlyValidation.warnings.length > 0) {
        toast.warning(`Advertencias: ${earlyValidation.warnings.join(', ')}`);
      }

      // Validate service IDs for duplicates
      const serviceIds = state.parsedData
        .map(row => {
          const idField = Object.keys(state.mapping).find(csvField => state.mapping[csvField] === 'id_servicio');
          return idField ? row[idField] : null;
        })
        .filter(id => id && typeof id === 'string' && id.trim());

      if (serviceIds.length > 0) {
        // ✅ NUEVO: Verificar sesión antes de validar IDs
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!session || sessionError) {
          toast.error('Sesión expirada', {
            description: 'Por favor recarga la página e intenta nuevamente',
            duration: 5000
          });
          setState(prev => ({ 
            ...prev, 
            step: 'mapping',
            result: {
              success: false,
              imported: 0,
              updated: 0,
              failed: transformedData.length,
              errors: ['⚠️ Sesión expirada - por favor recarga la página'],
              warnings: [],
              failedRecords: []
            }
          }));
          return;
        }
        
        const updateMode = isUpdateOnlyMode();
        let validationMode: 'create' | 'update' = 
          importMode === 'auto' 
            ? (updateMode ? 'update' : 'create')
            : importMode === 'update' 
              ? 'update' 
              : 'create';
        
        // Salvaguarda: forzar update si importMode es 'update'
        if (importMode === 'update' && validationMode !== 'update') {
          console.warn('⚠️ Mode mismatch - forcing update mode', { importMode, updateMode, calculated: validationMode });
          validationMode = 'update';
        }
        
        console.log('🔍 Validating service IDs...', { importMode, updateMode, validationMode, count: serviceIds.length });
        toast.info(`Validando (${validationMode.toUpperCase()}): ${serviceIds.length} IDs`, { duration: 2500 });
        
        // ⚡ Fase 2: En UPDATE mode con archivos grandes (>500), skip validación completa
        const shouldSkipValidation = validationMode === 'update' && serviceIds.length > 500;
        
        if (shouldSkipValidation) {
          console.log('⚡ Skipping full validation for large UPDATE batch:', { count: serviceIds.length });
          toast.info(
            `Modo actualización: ${serviceIds.length} registros se procesarán directamente. ` +
            `Los IDs no encontrados serán omitidos automáticamente.`,
            { duration: 5000 }
          );
          // Continue without validation - trust the RPC to handle non-existent IDs
        } else {
          // Validación normal para archivos pequeños o modo CREATE
          const idValidation = await validateMultipleIds(serviceIds, true, validationMode);
          
          // En modo UPDATE, solo bloquear si TODOS los IDs son inválidos
          if (!idValidation.is_valid && validationMode === 'update') {
            const validCount = idValidation.total_checked - idValidation.invalid_count;
            
            if (validCount > 0) {
              // Hay algunos IDs válidos, permitir continuar con warning
              toast.warning(
                `${idValidation.invalid_count} IDs no encontrados serán omitidos. ` +
                `${validCount} registros serán actualizados.`
              );
              console.log('⚠️ Partial validation in UPDATE mode:', { validCount, invalidCount: idValidation.invalid_count });
              // NO hacer return - continuar con la importación
            } else {
              // TODOS los IDs son inválidos - ir a vista de error
              toast.error(`Ningún ID encontrado en la base de datos: ${idValidation.summary}`);
              console.error('❌ No valid IDs found for UPDATE');
              setState(prev => ({ 
                ...prev, 
                step: 'error-detail', // ✅ FASE 5: Ir a paso dedicado de error
                result: {
                  success: false,
                  imported: 0,
                  updated: 0,
                  failed: transformedData.length,
                  errors: [
                    `❌ Ningún ID de servicio encontrado en la base de datos`,
                    `\n📊 Resumen:`,
                    `• Total IDs verificados: ${idValidation.total_checked}`,
                    `• IDs no encontrados: ${idValidation.invalid_count}`,
                    `\n💡 Posibles causas:`,
                    `1. Los IDs no existen en la base de datos`,
                    `2. Los IDs tienen espacios o caracteres adicionales`,
                    `3. El archivo corresponde a otro sistema o periodo`,
                    `\n🔧 Solución:`,
                    `• Verifica que los IDs existan antes de importar`,
                    `• Usa modo "Crear" si son servicios nuevos`,
                    `• Revisa el formato de los IDs (sin espacios extra)`
                  ],
                  warnings: [],
                  failedRecords: []
                }
              }));
              return;
            }
          } else if (!idValidation.is_valid && validationMode === 'create') {
            // En modo CREATE, bloquear siempre si hay duplicados - ir a vista de error
            
            // Distinguir entre tipos de error
            const hasDuplicatesInInput = idValidation.duplicate_in_input.length > 0;
            const hasDuplicatesInDB = idValidation.invalid_services.some(inv => inv.type === 'duplicate_service');
            const hasFinished = idValidation.finished_services.length > 0;
            
            const duplicateCount = idValidation.duplicate_in_input.length + 
              idValidation.invalid_services.filter(inv => inv.type === 'duplicate_service').length;
            const finishedCount = idValidation.finished_services.length;
            
            // ✨ NUEVO: Detectar si TODOS los errores son duplicados en DB (no finished, no otros errores)
            const allAreDuplicatesInDB = hasDuplicatesInDB && 
              !hasFinished && 
              !hasDuplicatesInInput &&
              idValidation.invalid_services.every(inv => inv.type === 'duplicate_service') &&
              idValidation.invalid_services.length === idValidation.total_checked;
            
            // Determinar título del error
            const hasConnectionError = idValidation.summary.includes('Error de conexión') || 
                                      idValidation.summary.includes('ambigüedad');
            
            const errorTitle = hasConnectionError
              ? '❌ Error durante la validación'
              : hasDuplicatesInInput || hasDuplicatesInDB
                ? hasFinished
                  ? '❌ IDs duplicados y servicios finalizados detectados'
                  : '❌ IDs duplicados detectados'
                : hasFinished
                  ? '❌ Servicios finalizados detectados'
                  : '❌ Error durante la validación';
            
            const errorMessage = `${errorTitle}: ${idValidation.summary}`;
            toast.error(errorMessage);
            
            if (idValidation.invalid_services.length > 0) {
              console.warn('Invalid service IDs:', idValidation.invalid_services);
            }
            
            setState(prev => ({ 
              ...prev, 
              step: 'error-detail',
              result: {
                success: false,
                imported: 0,
                updated: 0,
                failed: transformedData.length,
                errors: [
                  errorTitle,
                  `\n📊 Resumen:`,
                  `• Total IDs verificados: ${idValidation.total_checked}`,
                  `• IDs con problemas: ${idValidation.invalid_count}`,
                  ...(hasDuplicatesInInput || hasDuplicatesInDB ? [`• Duplicados: ${duplicateCount}`] : []),
                  ...(hasFinished ? [`• Servicios finalizados: ${finishedCount}`] : []),
                  `\n🔍 Detalles de IDs problemáticos:`,
                  ...idValidation.invalid_services.slice(0, 10).map(inv => 
                    `  • ${inv.id_servicio}: ${inv.message}`
                  ),
                  ...(idValidation.invalid_services.length > 10 
                    ? [`\n... y ${idValidation.invalid_services.length - 10} IDs más con problemas`]
                    : []
                  ),
                  `\n💡 Solución:`,
                  ...(hasDuplicatesInInput || hasDuplicatesInDB ? [
                    allAreDuplicatesInDB 
                      ? `• Los IDs ya existen en la base de datos`
                      : `• Elimina los IDs duplicados del archivo`
                  ] : []),
                  ...(hasFinished ? [`• Los servicios finalizados no pueden modificarse`] : []),
                  ...(allAreDuplicatesInDB ? [
                    `\n🔄 Cambio Rápido:`,
                    `• Puedes cambiar a modo "Actualizar" para modificar estos servicios existentes`
                  ] : [
                    `• Usa modo "Actualizar" si quieres modificar registros existentes`
                  ])
                ],
                warnings: [],
                failedRecords: [],
                // ✨ NUEVO: Sugerir cambio de modo si todos son duplicados en DB
                suggestedAction: allAreDuplicatesInDB ? 'switch_to_update' : undefined
              }
            }));
            return;
          } else {
            toast.success(`Validación de IDs exitosa: ${idValidation.summary}`);
          }
        }
      }

      // The import mode is now controlled by the state variable, not auto-detected here
      console.log(`🎯 Import mode selected: ${importMode}`, {
        mappedFields: Object.values(state.mapping).filter(v => v && v !== 'unmapped'),
        isUpdateOnly: isUpdateOnlyMode()
      });

      const result = await importCustodianServices(
        transformedData, 
        (progress) => {
          setState(prev => ({ ...prev, progress }));
        },
        importMode
      );

      setState(prev => ({ ...prev, result, step: 'results' }));
      console.log('🎯 Import completed, moving to results step:', result);
      
      // Call onComplete with results
      onComplete?.(result, state.fileName);
      
      if (result.success) {
        toast.success(`Importación completada: ${result.imported} nuevos, ${result.updated} actualizados`);
      } else {
        toast.error(`Importación con errores: ${result.failed} registros fallaron`);
      }
    } catch (error) {
      toast.error('Error durante la importación: ' + (error as Error).message);
      setState(prev => ({ ...prev, step: 'preview' }));
    }
  }, [state.parsedData, state.mapping, importMode, isUpdateOnlyMode, isVisible, resetTabTracking, validateMultipleIds, onComplete]);

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
      fileName: '',
    });
    setMappingName('');
    resetTabTracking();
    onOpenChange(false);
  }, [onOpenChange, resetTabTracking]);

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

      <Alert className="border-red-200 bg-red-50 text-red-800">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="font-medium">
          <strong>¡Importante!</strong> Mantén esta pestaña activa durante todo el proceso de importación. 
          Cambiar de pestaña puede interrumpir la carga de datos y causar errores.
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

  const handleIntelligentMapping = () => {
    if (!state.parsedData || state.parsedData.length === 0) {
      toast.error('No hay datos cargados. Por favor, sube un archivo primero.');
      return;
    }

    const csvFields = Object.keys(state.parsedData[0]) || [];
    
    console.log('🎯 Iniciando mapeo inteligente:', {
      totalFilas: state.parsedData.length,
      campos: csvFields,
      primeraFila: state.parsedData[0]
    });
    
    applyIntelligentMapping(csvFields, (newMapping) => {
      console.log('🎯 Mapeo inteligente completado:', newMapping);
      setState(prev => ({ ...prev, mapping: newMapping }));
      autoSaveMapping(newMapping);
    }, state.parsedData || []);
  };

  const renderMappingStep = () => {
    const csvFields = state.parsedData?.[0] ? Object.keys(state.parsedData[0]) : [];
    const mappedCount = Object.values(state.mapping).filter(v => v).length;
    const isValidMapping = Object.values(state.mapping).includes('id_servicio');
    const updateOnlyMode = isUpdateOnlyMode();

    // Helper function to get sample data for a CSV column
    const getSampleData = (columnName: string): string[] => {
      if (!state.parsedData || state.parsedData.length === 0) return [];
      return state.parsedData
        .slice(0, 3)
        .map(row => String(row[columnName] || '').trim())
        .filter(val => val && val !== 'undefined' && val !== 'null');
    };

    // Filter fields based on search and category
    const getFilteredFields = () => {
      let filteredFields = CUSTODIAN_SERVICE_FIELDS;
      
      if (selectedCategory !== 'all') {
        filteredFields = { [selectedCategory]: CUSTODIAN_SERVICE_FIELDS[selectedCategory] || [] };
      }

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const filtered: typeof CUSTODIAN_SERVICE_FIELDS = {};
        
        Object.entries(filteredFields).forEach(([category, fieldDefs]) => {
          const matchingFields = fieldDefs.filter(fieldDef => 
            fieldDef.name.toLowerCase().includes(searchLower) ||
            fieldDef.description.toLowerCase().includes(searchLower) ||
            fieldDef.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
          );
          
          if (matchingFields.length > 0) {
            filtered[category] = matchingFields;
          }
        });
        
        filteredFields = filtered;
      }

      return filteredFields;
    };

    const filteredFields = getFilteredFields();
    const categories = Object.keys(CUSTODIAN_SERVICE_FIELDS);

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
            <Badge className="text-sm px-3 py-1 bg-blue-100 text-blue-800 border-blue-300">
              {importMode === 'auto' && updateOnlyMode && '🔄 Modo: Actualizar (auto-detectado)'}
              {importMode === 'auto' && !updateOnlyMode && '➕ Modo: Crear (auto-detectado)'}
              {importMode === 'create' && '➕ Modo: Crear Nuevos'}
              {importMode === 'update' && '🔄 Modo: Actualizar Existentes'}
            </Badge>
          </div>
        </div>

        {/* Selector de Modo de Importación */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold text-blue-900">
                Modo de Importación
              </Label>
              <Select value={importMode} onValueChange={(value: 'auto' | 'create' | 'update') => setImportMode(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    🤖 Automático (detectar según campos mapeados)
                  </SelectItem>
                  <SelectItem value="create">
                    ➕ Crear Nuevos Servicios
                  </SelectItem>
                  <SelectItem value="update">
                    🔄 Actualizar Servicios Existentes
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {importMode === 'auto' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-sm text-blue-800">
                    <div className="space-y-2">
                      <div className="font-semibold">El sistema detectará automáticamente:</div>
                      <div>
                        📅 <strong>Carga Diaria (Crear)</strong>: Si mapeas 3+ campos → servicios NUEVOS
                      </div>
                      <div>
                        📆 <strong>Actualización Mensual (Actualizar)</strong>: Si solo mapeas id_servicio + estado
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200 text-xs">
                        💡 Tip: Si los IDs ya existen y quieres actualizarlos, usa modo "Actualizar" manualmente
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {importMode === 'create' && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-sm text-green-800">
                    📅 <strong>Modo Crear</strong>: Solo para servicios NUEVOS. Los IDs NO deben existir en la base de datos.
                  </AlertDescription>
                </Alert>
              )}
              
              {importMode === 'update' && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-sm text-orange-800">
                    📆 <strong>Modo Actualizar</strong>: Solo para servicios EXISTENTES. Los IDs deben existir en la base de datos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

         {/* Status del archivo cargado */}
        {state.parsedData && state.parsedData.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Archivo Cargado Correctamente</h3>
                  <p className="text-sm text-green-800">
                    {state.parsedData.length} registros • {csvFields.length} columnas detectadas
                  </p>
                  {updateOnlyMode && (
                    <p className="text-xs text-blue-700 mt-1 font-medium">
                      ⓘ Modo actualización: Se actualizará únicamente el estado de los IDs existentes
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mapeo Inteligente */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 text-lg mb-1">Mapeo Inteligente</h3>
                  <p className="text-sm text-purple-800">
                    Detecta automáticamente qué columnas corresponden a cada campo usando similitud de nombres
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleIntelligentMapping}
                disabled={!state.parsedData || state.parsedData.length === 0}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                Auto-Mapear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Mapeo de Columnas</CardTitle>
            <CardDescription className="text-base">
              Las configuraciones se guardan automáticamente mientras trabajas
            </CardDescription>
            
            {/* Search and Filter Controls */}
            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar campos por nombre, descripción o palabras clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {Object.entries(filteredFields).map(([category, fieldDefs]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-gradient-to-r from-primary to-transparent flex-1"></div>
                      <h4 className="font-bold text-lg text-primary px-3">{category}</h4>
                      <div className="h-px bg-gradient-to-l from-primary to-transparent flex-1"></div>
                    </div>
                    <div className="grid gap-3 ml-6">
                      {fieldDefs.map(fieldDef => {
                        const field = fieldDef.name;
                        // Find which CSV field is mapped to this DB field
                        const csvField = Object.keys(state.mapping).find(k => state.mapping[k] === field);
                        const isMapped = !!csvField;
                        const isRequired = fieldDef.required;
                        
                        return (
                          <div key={field} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isMapped ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'
                          } ${isRequired ? 'ring-2 ring-red-200' : ''}`}>
                            <div className="w-40">
                              <div className="font-mono text-sm font-semibold text-gray-800">{field}</div>
                              <div className="text-xs text-gray-500 mt-1">{fieldDef.description}</div>
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
                                  // Remove this field from mapping
                                  setState(prev => {
                                    const newMapping = { ...prev.mapping };
                                    Object.keys(newMapping).forEach(key => {
                                      if (newMapping[key] === field) {
                                        delete newMapping[key];
                                      }
                                    });
                                    autoSaveMapping(newMapping);
                                    return { ...prev, mapping: newMapping };
                                  });
                                } else {
                                  // Clear any existing mapping for this CSV field and map it to current DB field
                                  setState(prev => {
                                    const newMapping = { ...prev.mapping };
                                    // Remove this CSV field from any existing mapping
                                    delete newMapping[value];
                                    // Remove this DB field from any existing mapping
                                    Object.keys(newMapping).forEach(key => {
                                      if (newMapping[key] === field) {
                                        delete newMapping[key];
                                      }
                                    });
                                    // Add new mapping
                                    newMapping[value] = field;
                                    autoSaveMapping(newMapping);
                                    return { ...prev, mapping: newMapping };
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="w-64 bg-white border-2 font-medium">
                                <SelectValue placeholder="Seleccionar columna CSV" />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-50 border-2 shadow-xl max-h-60">
                                <SelectItem value="none" className="font-medium text-gray-600">
                                  Sin configurar
                                </SelectItem>
                                {csvFields.map(csvField => {
                                  const sampleData = getSampleData(csvField);
                                  return (
                                    <SelectItem key={csvField} value={csvField} className="font-medium">
                                      <div className="w-full">
                                        <div className="font-semibold">{csvField}</div>
                                        {sampleData.length > 0 && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Ejemplo: {sampleData.slice(0, 2).join(', ')}
                                            {sampleData.length > 2 ? '...' : ''}
                                          </div>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
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
            
            {/* Show message when no fields match search */}
            {Object.keys(filteredFields).length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <p>No se encontraron campos que coincidan con "{searchTerm}"</p>
                <p className="text-sm mt-2">Intenta con otros términos de búsqueda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensaje si no hay archivo cargado */}
        {(!state.parsedData || state.parsedData.length === 0) && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">Carga un archivo para continuar</h3>
                  <p className="text-sm text-amber-800">
                    Necesitas cargar un archivo CSV o Excel antes de poder configurar el mapeo de campos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

      {/* Tab switch warning */}
      {hasLeftTab && (
        <Alert className="border-red-200 bg-red-50 text-red-800 max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="font-medium">
            <strong>¡Advertencia!</strong> Has cambiado de pestaña durante el proceso. 
            Esto puede haber afectado la importación. Si el proceso se detiene, reintenta la importación.
          </AlertDescription>
        </Alert>
      )}

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

  const renderErrorDetailStep = () => {
    if (!state.result) return null;

    const handleSwitchToUpdateMode = () => {
      console.log('🔄 Switching to UPDATE mode from error screen');
      setImportMode('update');
      toast.success('Modo cambiado a ACTUALIZAR. Procesando validación...');
      setState(prev => ({ ...prev, step: 'preview', result: null }));
    };

    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-red-600">
            Error de Validación
          </h2>
          
          <p className="text-lg text-muted-foreground">
            Se encontraron problemas con los datos antes de importar
          </p>
        </div>

        {/* ✨ NUEVO: Botón de cambio rápido si se sugiere cambiar a UPDATE */}
        {state.result.suggestedAction === 'switch_to_update' && (
          <Alert className="border-blue-500 bg-blue-50">
            <AlertDescription>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-blue-900 mb-1">
                    💡 Solución Rápida Detectada
                  </div>
                  <p className="text-sm text-blue-800">
                    Los IDs ya existen en la base de datos. Cambia a modo <strong>Actualizar</strong> para modificar estos servicios.
                  </p>
                </div>
                <Button 
                  onClick={handleSwitchToUpdateMode}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0"
                  size="lg"
                >
                  🔄 Cambiar a Modo Actualizar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Detalles del Error
            </CardTitle>
            <CardDescription className="text-red-700">
              Revisa la información a continuación para corregir el problema
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3 pr-4">
                {state.result.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                    <p className="text-sm text-red-800 whitespace-pre-line font-mono">
                      {error}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg mb-2">¿Qué puedes hacer?</h3>
                <div className="space-y-2 text-blue-800">
                  <p>• <strong>Corregir el archivo:</strong> Edita tu CSV/Excel según las indicaciones</p>
                  <p>• <strong>Verificar mapeo:</strong> Revisa que los campos estén correctamente mapeados</p>
                  <p>• <strong>Cambiar modo:</strong> Si es actualización, asegúrate de usar el modo correcto</p>
                  <p>• <strong>Consultar soporte:</strong> Si el error persiste, contacta al equipo técnico</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setState(prev => ({ ...prev, step: 'mapping', result: null }))}
            className="font-medium"
          >
            ← Volver al Mapeo
          </Button>
          <Button 
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, step: 'upload', result: null }))}
            className="font-medium flex-1"
          >
            📁 Cargar Nuevo Archivo
          </Button>
          <Button 
            onClick={handleClose}
            className="font-bold"
          >
            Cerrar
          </Button>
        </div>
      </div>
    );
  };

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
          {state.result.failedRecords && state.result.failedRecords.length > 0 && (
            <Button
              variant="outline"
              onClick={() => exportFailedRecordsToExcel(
                state.result!.failedRecords,
                `registros_fallidos_${state.fileName?.replace(/\.[^/.]+$/, '') || 'importacion'}`
              )}
              className="font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Fallidos ({state.result.failedRecords.length})
            </Button>
          )}
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
                  Paso {['upload', 'mapping', 'validation', 'preview', 'processing', 'error-detail', 'results'].indexOf(state.step) + 1} de 7
                </span>
                <span className="text-primary font-bold">
                  {Math.round(((['upload', 'mapping', 'validation', 'preview', 'processing', 'error-detail', 'results'].indexOf(state.step) + 1) / 7) * 100)}% completado
                </span>
              </div>
              <Progress 
                value={((['upload', 'mapping', 'validation', 'preview', 'processing', 'error-detail', 'results'].indexOf(state.step) + 1) / 7) * 100} 
                className="h-2"
              />
            </div>

            {state.step === 'upload' && renderUploadStep()}
            {state.step === 'mapping' && renderMappingStep()}
            {state.step === 'validation' && renderValidationStep()}
            {state.step === 'preview' && renderPreviewStep()}
            {state.step === 'processing' && renderProcessingStep()}
            {state.step === 'error-detail' && renderErrorDetailStep()}
            {state.step === 'results' && renderResultsStep()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};