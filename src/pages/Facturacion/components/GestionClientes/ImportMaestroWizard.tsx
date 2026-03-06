import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  Users,
  FileText,
  Clock,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  ParsedMaestro,
  ImportSummary,
  ImportExecutionResult,
  MatchResult,
  parseExcelMaestro,
  matchClientsWithDb,
  executeMaestroImport,
} from '../../services/maestroImportService';

interface ImportMaestroWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'summary' | 'executing' | 'done';

export function ImportMaestroWizard({ open, onOpenChange }: ImportMaestroWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('upload');
  const [parsed, setParsed] = useState<ParsedMaestro | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [result, setResult] = useState<ImportExecutionResult | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, msg: '' });
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const reset = useCallback(() => {
    setStep('upload');
    setParsed(null);
    setSummary(null);
    setResult(null);
    setProgress({ current: 0, total: 0, msg: '' });
    setLoading(false);
    setFileName('');
  }, []);

  const handleClose = () => {
    if (step !== 'executing') {
      reset();
      onOpenChange(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);

    try {
      const data = await parseExcelMaestro(file);
      setParsed(data);
      setStep('preview');
    } catch (err) {
      toast.error('Error al leer el archivo Excel');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!parsed) return;
    setLoading(true);
    try {
      const matchResult = await matchClientsWithDb(parsed);
      setSummary(matchResult);
      setStep('summary');
    } catch (err) {
      toast.error('Error al hacer matching con base de datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!parsed || !summary) return;
    setStep('executing');

    try {
      const importResult = await executeMaestroImport(
        parsed,
        summary.matchResults,
        (current, total, msg) => setProgress({ current, total, msg })
      );
      setResult(importResult);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['clientes-fiscales'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-contactos'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-gadgets'] });
    } catch (err) {
      toast.error('Error durante la importación');
      console.error(err);
      setStep('summary');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Maestro de Facturación
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube el archivo Excel con las reglas de facturación, contactos y estadías.'}
            {step === 'preview' && 'Revisión de los datos parseados del archivo.'}
            {step === 'summary' && 'Resumen del matching con la base de datos. Revisa antes de ejecutar.'}
            {step === 'executing' && 'Importando datos...'}
            {step === 'done' && 'Importación completada.'}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-1">
          {(['upload', 'preview', 'summary', 'done'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className="flex-1 h-px bg-border" />}
              <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${
                step === s || (step === 'executing' && s === 'done')
                  ? 'bg-primary text-primary-foreground'
                  : ['upload', 'preview', 'summary', 'done'].indexOf(s) < ['upload', 'preview', 'summary', 'done'].indexOf(step === 'executing' ? 'done' : step)
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Arrastra o selecciona el archivo</p>
                <p className="text-xs text-muted-foreground mb-4">
                  MAESTRO DE FACTURACION.xlsx
                </p>
                <label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Seleccionar archivo</span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground max-w-md text-center">
                El archivo debe tener las pestañas: Reglas de Facturación, Contactos, Servicios Monitoring, Reglas de Estadías y Portales.
              </p>
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && parsed && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={FileText} label="Reglas Facturación" value={parsed.reglas.length} />
                <StatCard icon={Users} label="Contactos" value={parsed.contactos.length} />
                <StatCard icon={Clock} label="Reglas Estadías" value={parsed.estadias.length} />
                <StatCard icon={Package} label="Portales" value={parsed.portales.length} />
              </div>

              {/* Preview of first 10 reglas */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Preview: Reglas de Facturación (primeros 10)</p>
                <ScrollArea className="h-[240px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">Corte</TableHead>
                        <TableHead className="text-xs">Portal</TableHead>
                        <TableHead className="text-xs">Descripción</TableHead>
                        <TableHead className="text-xs">Entrega</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsed.reglas.slice(0, 10).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium">{r.clienteNombre}</TableCell>
                          <TableCell className="text-xs">{r.corte || r.inmediata || '-'}</TableCell>
                          <TableCell className="text-xs">{r.portal || '-'}</TableCell>
                          <TableCell className="text-xs truncate max-w-[200px]">{r.descripcion || '-'}</TableCell>
                          <TableCell className="text-xs">{r.fechaEntrega || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Atrás
                </Button>
                <Button size="sm" onClick={handleMatch} disabled={loading}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Hacer matching con BD
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Summary */}
          {step === 'summary' && summary && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{summary.matched}</p>
                  <p className="text-xs text-muted-foreground">Clientes encontrados</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{summary.unmatched}</p>
                  <p className="text-xs text-muted-foreground">Sin match</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{summary.changesCount}</p>
                  <p className="text-xs text-muted-foreground">Cambios a aplicar</p>
                </div>
              </div>

              <ScrollArea className="h-[320px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs w-8">Match</TableHead>
                      <TableHead className="text-xs">Cliente (Excel)</TableHead>
                      <TableHead className="text-xs">Cliente (BD)</TableHead>
                      <TableHead className="text-xs text-center">Cambios</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.matchResults.map((m, i) => (
                      <MatchRow key={i} match={m} />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setStep('preview')}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Atrás
                </Button>
                <Button size="sm" onClick={handleExecute} disabled={summary.matched === 0}>
                  Ejecutar importación ({summary.matched} clientes)
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Executing */}
          {step === 'executing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Importando datos...</p>
                <p className="text-xs text-muted-foreground">{progress.msg}</p>
              </div>
              <div className="w-64">
                <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} />
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {progress.current} / {progress.total}
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Done */}
          {step === 'done' && result && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                {result.success ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                )}
                <div>
                  <p className="font-semibold">
                    {result.success ? 'Importación exitosa' : 'Importación completada con errores'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.updated} clientes actualizados · {result.contactosCreated} contactos creados · {result.gadgetsCreated} gadgets creados
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <ScrollArea className="h-[200px] rounded-md border p-3">
                  <div className="space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive flex items-start gap-1">
                        <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        {err}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="flex justify-end">
                <Button size="sm" onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: MatchResult }) {
  return (
    <TableRow className={match.confidence === 'none' ? 'bg-destructive/5' : ''}>
      <TableCell>
        {match.confidence === 'exact' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        {match.confidence === 'partial' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
        {match.confidence === 'none' && <XCircle className="h-4 w-4 text-destructive" />}
      </TableCell>
      <TableCell className="text-xs font-medium">{match.clienteNombre}</TableCell>
      <TableCell className="text-xs">
        {match.matchedNombre || <span className="text-muted-foreground italic">Sin match</span>}
        {match.confidence === 'partial' && (
          <Badge variant="outline" className="ml-1 text-[9px]">Parcial</Badge>
        )}
      </TableCell>
      <TableCell className="text-center">
        {match.changes.length > 0 ? (
          <Badge variant="secondary" className="text-[10px]">{match.changes.length}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}
