import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCrmPipeline } from '@/hooks/useCrmPipeline';
import { useCrmDealsByStage } from '@/hooks/useCrmDeals';
import { useCrmTrends, useStageAverageTimes, calculateDealStalledInfo } from '@/hooks/useCrmTrends';
import type { CrmDealWithStage, CrmPipelineStage } from '@/types/crm';
import { getDealValueTier } from '@/types/crm';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, TrendingUp, TrendingDown, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

interface DealCardProps {
  deal: CrmDealWithStage;
  stageAverages: Record<string, { avgDaysInStage: number }>;
}

function DealCard({ deal, stageAverages }: DealCardProps) {
  const daysInStage = deal.updated_at
    ? formatDistanceToNow(new Date(deal.updated_at), { locale: es, addSuffix: false })
    : 'N/A';

  const valueTier = getDealValueTier(deal.value);
  
  // Calculate stalled status
  const stalledInfo = calculateDealStalledInfo(
    deal.updated_at,
    deal.stage_id,
    stageAverages as Record<string, { stageId: string; stageName: string; avgDaysInStage: number }>
  );

  const statusColor = {
    open: 'bg-blue-500/10 text-blue-600 border-blue-200',
    won: 'bg-green-500/10 text-green-600 border-green-200',
    lost: 'bg-red-500/10 text-red-600 border-red-200',
  }[deal.status] || 'bg-muted text-muted-foreground';

  // Value tier styling
  const tierStyles = {
    low: 'border-l-muted-foreground/30',
    medium: 'border-l-blue-500',
    high: 'border-l-primary',
    premium: 'border-l-amber-500 bg-amber-500/5',
  };

  const titleStyles = {
    low: 'font-medium',
    medium: 'font-semibold',
    high: 'font-semibold text-primary',
    premium: 'font-bold',
  };

  return (
    <Card className={cn(
      'cursor-pointer hover:shadow-md transition-shadow border-l-4',
      tierStyles[valueTier],
      stalledInfo.isStalled && 'ring-1 ring-destructive/20'
    )}>
      <CardContent className="p-3 space-y-2">
        {/* Title and Premium Badge */}
        <div className="flex items-start gap-2">
          <div className={cn('text-sm line-clamp-2 flex-1', titleStyles[valueTier])}>
            {deal.title}
          </div>
          {valueTier === 'premium' && (
            <Gem className="h-4 w-4 text-amber-500 shrink-0" />
          )}
        </div>

        {/* Stalled Warning */}
        {stalledInfo.isStalled && (
          <div className={cn(
            'flex items-center gap-1.5 text-xs rounded-md px-2 py-1',
            stalledInfo.stalledSeverity === 'critical' 
              ? 'bg-destructive/10 text-destructive' 
              : 'bg-amber-500/10 text-amber-600'
          )}>
            <AlertTriangle className="h-3 w-3" />
            <span>
              Stalled ({stalledInfo.daysInStage}d vs {stalledInfo.avgDaysForStage}d prom.)
            </span>
          </div>
        )}
        
        {deal.organization_name && (
          <div className="text-xs text-muted-foreground truncate">
            {deal.organization_name}
          </div>
        )}
        
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'text-sm font-semibold',
            valueTier === 'premium' ? 'text-amber-600' : 'text-primary'
          )}>
            {formatCurrency(deal.value)}
          </span>
          <Badge variant="outline" className={`text-xs ${statusColor}`}>
            {deal.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{daysInStage}</span>
          {deal.owner_name && (
            <span className="truncate max-w-[100px]">{deal.owner_name}</span>
          )}
        </div>
        
        {deal.match_confidence !== null && deal.match_confidence > 0 && (
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              deal.match_confidence >= 1 ? 'bg-green-500' :
              deal.match_confidence >= 0.7 ? 'bg-yellow-500' : 'bg-orange-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {deal.matched_client_name || 'Match pendiente'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StageColumnProps {
  stage: CrmPipelineStage;
  deals: CrmDealWithStage[];
  stageAverages: Record<string, { avgDaysInStage: number }>;
}

function StageColumn({ stage, deals, stageAverages }: StageColumnProps) {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const stalledCount = deals.filter(deal => {
    const info = calculateDealStalledInfo(
      deal.updated_at,
      deal.stage_id,
      stageAverages as Record<string, { stageId: string; stageName: string; avgDaysInStage: number }>
    );
    return info.isStalled;
  }).length;

  return (
    <div className="flex-shrink-0 w-72 bg-secondary/30 rounded-lg p-3 space-y-3">
      {/* Column Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{stage.name}</h3>
          <div className="flex items-center gap-1.5">
            {stalledCount > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-200">
                {stalledCount} stalled
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {deals.length}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{stage.deal_probability}% prob.</span>
          <span className="font-medium">{formatCompactCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Deals */}
      <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
        {deals.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            Sin deals en esta etapa
          </div>
        ) : (
          deals.map(deal => (
            <DealCard key={deal.id} deal={deal} stageAverages={stageAverages} />
          ))
        )}
      </div>
    </div>
  );
}

export default function PipelineKanban() {
  const { data: stages, isLoading: stagesLoading } = useCrmPipeline();
  const { dealsByStage, isLoading: dealsLoading } = useCrmDealsByStage();
  const { data: trends, isLoading: trendsLoading } = useCrmTrends();
  const { data: stageAverages = {}, isLoading: averagesLoading } = useStageAverageTimes();

  const isLoading = stagesLoading || dealsLoading || trendsLoading || averagesLoading;

  // Calculate total metrics
  const totalMetrics = useMemo(() => {
    const allDeals = Object.values(dealsByStage).flat();
    return {
      totalDeals: allDeals.length,
      totalValue: allDeals.reduce((sum, d) => sum + d.value, 0),
    };
  }, [dealsByStage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-72 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary with Trends */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-8">
            {/* Total Deals */}
            <div>
              <div className="text-sm text-muted-foreground">Total Deals Abiertos</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{totalMetrics.totalDeals}</span>
                {trends && trends.openDealsChange !== 0 && (
                  <div className={cn(
                    'flex items-center gap-0.5 text-xs',
                    trends.openDealsChange > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trends.openDealsChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{trends.openDealsChange > 0 ? '+' : ''}{trends.openDealsChange} vs mes ant.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Value */}
            <div>
              <div className="text-sm text-muted-foreground">Valor Total Pipeline</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatCompactCurrency(totalMetrics.totalValue)}
                </span>
                {trends && trends.pipelineValueChange !== 0 && (
                  <div className={cn(
                    'flex items-center gap-0.5 text-xs',
                    trends.pipelineValueChange > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trends.pipelineValueChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{trends.pipelineValueChange > 0 ? '+' : ''}{trends.pipelineValueChange.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              {/* Progress vs Target */}
              {trends?.progressVsTarget !== null && trends?.monthlyTarget && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 max-w-32 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, trends.progressVsTarget || 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(trends.progressVsTarget || 0).toFixed(0)}% de meta ({formatCompactCurrency(trends.monthlyTarget)})
                  </span>
                </div>
              )}
            </div>

            {/* Won This Month */}
            {trends && trends.currentWonValue > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">Ganados Este Mes</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">
                    {formatCompactCurrency(trends.currentWonValue)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({trends.currentWonDeals} deals)
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {(stages || []).map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id] || []}
              stageAverages={stageAverages}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
