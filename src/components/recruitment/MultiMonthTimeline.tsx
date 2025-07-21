import React from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MinimalCard } from '@/components/recruitment/ui/MinimalCard';
import { MinimalGrid } from '@/components/recruitment/ui/MinimalGrid';
import type { MultiMonthPrediction, MonthlyNeed, ClusterNeed } from '@/hooks/useMultiMonthRecruitmentPrediction';

interface MultiMonthTimelineProps {
  data: MultiMonthPrediction;
  onRefresh: () => void;
  loading?: boolean;
}

const getStatusInfo = (urgencyLevel: string, finalNeed: number) => {
  if (finalNeed === 0) {
    return {
      color: 'bg-green-500/20 border-green-500/30',
      dotColor: 'bg-green-500',
      status: 'estable',
      tooltip: 'Zona Estable: No requiere reclutamiento inmediato. La capacidad actual es suficiente para la demanda proyectada.'
    };
  }
  
  switch (urgencyLevel) {
    case 'critico':
      return {
        color: 'bg-red-500/20 border-red-500/30',
        dotColor: 'bg-red-500',
        status: 'crítico',
        tooltip: 'Estado Crítico: Requiere reclutamiento inmediato. La demanda supera significativamente la capacidad actual.'
      };
    case 'urgente':
      return {
        color: 'bg-yellow-500/20 border-yellow-500/30',
        dotColor: 'bg-yellow-500',
        status: 'alerta',
        tooltip: 'Estado Alerta: Requiere planificación de reclutamiento a corto plazo. La capacidad está cerca del límite.'
      };
    case 'estable':
    default:
      return {
        color: 'bg-green-500/20 border-green-500/30',
        dotColor: 'bg-green-500',
        status: 'estable',
        tooltip: 'Zona Estable: Capacidad adecuada para la demanda actual. Monitoreo continuo recomendado.'
      };
  }
};

const MinimalClusterCard: React.FC<{ cluster: ClusterNeed; isTargetMonth: boolean }> = ({ cluster, isTargetMonth }) => {
  const needsRecruitment = cluster.finalNeed > 0;
  const statusInfo = getStatusInfo(cluster.urgencyLevel, cluster.finalNeed);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="relative p-8 transition-all duration-200 hover:shadow-sm bg-white border-gray-100 cursor-help">
            {/* Glass Status Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full border backdrop-blur-sm ${statusInfo.color}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}></div>
                <span className="text-xs font-medium text-gray-700 capitalize">
                  {statusInfo.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-6 mt-8">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-lg font-medium text-gray-900">{cluster.clusterName}</h4>
                  <p className="text-sm text-gray-500">
                    {cluster.currentCustodians} custodios activos
                  </p>
                </div>
                {needsRecruitment && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{cluster.finalNeed}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Necesarios</div>
                  </div>
                )}
              </div>

              {/* Main Metrics */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-lg font-medium text-gray-600">{cluster.projectedServices}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Servicios Proj.</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-600">{cluster.rotationImpact}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Rotación</div>
                </div>
              </div>

              {/* Budget for target month */}
              {isTargetMonth && needsRecruitment && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Presupuesto
                    </span>
                    <span className="text-lg font-medium text-gray-900">
                      {new Intl.NumberFormat('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN',
                        notation: 'compact',
                        maximumFractionDigits: 0
                      }).format(cluster.budgetRequired)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <p className="text-sm">{statusInfo.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MinimalMonthSection: React.FC<{ monthData: MonthlyNeed; isTargetMonth: boolean }> = ({ monthData, isTargetMonth }) => (
  <div className="space-y-8">
    {/* Month Header */}
    <div className={`p-8 rounded-lg ${
      isTargetMonth ? 'bg-gray-50 border border-gray-200' : 'bg-white border border-gray-100'
    }`}>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h3 className="text-2xl font-light text-gray-900">
            {monthData.monthName} {monthData.year}
          </h3>
          {isTargetMonth && (
            <p className="text-sm text-gray-500">Mes principal</p>
          )}
        </div>
        
        <div className="text-right space-y-1">
          <div className="text-3xl font-light text-gray-900">{monthData.totalNeed}</div>
          <div className="text-sm text-gray-500">Total a reclutar</div>
          <div className="text-xs text-gray-400">
            {new Intl.NumberFormat('es-MX', { 
              style: 'currency', 
              currency: 'MXN',
              notation: 'compact',
              maximumFractionDigits: 0
            }).format(monthData.budgetEstimate)}
          </div>
        </div>
      </div>

      {isTargetMonth && monthData.daysToRecruitmentDeadline <= 15 && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <p className="text-sm text-orange-800">
              <span className="font-medium">PLANIFICACIÓN:</span> Preparar {monthData.totalNeed} reclutamientos para {monthData.monthName.toLowerCase()}
            </p>
          </div>
        </div>
      )}
    </div>

    {/* Clusters Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {monthData.clustersNeeds
        .filter(cluster => cluster.finalNeed > 0)
        .map((cluster) => (
          <MinimalClusterCard 
            key={cluster.clusterId} 
            cluster={cluster} 
            isTargetMonth={isTargetMonth}
          />
        ))}
    </div>
  </div>
);

export const MultiMonthTimeline: React.FC<MultiMonthTimelineProps> = ({ data, onRefresh, loading }) => {
  if (!data) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {/* Target Month */}
      <MinimalMonthSection 
        monthData={data.targetMonth} 
        isTargetMonth={true}
      />
      
      {/* Next Month Preview */}
      <MinimalMonthSection 
        monthData={data.nextMonth} 
        isTargetMonth={false}
      />
    </div>
  );
};