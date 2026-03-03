import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SemaforoBadgeProps {
  resultado: string | null; // Acepta cualquier string para detectar valores inesperados
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  avalDecision?: 'aprobado' | 'rechazado' | 'pendiente' | null;
}

const semaforoConfig = {
  verde: {
    label: 'Aprobado',
    description: 'Score ≥70 - Candidato apto',
    className: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400',
    dot: 'bg-green-500',
  },
  ambar: {
    label: 'Revisión',
    description: 'Score 50-69 - Requiere aval de Coordinación',
    className: 'bg-amber-500/20 text-amber-700 border-amber-500/30 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  rojo: {
    label: 'No apto',
    description: 'Score <50 - Candidato no procede',
    className: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

export function SemaforoBadge({ 
  resultado, 
  score, 
  showScore = false, 
  size = 'md',
  avalDecision 
}: SemaforoBadgeProps) {
  if (!resultado) return null;

  // Fallback: si el valor no es un enum válido, mostrar warning visible
  const validValues: Array<'verde' | 'ambar' | 'rojo'> = ['verde', 'ambar', 'rojo'];
  if (!validValues.includes(resultado as any)) {
    console.warn(`[SemaforoBadge] Valor inesperado de resultado_semaforo: "${resultado}"`);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1.5 font-medium bg-gray-500/20 text-gray-700 border-gray-500/30 dark:text-gray-400">
              <span className="rounded-full bg-gray-500 h-2 w-2" />
              ⚠ {String(resultado)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm font-semibold text-destructive">Valor no reconocido: "{String(resultado)}"</p>
            <p className="text-xs text-muted-foreground">Contacte soporte técnico</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const config = semaforoConfig[resultado];
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  // Si es ámbar y tiene aval, mostrar el estado del aval
  let displayLabel = config.label;
  let displayClassName = config.className;
  
  if (resultado === 'ambar' && avalDecision) {
    if (avalDecision === 'aprobado') {
      displayLabel = 'Aprobado (Aval)';
      displayClassName = 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400';
    } else if (avalDecision === 'rechazado') {
      displayLabel = 'Rechazado';
      displayClassName = 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400';
    } else {
      displayLabel = 'Pendiente Aval';
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              'gap-1.5 font-medium',
              displayClassName,
              sizeClasses[size]
            )}
          >
            <span className={cn('rounded-full', config.dot, dotSizes[size])} />
            {showScore && score !== undefined ? `${score.toFixed(0)}` : displayLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">{config.label}</p>
            <p className="text-muted-foreground">{config.description}</p>
            {score !== undefined && (
              <p className="mt-1">Score: {score.toFixed(1)}</p>
            )}
            {resultado === 'ambar' && avalDecision && (
              <p className="mt-1">
                Aval: {avalDecision === 'aprobado' ? '✅ Aprobado' : 
                       avalDecision === 'rechazado' ? '❌ Rechazado' : 
                       '⏳ Pendiente'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
