import React from 'react';
import { HistoricalReportData } from '@/types/reports';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity, 
  UserPlus, 
  Target, 
  Gauge,
  BarChart3,
  LineChart,
  List
} from 'lucide-react';

interface ReportTableOfContentsProps {
  data: HistoricalReportData;
}

interface TOCItem {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

export function ReportTableOfContents({ data }: ReportTableOfContentsProps) {
  const tocItems: TOCItem[] = [
    {
      number: 1,
      title: 'Costo por Adquisición (CPA)',
      description: 'Análisis del costo de captación de nuevos custodios',
      icon: <DollarSign className="h-4 w-4" />,
      available: !!data.cpa,
    },
    {
      number: 2,
      title: 'Lifetime Value (LTV)',
      description: 'Valor de vida del custodio y ratio LTV/CPA',
      icon: <TrendingUp className="h-4 w-4" />,
      available: !!data.ltv,
    },
    {
      number: 3,
      title: 'Retención de Custodios',
      description: 'Análisis de cohortes y tasas de permanencia',
      icon: <Users className="h-4 w-4" />,
      available: !!data.retention,
    },
    {
      number: 4,
      title: 'Engagement',
      description: 'Frecuencia de servicios por custodio',
      icon: <Activity className="h-4 w-4" />,
      available: !!data.engagement,
    },
    {
      number: 5,
      title: 'Crecimiento Supply',
      description: 'Evolución de la base de custodios',
      icon: <UserPlus className="h-4 w-4" />,
      available: !!data.supplyGrowth,
    },
    {
      number: 6,
      title: 'Tasa de Conversión',
      description: 'Conversión de leads a custodios activos',
      icon: <Target className="h-4 w-4" />,
      available: !!data.conversion,
    },
    {
      number: 7,
      title: 'Capacidad Operativa',
      description: 'Disponibilidad y utilización de flota',
      icon: <Gauge className="h-4 w-4" />,
      available: !!data.capacity,
    },
    {
      number: 8,
      title: 'Métricas Operacionales',
      description: 'Servicios, GMV y rankings de desempeño',
      icon: <BarChart3 className="h-4 w-4" />,
      available: !!data.operational,
    },
    {
      number: 9,
      title: 'Proyecciones',
      description: 'Forecast vs. real y precisión del modelo',
      icon: <LineChart className="h-4 w-4" />,
      available: !!data.projections,
    },
  ];

  const availableItems = tocItems.filter(item => item.available);

  // Re-number based on available items
  const numberedItems = availableItems.map((item, index) => ({
    ...item,
    number: index + 1,
  }));

  return (
    <div className="toc-container space-y-6 p-6 bg-background print:break-after-page">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <List className="h-5 w-5 text-primary" />
          Contenido del Informe
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {numberedItems.length} secciones incluidas • {data.periodLabel}
        </p>
      </div>

      {/* TOC List */}
      <div className="space-y-1">
        {numberedItems.map((item) => (
          <div 
            key={item.number}
            className="toc-item flex items-center py-3 border-b border-dotted border-border hover:bg-muted/30 rounded-lg px-2 transition-colors"
          >
            {/* Number Badge */}
            <div className="toc-number w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm mr-4 flex-shrink-0">
              {item.number}
            </div>
            
            {/* Icon */}
            <div className="p-2 bg-muted rounded-lg mr-3 flex-shrink-0">
              {item.icon}
            </div>
            
            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <p className="toc-title font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
        <p className="font-medium mb-2">Acerca de este informe</p>
        <ul className="space-y-1 text-xs">
          <li>• Los datos presentados corresponden al período seleccionado sin omisiones</li>
          <li>• Las tendencias se calculan comparando con el período anterior</li>
          <li>• Los valores monetarios están expresados en MXN</li>
        </ul>
      </div>
    </div>
  );
}
