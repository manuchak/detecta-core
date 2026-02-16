// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle2, XCircle, HelpCircle, Database } from 'lucide-react';
import type { StarMapPillar, StarMapKPI } from '@/hooks/useStarMapKPIs';

interface Props {
  pillar: StarMapPillar;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'green':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'yellow':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'red':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    green: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    red: 'bg-red-500/10 text-red-600 border-red-500/20',
    'no-data': 'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<string, string> = {
    green: 'En meta',
    yellow: 'Riesgo',
    red: 'Crítico',
    'no-data': 'Sin datos',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[status]}`}>
      <StatusIcon status={status} />
      {labels[status]}
    </span>
  );
};

export const PillarDetailPanel: React.FC<Props> = ({ pillar }) => {
  const measurable = pillar.kpis.filter(k => k.status !== 'no-data');
  const missing = pillar.kpis.filter(k => k.status === 'no-data');

  return (
    <Card className="border-t-2" style={{ borderTopColor: pillar.color }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span>{pillar.icon}</span>
            {pillar.name}
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground text-lg">{pillar.score}</span>
            <span>/ 100</span>
            <span className="text-[10px]">({Math.round(pillar.coverage)}% cobertura)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Measurable KPIs */}
        {measurable.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">KPIs con datos</p>
            <div className="grid gap-2">
              {measurable.map(kpi => (
                <div
                  key={kpi.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-muted-foreground">{kpi.id}</span>
                    <span className="text-sm font-medium truncate">{kpi.name}</span>
                    {kpi.isProxy && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">proxy</span>
                          </TooltipTrigger>
                          <TooltipContent>Calculado con datos aproximados</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tabular-nums">
                      {kpi.value !== null ? `${kpi.value.toLocaleString('es-MX')}${kpi.unit === '%' ? '%' : ''}` : '—'}
                    </span>
                    {kpi.unit !== '%' && kpi.value !== null && (
                      <span className="text-[10px] text-muted-foreground">{kpi.unit}</span>
                    )}
                    <StatusBadge status={kpi.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing KPIs */}
        {missing.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Database className="h-3 w-3" />
              Requieren instrumentación ({missing.length})
            </p>
            <div className="grid gap-1.5">
              {missing.map(kpi => (
                <div
                  key={kpi.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30 opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{kpi.id}</span>
                    <span className="text-xs text-muted-foreground">{kpi.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {kpi.missingFields && kpi.missingFields.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-[9px] text-muted-foreground underline decoration-dotted cursor-help">
                              {kpi.missingFields.length} campo{kpi.missingFields.length > 1 ? 's' : ''}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs font-semibold mb-1">Campos faltantes:</p>
                            <ul className="text-xs space-y-0.5">
                              {kpi.missingFields.map((f, i) => (
                                <li key={i}>• {f}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <StatusBadge status="no-data" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
