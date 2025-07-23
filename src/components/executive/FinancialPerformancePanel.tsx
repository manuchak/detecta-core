import React from 'react';
import { Card } from '@/components/ui/card';
import { KPIHeroCard } from './KPIHeroCard';
import { useFinancialSystem } from '@/hooks/useFinancialSystem';

export function FinancialPerformancePanel() {
  const financialSystem = useFinancialSystem();

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
            Últimos 30 días
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPIHeroCard
            title="Inversión Total MKT"
            value={formatCurrency(financialSystem.gastosTotales || 0)}
            trend="neutral"
            loading={financialSystem.loading}
          />
          
          <KPIHeroCard
            title="ROI Promedio"
            value={financialSystem.roiPromedio || 0}
            unit="%"
            trend={financialSystem.roiPromedio > 20 ? 'up' : 'down'}
            loading={financialSystem.loading}
          />
          
          <KPIHeroCard
            title="Eficiencia Presupuestaria"
            value={85}
            unit="%"
            trend="up"
            loading={financialSystem.loading}
          />
          
          <KPIHeroCard
            title="Canal Más Rentable"
            value="Digital"
            trend="up"
            loading={financialSystem.loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investment Distribution */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Distribución de Inversión</h3>
            <div className="space-y-2">
              {[
                { name: 'Digital', amount: 180000, percentage: 45 },
                { name: 'Referidos', amount: 120000, percentage: 30 },
                { name: 'Eventos', amount: 80000, percentage: 20 },
                { name: 'Otros', amount: 20000, percentage: 5 }
              ].map((channel, index) => (
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
              ))}
            </div>
          </div>

          {/* ROI by Channel */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">ROI por Canal</h3>
            <div className="space-y-2">
              {[
                { name: 'Digital', roi: 35 },
                { name: 'Referidos', roi: 28 },
                { name: 'Eventos', roi: 15 },
                { name: 'Otros', roi: 8 }
              ].map((channel, index) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}