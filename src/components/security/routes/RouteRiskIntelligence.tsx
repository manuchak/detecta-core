import React, { useState, useCallback } from 'react';
import { RiskZonesMap } from '../map/RiskZonesMap';
import { RiskZonesMapLayers, type LayerVisibility } from '../map/RiskZonesMapLayers';
import { HighRiskSegmentsList } from '../map/HighRiskSegmentsList';
import { RiskZonesHeader } from '../map/RiskZonesHeader';
import { Button } from '@/components/ui/button';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { HighwaySegment } from '@/lib/security/highwaySegments';

export function RouteRiskIntelligence() {
  const [layers, setLayers] = useState<LayerVisibility>({
    segments: true,
    pois: true,
    safePoints: true,
    deadZones: true,
    labels: false,
  });
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSegmentSelect = useCallback((seg: HighwaySegment | null) => {
    setSelectedSegmentId(seg?.id || null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0"><RiskZonesHeader /></div>

      <div className={`grid grid-cols-1 ${panelOpen ? 'md:grid-cols-[1fr_260px]' : ''} gap-3 flex-1 min-h-0 mt-1`} style={{ minHeight: 0, gridTemplateRows: '1fr' }}>
        {/* Map with layer overlay */}
        <div className="relative rounded-lg overflow-hidden border bg-muted/10 min-h-[420px]" style={{ zoom: 1 }}>
          <RiskZonesMap
            layers={layers}
            selectedSegmentId={selectedSegmentId}
            onSegmentSelect={handleSegmentSelect}
          />
          {/* Toggle panel button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPanelOpen(!panelOpen)}
            className="absolute top-2 left-12 z-10 h-7 w-7 bg-background/90 backdrop-blur-sm"
            title={panelOpen ? 'Ocultar panel' : 'Mostrar panel'}
          >
            {panelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </Button>
          {/* Layer controls as overlay */}
          <div className="absolute top-2 right-2 z-10">
            <RiskZonesMapLayers layers={layers} onToggle={toggleLayer} />
          </div>
        </div>

        {/* Right panel - Segments list */}
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
