import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

interface ComparisonRow {
  period: string;
  year: number;
  month: number;
  servicesExcel: number;
  servicesSystem: number;
  servicesDelta: number;
  servicesDeltaPct: number;
  gmvExcel: number;
  gmvSystem: number;
  gmvDelta: number;
  gmvDeltaPct: number;
  status: 'ok' | 'alert' | 'error';
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function normalizeColumnName(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function findColumn(headers: string[], variants: string[]): string | null {
  for (const h of headers) {
    const norm = normalizeColumnName(h);
    if (variants.some(v => norm === v || norm.includes(v))) return h;
  }
  return null;
}

function getStatus(deltaPct: number): 'ok' | 'alert' | 'error' {
  const abs = Math.abs(deltaPct);
  if (abs < 1) return 'ok';
  if (abs < 5) return 'alert';
  return 'error';
}

const StatusIcon = ({ status }: { status: 'ok' | 'alert' | 'error' }) => {
  if (status === 'ok') return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === 'alert') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
};

const DataAuditManager = () => {
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);

    try {
      // Read Excel
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      if (rows.length === 0) {
        toast.error('El archivo está vacío');
        setLoading(false);
        return;
      }

      const headers = Object.keys(rows[0]);
      const yearCol = findColumn(headers, ['ano', 'year', 'año']);
      const monthCol = findColumn(headers, ['mes', 'month']);
      const servicesCol = findColumn(headers, ['servicios', 'services', 'servicio']);
      const gmvCol = findColumn(headers, ['gmv', 'ingreso', 'revenue', 'cobro']);

      if (!yearCol || !monthCol || !servicesCol) {
        toast.error('No se encontraron las columnas requeridas: Año, Mes, Servicios');
        setLoading(false);
        return;
      }

      // Parse Excel data
      const excelMap: Record<string, { services: number; gmv: number }> = {};
      rows.forEach(row => {
        const year = parseInt(String(row[yearCol]));
        const month = parseInt(String(row[monthCol]));
        if (isNaN(year) || isNaN(month)) return;
        const key = `${year}-${month}`;
        excelMap[key] = {
          services: parseInt(String(row[servicesCol] || 0)) || 0,
          gmv: gmvCol ? parseFloat(String(row[gmvCol] || 0)) || 0 : 0,
        };
      });

      // Fetch system data via RPC
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_historical_monthly_data');
      if (rpcErr) throw rpcErr;

      const systemMap: Record<string, { services: number; gmv: number }> = {};
      (rpcData || []).forEach((r: any) => {
        const key = `${r.year}-${r.month}`;
        systemMap[key] = {
          services: r.services,
          gmv: parseFloat(String(r.gmv)) || 0,
        };
      });

      // Build comparison
      const allKeys = new Set([...Object.keys(excelMap), ...Object.keys(systemMap)]);
      const results: ComparisonRow[] = [];

      allKeys.forEach(key => {
        const [yStr, mStr] = key.split('-');
        const year = parseInt(yStr);
        const month = parseInt(mStr);
        const excel = excelMap[key] || { services: 0, gmv: 0 };
        const system = systemMap[key] || { services: 0, gmv: 0 };

        const servicesDelta = system.services - excel.services;
        const servicesDeltaPct = excel.services > 0 ? (servicesDelta / excel.services) * 100 : (system.services > 0 ? 100 : 0);
        const gmvDelta = system.gmv - excel.gmv;
        const gmvDeltaPct = excel.gmv > 0 ? (gmvDelta / excel.gmv) * 100 : (system.gmv > 0 ? 100 : 0);

        const worstPct = Math.max(Math.abs(servicesDeltaPct), Math.abs(gmvDeltaPct));

        results.push({
          period: `${MONTH_LABELS[month - 1]} ${year}`,
          year, month,
          servicesExcel: excel.services,
          servicesSystem: system.services,
          servicesDelta,
          servicesDeltaPct,
          gmvExcel: excel.gmv,
          gmvSystem: system.gmv,
          gmvDelta,
          gmvDeltaPct,
          status: getStatus(worstPct),
        });
      });

      results.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
      setComparison(results);
      toast.success(`Comparación completada: ${results.length} periodos analizados`);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportResults = useCallback(() => {
    if (comparison.length === 0) return;
    const exportData = comparison.map(r => ({
      Periodo: r.period,
      'Servicios Excel': r.servicesExcel,
      'Servicios Sistema': r.servicesSystem,
      'Delta Servicios': r.servicesDelta,
      'Delta % Servicios': `${r.servicesDeltaPct.toFixed(1)}%`,
      'GMV Excel': r.gmvExcel,
      'GMV Sistema': r.gmvSystem,
      'Delta GMV': r.gmvDelta,
      'Delta % GMV': `${r.gmvDeltaPct.toFixed(1)}%`,
      Estado: r.status === 'ok' ? 'OK' : r.status === 'alert' ? 'Alerta' : 'Error',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');
    XLSX.writeFile(wb, `auditoria_datos_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [comparison]);

  // Summary stats
  const totalPeriods = comparison.length;
  const withDiscrepancy = comparison.filter(r => r.status !== 'ok').length;
  const maxDiscrepancy = comparison.length > 0
    ? Math.max(...comparison.map(r => Math.max(Math.abs(r.servicesDeltaPct), Math.abs(r.gmvDeltaPct))))
    : 0;
  const matchRate = totalPeriods > 0 ? ((totalPeriods - withDiscrepancy) / totalPeriods) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="max-w-xs"
            disabled={loading}
          />
        </div>
        {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {comparison.length > 0 && (
          <Button variant="outline" onClick={exportResults} className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Exportar Resultados
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {comparison.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Periodos Analizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPeriods}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Con Discrepancia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${withDiscrepancy > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {withDiscrepancy}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Discrepancia Máxima</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maxDiscrepancy.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Coincidencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${matchRate >= 90 ? 'text-green-500' : 'text-yellow-500'}`}>
                {matchRate.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Table */}
      {comparison.length > 0 && (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Svcs Excel</TableHead>
                <TableHead className="text-right">Svcs Sistema</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead className="text-right">Delta %</TableHead>
                <TableHead className="text-right">GMV Excel</TableHead>
                <TableHead className="text-right">GMV Sistema</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead className="text-right">Delta %</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row, i) => (
                <TableRow key={i} className={row.status === 'error' ? 'bg-red-50 dark:bg-red-950/20' : row.status === 'alert' ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                  <TableCell className="font-medium">{row.period}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.servicesExcel)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.servicesSystem)}</TableCell>
                  <TableCell className={`text-right ${row.servicesDelta !== 0 ? 'font-semibold' : ''}`}>
                    {row.servicesDelta > 0 ? '+' : ''}{formatNumber(row.servicesDelta)}
                  </TableCell>
                  <TableCell className={`text-right ${Math.abs(row.servicesDeltaPct) >= 5 ? 'text-red-500 font-semibold' : Math.abs(row.servicesDeltaPct) >= 1 ? 'text-yellow-600' : ''}`}>
                    {row.servicesDeltaPct > 0 ? '+' : ''}{row.servicesDeltaPct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(row.gmvExcel)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.gmvSystem)}</TableCell>
                  <TableCell className={`text-right ${row.gmvDelta !== 0 ? 'font-semibold' : ''}`}>
                    {row.gmvDelta > 0 ? '+' : ''}{formatCurrency(row.gmvDelta)}
                  </TableCell>
                  <TableCell className={`text-right ${Math.abs(row.gmvDeltaPct) >= 5 ? 'text-red-500 font-semibold' : Math.abs(row.gmvDeltaPct) >= 1 ? 'text-yellow-600' : ''}`}>
                    {row.gmvDeltaPct > 0 ? '+' : ''}{row.gmvDeltaPct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center"><StatusIcon status={row.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {comparison.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <Upload className="h-12 w-12" />
          <p className="text-lg font-medium">Sube tu Excel de datos validados</p>
          <p className="text-sm">El archivo debe contener columnas: Año, Mes, Servicios (y opcionalmente GMV)</p>
        </div>
      )}
    </div>
  );
};

export default DataAuditManager;
