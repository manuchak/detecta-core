import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import { CxCMetrics } from '../../hooks/useCuentasPorCobrar';
import { formatCurrency } from '@/utils/formatUtils';

interface AgingKPIBarProps {
  metrics: CxCMetrics;
  isLoading?: boolean;
}

export function AgingKPIBar({ metrics, isLoading }: AgingKPIBarProps) {
  const kpis = [
    {
      label: 'Total CxC',
      value: formatCurrency(metrics.totalCxC),
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Vigente',
      value: formatCurrency(metrics.totalVigente),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Vencido',
      value: formatCurrency(metrics.totalVencido),
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: '>60 días',
      value: formatCurrency(metrics.totalVencidoMas60),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      alert: metrics.totalVencidoMas60 > 0,
    },
    {
      label: 'DSO',
      value: `${metrics.dsoPromedio} días`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Eficiencia',
      value: `${metrics.eficienciaCobranza}%`,
      icon: TrendingUp,
      color: metrics.eficienciaCobranza >= 80 ? 'text-emerald-600' : 'text-amber-600',
      bgColor: metrics.eficienciaCobranza >= 80 ? 'bg-emerald-500/10' : 'bg-amber-500/10',
    },
    {
      label: 'Clientes',
      value: metrics.numClientes.toString(),
      icon: Users,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
    {
      label: 'Facturas',
      value: metrics.numFacturas.toString(),
      icon: FileText,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {kpis.map((_, i) => (
          <Card key={i} className="p-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-16 mb-2" />
            <div className="h-6 bg-muted rounded w-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {kpis.map((kpi) => (
        <Card 
          key={kpi.label} 
          className={`p-3 ${kpi.alert ? 'ring-2 ring-red-500/50' : ''}`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`p-1 rounded ${kpi.bgColor}`}>
              <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              {kpi.label}
            </span>
            {kpi.alert && <AlertCircle className="h-3 w-3 text-red-500 animate-pulse" />}
          </div>
          <p className={`text-sm font-bold ${kpi.color}`}>
            {kpi.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
