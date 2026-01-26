import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCrmConversionFlow, useConversionInsights } from '@/hooks/useCrmConversionFlow';
import { Sankey, Tooltip, ResponsiveContainer, Layer, Rectangle } from 'recharts';
import { TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

// Custom node component for Sankey
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
  'Ganados': 'hsl(142, 76%, 36%)', // green
  'Perdidos': 'hsl(0, 84%, 60%)', // red
  'En Proceso': 'hsl(221, 83%, 53%)', // blue
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
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={10}
        fontWeight={500}
      >
        {payload.name}
      </text>
    </g>
  );
}

// Custom link component
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
  
  // Safely access target name
  const targetPayload = payload.target as { category: string; name?: string };
  const targetName = targetPayload.name || '';
  const targetColor = targetPayload.category === 'outcome'
    ? OUTCOME_COLORS[targetName as keyof typeof OUTCOME_COLORS] || CATEGORY_COLORS[targetPayload.category]
    : CATEGORY_COLORS[targetPayload.category];
  
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity={0.5} />
          <stop offset="100%" stopColor={targetColor} stopOpacity={0.5} />
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
        strokeOpacity={0.6}
      />
    </g>
  );
}

function formatValue(value: number): string {
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

  // Transform data for Recharts Sankey
  const sankeyData = useMemo(() => {
    if (!flowData) return { nodes: [], links: [] };

    // Create node index map
    const nodeIndexMap = new Map<string, number>();
    flowData.nodes.forEach((node, index) => {
      nodeIndexMap.set(node.id, index);
    });

    // Transform links to use indices
    const transformedLinks = flowData.links
      .map(link => ({
        source: nodeIndexMap.get(link.source),
        target: nodeIndexMap.get(link.target),
        value: link.value,
      }))
      .filter(link => link.source !== undefined && link.target !== undefined);

    // Add category to nodes for coloring
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
        <Skeleton className="h-[400px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
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

  return (
    <div className="space-y-6">
      {/* Sankey Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Flujo de Conversión por Zona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
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
                nodePadding={30}
                nodeWidth={80}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.source }} />
              <span className="text-xs text-muted-foreground">Fuente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.zone }} />
              <span className="text-xs text-muted-foreground">Zona</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.stage }} />
              <span className="text-xs text-muted-foreground">Etapa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: OUTCOME_COLORS['Ganados'] }} />
              <span className="text-xs text-muted-foreground">Ganados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: OUTCOME_COLORS['Perdidos'] }} />
              <span className="text-xs text-muted-foreground">Perdidos</span>
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
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    {insight.value && (
                      <Badge variant="outline" className="mt-2">{insight.value}</Badge>
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
