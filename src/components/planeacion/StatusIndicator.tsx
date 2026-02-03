import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'critical' | 'warning' | 'info' | 'success';
  size?: 'sm' | 'md';
  pulse?: boolean;
  label?: string;
  className?: string;
}

const statusConfig = {
  critical: {
    dot: 'bg-destructive',
    text: 'text-destructive',
    bg: 'bg-destructive/10'
  },
  warning: {
    dot: 'bg-warning',
    text: 'text-warning',
    bg: 'bg-warning/10'
  },
  info: {
    dot: 'bg-chart-1',
    text: 'text-chart-1',
    bg: 'bg-chart-1/10'
  },
  success: {
    dot: 'bg-success',
    text: 'text-success',
    bg: 'bg-success/10'
  }
} as const;

export function StatusIndicator({ 
  status, 
  size = 'sm', 
  pulse = false,
  label,
  className 
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn(
        dotSize,
        'rounded-full flex-shrink-0',
        config.dot,
        pulse && 'animate-pulse'
      )} />
      {label && (
        <span className={cn(
          'text-xs font-medium',
          config.text
        )}>
          {label}
        </span>
      )}
    </div>
  );
}
