import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExcelRow {
  CLIENTE?: string;
  DESTINO?: string;
  'DIAS OPERACION'?: string;
  'VALOR BRUTO'?: number;
  'PRECIO A CUSTODIO'?: number;
  'COSTO OPERATIVO'?: number;
  'No de Kms'?: number;
  'PRECIO DESDE CASA'?: number;
  'PRECIO HISTORICO 2022'?: number;
  'PRECIO OPERATIVO LOGISTICO'?: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ExcelImportWizardProps {
  onSuccess: () => void;
}

export const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ExcelRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'success'>('upload');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFile(file);
    setIsProcessing(true);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Buscar la hoja "costos" o usar la primera hoja
        let sheetName = 'costos';
        if (!workbook.SheetNames.includes(sheetName)) {
          sheetName = workbook.SheetNames[0];
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Procesar datos
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const processedData: ExcelRow[] = rows
          .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
          .map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

        setData(processedData);
        validateData(processedData);
        setStep('preview');
        setProgress(100);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        toast.error('Error al procesar el archivo Excel');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  }, []);

  const validateData = (data: ExcelRow[]) => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      // Validar campos requeridos
      if (!row.CLIENTE || row.CLIENTE.toString().trim() === '') {
        errors.push({ row: index + 2, field: 'CLIENTE', message: 'Campo requerido' });
      }
      
      if (!row.DESTINO || row.DESTINO.toString().trim() === '') {
        errors.push({ row: index + 2, field: 'DESTINO', message: 'Campo requerido' });
      }
      
      if (!row['VALOR BRUTO'] || Number(row['VALOR BRUTO']) <= 0) {
        errors.push({ row: index + 2, field: 'VALOR BRUTO', message: 'Debe ser un número mayor a 0' });
      }
      
      if (!row['PRECIO A CUSTODIO'] || Number(row['PRECIO A CUSTODIO']) <= 0) {
        errors.push({ row: index + 2, field: 'PRECIO A CUSTODIO', message: 'Debe ser un número mayor a 0' });
      }

      // Validar que el precio al cliente sea mayor al precio al custodio
      if (row['VALOR BRUTO'] && row['PRECIO A CUSTODIO'] && 
          Number(row['VALOR BRUTO']) <= Number(row['PRECIO A CUSTODIO'])) {
        errors.push({ 
          row: index + 2, 
          field: 'VALOR BRUTO', 
          message: 'Debe ser mayor al precio del custodio' 
        });
      }
    });

    setValidationErrors(errors);
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error('Corrige los errores antes de importar');
      return;
    }

    setStep('importing');
    setProgress(0);

    try {
      const validData = data.filter(row => 
        row.CLIENTE && 
        row.DESTINO && 
        row['VALOR BRUTO'] && 
        row['PRECIO A CUSTODIO']
      );

      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < validData.length; i += batchSize) {
        batches.push(validData.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i].map(row => ({
          cliente_nombre: row.CLIENTE!.toString().trim(),
          destino_texto: row.DESTINO!.toString().trim(),
          dias_operacion: row['DIAS OPERACION']?.toString() || null,
          valor_bruto: Number(row['VALOR BRUTO']),
          precio_custodio: Number(row['PRECIO A CUSTODIO']),
          costo_operativo: Number(row['COSTO OPERATIVO']) || 0,
          distancia_km: row['No de Kms'] ? Number(row['No de Kms']) : null,
          precio_desde_casa: row['PRECIO DESDE CASA'] ? Number(row['PRECIO DESDE CASA']) : null,
          precio_historico_2022: row['PRECIO HISTORICO 2022'] ? Number(row['PRECIO HISTORICO 2022']) : null,
          precio_operativo_logistico: row['PRECIO OPERATIVO LOGISTICO'] ? Number(row['PRECIO OPERATIVO LOGISTICO']) : null,
          activo: true
        }));

        const { error } = await supabase
          .from('matriz_precios_rutas')
          .upsert(batch, { 
            onConflict: 'cliente_nombre,destino_texto',
            ignoreDuplicates: false 
          });

        if (error) throw error;

        setProgress(((i + 1) / batches.length) * 100);
      }

      setStep('success');
      toast.success(`${validData.length} precios importados exitosamente`);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Error al importar los datos');
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['CLIENTE', 'DESTINO', 'DIAS OPERACION', 'VALOR BRUTO', 'PRECIO A CUSTODIO', 'COSTO OPERATIVO', 'No de Kms'],
      ['Cliente Ejemplo', 'Ciudad de México', 'L-V', 1000, 700, 150, 45],
      ['Otro Cliente', 'Guadalajara', 'L-D', 1500, 1000, 200, 65]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'costos');
    XLSX.writeFile(wb, 'template_matriz_precios.xlsx');
  };

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">¡Importación Exitosa!</h3>
              <p className="text-muted-foreground">
                Los precios han sido importados correctamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'importing') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold">Importando datos...</h3>
              <p className="text-muted-foreground">Por favor espera mientras procesamos tu archivo</p>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(progress)}% completado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo Excel</CardTitle>
            <CardDescription>
              Sube tu archivo Excel con la matriz de precios. Debe contener las columnas: CLIENTE, DESTINO, VALOR BRUTO, PRECIO A CUSTODIO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo
                  </p>
                  <p className="text-xs text-muted-foreground">Excel (.xlsx, .xls)</p>
                </div>
                <Input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                ¿No tienes un archivo? Descarga nuestra plantilla
              </span>
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  Procesando archivo...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Vista Previa de Datos
              </CardTitle>
              <CardDescription>
                Revisa los datos antes de importar. Se encontraron {data.length} filas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationErrors.length > 0 && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Se encontraron {validationErrors.length} errores que deben corregirse antes de importar.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {data.length} filas totales
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {validationErrors.length === 0 ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Listo para importar
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        {validationErrors.length} errores
                      </Badge>
                    )}
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    <h4 className="font-medium text-sm">Errores encontrados:</h4>
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-destructive bg-destructive/5 p-2 rounded">
                        Fila {error.row}, {error.field}: {error.message}
                      </div>
                    ))}
                    {validationErrors.length > 10 && (
                      <p className="text-sm text-muted-foreground">
                        ... y {validationErrors.length - 10} errores más
                      </p>
                    )}
                  </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-auto">
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
                        {data.slice(0, 10).map((row, index) => (
                          <tr key={index} className={validationErrors.some(e => e.row === index + 2) ? 'bg-destructive/5' : ''}>
                            <td className="p-2 border-t">{row.CLIENTE}</td>
                            <td className="p-2 border-t">{row.DESTINO}</td>
                            <td className="p-2 border-t">${Number(row['VALOR BRUTO'] || 0).toLocaleString()}</td>
                            <td className="p-2 border-t">${Number(row['PRECIO A CUSTODIO'] || 0).toLocaleString()}</td>
                            <td className="p-2 border-t">${Number(row['COSTO OPERATIVO'] || 0).toLocaleString()}</td>
                            <td className="p-2 border-t">{row['No de Kms'] || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.length > 10 && (
                      <div className="p-2 text-center text-muted-foreground text-sm border-t">
                        ... y {data.length - 10} filas más
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Cambiar Archivo
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={validationErrors.length > 0}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar {data.length} Registros
            </Button>
          </div>
        </>
      )}
    </div>
  );
};