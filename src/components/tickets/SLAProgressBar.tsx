import { cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface SLAProgressBarProps {
  status: 'en_tiempo' | 'proximo_vencer' | 'vencido' | 'cumplido' | 'sin_sla';
  percentage: number;
  remainingMinutes: number;
  compact?: boolean;
}

const formatTime = (minutes: number): string => {
  if (minutes <= 0) return 'Vencido';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const statusConfig = {
  en_tiempo: {
    icon: Clock,
    label: 'En tiempo',
    barColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-400'
  },
  proximo_vencer: {
    icon: AlertTriangle,
    label: 'Próximo a vencer',
    barColor: 'bg-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-400'
  },
  vencido: {
    icon: AlertTriangle,
    label: 'Vencido',
    barColor: 'bg-red-500',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-400'
  },
  cumplido: {
    icon: CheckCircle,
    label: 'Cumplido',
    barColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-400'
  },
  sin_sla: {
    icon: Clock,
    label: 'Sin SLA',
    barColor: 'bg-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/30',
    textColor: 'text-gray-500 dark:text-gray-400'
  }
};

export const SLAProgressBar = ({ 
  status, 
  percentage, 
  remainingMinutes,
  compact = false 
}: SLAProgressBarProps) => {
  const config = statusConfig[status] || statusConfig.sin_sla;
  const Icon = config.icon;
  const displayPercentage = Math.min(100, Math.max(0, percentage));
  
  if (status === 'sin_sla') {
    return (
      <span className="text-xs text-muted-foreground">-</span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2",
            compact ? "w-24" : "w-32"
          )}>
            <div className={cn(
              "flex-1 h-2 rounded-full overflow-hidden",
              config.bgColor
            )}>
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  config.barColor,
                  status === 'vencido' && "animate-pulse"
                )}
                style={{ width: `${displayPercentage}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-medium tabular-nums whitespace-nowrap",
              config.textColor
            )}>
              {formatTime(remainingMinutes)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="flex items-center gap-2">
          <Icon className={cn("h-3.5 w-3.5", config.textColor)} />
          <span>{config.label}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium">{displayPercentage.toFixed(0)}% consumido</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SLAProgressBar;
