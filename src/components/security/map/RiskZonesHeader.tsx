import React, { useMemo } from 'react';
import { HIGHWAY_SEGMENTS, getRiskDistribution, type RiskLevel } from '@/lib/security/highwaySegments';
import { CELLULAR_DEAD_ZONES } from '@/lib/security/cellularCoverage';
import { MapPin, Route, AlertTriangle, Wifi } from 'lucide-react';

export function RiskZonesHeader() {
  const stats = useMemo(() => {
    const dist = getRiskDistribution();
    const totalKm = HIGHWAY_SEGMENTS.reduce((s, seg) => s + (seg.kmEnd - seg.kmStart), 0);
    const dzKm = CELLULAR_DEAD_ZONES.reduce((s, dz) => s + dz.estimatedLengthKm, 0);
    return {
      totalSegments: HIGHWAY_SEGMENTS.length,
      extremo: dist.extremo.count,
      alto: dist.alto.count,
      totalKm,
      dzCount: CELLULAR_DEAD_ZONES.length,
      dzKm,
    };
  }, []);

  const cards = [
    { icon: Route, label: 'Tramos', value: stats.totalSegments, sub: `${stats.totalKm.toLocaleString()} km` },
    { icon: AlertTriangle, label: 'Extremo / Alto', value: `${stats.extremo} / ${stats.alto}`, sub: 'segmentos', color: 'text-destructive' },
    { icon: Wifi, label: 'Sin cobertura', value: stats.dzCount, sub: `${stats.dzKm.toLocaleString()} km` },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {cards.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1 border">
          <c.icon className={`h-3 w-3 shrink-0 ${c.color || 'text-muted-foreground'}`} />
          <span className="text-xs font-semibold text-foreground leading-none">{c.value}</span>
          <span className="text-[10px] text-muted-foreground leading-none">{c.label} · {c.sub}</span>
        </div>
      ))}
    </div>
  );
}
