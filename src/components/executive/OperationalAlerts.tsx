import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OperationalAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  value?: string;
  timestamp?: string;
}

interface OperationalAlertsProps {
  alerts: OperationalAlert[];
  maxAlerts?: number;
}

const alertStyles: Record<OperationalAlert['type'], { 
  icon: React.ElementType; 
  bg: string; 
  border: string;
  iconColor: string;
  titleColor: string;
}> = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
    titleColor: 'text-red-700 dark:text-red-400'
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-700 dark:text-amber-400'
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-700 dark:text-blue-400'
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-700 dark:text-emerald-400'
  }
};

const AlertItem: React.FC<{ alert: OperationalAlert }> = ({ alert }) => {
  const style = alertStyles[alert.type];
  const Icon = style.icon;

  return (
    <div 
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        style.bg,
        style.border
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', style.iconColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium truncate', style.titleColor)}>
            {alert.title}
          </p>
          {alert.value && (
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {alert.value}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {alert.description}
        </p>
      </div>
    </div>
  );
};

export const OperationalAlerts: React.FC<OperationalAlertsProps> = ({
  alerts,
  maxAlerts = 5
}) => {
  // Sort by priority: critical > warning > info > success
  const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
  const sortedAlerts = [...alerts]
    .sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
    .slice(0, maxAlerts);

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Alertas Operativas
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
                <AlertCircle className="h-3 w-3" />
                {criticalCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                {warningCount}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedAlerts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />
            <span className="text-sm">Sin alertas activas</span>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
