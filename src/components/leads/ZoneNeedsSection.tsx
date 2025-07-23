import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KPIHeroCard } from '@/components/executive/KPIHeroCard';
import { useMultiMonthRecruitmentPrediction } from '@/hooks/useMultiMonthRecruitmentPrediction';
import { CalendarDays, Target, TrendingUp, AlertTriangle } from 'lucide-react';

const getStatusInfo = (urgencyLevel: string, finalNeed: number, clusterName: string) => {
  const getStatesForCluster = (name: string) => {
    switch (name.toLowerCase()) {
      case 'centro de méxico':
        return 'Ciudad de México, Estado de México, Morelos, Hidalgo, Tlaxcala, Puebla';
      case 'norte':
        return 'Chihuahua, Sonora, Nuevo León, Coahuila, Tamaulipas, Durango';
      case 'occidente':
        return 'Jalisco, Michoacán, Colima, Nayarit, Guanajuato';
      case 'bajío':
        return 'Aguascalientes, Zacatecas, San Luis Potosí, Querétaro';
      case 'pacífico':
        return 'Guerrero, Oaxaca, Chiapas, Veracruz (sur)';
      case 'golfo':
        return 'Veracruz (norte), Tabasco, Campeche, Yucatán, Quintana Roo';
      case 'sureste':
        return 'Chiapas, Oaxaca, Guerrero, Tabasco, Campeche';
      case 'centro-occidente':
        return 'Guanajuato, Querétaro, Michoacán (norte), Jalisco (este)';
      default:
        return 'Estados de la zona operativa correspondiente';
    }
  };

  const states = getStatesForCluster(clusterName);
  
  if (finalNeed === 0) {
    return {
      color: 'bg-emerald-50 border-emerald-200',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      status: 'Estable',
      tooltip: `${clusterName}\n\nEstados incluidos:\n${states}\n\nCapacidad actual suficiente para la demanda proyectada.`
    };
  }
  
  switch (urgencyLevel) {
    case 'critico':
      return {
        color: 'bg-red-50 border-red-200',
        dotColor: 'bg-red-500',
        textColor: 'text-red-700',
        status: 'Crítico',
        tooltip: `${clusterName}\n\nEstados incluidos:\n${states}\n\nDéficit crítico que requiere reclutamiento inmediato.`
      };
    case 'urgente':
      return {
        color: 'bg-amber-50 border-amber-200',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        status: 'Alerta',
        tooltip: `${clusterName}\n\nEstados incluidos:\n${states}\n\nRequiere planificación de reclutamiento a corto plazo.`
      };
    case 'estable':
    default:
      return {
        color: 'bg-emerald-50 border-emerald-200',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        status: 'Estable',
        tooltip: `${clusterName}\n\nEstados incluidos:\n${states}\n\nCapacidad adecuada para la demanda actual.`
      };
  }
};

const ZoneCard: React.FC<{ 
  cluster: any; 
  onClick?: () => void;
}> = ({ cluster, onClick }) => {
  const statusInfo = getStatusInfo(cluster.urgencyLevel, cluster.finalNeed, cluster.clusterName);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`relative transition-all duration-200 hover:shadow-md cursor-help ${statusInfo.color} ${
              onClick ? 'hover:scale-[1.02] cursor-pointer' : ''
            }`}
            onClick={onClick}
          >
            <CardContent className="p-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}></div>
                  <span className={`text-xs font-medium ${statusInfo.textColor}`}>
                    {statusInfo.status}
                  </span>
                </div>
                {cluster.finalNeed > 0 && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">{cluster.finalNeed}</div>
                  </div>
                )}
              </div>
              
              {/* Zone Name */}
              <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-1">
                {cluster.clusterName}
              </h4>
              
              {/* Current Status */}
              <div className="text-xs text-muted-foreground">
                {cluster.currentCustodians} custodios activos
              </div>
              
              {/* Budget if needed */}
              {cluster.finalNeed > 0 && (
                <div className="mt-2 pt-2 border-t border-current/10">
                  <div className="text-xs text-muted-foreground">
                    Presupuesto: {new Intl.NumberFormat('es-MX', { 
                      style: 'currency', 
                      currency: 'MXN',
                      notation: 'compact',
                      maximumFractionDigits: 0
                    }).format(cluster.budgetRequired || 0)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-3">
          <p className="text-sm whitespace-pre-line">{statusInfo.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const ZoneNeedsSection: React.FC = () => {
  const { multiMonthData: data, loading } = useMultiMonthRecruitmentPrediction();
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>No se pudieron cargar las necesidades por zona</p>
        </div>
      </Card>
    );
  }

  const targetMonth = data.targetMonth;
  const totalNeed = targetMonth?.totalNeed || 0;
  const totalBudget = targetMonth?.clustersNeeds?.reduce((sum, cluster) => sum + (cluster.budgetRequired || 0), 0) || 0;
  const criticalZones = targetMonth?.clustersNeeds?.filter(cluster => 
    cluster.urgencyLevel === 'critico' && cluster.finalNeed > 0
  ).length || 0;
  const daysRemaining = targetMonth?.daysToRecruitmentDeadline || 0;

  // Solo mostrar zonas que necesitan custodios
  const zonesWithNeeds = targetMonth?.clustersNeeds?.filter(cluster => cluster.finalNeed > 0) || [];

  return (
    <div className="space-y-6">
      {/* Resumen del Mes Objetivo */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Resumen del Mes Objetivo - {targetMonth?.monthName} {targetMonth?.year}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Metas de reclutamiento para mantener siempre presente durante la gestión de candidatos
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIHeroCard
            title="CUSTODIOS NECESARIOS"
            value={totalNeed.toString()}
            unit={`${targetMonth?.monthName || ''} ${targetMonth?.year || ''}`}
            trend="neutral"
            loading={loading}
          />
          
          <KPIHeroCard
            title="PRESUPUESTO ESTIMADO"
            value={new Intl.NumberFormat('es-MX', { 
              style: 'currency', 
              currency: 'MXN',
              notation: 'compact',
              maximumFractionDigits: 0
            }).format(totalBudget)}
            unit="Inversión requerida"
            trend="neutral"
            loading={loading}
          />
          
          <KPIHeroCard
            title="DÍAS DISPONIBLES"
            value={daysRemaining.toString()}
            unit="Para actuar"
            trend={daysRemaining <= 15 ? "down" : daysRemaining <= 30 ? "neutral" : "up"}
            loading={loading}
          />
          
          <KPIHeroCard
            title="ZONAS CRÍTICAS"
            value={criticalZones.toString()}
            unit="Requieren atención inmediata"
            trend={criticalZones > 0 ? "down" : "up"}
            loading={loading}
          />
        </div>
      </div>

      {/* Necesidades por Zona */}
      {zonesWithNeeds.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Necesidades por Zona Operativa
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {zonesWithNeeds.map((cluster) => (
              <ZoneCard 
                key={cluster.clusterId} 
                cluster={cluster}
              />
            ))}
          </div>
        </div>
      )}

      {zonesWithNeeds.length === 0 && (
        <Card className="p-6">
          <div className="text-center">
            <Target className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¡Excelente! Capacidad Suficiente
            </h3>
            <p className="text-muted-foreground">
              Todas las zonas tienen capacidad suficiente para {targetMonth?.monthName} {targetMonth?.year}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};