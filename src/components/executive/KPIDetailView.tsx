import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { RetentionDetailView } from './details/RetentionDetailView';
import { SupplyGrowthDetailView } from './details/SupplyGrowthDetailView';
import { CPADetailView } from './details/CPADetailView';
import { ConversionRateDetailView } from './details/ConversionRateDetailView';
import { CustodianEngagementDetailView } from './details/CustodianEngagementDetailView';
import { LTVDetailView } from './details/LTVDetailView';
import { MonthlyCapacityDetailView } from './details/MonthlyCapacityDetailView';

export type KPIType = 'retention' | 'ltv' | 'cpa' | 'conversion' | 'engagement' | 'supply' | 'roi' | 'supply_growth' | 
  'monthly_capacity' | 'daily_capacity' | 'healthy_utilization' | 'gap_forecast' | 'fleet_efficiency';

interface KPIDetailViewProps {
  selectedKPI: KPIType;
  onClose: () => void;
  tooltipContent?: React.ReactNode;
}

const KPI_TITLES: Record<KPIType, string> = {
  retention: 'Análisis de Retención',
  ltv: 'Valor de Vida del Cliente (LTV)',
  cpa: 'Costo por Adquisición (CPA)',
  conversion: 'Tasa de Conversión',
  engagement: 'Engagement de Usuarios',
  supply: 'Crecimiento de Oferta',
  supply_growth: 'Crecimiento del Supply',
  roi: 'ROI de Marketing',
  monthly_capacity: 'Capacidad Mensual Proyectada',
  daily_capacity: 'Capacidad Diaria',
  healthy_utilization: 'Utilización Saludable',
  gap_forecast: 'Gap vs Forecast',
  fleet_efficiency: 'Eficiencia de Flota'
};

function DetailContent({ selectedKPI }: { selectedKPI: KPIType }) {
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
    case 'monthly_capacity':
    case 'daily_capacity':
    case 'healthy_utilization':
    case 'gap_forecast':
    case 'fleet_efficiency':
      return <MonthlyCapacityDetailView />;
    default:
      return (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              Vista detallada para {KPI_TITLES[selectedKPI]} próximamente
            </div>
          </CardContent>
        </Card>
      );
  }
}

export function KPIDetailView({ selectedKPI, onClose, tooltipContent }: KPIDetailViewProps) {
  const isMobile = useIsMobile();
  const title = KPI_TITLES[selectedKPI];
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      requestAnimationFrame(() => {
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      });
      onClose();
    }
  };

  // Mobile: fullscreen Drawer
  if (isMobile) {
    return (
      <Drawer open={true} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[95vh] max-h-[95vh]">
          <DrawerHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border sticky top-0 bg-background z-10">
            <div className="min-w-0 flex-1 mr-2">
              <DrawerTitle className="text-sm font-semibold truncate">{title}</DrawerTitle>
              <p className="text-xs text-muted-foreground truncate">Análisis detallado</p>
            </div>
            <DrawerClose className="rounded-full p-1.5 hover:bg-muted flex-shrink-0">
              <X className="h-4 w-4" />
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {/* Tooltip summary collapsible */}
            {tooltipContent && (
              <Collapsible open={tooltipOpen} onOpenChange={setTooltipOpen} className="mb-3">
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                  <Info className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="flex-1">Resumen y fórmula</span>
                  {tooltipOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 px-3 py-3 rounded-lg border border-border/50 bg-card">
                  {tooltipContent}
                </CollapsibleContent>
              </Collapsible>
            )}
            <div className="animate-fade-in">
              <DetailContent selectedKPI={selectedKPI} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: side panel
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background border-l shadow-lg overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-light tracking-tight text-foreground">
                {title}
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
          <div className="animate-fade-in">
            <DetailContent selectedKPI={selectedKPI} />
          </div>
        </div>
      </div>
    </div>
  );
}
