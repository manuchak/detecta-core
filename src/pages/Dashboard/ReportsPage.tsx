import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, X, RefreshCw } from 'lucide-react';
import { useHistoricalReportData } from '@/hooks/useHistoricalReportData';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { ReportExportButtons } from '@/components/reports/ReportExportButtons';
import { ReportGenerationProgress } from '@/components/reports/ReportGenerationProgress';
import { HistoricalReportConfig, ReportModule, ReportGranularity, MODULE_LABELS, GRANULARITY_LABELS, MODULE_GRANULARITY_SUPPORT } from '@/types/reports';
import { useQueryClient } from '@tanstack/react-query';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const YEARS = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);
const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

type GenerationStatus = 'idle' | 'generating' | 'done' | 'error';

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<HistoricalReportConfig>({
    granularity: 'year',
    year: currentYear,
    month: currentMonth,
    modules: ['cpa', 'ltv', 'retention', 'engagement', 'supply_growth', 'conversion', 'capacity', 'operational', 'projections'],
    includeProjections: true,
    compareWithPrevious: true,
  });

  const [generateEnabled, setGenerateEnabled] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [showPreview, setShowPreview] = useState(false);

  const { data: reportData, loading, error, progress, completedCount, totalCount } = useHistoricalReportData(config, generateEnabled);

  // Update status based on loading state
  useEffect(() => {
    if (!generateEnabled) {
      setStatus('idle');
    } else if (error) {
      setStatus('error');
    } else if (loading) {
      setStatus('generating');
    } else if (reportData) {
      setStatus('done');
      setShowPreview(true);
    }
  }, [generateEnabled, loading, error, reportData]);

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
    setGenerateEnabled(true);
    setShowPreview(false);
  };

  const handleCancel = () => {
    // Cancel all pending queries
    queryClient.cancelQueries();
    setGenerateEnabled(false);
    setStatus('idle');
  };

  const handleRetry = () => {
    setGenerateEnabled(false);
    setTimeout(() => {
      setGenerateEnabled(true);
    }, 100);
  };

  const handleBackToConfig = () => {
    setShowPreview(false);
    setGenerateEnabled(false);
    setStatus('idle');
  };

  const getButtonContent = () => {
    switch (status) {
      case 'generating':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Generando... ({completedCount}/{totalCount})
          </>
        );
      case 'error':
        return (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </>
        );
      case 'done':
        return (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Regenerar Informe
          </>
        );
      default:
        return (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Generar Vista Previa
          </>
        );
    }
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
                <Select 
                  value={config.granularity} 
                  onValueChange={(v: ReportGranularity) => setConfig(prev => ({ ...prev, granularity: v }))}
                  disabled={status === 'generating'}
                >
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
                <Select 
                  value={config.year.toString()} 
                  onValueChange={(v) => setConfig(prev => ({ ...prev, year: parseInt(v) }))}
                  disabled={status === 'generating'}
                >
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
                  <Select 
                    value={config.month?.toString() || '1'} 
                    onValueChange={(v) => setConfig(prev => ({ ...prev, month: parseInt(v) }))}
                    disabled={status === 'generating'}
                  >
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
                        disabled={status === 'generating'}
                      />
                      <label htmlFor={module} className="text-sm cursor-pointer">{MODULE_LABELS[module]}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={status === 'error' ? handleRetry : handleGenerateReport} 
                  disabled={status === 'generating' || config.modules.length === 0}
                >
                  {getButtonContent()}
                </Button>
                
                {status === 'generating' && (
                  <Button variant="destructive" size="icon" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Panel derecho: Progreso o Descripción */}
          <Card className="lg:col-span-2">
            {status === 'generating' || status === 'error' ? (
              <>
                <CardHeader>
                  <CardTitle>Progreso de Generación</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportGenerationProgress
                    progress={progress}
                    completedCount={completedCount}
                    totalCount={totalCount}
                    error={error}
                  />
                </CardContent>
              </>
            ) : (
              <>
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
              </>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBackToConfig}>← Volver a Configuración</Button>
            <ReportExportButtons config={config} data={reportData} disabled={loading} />
          </div>
          
          {reportData ? (
            <ReportPreview data={reportData} />
          ) : (
            <p className="text-center py-20 text-muted-foreground">No se pudieron cargar los datos</p>
          )}
        </div>
      )}
    </div>
  );
}
