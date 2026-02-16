// @ts-nocheck
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Database, Globe, ArrowRight, TrendingUp } from 'lucide-react';
import type { StarMapPillar, StarMapKPI } from '@/hooks/useStarMapKPIs';

interface Props {
  pillars: StarMapPillar[];
}

interface RoadmapItem {
  kpi: StarMapKPI;
  pillarName: string;
  priorityScore: number;
}

const EFFORT_WEIGHT = { 'quick-win': 1, 'new-table': 3, 'external': 5 } as const;

function computePriority(kpi: StarMapKPI, pillar: StarMapPillar): number {
  const cat = kpi.instrumentationCategory;
  if (!cat) return 0;
  const totalKpis = pillar.kpis.length;
  const coverageGain = totalKpis > 0 ? (1 / totalKpis) * 100 : 0;
  return Math.round((coverageGain / EFFORT_WEIGHT[cat]) * 10) / 10;
}

const categoryMeta = {
  'quick-win': { label: 'Quick Wins', icon: Zap, desc: 'Agregar campo a tabla existente' },
  'new-table': { label: 'Nuevas Tablas', icon: Database, desc: 'Tabla + lógica + UI' },
  'external': { label: 'Externo', icon: Globe, desc: 'Integración o webhook' },
} as const;

export const InstrumentationRoadmap: React.FC<Props> = ({ pillars }) => {
  const items = useMemo(() => {
    const result: Record<string, RoadmapItem[]> = { 'quick-win': [], 'new-table': [], 'external': [] };
    for (const p of pillars) {
      for (const k of p.kpis) {
        if (k.instrumentationCategory && (k.status === 'no-data' || k.isProxy)) {
          result[k.instrumentationCategory].push({
            kpi: k,
            pillarName: p.shortName,
            priorityScore: computePriority(k, p),
          });
        }
      }
    }
    // Sort each category by priority descending
    for (const cat of Object.keys(result)) {
      result[cat].sort((a, b) => b.priorityScore - a.priorityScore);
    }
    return result;
  }, [pillars]);

  const totalItems = Object.values(items).reduce((s, arr) => s + arr.length, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Roadmap de Instrumentación
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {totalItems} KPIs pendientes · Ordenados por ROI de instrumentación
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quick-win" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-9">
            {(['quick-win', 'new-table', 'external'] as const).map(cat => {
              const meta = categoryMeta[cat];
              const Icon = meta.icon;
              return (
                <TabsTrigger key={cat} value={cat} className="text-xs gap-1 px-2">
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{meta.label}</span>
                  <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">{items[cat].length}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(['quick-win', 'new-table', 'external'] as const).map(cat => {
            const meta = categoryMeta[cat];
            const catItems = items[cat];
            return (
              <TabsContent key={cat} value={cat} className="mt-3">
                <p className="text-[10px] text-muted-foreground mb-3">{meta.desc}</p>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {catItems.map(item => (
                    <div key={item.kpi.id} className="p-2.5 rounded-lg border border-border/60 hover:border-border transition-colors space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{item.kpi.id}</span>
                          <span className="text-xs truncate">{item.kpi.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.kpi.isProxy && (
                            <Badge className="text-[9px] h-4 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15">
                              proxy <ArrowRight className="h-2 w-2 mx-0.5 inline" /> real
                            </Badge>
                          )}
                          {item.kpi.status === 'no-data' && !item.kpi.isProxy && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">sin datos</Badge>
                          )}
                        </div>
                      </div>

                      {item.kpi.missingFields && item.kpi.missingFields.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          <span className="font-medium">Requiere:</span> {item.kpi.missingFields.join(', ')}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        {item.kpi.businessImpact && (
                          <span className="text-[10px] text-primary/80">{item.kpi.businessImpact}</span>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-[9px] text-muted-foreground">Prioridad</span>
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-mono">{item.priorityScore}</Badge>
                        </div>
                      </div>

                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.pillarName}</span>
                    </div>
                  ))}
                  {catItems.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">¡Nada pendiente en esta categoría!</p>
                  )}
                </div>

                {/* Category progress */}
                {catItems.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground shrink-0">{catItems.filter(i => i.kpi.isProxy).length} proxy</span>
                    <Progress value={catItems.filter(i => i.kpi.isProxy).length / catItems.length * 100} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground shrink-0">{catItems.filter(i => !i.kpi.isProxy).length} sin datos</span>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};
