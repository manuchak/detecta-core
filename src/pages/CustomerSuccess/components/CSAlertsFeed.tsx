import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCSAlerts, type CSAlert, type AlertLevel } from '@/hooks/useCSAlerts';
import { AlertTriangle, Clock, TrendingDown, Shield, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LEVEL_STYLES: Record<AlertLevel, string> = {
  critico: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
  warning: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
  info: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
};

const LEVEL_BADGE: Record<AlertLevel, { variant: 'destructive' | 'outline' | 'secondary'; label: string }> = {
  critico: { variant: 'destructive', label: 'Crítico' },
  warning: { variant: 'outline', label: 'Warning' },
  info: { variant: 'secondary', label: 'Info' },
};

const TYPE_ICON: Record<string, React.ElementType> = {
  sla_riesgo: Clock,
  inactividad: AlertTriangle,
  caida_gmv: TrendingDown,
  capa_vencida: Shield,
  sin_contacto_30d: Bell,
};

interface Props {
  onClienteClick?: (clienteId: string) => void;
  maxItems?: number;
}

export function CSAlertsFeed({ onClienteClick, maxItems = 8 }: Props) {
  const { data: alerts, isLoading } = useCSAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas Proactivas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = (alerts || []).slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Alertas Proactivas
          </CardTitle>
          {alerts && alerts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {alerts.length} alerta{alerts.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">SLA, inactividad y CAPAs que requieren atención</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            ✓ Sin alertas activas
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(alert => {
              const Icon = TYPE_ICON[alert.type] || Bell;
              const badge = LEVEL_BADGE[alert.level];
              return (
                <button
                  key={alert.id}
                  onClick={() => alert.clienteId && onClienteClick?.(alert.clienteId)}
                  className={`flex items-start gap-3 w-full p-3 rounded-lg border-l-4 text-left transition-colors hover:opacity-80 ${LEVEL_STYLES[alert.level]}`}
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{alert.title}</span>
                      <Badge variant={badge.variant} className="text-[10px] shrink-0">{badge.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
