import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Download, FileText } from 'lucide-react';
import { useHistoricalReportData } from '@/hooks/useHistoricalReportData';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { ReportExportButtons } from '@/components/reports/ReportExportButtons';
import { HistoricalReportConfig, ReportModule, ReportGranularity, MODULE_LABELS, GRANULARITY_LABELS, MODULE_GRANULARITY_SUPPORT } from '@/types/reports';
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const YEARS = [2024, 2025];
const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

export default function ReportsPage() {
  const [config, setConfig] = useState<HistoricalReportConfig>({
    granularity: 'year',
    year: currentYear,
    month: currentMonth,
    modules: ['cpa', 'ltv', 'retention', 'engagement', 'supply_growth', 'conversion', 'capacity', 'operational', 'projections'],
    includeProjections: true,
    compareWithPrevious: true,
  });

  const [showPreview, setShowPreview] = useState(false);
  const { data: reportData, loading } = useHistoricalReportData(config);

  const handleModuleToggle = (module: ReportModule) => {
    setConfig(prev => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter(m => m !== module)
        : [...prev.modules, module],
    }));
  };

  const availableModules = Object.keys(MODULE_LABELS).filter(
    (module) => MODULE_GRANULARITY_SUPPORT[module as ReportModule].includes(config.granularity)
  ) as ReportModule[];

  const handleGenerateReport = () => {
    setShowPreview(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Generador de Informes Históricos
          </h1>
          <p className="text-muted-foreground">Crea informes detallados con toda la información de KPIs y tooltips</p>
        </div>
      </div>

      {!showPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuración */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Configuración del Informe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Granularidad */}
              <div className="space-y-2">
                <Label>Granularidad</Label>
                <Select value={config.granularity} onValueChange={(v: ReportGranularity) => setConfig(prev => ({ ...prev, granularity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GRANULARITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Año */}
              <div className="space-y-2">
                <Label>Año</Label>
                <Select value={config.year.toString()} onValueChange={(v) => setConfig(prev => ({ ...prev, year: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mes (si aplica) */}
              {config.granularity !== 'year' && (
                <div className="space-y-2">
                  <Label>Mes</Label>
                  <Select value={config.month?.toString() || '1'} onValueChange={(v) => setConfig(prev => ({ ...prev, month: parseInt(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Módulos */}
              <div className="space-y-3">
                <Label>Módulos a Incluir</Label>
                <div className="space-y-2">
                  {availableModules.map(module => (
                    <div key={module} className="flex items-center space-x-2">
                      <Checkbox
                        id={module}
                        checked={config.modules.includes(module)}
                        onCheckedChange={() => handleModuleToggle(module)}
                      />
                      <label htmlFor={module} className="text-sm cursor-pointer">{MODULE_LABELS[module]}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={handleGenerateReport} disabled={loading || config.modules.length === 0}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Generar Vista Previa
              </Button>
            </CardContent>
          </Card>

          {/* Descripción */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Acerca de los Informes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Este sistema genera informes históricos completos y detallados que incluyen <strong>toda la información</strong> 
                de los tooltips y deep dives de cada KPI, sin omisiones ni resúmenes que pierdan datos.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">✅ Incluye</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Fórmulas explicativas</li>
                    <li>• Valores absolutos y porcentajes</li>
                    <li>• Evolución mensual completa</li>
                    <li>• Análisis de cohortes</li>
                    <li>• Comparativos MoM, QoQ, YoY</li>
                    <li>• Top custodios y clientes</li>
                  </ul>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📊 Formatos</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Vista previa en pantalla</li>
                    <li>• Exportar a PDF profesional</li>
                    <li>• Exportar a Excel con datos crudos</li>
                    <li>• Impresión directa</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowPreview(false)}>← Volver a Configuración</Button>
            <ReportExportButtons config={config} data={reportData} disabled={loading} />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Generando informe...</span>
            </div>
          ) : reportData ? (
            <ReportPreview data={reportData} />
          ) : (
            <p className="text-center py-20 text-muted-foreground">No se pudieron cargar los datos</p>
          )}
        </div>
      )}
    </div>
  );
}
