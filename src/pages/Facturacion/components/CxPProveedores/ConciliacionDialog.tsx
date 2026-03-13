import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  parseProviderFile,
  REQUIRED_MAPPINGS,
  runConciliacion,
  type ParsedFile,
  type ColumnMapping,
  type ConciliacionLine,
  type DetectaRecord,
} from '../../services/conciliacionParserService';
import { useCreateConciliacion } from '../../hooks/useConciliacion';
import type { CxPProveedor } from '../../hooks/useCxPProveedores';

type Step = 'upload' | 'mapping' | 'results';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cxp: CxPProveedor;
}

export function ConciliacionDialog({ open, onOpenChange, cxp }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [results, setResults] = useState<ConciliacionLine[]>([]);
  const [detectaRecords, setDetectaRecords] = useState<DetectaRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const createMutation = useCreateConciliacion();

  const resetState = useCallback(() => {
    setStep('upload');
    setParsedFile(null);
    setMapping({});
    setResults([]);
    setDetectaRecords([]);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const parsed = await parseProviderFile(file);
      setParsedFile(parsed);
      setStep('mapping');

      // Auto-detect column mapping
      const autoMap: Partial<ColumnMapping> = {};
      const lowerHeaders = parsed.headers.map(h => h.toLowerCase());
      
      const dateKeywords = ['fecha', 'date', 'dia'];
      const nameKeywords = ['nombre', 'custodio', 'armado', 'guardia', 'name'];
      const routeKeywords = ['ruta', 'destino', 'route', 'origen'];
      const amountKeywords = ['monto', 'total', 'importe', 'amount', 'pago', 'costo'];

      parsed.headers.forEach((h, i) => {
        const lower = lowerHeaders[i];
        if (!autoMap.fecha && dateKeywords.some(k => lower.includes(k))) autoMap.fecha = h;
        if (!autoMap.nombre_armado && nameKeywords.some(k => lower.includes(k))) autoMap.nombre_armado = h;
        if (!autoMap.ruta_destino && routeKeywords.some(k => lower.includes(k))) autoMap.ruta_destino = h;
        if (!autoMap.monto && amountKeywords.some(k => lower.includes(k))) autoMap.monto = h;
      });

      setMapping(autoMap);
    } catch (err: any) {
      toast.error(`Error al leer archivo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isMappingComplete = REQUIRED_MAPPINGS.every(m => mapping[m.key]);

  const handleRunConciliacion = async () => {
    if (!parsedFile || !isMappingComplete) return;

    setLoading(true);
    try {
      // Fetch Detecta records for this CxP
      const { data: detalles, error } = await supabase
        .from('cxp_detalle_servicios')
        .select(`
          asignacion_id,
          monto_servicio,
          asignacion_armados!inner(
            hora_encuentro,
            armado_nombre_verificado,
            punto_encuentro,
            armados_operativos(nombre)
          )
        `)
        .eq('cxp_id', cxp.id);

      if (error) throw error;

      const dRecords: DetectaRecord[] = (detalles || []).map((d: any) => {
        const asig = d.asignacion_armados;
        return {
          asignacion_id: d.asignacion_id,
          fecha: asig?.hora_encuentro?.split('T')[0] || '',
          nombre_armado: asig?.armado_nombre_verificado || asig?.armados_operativos?.nombre || '',
          ruta: asig?.punto_encuentro || '',
          monto: Number(d.monto_servicio) || 0,
        };
      });

      setDetectaRecords(dRecords);

      const lines = runConciliacion(dRecords, parsedFile.rows, mapping as ColumnMapping);
      setResults(lines);
      setStep('results');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConciliacion = async () => {
    if (!parsedFile) return;

    await createMutation.mutateAsync({
      cxpId: cxp.id,
      filename: parsedFile.filename,
      mapping: mapping as Record<string, string>,
      lines: results,
      totalFilasDetecta: detectaRecords.length,
      totalFilasProveedor: parsedFile.rows.length,
    });

    onOpenChange(false);
    resetState();
  };

  const summary = useMemo(() => {
    const coincide = results.filter(r => r.resultado === 'coincide').length;
    const discrepancia = results.filter(r => r.resultado === 'discrepancia_monto').length;
    const soloProv = results.filter(r => r.resultado === 'solo_proveedor').length;
    const soloDet = results.filter(r => r.resultado === 'solo_detecta').length;
    return { coincide, discrepancia, soloProv, soloDet, total: results.length };
  }, [results]);

  const formatCurrency = (v: number | null) =>
    v != null ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v) : '—';

  const RESULT_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    coincide: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Coincide' },
    discrepancia_monto: { icon: AlertTriangle, color: 'text-amber-600', label: 'Diferencia' },
    solo_proveedor: { icon: XCircle, color: 'text-red-500', label: 'Solo Proveedor' },
    solo_detecta: { icon: XCircle, color: 'text-blue-500', label: 'Solo Detecta' },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Conciliación — {cxp.proveedor_nombre}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Badge variant={step === 'upload' ? 'default' : 'secondary'}>1. Subir archivo</Badge>
          <ArrowRight className="h-3 w-3" />
          <Badge variant={step === 'mapping' ? 'default' : 'secondary'}>2. Mapear columnas</Badge>
          <ArrowRight className="h-3 w-3" />
          <Badge variant={step === 'results' ? 'default' : 'secondary'}>3. Resultados</Badge>
        </div>

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 border-2 border-dashed border-border rounded-lg">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Sube la relación del proveedor (Excel o CSV)</p>
            <label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button variant="outline" asChild disabled={loading}>
                <span>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Seleccionar archivo</span>
              </Button>
            </label>
          </div>
        )}

        {/* STEP 2: Column Mapping */}
        {step === 'mapping' && parsedFile && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Archivo: <strong>{parsedFile.filename}</strong> — {parsedFile.rows.length} filas detectadas.
              Mapea cada campo a la columna correspondiente del archivo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REQUIRED_MAPPINGS.map(m => (
                <div key={m.key} className="space-y-1.5">
                  <Label className="text-xs">{m.label} *</Label>
                  <Select
                    value={mapping[m.key] || ''}
                    onValueChange={v => setMapping(prev => ({ ...prev, [m.key]: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={m.description} />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedFile.headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview first 3 rows */}
            <div className="text-xs text-muted-foreground mt-2">Vista previa (primeras 3 filas):</div>
            <div className="overflow-x-auto max-h-40 border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    {parsedFile.headers.slice(0, 8).map(h => (
                      <TableHead key={h} className="text-[10px] px-2 py-1 whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedFile.rows.slice(0, 3).map(r => (
                    <TableRow key={r.rowIndex}>
                      {parsedFile.headers.slice(0, 8).map(h => (
                        <TableCell key={h} className="text-[10px] px-2 py-1 whitespace-nowrap">
                          {String(r.raw[h] ?? '').substring(0, 30)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { resetState(); }}>Cancelar</Button>
              <Button onClick={handleRunConciliacion} disabled={!isMappingComplete || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Ejecutar Conciliación
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 'results' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Coinciden</p>
                    <p className="text-lg font-bold">{summary.coincide}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Diferencia monto</p>
                    <p className="text-lg font-bold">{summary.discrepancia}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Solo Proveedor</p>
                    <p className="text-lg font-bold">{summary.soloProv}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Solo Detecta</p>
                    <p className="text-lg font-bold">{summary.soloDet}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Detail table */}
            <div className="overflow-x-auto max-h-[400px] border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Resultado</TableHead>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">Ruta</TableHead>
                    <TableHead className="text-xs text-right">Monto Detecta</TableHead>
                    <TableHead className="text-xs text-right">Monto Proveedor</TableHead>
                    <TableHead className="text-xs text-right">Diferencia</TableHead>
                    <TableHead className="text-xs text-center">Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => {
                    const cfg = RESULT_CONFIG[r.resultado] || RESULT_CONFIG.solo_detecta;
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                            <span className="text-[11px]">{cfg.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{r.fecha || '—'}</TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{r.nombre || '—'}</TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{r.ruta || '—'}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(r.monto_detecta)}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(r.monto_proveedor)}</TableCell>
                        <TableCell className={`text-xs text-right font-medium ${r.diferencia && r.diferencia !== 0 ? 'text-amber-600' : ''}`}>
                          {r.diferencia != null ? formatCurrency(r.diferencia) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetState}>Reiniciar</Button>
              <Button
                onClick={handleSaveConciliacion}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar Conciliación
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
