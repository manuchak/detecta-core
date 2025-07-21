
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Calendar, DollarSign, TrendingUp, Clock, Target } from 'lucide-react';
import type { MultiMonthPrediction, MonthlyNeed, ClusterNeed } from '@/hooks/useMultiMonthRecruitmentPrediction';

interface MultiMonthTimelineProps {
  data: MultiMonthPrediction;
  onRefresh: () => void;
  loading?: boolean;
}

const getUrgencyColor = (level: string) => {
  switch (level) {
    case 'critico': return 'bg-red-500 text-white';
    case 'urgente': return 'bg-yellow-500 text-black';
    case 'estable': return 'bg-green-500 text-white';
    case 'sobreabastecido': return 'bg-gray-300 text-gray-800';
    default: return 'bg-gray-500 text-white';
  }
};

const getUrgencyIcon = (level: string) => {
  switch (level) {
    case 'critico': return '🔴';
    case 'urgente': return '🟡';
    case 'estable': return '🟢';
    case 'sobreabastecido': return '⚪';
    default: return '⚫';
  }
};

const ClusterCard: React.FC<{ cluster: ClusterNeed; isTargetMonth: boolean }> = ({ cluster, isTargetMonth }) => (
  <Card className={`p-4 border-l-4 ${
    cluster.urgencyLevel === 'critico' ? 'border-l-red-500' :
    cluster.urgencyLevel === 'urgente' ? 'border-l-yellow-500' :
    cluster.urgencyLevel === 'estable' ? 'border-l-green-500' : 'border-l-gray-300'
  }`}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-semibold text-lg">{cluster.clusterName}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl">{getUrgencyIcon(cluster.urgencyLevel)}</span>
          <Badge className={getUrgencyColor(cluster.urgencyLevel)} variant="outline">
            {cluster.urgencyLevel.toUpperCase()}
          </Badge>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-red-600">{cluster.finalNeed}</div>
        <div className="text-sm text-muted-foreground">Custodios necesarios</div>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      <div className="text-center">
        <div className="text-lg font-bold text-blue-600">{cluster.currentCustodians}</div>
        <div className="text-xs text-muted-foreground">Actuales</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-green-600">{cluster.projectedServices}</div>
        <div className="text-xs text-muted-foreground">Servicios Proj.</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-orange-600">{cluster.currentGap}</div>
        <div className="text-xs text-muted-foreground">Gap Demanda</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-purple-600">{cluster.rotationImpact}</div>
        <div className="text-xs text-muted-foreground">Rotación</div>
      </div>
    </div>

    {isTargetMonth && cluster.urgencyLevel !== 'sobreabastecido' && (
      <div className="mt-3 p-3 bg-gray-50 rounded border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Presupuesto requerido:</span>
          <span className="font-bold text-green-600">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cluster.budgetRequired)}
          </span>
        </div>
      </div>
    )}
  </Card>
);

const MonthSection: React.FC<{ monthData: MonthlyNeed; isTargetMonth: boolean }> = ({ monthData, isTargetMonth }) => (
  <div className="space-y-4">
    <div className={`p-6 rounded-lg ${
      isTargetMonth ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200' : 'bg-gray-50'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className={`text-xl font-bold ${isTargetMonth ? 'text-blue-800' : 'text-gray-700'}`}>
            {isTargetMonth ? '🎯 ' : '📅 '}{monthData.monthName} {monthData.year}
            {isTargetMonth && <span className="text-sm font-normal ml-2">(Mes Principal)</span>}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl">{getUrgencyIcon(monthData.urgencyLevel)}</span>
            <Badge className={getUrgencyColor(monthData.urgencyLevel)}>
              {monthData.urgencyLevel.toUpperCase()}
            </Badge>
            {isTargetMonth && (
              <Badge variant="outline" className="bg-blue-100">
                {monthData.daysToRecruitmentDeadline} días para actuar
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${isTargetMonth ? 'text-blue-600' : 'text-gray-600'}`}>
            {monthData.totalNeed}
          </div>
          <div className="text-sm text-muted-foreground">Total a reclutar</div>
          <div className="text-lg font-semibold text-green-600">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monthData.budgetEstimate)}
          </div>
        </div>
      </div>

      {isTargetMonth && monthData.daysToRecruitmentDeadline <= 10 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800">
              ⏰ Acción inmediata requerida - Quedan {monthData.daysToRecruitmentDeadline} días
            </span>
          </div>
        </div>
      )}
    </div>

    <div className="space-y-3">
      {monthData.clustersNeeds
        .filter(cluster => isTargetMonth || cluster.urgencyLevel !== 'sobreabastecido')
        .sort((a, b) => {
          // Ordenar por urgencia: crítico > urgente > estable > sobreabastecido
          const urgencyOrder = { critico: 4, urgente: 3, estable: 2, sobreabastecido: 1 };
          return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        })
        .map((cluster) => (
          <ClusterCard 
            key={cluster.clusterId} 
            cluster={cluster} 
            isTargetMonth={isTargetMonth}
          />
        ))}
    </div>
  </div>
);

export const MultiMonthTimeline: React.FC<MultiMonthTimelineProps> = ({ data, onRefresh, loading }) => {
  return (
    <div className="space-y-6">
      {/* Header con KPIs críticos */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-800">
            📊 Planificación de Reclutamiento Multi-Mes
          </h2>
          <Button onClick={onRefresh} disabled={loading} variant="outline">
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-red-600">{data.kpis.totalRecruitmentNeed}</div>
            <div className="text-sm text-muted-foreground">Total a Reclutar</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-orange-600">{data.kpis.criticalClusters}</div>
            <div className="text-sm text-muted-foreground">Clusters Críticos</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-yellow-600">{data.kpis.urgentClusters}</div>
            <div className="text-sm text-muted-foreground">Clusters Urgentes</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-blue-600">{data.kpis.daysUntilAction}</div>
            <div className="text-sm text-muted-foreground">Días para Actuar</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-bold text-green-600">
              {new Intl.NumberFormat('es-MX', { 
                style: 'currency', 
                currency: 'MXN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(data.kpis.budgetRequired)}
            </div>
            <div className="text-sm text-muted-foreground">Presupuesto Total</div>
          </div>
        </div>
      </Card>

      {/* Panel de Acciones Críticas */}
      {data.criticalActions.length > 0 && (
        <Card className="p-6 border-l-4 border-l-red-500 bg-red-50">
          <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            🚨 Acciones Inmediatas Requeridas
          </h3>
          <div className="space-y-2">
            {data.criticalActions.map((action, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span className="text-red-800">{action}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline de Meses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <MonthSection monthData={data.targetMonth} isTargetMonth={true} />
        </div>
        <div>
          <MonthSection monthData={data.nextMonth} isTargetMonth={false} />
        </div>
      </div>

      {/* Impacto en Equipo de Monitoreo */}
      {data.monitoringTeamImpact.needsExpansion && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            📈 Impacto en Equipo de Monitoreo
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.monitoringTeamImpact.currentCapacity}</div>
              <div className="text-sm text-muted-foreground">Capacidad Actual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.monitoringTeamImpact.requiredCapacity}</div>
              <div className="text-sm text-muted-foreground">Capacidad Requerida</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                +{data.monitoringTeamImpact.requiredCapacity - data.monitoringTeamImpact.currentCapacity}
              </div>
              <div className="text-sm text-muted-foreground">Personal Adicional</div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-yellow-100 rounded">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Recomendación:</strong> Considerar expandir el equipo de monitoreo para manejar el incremento 
              de custodios proyectado para los próximos meses.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
