import React, { useState, useCallback } from 'react';
import { RiskZonesMap } from '../map/RiskZonesMap';
import { RiskZonesMapLayers, type LayerVisibility } from '../map/RiskZonesMapLayers';
import { HighRiskSegmentsList } from '../map/HighRiskSegmentsList';
import { RiskZonesHeader } from '../map/RiskZonesHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PanelRightClose, PanelRightOpen, FileText, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { HighwaySegment } from '@/lib/security/highwaySegments';
import { fetchRouteAnalysisData } from '@/hooks/security/useRouteAnalysisData';
import { RouteAnalysisReport } from '../reports/RouteAnalysisReport';

export function RouteRiskIntelligence() {
  const [layers, setLayers] = useState<LayerVisibility>({
    segments: true,
    pois: true,
    safePoints: true,
    deadZones: true,
    labels: true,
  });
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  // Report dialog state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportOrigen, setReportOrigen] = useState('');
  const [reportDestino, setReportDestino] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSegmentSelect = useCallback((seg: HighwaySegment | null) => {
    setSelectedSegmentId(seg?.id || null);
  }, []);

  const handleGenerateReport = async () => {
    if (!reportOrigen.trim() || !reportDestino.trim()) {
      toast.error('Ingresa origen y destino');
      return;
    }
    setGenerating(true);
    try {
      // Step 1: Fetch basic operational data
      setGenerationStep('Consultando datos operativos...');
      const baseData = await fetchRouteAnalysisData(reportOrigen.trim(), reportDestino.trim());

      // Step 2: Call AI agent for enriched analysis
      setGenerationStep('Agente AI analizando ruta (ISO 28000)...');
      let agentData = null;
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('route-intelligence-report', {
          body: { origen: reportOrigen.trim(), destino: reportDestino.trim() },
        });
        if (fnError) {
          console.warn('Agent error (will use basic report):', fnError);
        } else {
          agentData = fnData;
        }
      } catch (agentErr) {
        console.warn('Agent call failed (will use basic report):', agentErr);
      }

      // Step 3: Generate PDF
      setGenerationStep('Generando PDF...');
      const blob = await pdf(
        <RouteAnalysisReport data={baseData} agentData={agentData} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Analisis_Ruta_${reportOrigen.trim().replace(/\s+/g, '_')}_${reportDestino.trim().replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Informe generado exitosamente');
      setReportOpen(false);
    } catch (err: any) {
      console.error('Report generation error:', err);
      toast.error('Error al generar informe: ' + (err.message || 'Error desconocido'));
    } finally {
      setGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between">
        <RiskZonesHeader />
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Generar Informe de Ruta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Generar Informe de Análisis de Ruta</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Origen</label>
                <Input
                  placeholder="Ej: Guadalajara"
                  value={reportOrigen}
                  onChange={(e) => setReportOrigen(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Destino</label>
                <Input
                  placeholder="Ej: Ciudad de México"
                  value={reportDestino}
                  onChange={(e) => setReportDestino(e.target.value)}
                  className="text-sm"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                El informe incluye: DRF del corredor, historial de incidentes operativos,
                inteligencia RRSS, zonas de riesgo, ETA, hora sugerida de salida,
                paradas seguras recomendadas, zonas sin cobertura celular,
                briefing operativo y recomendaciones ISO 28000.
              </p>
              {generating && generationStep && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  <span>{generationStep}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleGenerateReport} disabled={generating} size="sm" className="gap-1.5">
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                {generating ? 'Generando...' : 'Generar PDF'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className={`grid grid-cols-1 ${panelOpen ? 'md:grid-cols-[1fr_260px]' : ''} gap-3 flex-1 min-h-0 mt-1`} style={{ minHeight: 0, gridTemplateRows: '1fr' }}>
        {/* Map with layer overlay */}
        <div className="relative rounded-lg overflow-hidden border bg-muted/10 min-h-[420px] h-full" style={{ zoom: 1 }}>
          <RiskZonesMap
            layers={layers}
            selectedSegmentId={selectedSegmentId}
            onSegmentSelect={handleSegmentSelect}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPanelOpen(!panelOpen)}
            className="absolute top-2 left-12 z-10 h-7 w-7 bg-background/90 backdrop-blur-sm"
            title={panelOpen ? 'Ocultar panel' : 'Mostrar panel'}
          >
            {panelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </Button>
          <div className="absolute top-2 right-2 z-10">
            <RiskZonesMapLayers layers={layers} onToggle={toggleLayer} />
          </div>
        </div>

        {panelOpen && (
          <div className="border rounded-lg p-3 bg-background overflow-hidden">
            <HighRiskSegmentsList
              onSegmentClick={setSelectedSegmentId}
              selectedSegmentId={selectedSegmentId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
