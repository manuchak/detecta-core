import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { ExcelData, MappingConfig, validateMappedData } from '@/utils/excelImporter';

interface ImportMappingStepProps {
  data: ExcelData;
  mapping: MappingConfig;
  onComplete: (mapping: MappingConfig) => void;
  onBack: () => void;
}

const NONE_VALUE = '__none__';
const DATABASE_FIELDS = [
  { value: NONE_VALUE, label: 'No mapear', description: 'Ignorar esta columna' },
  { value: 'folio', label: 'Folio', description: 'Folio del servicio (si existe en Excel)' },
  { value: 'cliente', label: 'Cliente', description: 'Nombre del cliente (texto)' },
  { value: 'cliente_id', label: 'Cliente ID', description: 'Identificador único del cliente', required: true },
  { value: 'fecha_hora_programada', label: 'Fecha y Hora Programada', description: 'Fecha y hora del servicio (DD-MM-YYYY HH:MM o similar)' },
  { value: 'fecha_programada', label: 'Fecha Programada', description: 'Fecha del servicio (YYYY-MM-DD)', required: true },
  { value: 'hora_programacion', label: 'Hora Programación', description: 'Hora del servicio (HH:MM)' },
  { value: 'fecha_hora_recepcion_servicio', label: 'Fecha y Hora de recepción de la Solicitud del Servicio', description: 'Fecha y hora de recepción (YYYY-MM-DD HH:MM)' },
  { value: 'hora_ventana_inicio', label: 'Hora Inicio', description: 'Hora de inicio (HH:MM)' },
  { value: 'hora_ventana_fin', label: 'Hora Fin', description: 'Hora de fin (HH:MM)' },
  { value: 'origen_texto', label: 'Origen', description: 'Dirección de origen', required: true },
  { value: 'origen_lat', label: 'Latitud Origen', description: 'Coordenada latitud del origen' },
  { value: 'origen_lng', label: 'Longitud Origen', description: 'Coordenada longitud del origen' },
  { value: 'destino_texto', label: 'Destino', description: 'Dirección de destino', required: true },
  { value: 'destino_lat', label: 'Latitud Destino', description: 'Coordenada latitud del destino' },
  { value: 'destino_lng', label: 'Longitud Destino', description: 'Coordenada longitud del destino' },
  { value: 'tipo_servicio', label: 'Tipo Servicio', description: 'traslado, custodia_local, escolta, vigilancia' },
  { value: 'custodio_asignado_id', label: 'Custodio ID', description: 'ID del custodio asignado (UUID o código)' },
  { value: 'requiere_gadgets', label: 'Requiere Gadgets', description: 'true/false o si/no' },
  { value: 'notas_especiales', label: 'Notas Especiales', description: 'Comentarios adicionales' },
  { value: 'prioridad', label: 'Prioridad', description: 'Número del 1 al 5' },
  { value: 'valor_estimado', label: 'Valor Estimado', description: 'Valor monetario del servicio' }
];

export default function ImportMappingStep({
  data,
  mapping,
  onComplete,
  onBack
}: ImportMappingStepProps) {
  const [currentMapping, setCurrentMapping] = useState<MappingConfig>(mapping);
  const safeColumns = (data.columns || []).filter((c: any) => c && typeof c.key === 'string');
  const [validationResult, setValidationResult] = useState(() => {
    const requiredFields = DATABASE_FIELDS.filter(f => f.required).map(f => f.value);
    return validateMappedData({ ...data, columns: safeColumns }, mapping, requiredFields);
  });

  const handleMappingChange = (excelColumn: string, dbField: string) => {
    const normalized = dbField === NONE_VALUE ? '' : dbField;
    const newMapping = { ...currentMapping, [excelColumn]: normalized };
    setCurrentMapping(newMapping);
    
    // Re-validate
    const requiredFields = DATABASE_FIELDS.filter(f => f.required).map(f => f.value);
    setValidationResult(validateMappedData({ ...data, columns: safeColumns }, newMapping, requiredFields));
  };

  const handleContinue = () => {
    if (validationResult.valid) {
      onComplete(currentMapping);
    }
  };

  const getUsedFields = () => {
    return Object.values(currentMapping).filter(field => field !== '' && field !== NONE_VALUE);
  };

  const usedFields = getUsedFields();

  return (
    <div className="space-y-6 py-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Mapeo de Columnas</h3>
        <p className="text-muted-foreground">
          Asocia cada columna de Excel con los campos correspondientes en la base de datos
        </p>
      </div>

      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Archivo: {data.fileName}</CardTitle>
          <CardDescription>
            {safeColumns.length} columnas encontradas, {data.rows.length} registros
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Validation Status */}
      {!validationResult.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Errores de validación:</div>
              {validationResult.errors.map((error, index) => (
                <div key={index} className="text-sm">• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validationResult.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Advertencias:</div>
              {validationResult.warnings.map((warning, index) => (
                <div key={index} className="text-sm">• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración de Mapeo</CardTitle>
          <CardDescription>
            Los campos marcados con <Badge variant="destructive" className="text-xs">*</Badge> son obligatorios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safeColumns.map((column) => (
              <div key={column.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{column.header}</div>
                  <div className="text-sm text-muted-foreground">
                    Muestra: "{column.sample}"
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <Select
                    value={(currentMapping[column.key] && currentMapping[column.key] !== '' ? currentMapping[column.key] : NONE_VALUE)}
                    onValueChange={(value) => handleMappingChange(column.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATABASE_FIELDS.map((field) => {
                        const isUsed = usedFields.includes(field.value) && 
                                      currentMapping[column.key] !== field.value;
                        return (
                          <SelectItem 
                            key={field.value} 
                            value={field.value}
                            textValue={field.label}
                            disabled={isUsed && field.value !== ''}
                          >
                            <div className="flex items-center gap-2">
                              <span>{field.label}</span>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs" aria-hidden>
                                  *
                                </Badge>
                              )}
                              {isUsed && field.value !== '' && (
                                <Badge variant="secondary" className="text-xs">En uso</Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {currentMapping[column.key] && currentMapping[column.key] !== NONE_VALUE && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {DATABASE_FIELDS.find(f => f.value === currentMapping[column.key])?.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen del Mapeo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Campos Mapeados:</div>
              <div className="space-y-1">
                {Object.entries(currentMapping)
                  .filter(([_, dbField]) => dbField !== '' && dbField !== NONE_VALUE)
                  .map(([excelCol, dbField]) => {
                    const excelColumn = safeColumns.find(c => c.key === excelCol);
                    const dbColumn = DATABASE_FIELDS.find(f => f.value === dbField);
                    return (
                      <div key={excelCol} className="text-sm">
                        <span className="text-muted-foreground">{excelColumn?.header}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium">{dbColumn?.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Campos Sin Mapear:</div>
              <div className="space-y-1">
                {safeColumns
                  .filter(col => !currentMapping[col.key] || currentMapping[col.key] === '' || currentMapping[col.key] === NONE_VALUE)
                  .map(column => (
                    <div key={column.key} className="text-sm text-muted-foreground">
                      {column.header}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        <Button 
          onClick={handleContinue}
          disabled={!validationResult.valid}
        >
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}