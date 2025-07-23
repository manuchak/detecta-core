import React from 'react';
import { Card } from '@/components/ui/card';
import { KPIHeroCard } from './KPIHeroCard';
import { useRealFinancialPerformance } from '@/hooks/useRealFinancialPerformance';

export function FinancialPerformancePanel() {
  const {
    totalInvestment,
    averageROI,
    budgetEfficiency,
    mostProfitableChannel,
    channelDistribution,
    roiByChannel,
    loading
  } = useRealFinancialPerformance();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  return (
    <Card className="p-6 shadow-apple">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Performance Financiero</h2>
          <div className="text-sm text-muted-foreground">
            Últimos 90 días
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPIHeroCard
            title="Inversión Total MKT"
            value={formatCurrency(totalInvestment)}
            trend="neutral"
            loading={loading}
          />
          
          <KPIHeroCard
            title="ROI Promedio"
            value={Math.round(averageROI * 10) / 10}
            unit="%"
            trend={averageROI > 20 ? 'up' : 'down'}
            loading={loading}
          />
          
          <KPIHeroCard
            title="Eficiencia Presupuestaria"
            value={Math.round(budgetEfficiency * 10) / 10}
            unit="%"
            trend={budgetEfficiency > 75 ? 'up' : budgetEfficiency > 50 ? 'neutral' : 'down'}
            loading={loading}
          />
          
          <KPIHeroCard
            title="Canal Más Rentable"
            value={mostProfitableChannel}
            trend="up"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investment Distribution */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Distribución de Inversión</h3>
            <div className="space-y-2">
              {channelDistribution.length > 0 ? channelDistribution.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{channel.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(channel.amount)}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {channel.percentage}%
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground p-3">
                  Sin datos de distribución disponibles
                </div>
              )}
            </div>
          </div>

          {/* ROI by Channel */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">ROI por Canal</h3>
            <div className="space-y-2">
              {roiByChannel.length > 0 ? roiByChannel.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{channel.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      channel.roi > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {channel.roi > 0 ? '+' : ''}{channel.roi}%
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      channel.roi > 20 ? 'bg-green-500' : 
                      channel.roi > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground p-3">
                  Sin datos de ROI disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}