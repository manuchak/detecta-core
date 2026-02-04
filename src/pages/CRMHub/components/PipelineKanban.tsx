import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCrmPipeline } from '@/hooks/useCrmPipeline';
import { useCrmDealsByStage, useCrmDeals } from '@/hooks/useCrmDeals';
import { useCrmTrends, useStageAverageTimes, calculateDealStalledInfo } from '@/hooks/useCrmTrends';
import { CRMHeroCard, type HealthStatus } from './CRMHeroCard';
import { CRMAlertBanner, type AlertItem } from './CRMAlertBanner';
import type { CrmDealWithStage, CrmPipelineStage } from '@/types/crm';
import { getDealValueTier } from '@/types/crm';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Gem, TrendingUp } from 'lucide-react';
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
    return `$${(value / 1000000).toFixed(2)}M`;
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
  const daysAgo = deal.updated_at
    ? formatDistanceToNow(new Date(deal.updated_at), { locale: es, addSuffix: false })
    : 'N/A';

  const valueTier = getDealValueTier(deal.value);
  
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
        <div className="flex items-start gap-2">
          <div className={cn('text-sm line-clamp-2 flex-1', titleStyles[valueTier])}>
            {deal.title}
          </div>
          {valueTier === 'premium' && (
            <Gem className="h-4 w-4 text-amber-500 shrink-0" />
          )}
        </div>

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
          <span>{daysAgo}</span>
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

      <div className="space-y-2 max-h-[calc(var(--vh-full)-450px)] overflow-y-auto pr-1">
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
  const { data: allDeals } = useCrmDeals();
  const { data: trends, isLoading: trendsLoading } = useCrmTrends();
  const { data: stageAverages = {}, isLoading: averagesLoading } = useStageAverageTimes();

  const isLoading = stagesLoading || dealsLoading || trendsLoading || averagesLoading;

  // Calculate total metrics and alerts
  const { totalMetrics, alerts } = useMemo(() => {
    const deals = Object.values(dealsByStage).flat();
    const alertItems: AlertItem[] = [];
    let stalledCount = 0;
    let stalledValue = 0;
    let premiumStalledCount = 0;
    let premiumStalledValue = 0;

    deals.forEach(deal => {
      const stalledInfo = calculateDealStalledInfo(
        deal.updated_at,
        deal.stage_id,
        stageAverages as Record<string, { stageId: string; stageName: string; avgDaysInStage: number }>
      );
      
      if (stalledInfo.isStalled) {
        const valueTier = getDealValueTier(deal.value);
        if (valueTier === 'premium') {
          premiumStalledCount++;
          premiumStalledValue += deal.value;
          alertItems.push({
            id: `premium-${deal.id}`,
            type: 'premium',
            title: deal.title,
            description: `${stalledInfo.daysInStage} días sin movimiento`,
            value: formatCompactCurrency(deal.value),
          });
        } else {
          stalledCount++;
          stalledValue += deal.value;
          alertItems.push({
            id: `stalled-${deal.id}`,
            type: 'stalled',
            title: deal.title,
            description: `${stalledInfo.daysInStage} días en etapa`,
            value: formatCompactCurrency(deal.value),
          });
        }
      }
    });

    return {
      totalMetrics: {
        totalDeals: deals.length,
        totalValue: deals.reduce((sum, d) => sum + d.value, 0),
        stalledCount: stalledCount + premiumStalledCount,
        stalledValue: stalledValue + premiumStalledValue,
      },
      alerts: alertItems,
    };
  }, [dealsByStage, stageAverages]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
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

  // Determine health based on stalled deals
  const stalledPercent = totalMetrics.totalDeals > 0 
    ? (totalMetrics.stalledCount / totalMetrics.totalDeals) * 100 
    : 0;
  const health: HealthStatus = stalledPercent > 20 ? 'critical' 
    : stalledPercent > 10 ? 'warning' 
    : stalledPercent > 0 ? 'neutral'
    : 'healthy';

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <CRMHeroCard
        title="Pipeline Activo"
        value={formatCompactCurrency(totalMetrics.totalValue)}
        subtitle={`${totalMetrics.totalDeals} deals abiertos en negociación`}
        health={health}
        trend={trends?.pipelineValueChange ? {
          value: trends.pipelineValueChange,
          label: 'vs mes anterior',
        } : undefined}
        secondaryMetrics={[
          { label: 'Deals', value: String(totalMetrics.totalDeals) },
          { label: 'Stalled', value: String(totalMetrics.stalledCount), highlight: totalMetrics.stalledCount > 0 },
          ...(trends?.currentWonValue ? [{ label: 'Ganado este mes', value: formatCompactCurrency(trends.currentWonValue) }] : []),
        ]}
        icon={<TrendingUp className="h-8 w-8 text-muted-foreground/20" />}
      />

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <CRMAlertBanner alerts={alerts} />
      )}

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
