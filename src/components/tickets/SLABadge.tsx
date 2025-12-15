import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertTriangle, CheckCircle, Timer, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SLAStatus, formatRemainingTime } from '@/hooks/useTicketSLA';

interface SLABadgeProps {
  status: SLAStatus;
  remainingMinutes: number | null;
  percentage: number;
  type?: 'respuesta' | 'resolucion';
  showTime?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<SLAStatus, {
  label: string;
  icon: typeof Clock;
  className: string;
  tooltipPrefix: string;
}> = {
  en_tiempo: {
    label: 'En tiempo',
    icon: Clock,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    tooltipPrefix: 'Quedan'
  },
  proximo_vencer: {
    label: 'Próximo',
    icon: Timer,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 animate-pulse',
    tooltipPrefix: 'Urgente:'
  },
  vencido: {
    label: 'Vencido',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    tooltipPrefix: 'Vencido hace'
  },
  cumplido: {
    label: 'Cumplido',
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    tooltipPrefix: 'SLA cumplido'
  },
  sin_sla: {
    label: 'Sin SLA',
    icon: HelpCircle,
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700',
    tooltipPrefix: 'Sin SLA configurado'
  }
};

export const SLABadge = ({
  status,
  remainingMinutes,
  percentage,
  type = 'resolucion',
  showTime = true,
  size = 'sm'
}: SLABadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const timeDisplay = formatRemainingTime(remainingMinutes);
  const typeLabel = type === 'respuesta' ? 'Primera respuesta' : 'Resolución';
  
  const tooltipContent = status === 'sin_sla' || status === 'cumplido'
    ? config.tooltipPrefix
    : `${config.tooltipPrefix} ${timeDisplay} para ${typeLabel.toLowerCase()}`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1 font-medium cursor-default',
              config.className,
              size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
            )}
          >
            <Icon className={cn(
              size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
            )} />
            {showTime && remainingMinutes !== null ? (
              <span>{timeDisplay}</span>
            ) : (
              <span>{config.label}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{tooltipContent}</p>
            {percentage > 0 && status !== 'cumplido' && status !== 'sin_sla' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Tiempo consumido</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      status === 'vencido' ? 'bg-red-500' :
                      status === 'proximo_vencer' ? 'bg-yellow-500' : 'bg-green-500'
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Compact badge for table cells
export const SLABadgeCompact = ({
  status,
  remainingMinutes
}: {
  status: SLAStatus;
  remainingMinutes: number | null;
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      config.className
    )}>
      <Icon className="h-3 w-3" />
      {remainingMinutes !== null ? formatRemainingTime(remainingMinutes) : config.label}
    </div>
  );
};

export default SLABadge;
