import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Workflow,
  AlertTriangle,
  HandCoins,
  XCircle,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useWorkflowMetrics } from '../../hooks/useCobranzaWorkflow';
import { formatCurrency } from '@/utils/formatUtils';
import { cn } from '@/lib/utils';

export function WorkflowMetricsBar() {
  const metrics = useWorkflowMetrics();

  const cards = [
    {
      label: 'Workflows Activos',
      value: metrics.totalWorkflows,
      icon: Workflow,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Críticos / Altos',
      value: metrics.workflowsCriticos,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      highlight: metrics.workflowsCriticos > 0,
    },
    {
      label: 'Promesas Pendientes',
      value: metrics.promesasPendientes,
      icon: HandCoins,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Promesas Incumplidas',
      value: metrics.promesasIncumplidas,
      icon: XCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      highlight: metrics.promesasIncumplidas > 0,
    },
    {
      label: 'Monto en Riesgo (+30d)',
      value: formatCurrency(metrics.montoEnRiesgo),
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      isAmount: true,
    },
    {
      label: 'Acciones Hoy',
      value: metrics.accionesHoy,
      icon: Calendar,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={cn(
            'p-3 border transition-colors',
            card.highlight && 'border-red-500/50 animate-pulse'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('p-1.5 rounded-md', card.bgColor)}>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {card.label}
            </span>
          </div>
          <p className={cn(
            'text-xl font-bold',
            card.color,
            card.isAmount && 'text-lg'
          )}>
            {card.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
