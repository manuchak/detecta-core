import React, { useState, useCallback } from 'react';
import { RiskZonesMap } from '../map/RiskZonesMap';
import { RiskZonesMapLayers, type LayerVisibility } from '../map/RiskZonesMapLayers';
import { HighRiskSegmentsList } from '../map/HighRiskSegmentsList';
import { RiskZonesHeader } from '../map/RiskZonesHeader';
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

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSegmentSelect = useCallback((seg: HighwaySegment | null) => {
    setSelectedSegmentId(seg?.id || null);
  }, []);

  return (
    <div className="space-y-3 h-full">
      <RiskZonesHeader />

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_280px] gap-3 h-[calc(100vh-320px)] min-h-[500px]">
        {/* Left panel - Layer controls */}
        <div className="hidden md:block">
          <RiskZonesMapLayers layers={layers} onToggle={toggleLayer} />
        </div>

        {/* Center - Map */}
        <div className="relative rounded-lg overflow-hidden border bg-muted/10">
          <RiskZonesMap
            layers={layers}
            selectedSegmentId={selectedSegmentId}
            onSegmentSelect={handleSegmentSelect}
          />
          {/* Mobile layer control overlay */}
          <div className="absolute top-3 right-3 md:hidden">
            <RiskZonesMapLayers layers={layers} onToggle={toggleLayer} />
          </div>
        </div>

        {/* Right panel - Segments list */}
        <div className="border rounded-lg p-3 bg-background overflow-hidden">
          <HighRiskSegmentsList
            onSegmentClick={setSelectedSegmentId}
            selectedSegmentId={selectedSegmentId}
          />
        </div>
      </div>
    </div>
  );
}
