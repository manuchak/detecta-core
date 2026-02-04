import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  RefreshCw, BarChart3, TrendingUp, Wallet, GitCompare,
  Download, FileSpreadsheet
} from 'lucide-react';
import { useFinancialReports, formatCurrency } from '../../hooks/useFinancialReports';
import { DSOTrendChart } from './DSOTrendChart';
import { CashFlowProjectionChart } from './CashFlowProjectionChart';
import { CollectionEfficiencyChart } from './CollectionEfficiencyChart';
import { PeriodComparisonTable } from './PeriodComparisonTable';
import * as XLSX from 'xlsx';

interface FinancialReportsPanelProps {
  className?: string;
}

export function FinancialReportsPanel({ className }: FinancialReportsPanelProps) {
  const [monthsBack, setMonthsBack] = React.useState(6);
  const { data, isLoading, refetch } = useFinancialReports(monthsBack);

  const handleExportReport = () => {
    if (!data) return;

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // DSO History
    const dsoSheet = XLSX.utils.json_to_sheet(data.dsoHistory.map(d => ({
      'Mes': d.monthLabel,
      'DSO (días)': d.dso,
      'Facturado': d.facturado,
      'Cobrado': d.cobrado,
    })));
    XLSX.utils.book_append_sheet(wb, dsoSheet, 'DSO');

    // Efficiency
    const effSheet = XLSX.utils.json_to_sheet(data.collectionEfficiency.map(d => ({
      'Mes': d.mesLabel,
      'Facturado': d.facturado,
      'Cobrado': d.cobrado,
      'Eficiencia (%)': d.eficiencia,
      'Días Promedio Cobro': d.diasPromedioCobro,
    })));
    XLSX.utils.book_append_sheet(wb, effSheet, 'Eficiencia');

    // Cash Flow Projection
    const cfSheet = XLSX.utils.json_to_sheet(data.cashFlowProjection.filter(d => d.montoEsperado > 0).map(d => ({
      'Fecha': d.fechaLabel,
      'Monto Esperado': d.montoEsperado,
      'Acumulado': d.montoAcumulado,
      '# Facturas': d.numFacturas,
      'Probabilidad (%)': d.probabilidad,
    })));
    XLSX.utils.book_append_sheet(wb, cfSheet, 'Proyección Flujo');

    // Comparison
    const compSheet = XLSX.utils.json_to_sheet(data.periodComparison.map(d => ({
      'Métrica': d.metrica,
      'Actual': d.actual,
      'Anterior': d.anterior,
      'Variación': d.variacion,
      'Variación (%)': d.variacionPct,
    })));
    XLSX.utils.book_append_sheet(wb, compSheet, 'Comparativo');

    XLSX.writeFile(wb, `reporte_financiero_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Reportes Financieros</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={monthsBack.toString()} 
            onValueChange={(v) => setMonthsBack(parseInt(v))}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleExportReport}
            disabled={!data}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            Exportar
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total CxC</p>
                <p className="text-xl font-bold">
                  {formatCurrency(data?.summary.totalCxC || 0)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Proyección 30d</p>
                <p className="text-xl font-bold">
                  {formatCurrency(data?.summary.proyeccion30d || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Eficiencia Prom.</p>
                <p className="text-xl font-bold">
                  {data?.summary.eficienciaPromedio || 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-500/10 to-transparent">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">DSO Actual</p>
                <p className="text-xl font-bold">
                  {data?.dso.current || 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1">días</span>
                </p>
              </div>
              <GitCompare className="h-8 w-8 text-violet-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DSOTrendChart 
          dso={data?.dso || { current: 0, previous: 0, trend: 'estable', trendPercent: 0, benchmark: 45, status: 'bueno' }}
          history={data?.dsoHistory || []}
          isLoading={isLoading}
        />
        
        <CashFlowProjectionChart 
          data={data?.cashFlowProjection || []}
          totalProyectado={data?.summary.proyeccion30d || 0}
          isLoading={isLoading}
        />
        
        <CollectionEfficiencyChart 
          data={data?.collectionEfficiency || []}
          promedioEficiencia={data?.summary.eficienciaPromedio || 0}
          isLoading={isLoading}
        />
        
        <PeriodComparisonTable 
          data={data?.periodComparison || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
