import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCrmPipeline } from '@/hooks/useCrmPipeline';
import { useCrmDealsByStage } from '@/hooks/useCrmDeals';
import type { CrmDealWithStage, CrmPipelineStage } from '@/types/crm';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface DealCardProps {
  deal: CrmDealWithStage;
}

function DealCard({ deal }: DealCardProps) {
  const daysInStage = deal.updated_at
    ? formatDistanceToNow(new Date(deal.updated_at), { locale: es, addSuffix: false })
    : 'N/A';

  const statusColor = {
    open: 'bg-blue-500/10 text-blue-600 border-blue-200',
    won: 'bg-green-500/10 text-green-600 border-green-200',
    lost: 'bg-red-500/10 text-red-600 border-red-200',
  }[deal.status] || 'bg-muted text-muted-foreground';

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/50">
      <CardContent className="p-3 space-y-2">
        <div className="font-medium text-sm line-clamp-2">{deal.title}</div>
        
        {deal.organization_name && (
          <div className="text-xs text-muted-foreground truncate">
            {deal.organization_name}
          </div>
        )}
        
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-primary">
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
}

function StageColumn({ stage, deals }: StageColumnProps) {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex-shrink-0 w-72 bg-secondary/30 rounded-lg p-3 space-y-3">
      {/* Column Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {deals.length}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{stage.deal_probability}% prob.</span>
          <span className="font-medium">{formatCurrency(totalValue)}</span>
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
            <DealCard key={deal.id} deal={deal} />
          ))
        )}
      </div>
    </div>
  );
}

export default function PipelineKanban() {
  const { data: stages, isLoading: stagesLoading } = useCrmPipeline();
  const { dealsByStage, isLoading: dealsLoading } = useCrmDealsByStage();

  const isLoading = stagesLoading || dealsLoading;

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
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Total Deals Abiertos</div>
              <div className="text-2xl font-bold">{totalMetrics.totalDeals}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Valor Total Pipeline</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalMetrics.totalValue)}
              </div>
            </div>
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
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
