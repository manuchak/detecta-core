import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  current: number;
  previous: number;
  invertColors?: boolean; // true para métricas donde menos es mejor (ej: sin asignar)
  label?: string;
}

export function TrendBadge({ 
  current, 
  previous, 
  invertColors = false,
  label = 'vs ayer'
}: TrendBadgeProps) {
  const diff = current - previous;
  
  if (diff === 0 || previous === 0) {
    return (
      <span className="inline-flex items-center text-xs text-muted-foreground">
        <Minus className="h-3 w-3 mr-0.5" />
        {label}
      </span>
    );
  }
  
  const isPositive = diff > 0;
  // Invertir colores para métricas donde menos es mejor (ej: sin asignar)
  const isGood = invertColors ? !isPositive : isPositive;
  
  return (
    <span className={`inline-flex items-center text-xs font-medium ${
      isGood 
        ? 'text-success dark:text-green-400' 
        : 'text-destructive dark:text-red-400'
    }`}>
      {isPositive ? (
        <ArrowUp className="h-3 w-3 mr-0.5" />
      ) : (
        <ArrowDown className="h-3 w-3 mr-0.5" />
      )}
      {Math.abs(diff)} {label}
    </span>
  );
}
