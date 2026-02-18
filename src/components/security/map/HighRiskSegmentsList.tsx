import React, { useMemo, useState } from 'react';
import { HIGHWAY_SEGMENTS, RISK_LEVEL_COLORS, type HighwaySegment, type RiskLevel } from '@/lib/security/highwaySegments';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface HighRiskSegmentsListProps {
  onSegmentClick: (segmentId: string) => void;
  selectedSegmentId?: string | null;
}

const RISK_ORDER: RiskLevel[] = ['extremo', 'alto', 'medio', 'bajo'];

export function HighRiskSegmentsList({ onSegmentClick, selectedSegmentId }: HighRiskSegmentsListProps) {
  const [filter, setFilter] = useState<string>('todos');

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: HIGHWAY_SEGMENTS.length };
    RISK_ORDER.forEach(l => { c[l] = HIGHWAY_SEGMENTS.filter(s => s.riskLevel === l).length; });
    return c;
  }, []);

  const filtered = useMemo(() => {
    const list = filter === 'todos' ? [...HIGHWAY_SEGMENTS] : HIGHWAY_SEGMENTS.filter(s => s.riskLevel === filter);
    return list.sort((a, b) => RISK_ORDER.indexOf(a.riskLevel) - RISK_ORDER.indexOf(b.riskLevel));
  }, [filter]);

  return (
    <div className="flex flex-col h-full">
      <div className="pb-2 border-b mb-2">
        <h3 className="text-xs font-semibold text-foreground mb-2">Tramos por Riesgo</h3>
        <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v)} className="flex-wrap justify-start gap-1">
          {['todos', ...RISK_ORDER].map(level => (
            <ToggleGroupItem key={level} value={level} className="h-6 px-2 text-[10px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {level === 'todos' ? 'Todos' : level.charAt(0).toUpperCase() + level.slice(1)} ({counts[level]})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-2">
          {filtered.map(seg => (
            <button
              key={seg.id}
              onClick={() => onSegmentClick(seg.id)}
              className={`w-full text-left p-2 rounded-md border text-xs transition-colors hover:bg-muted/50 ${
                selectedSegmentId === seg.id ? 'bg-muted border-primary/50' : 'border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-medium text-foreground leading-tight">{seg.name}</span>
                <Badge
                  variant="outline"
                  className="shrink-0 text-[9px] px-1.5 py-0 border-0"
                  style={{ backgroundColor: RISK_LEVEL_COLORS[seg.riskLevel], color: '#fff' }}
                >
                  {seg.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground text-[10px]">
                <span>Km {seg.kmStart}-{seg.kmEnd}</span>
                <span>·</span>
                <span>{seg.avgMonthlyEvents} ev/mes</span>
                <span>·</span>
                <span>{seg.criticalHours}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
