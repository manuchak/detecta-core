import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCrmConversionFlow, useConversionInsights } from '@/hooks/useCrmConversionFlow';
import { CRMHeroCard } from './CRMHeroCard';
import { Sankey, Tooltip, ResponsiveContainer, Rectangle } from 'recharts';
import { AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';

interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: {
    name: string;
    value: number;
    category: string;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  source: 'hsl(var(--chart-1))',
  zone: 'hsl(var(--chart-2))',
  stage: 'hsl(var(--chart-3))',
  outcome: 'hsl(var(--chart-4))',
};

const OUTCOME_COLORS: Record<string, string> = {
  'Ganados': 'hsl(142, 76%, 36%)',
  'Perdidos': 'hsl(0, 84%, 60%)',
  'En Proceso': 'hsl(221, 83%, 53%)',
};

function CustomNode({ x, y, width, height, payload }: CustomNodeProps) {
  const fill = OUTCOME_COLORS[payload.name] || CATEGORY_COLORS[payload.category] || 'hsl(var(--muted))';
  
  return (
    <g>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={0.9}
        rx={4}
        ry={4}
      />
      {/* External label */}
      <text
        x={x + width + 8}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fill="currentColor"
        fontSize={11}
        fontWeight={500}
        className="fill-foreground"
      >
        {payload.name}
      </text>
    </g>
  );
}

interface CustomLinkProps {
  sourceX: number;
  targetX: number;
  sourceY: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  linkWidth: number;
  payload: {
    source: { category: string };
    target: { category: string };
    value: number;
  };
}

function CustomLink(props: CustomLinkProps) {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload } = props;
  
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  const sourceColor = CATEGORY_COLORS[payload.source.category] || 'hsl(var(--muted))';
  
  const targetPayload = payload.target as { category: string; name?: string };
  const targetName = targetPayload.name || '';
  const targetColor = targetPayload.category === 'outcome'
    ? OUTCOME_COLORS[targetName as keyof typeof OUTCOME_COLORS] || CATEGORY_COLORS[targetPayload.category]
    : CATEGORY_COLORS[targetPayload.category];
  
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity={0.4} />
          <stop offset="100%" stopColor={targetColor} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        stroke={`url(#${gradientId})`}
        strokeWidth={linkWidth}
        fill="none"
        strokeOpacity={0.7}
      />
    </g>
  );
}

function formatValue(value: number | undefined | null): string {
  if (value === undefined || value === null) return '$0';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export default function ConversionSankeyChart() {
  const { data: flowData, isLoading: flowLoading } = useCrmConversionFlow();
  const { insights, isLoading: insightsLoading } = useConversionInsights();

  const isLoading = flowLoading || insightsLoading;

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!flowData) return null;

    const wonLink = flowData.links.find(l => l.target === 'outcome_won');
    const lostLink = flowData.links.find(l => l.target === 'outcome_lost');
    const totalOutcome = (wonLink?.value || 0) + (lostLink?.value || 0);
    const conversionRate = totalOutcome > 0 ? ((wonLink?.value || 0) / totalOutcome) * 100 : 0;

    // Find zone with most losses
    const zoneLosses = flowData.links
      .filter(l => l.target === 'outcome_lost')
      .map(l => ({
        zone: flowData.nodes.find(n => n.id === l.source)?.name || 'Desconocido',
        value: l.value,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      conversionRate,
      wonValue: wonLink?.value || 0,
      lostValue: lostLink?.value || 0,
      worstZone: zoneLosses[0]?.zone || null,
      worstZoneValue: zoneLosses[0]?.value || 0,
    };
  }, [flowData]);

  const sankeyData = useMemo(() => {
    if (!flowData) return { nodes: [], links: [] };

    const nodeIndexMap = new Map<string, number>();
    flowData.nodes.forEach((node, index) => {
      nodeIndexMap.set(node.id, index);
    });

    const transformedLinks = flowData.links
      .map(link => ({
        source: nodeIndexMap.get(link.source),
        target: nodeIndexMap.get(link.target),
        value: link.value,
      }))
      .filter(link => link.source !== undefined && link.target !== undefined);

    const nodesWithData = flowData.nodes.map(node => ({
      name: node.name,
      category: node.category,
    }));

    return {
      nodes: nodesWithData,
      links: transformedLinks,
    };
  }, [flowData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (!flowData || flowData.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No hay suficientes datos para generar el flujo de conversión
          </p>
        </CardContent>
      </Card>
    );
  }

  const health = keyMetrics && keyMetrics.conversionRate >= 30 ? 'healthy' 
    : keyMetrics && keyMetrics.conversionRate >= 15 ? 'warning' 
    : 'critical';

  return (
    <div className="space-y-6">
      {/* Hero - Key Finding */}
      <CRMHeroCard
        title="¿Dónde se pierden los deals?"
        value={`${(keyMetrics?.conversionRate || 0).toFixed(0)}% conversión`}
        subtitle="Tasa de deals cerrados como ganados"
        health={health}
        secondaryMetrics={[
          { label: 'Ganados', value: formatValue(keyMetrics?.wonValue || 0) },
          { label: 'Perdidos', value: formatValue(keyMetrics?.lostValue || 0), highlight: true },
          ...(keyMetrics?.worstZone ? [{ 
            label: 'Mayor pérdida', 
            value: keyMetrics.worstZone,
            highlight: true 
          }] : []),
        ]}
      />

      {/* Sankey Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Flujo: Fuente → Zona → Etapa → Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankeyData}
                node={<CustomNode x={0} y={0} width={0} height={0} payload={{ name: '', value: 0, category: '' }} />}
                link={<CustomLink 
                  sourceX={0}
                  targetX={0}
                  sourceY={0}
                  targetY={0}
                  sourceControlX={0}
                  targetControlX={0}
                  linkWidth={0}
                  payload={{ source: { category: '' }, target: { category: '' }, value: 0 }}
                />}
                nodePadding={24}
                nodeWidth={12}
                margin={{ top: 20, right: 120, bottom: 20, left: 20 }}
              >
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    if (data.source && data.target) {
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.source.name} → {data.target.name}</p>
                          <p className="text-sm text-muted-foreground">{formatValue(data.value)}</p>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">{formatValue(data.value)}</p>
                      </div>
                    );
                  }}
                />
              </Sankey>
            </ResponsiveContainer>
          </div>
          
          {/* Compact Legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: CATEGORY_COLORS.source }} />
              <span className="text-muted-foreground">Fuente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: CATEGORY_COLORS.zone }} />
              <span className="text-muted-foreground">Zona</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: CATEGORY_COLORS.stage }} />
              <span className="text-muted-foreground">Etapa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: OUTCOME_COLORS['Ganados'] }} />
              <span className="text-muted-foreground">Ganados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: OUTCOME_COLORS['Perdidos'] }} />
              <span className="text-muted-foreground">Perdidos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    {insight.value && (
                      <Badge variant="outline" className="mt-2 text-xs">{insight.value}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
