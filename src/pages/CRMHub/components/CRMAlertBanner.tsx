import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, ChevronDown, ChevronUp, X, Gem, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertItem {
  id: string;
  type: 'stalled' | 'premium' | 'deadline' | 'critical';
  title: string;
  description: string;
  value?: string;
  count?: number;
  onClick?: () => void;
}

interface CRMAlertBannerProps {
  alerts: AlertItem[];
  onDismiss?: () => void;
}

const ALERT_CONFIG = {
  stalled: {
    icon: Clock,
    label: 'Stalled',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-500',
  },
  premium: {
    icon: Gem,
    label: 'Premium',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-500',
  },
  deadline: {
    icon: AlertTriangle,
    label: 'Deadline',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    iconColor: 'text-orange-500',
  },
  critical: {
    icon: AlertTriangle,
    label: 'Crítico',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    textColor: 'text-destructive',
    iconColor: 'text-destructive',
  },
};

export function CRMAlertBanner({ alerts, onDismiss }: CRMAlertBannerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen || alerts.length === 0) return null;

  // Group alerts by type
  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.type]) acc[alert.type] = [];
    acc[alert.type].push(alert);
    return acc;
  }, {} as Record<string, AlertItem[]>);

  // Calculate totals
  const totalCount = alerts.length;
  const totalValue = alerts.reduce((sum, a) => {
    if (a.value) {
      const numValue = parseFloat(a.value.replace(/[^0-9.]/g, ''));
      return sum + (isNaN(numValue) ? 0 : numValue);
    }
    return sum;
  }, 0);

  // Format total value
  const formattedTotalValue = totalValue >= 1000000
    ? `$${(totalValue / 1000000).toFixed(1)}M`
    : totalValue >= 1000
      ? `$${(totalValue / 1000).toFixed(0)}K`
      : `$${totalValue.toFixed(0)}`;

  // Main alert (highest priority)
  const priorityOrder: Array<AlertItem['type']> = ['critical', 'stalled', 'premium', 'deadline'];
  const mainType = priorityOrder.find(type => groupedAlerts[type]?.length > 0) || 'stalled';
  const mainConfig = ALERT_CONFIG[mainType];
  const MainIcon = mainConfig.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn('border', mainConfig.borderColor, mainConfig.bgColor)}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn('p-2 rounded-lg', mainConfig.bgColor)}>
                <MainIcon className={cn('h-5 w-5', mainConfig.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-semibold', mainConfig.textColor)}>
                    {totalCount} deal{totalCount !== 1 ? 's' : ''} requiere{totalCount === 1 ? '' : 'n'} atención
                  </span>
                  {totalValue > 0 && (
                    <Badge variant="outline" className={mainConfig.textColor}>
                      {formattedTotalValue} en riesgo
                    </Badge>
                  )}
                </div>
                {!isExpanded && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {Object.entries(groupedAlerts).map(([type, items]) => 
                      `${items.length} ${ALERT_CONFIG[type as AlertItem['type']].label.toLowerCase()}`
                    ).join(' • ')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Ver detalles
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => {
                    setIsOpen(false);
                    onDismiss();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent className="mt-4">
            <div className="space-y-3">
              {Object.entries(groupedAlerts).map(([type, items]) => {
                const config = ALERT_CONFIG[type as AlertItem['type']];
                const Icon = config.icon;
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', config.iconColor)} />
                      <span className="text-sm font-medium">{config.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                      {items.slice(0, 4).map((alert) => (
                        <button
                          key={alert.id}
                          onClick={alert.onClick}
                          className={cn(
                            'text-left p-2 rounded-md border bg-background/50 hover:bg-background transition-colors',
                            alert.onClick && 'cursor-pointer'
                          )}
                        >
                          <p className="text-sm font-medium truncate">{alert.title}</p>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground truncate">
                              {alert.description}
                            </p>
                            {alert.value && (
                              <span className={cn('text-xs font-semibold shrink-0', config.textColor)}>
                                {alert.value}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                      {items.length > 4 && (
                        <p className="text-xs text-muted-foreground col-span-full">
                          +{items.length - 4} más
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
