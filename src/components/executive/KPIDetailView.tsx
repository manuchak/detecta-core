import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RetentionDetailView } from './details/RetentionDetailView';
import { SupplyGrowthDetailView } from './details/SupplyGrowthDetailView';
import { CPADetailView } from './details/CPADetailView';
import { ConversionRateDetailView } from './details/ConversionRateDetailView';
import { CustodianEngagementDetailView } from './details/CustodianEngagementDetailView';
import { LTVDetailView } from './details/LTVDetailView';

export type KPIType = 'retention' | 'ltv' | 'cpa' | 'conversion' | 'engagement' | 'supply' | 'roi' | 'supply_growth';

interface KPIDetailViewProps {
  selectedKPI: KPIType;
  onClose: () => void;
}

export function KPIDetailView({ selectedKPI, onClose }: KPIDetailViewProps) {
  const getKPITitle = (kpi: KPIType) => {
    const titles: Record<KPIType, string> = {
      retention: 'Análisis de Retención',
      ltv: 'Valor de Vida del Cliente (LTV)',
      cpa: 'Costo por Adquisición (CPA)',
      conversion: 'Tasa de Conversión',
      engagement: 'Engagement de Usuarios',
      supply: 'Crecimiento de Oferta',
      supply_growth: 'Crecimiento del Supply',
      roi: 'ROI de Marketing'
    };
    return titles[kpi];
  };

  const renderDetailComponent = () => {
    switch (selectedKPI) {
      case 'supply_growth':
        return <SupplyGrowthDetailView />;
      case 'retention':
        return <RetentionDetailView />;
      case 'cpa':
        return <CPADetailView />;
      case 'conversion':
        return <ConversionRateDetailView />;
      case 'engagement':
        return <CustodianEngagementDetailView />;
      case 'ltv':
        return <LTVDetailView />;
      default:
        return (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                Vista detallada para {getKPITitle(selectedKPI)} próximamente
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background border-l shadow-lg overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-light tracking-tight text-foreground">
                {getKPITitle(selectedKPI)}
              </h2>
              <p className="text-muted-foreground">
                Evolución mensual y análisis detallado
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Detail Content */}
          <div className="animate-fade-in">
            {renderDetailComponent()}
          </div>
        </div>
      </div>
    </div>
  );
}