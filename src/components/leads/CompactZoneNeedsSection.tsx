import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { useMultiMonthRecruitmentPrediction } from '@/hooks/useMultiMonthRecruitmentPrediction';
import { Target, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const getStatusVariant = (urgencyLevel: string, finalNeed: number) => {
  if (finalNeed === 0) return 'default';
  
  switch (urgencyLevel) {
    case 'critico':
      return 'destructive';
    case 'urgente':
      return 'secondary';
    default:
      return 'default';
  }
};

const CompactKPICard: React.FC<{
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}> = ({ title, value, unit, icon, trend = 'neutral', loading }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
        trend === 'down' ? 'bg-red-100 text-red-600' : 
        trend === 'up' ? 'bg-green-100 text-green-600' : 
        'bg-blue-100 text-blue-600'
      )}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
          {title}
        </div>
        <div className="text-lg font-bold text-foreground">
          {loading ? '...' : value}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {unit}
        </div>
      </div>
    </div>
  );
};

const CompactZoneCard: React.FC<{ cluster: any }> = ({ cluster }) => {
  const statusVariant = getStatusVariant(cluster.urgencyLevel, cluster.finalNeed);
  
  return (
    <div className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Badge variant={statusVariant} className="shrink-0">
          {cluster.finalNeed}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-foreground truncate">
            {cluster.clusterName}
          </div>
          <div className="text-xs text-muted-foreground">
            {cluster.currentCustodians} activos
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <div className="text-xs text-muted-foreground">
          {new Intl.NumberFormat('es-MX', { 
            style: 'currency', 
            currency: 'MXN',
            notation: 'compact',
            maximumFractionDigits: 0
          }).format(cluster.budgetRequired || 0)}
        </div>
      </div>
    </div>
  );
};

export const CompactZoneNeedsSection: React.FC = () => {
  const { multiMonthData: data, loading } = useMultiMonthRecruitmentPrediction();
  
  if (loading) {
    return (
      <CollapsibleSection
        title="Cargando objetivos..."
        variant="compact"
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </CollapsibleSection>
    );
  }

  if (!data) {
    return (
      <CollapsibleSection
        title="Error al cargar datos"
        variant="compact"
        defaultOpen={false}
      >
        <div className="text-center py-6 text-muted-foreground">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <p className="text-sm">No se pudieron cargar las necesidades por zona</p>
        </div>
      </CollapsibleSection>
    );
  }

  const targetMonth = data.targetMonth;
  const totalNeed = targetMonth?.totalNeed || 0;
  const totalBudget = targetMonth?.clustersNeeds?.reduce((sum, cluster) => sum + (cluster.budgetRequired || 0), 0) || 0;
  const criticalZones = targetMonth?.clustersNeeds?.filter(cluster => 
    cluster.urgencyLevel === 'critico' && cluster.finalNeed > 0
  ).length || 0;
  const daysRemaining = targetMonth?.daysToRecruitmentDeadline || 0;

  const zonesWithNeeds = targetMonth?.clustersNeeds?.filter(cluster => cluster.finalNeed > 0) || [];

  const headerSummary = (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Target className="h-4 w-4 text-primary" />
        <span className="font-medium">{totalNeed}</span>
        <span className="text-muted-foreground">custodios</span>
      </div>
      {criticalZones > 0 && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="font-medium text-red-600">{criticalZones}</span>
          <span className="text-muted-foreground">críticas</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-blue-500" />
        <span className="font-medium">{daysRemaining}</span>
        <span className="text-muted-foreground">días</span>
      </div>
    </div>
  );

  return (
    <CollapsibleSection
      title={`Objetivos ${targetMonth?.monthName} ${targetMonth?.year}`}
      subtitle="Metas de reclutamiento y necesidades por zona"
      variant="compact"
      defaultOpen={false}
      headerContent={headerSummary}
    >
      <div className="space-y-4">
        {/* KPIs en grid compacto */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CompactKPICard
            title="Necesarios"
            value={totalNeed.toString()}
            unit={`${targetMonth?.monthName || ''}`}
            icon={<Target className="h-4 w-4" />}
            trend="neutral"
            loading={loading}
          />
          
          <CompactKPICard
            title="Presupuesto"
            value={new Intl.NumberFormat('es-MX', { 
              style: 'currency', 
              currency: 'MXN',
              notation: 'compact',
              maximumFractionDigits: 0
            }).format(totalBudget)}
            unit="Inversión"
            icon={<TrendingUp className="h-4 w-4" />}
            trend="neutral"
            loading={loading}
          />
          
          <CompactKPICard
            title="Tiempo"
            value={daysRemaining.toString()}
            unit="días disponibles"
            icon={<Calendar className="h-4 w-4" />}
            trend={daysRemaining <= 15 ? "down" : daysRemaining <= 30 ? "neutral" : "up"}
            loading={loading}
          />
          
          <CompactKPICard
            title="Críticas"
            value={criticalZones.toString()}
            unit="zonas urgentes"
            icon={<AlertTriangle className="h-4 w-4" />}
            trend={criticalZones > 0 ? "down" : "up"}
            loading={loading}
          />
        </div>

        {/* Zonas con necesidades en lista compacta */}
        {zonesWithNeeds.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Zonas que requieren reclutamiento ({zonesWithNeeds.length})
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {zonesWithNeeds.map((cluster) => (
                <CompactZoneCard 
                  key={cluster.clusterId} 
                  cluster={cluster}
                />
              ))}
            </div>
          </div>
        )}

        {zonesWithNeeds.length === 0 && (
          <div className="text-center py-4">
            <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">¡Capacidad Suficiente!</p>
            <p className="text-xs text-muted-foreground">
              Todas las zonas cubiertas para {targetMonth?.monthName}
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};