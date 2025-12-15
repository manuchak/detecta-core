import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  Send,
  Pause,
  Play
} from 'lucide-react';
import { useCustodianInvitations } from '@/hooks/useCustodianInvitations';
import * as XLSX from 'xlsx';

interface ImportRow {
  rowNumber: number;
  nombre: string;
  email: string;
  telefono: string;
  isValid: boolean;
  errors: string[];
}

interface SendingProgress {
  current: number;
  total: number;
  lastSent: string | null;
  isPaused: boolean;
}

type WizardStep = 'upload' | 'validate' | 'sending' | 'results';

export const BulkInvitationWizard = () => {
  const [step, setStep] = useState<WizardStep>('upload');
  const [importedData, setImportedData] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState<SendingProgress>({ current: 0, total: 0, lastSent: null, isPaused: false });
  const [results, setResults] = useState<{ sent: number; noEmail: number; failed: number }>({ sent: 0, noEmail: 0, failed: 0 });
  const [batchId, setBatchId] = useState<string | null>(null);
  const { toast } = useToast();
  const { createBulkInvitations } = useCustodianInvitations();

  const validateEmail = (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Find header row
        const headerRow = jsonData[0]?.map(h => String(h).toLowerCase().trim()) || [];
        const nombreIdx = headerRow.findIndex(h => h.includes('nombre'));
        const emailIdx = headerRow.findIndex(h => h.includes('email') || h.includes('correo'));
        const telefonoIdx = headerRow.findIndex(h => h.includes('telefono') || h.includes('tel') || h.includes('celular'));

        if (nombreIdx === -1) {
          toast({
            title: 'Error en el archivo',
            description: 'No se encontró la columna "nombre". Verifica que el archivo tenga el formato correcto.',
            variant: 'destructive',
          });
          return;
        }

        const rows: ImportRow[] = jsonData.slice(1).map((row, index) => {
          const nombre = String(row[nombreIdx] || '').trim();
          const email = String(row[emailIdx] || '').trim().toLowerCase();
          const telefono = String(row[telefonoIdx] || '').trim();
          const errors: string[] = [];

          if (!nombre) errors.push('Nombre requerido');
          if (email && !validateEmail(email)) errors.push('Email inválido');
          if (telefono && !validatePhone(telefono)) errors.push('Teléfono inválido');

          return {
            rowNumber: index + 2,
            nombre,
            email,
            telefono,
            isValid: errors.length === 0 && nombre.length > 0,
            errors,
          };
        }).filter(row => row.nombre || row.email); // Remove completely empty rows

        setImportedData(rows);
        setStep('validate');
        toast({
          title: 'Archivo procesado',
          description: `Se encontraron ${rows.length} filas.`,
        });
      } catch (error) {
        toast({
          title: 'Error al procesar archivo',
          description: 'No se pudo leer el archivo. Asegúrate de que sea un Excel o CSV válido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['nombre', 'email', 'telefono'],
      ['Juan Pérez', 'juan@ejemplo.com', '+52 55 1234 5678'],
      ['María García', 'maria@ejemplo.com', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Custodios');
    XLSX.writeFile(wb, 'plantilla-invitaciones-custodios.xlsx');
  };

  const startSending = async () => {
    const validRows = importedData.filter(r => r.isValid);
    setStep('sending');
    setProgress({ current: 0, total: validRows.length, lastSent: null, isPaused: false });
    setResults({ sent: 0, noEmail: 0, failed: 0 });

    try {
      const result = await createBulkInvitations.mutateAsync({
        invitations: validRows.map(row => ({
          nombre: row.nombre,
          email: row.email || undefined,
          telefono: row.telefono || undefined,
        })),
        onProgress: (current, total, lastEmail) => {
          setProgress(prev => ({ ...prev, current, total, lastSent: lastEmail }));
        },
      });

      setBatchId(result.batchId);
      setResults({
        sent: result.sentCount,
        noEmail: result.noEmailCount,
        failed: result.failedCount,
      });
      setStep('results');
    } catch (error: any) {
      toast({
        title: 'Error al enviar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const downloadReport = () => {
    const report = importedData.map(row => ({
      'Fila': row.rowNumber,
      'Nombre': row.nombre,
      'Email': row.email,
      'Teléfono': row.telefono,
      'Estado': row.isValid ? (row.email ? 'Enviado' : 'Sin email') : 'Error',
      'Errores': row.errors.join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(report);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte-invitaciones-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const validCount = importedData.filter(r => r.isValid).length;
  const invalidCount = importedData.filter(r => !r.isValid).length;
  const noEmailCount = importedData.filter(r => r.isValid && !r.email).length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importación Masiva de Custodios
        </CardTitle>
        <CardDescription>
          Importa una lista de custodios desde un archivo Excel o CSV
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Arrastra tu archivo aquí</p>
              <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground mt-4">Formatos soportados: .xlsx, .xls, .csv</p>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Columnas requeridas:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>nombre</strong> (obligatorio)</li>
                <li>• <strong>email</strong> (obligatorio para envío automático)</li>
                <li>• <strong>telefono</strong> (opcional)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Validate */}
        {step === 'validate' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Válidas: {validCount}
                </Badge>
                {noEmailCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Sin email: {noEmailCount}
                  </Badge>
                )}
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Con errores: {invalidCount}
                  </Badge>
                )}
              </div>
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedData.slice(0, 100).map((row) => (
                    <TableRow key={row.rowNumber} className={!row.isValid ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      <TableCell className="font-medium">{row.nombre || '-'}</TableCell>
                      <TableCell>{row.email || <span className="text-muted-foreground italic">Sin email</span>}</TableCell>
                      <TableCell>{row.telefono || '-'}</TableCell>
                      <TableCell>
                        {row.isValid ? (
                          row.email ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <span title="Sin email"><AlertTriangle className="h-4 w-4 text-amber-500" /></span>
                          )
                        ) : (
                          <span className="text-xs text-destructive">{row.errors[0]}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importedData.length > 100 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Mostrando 100 de {importedData.length} filas
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => { setStep('upload'); setImportedData([]); }} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button onClick={startSending} disabled={validCount === 0} className="gap-2">
                Enviar {validCount} invitaciones
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Sending */}
        {step === 'sending' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Send className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
              <h3 className="text-lg font-medium">Enviando Invitaciones</h3>
              <p className="text-muted-foreground mt-1">
                {progress.current} de {progress.total} enviadas
              </p>
            </div>

            <Progress value={(progress.current / progress.total) * 100} className="h-3" />

            {progress.lastSent && (
              <p className="text-center text-sm text-muted-foreground">
                Último enviado: {progress.lastSent} ✅
              </p>
            )}

            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold">Importación Completada</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{results.sent}</p>
                  <p className="text-sm text-green-600/80">Emails enviados</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">{results.noEmail}</p>
                  <p className="text-sm text-amber-600/80">Sin email</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{results.failed}</p>
                  <p className="text-sm text-red-600/80">Fallidos</p>
                </CardContent>
              </Card>
            </div>

            {results.noEmail > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Los custodios sin email tienen link generado. Puedes copiarlo o enviar por WhatsApp desde el historial.
              </p>
            )}

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={downloadReport} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar Reporte
              </Button>
              <Button onClick={() => { setStep('upload'); setImportedData([]); }} className="gap-2">
                Nueva Importación
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkInvitationWizard;
