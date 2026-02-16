// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';
import { InstrumentationRoadmap } from './InstrumentationRoadmap';
import type { StarMapPillar } from '@/hooks/useStarMapKPIs';

interface Props {
  pillars: StarMapPillar[];
  overallCoverage: number;
  overallScore: number;
}

export const DataHealthSummary: React.FC<Props> = ({ pillars, overallCoverage, overallScore }) => {
  const totalKPIs = pillars.reduce((s, p) => s + p.kpis.length, 0);
  const greenKPIs = pillars.reduce((s, p) => s + p.kpis.filter(k => k.status === 'green').length, 0);
  const yellowKPIs = pillars.reduce((s, p) => s + p.kpis.filter(k => k.status === 'yellow').length, 0);
  const redKPIs = pillars.reduce((s, p) => s + p.kpis.filter(k => k.status === 'red').length, 0);
  const noDataKPIs = pillars.reduce((s, p) => s + p.kpis.filter(k => k.status === 'no-data').length, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Coverage Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Cobertura de Datos StarMap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{overallCoverage}%</span>
            <span className="text-xs text-muted-foreground">{totalKPIs - noDataKPIs} de {totalKPIs} KPIs medibles</span>
          </div>
          <Progress value={overallCoverage} className="h-2" />

          <div className="grid grid-cols-4 gap-3 pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="text-lg font-bold">{greenKPIs}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">En meta</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span className="text-lg font-bold">{yellowKPIs}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Riesgo</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                <span className="text-lg font-bold">{redKPIs}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Crítico</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-muted-foreground">{noDataKPIs}</span>
              <p className="text-[10px] text-muted-foreground">Sin datos</p>
            </div>
          </div>

          {/* Per-pillar bars */}
          <div className="space-y-2 pt-2">
            {pillars.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs w-16 truncate">{p.shortName}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.coverage}%`,
                      backgroundColor: p.coverage >= 60 ? 'hsl(var(--success))' : p.coverage >= 30 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
                    }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground w-10 text-right">{Math.round(p.coverage)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instrumentation Roadmap */}
      <InstrumentationRoadmap pillars={pillars} />
    </div>
  );
};