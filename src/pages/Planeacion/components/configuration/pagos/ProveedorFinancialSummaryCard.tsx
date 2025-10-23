import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { ResumenFinanciero } from '@/hooks/useProveedoresPagos';

interface ProveedorFinancialSummaryCardProps {
  resumen: ResumenFinanciero;
  loading?: boolean;
}

export function ProveedorFinancialSummaryCard({ resumen, loading }: ProveedorFinancialSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const metrics = [
    {
      label: 'Total Pagado',
      value: formatCurrency(resumen.monto_pagado),
      count: `${resumen.servicios_pagados} servicios`,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Pendiente de Pago',
      value: formatCurrency(resumen.monto_pendiente),
      count: `${resumen.servicios_pendientes} servicios`,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'En Proceso',
      value: formatCurrency(resumen.monto_en_proceso),
      count: `${resumen.servicios_en_proceso} servicios`,
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Total General',
      value: formatCurrency(resumen.monto_total),
      count: `${resumen.total_servicios} servicios`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-2xl font-bold mb-1">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.count}</p>
              </div>
              <div className={`${metric.bgColor} ${metric.color} p-3 rounded-lg`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
