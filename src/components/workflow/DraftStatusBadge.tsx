import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DraftStatusBadgeProps {
  lastSaved: Date | null;
  getTimeSinceSave: () => string;
  hasDraft: boolean;
}

export function DraftStatusBadge({ lastSaved, getTimeSinceSave, hasDraft }: DraftStatusBadgeProps) {
  const [timeSince, setTimeSince] = useState(getTimeSinceSave());
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSince(getTimeSinceSave());
    }, 5000);

    return () => clearInterval(interval);
  }, [getTimeSinceSave]);

  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  if (!hasDraft) return null;

  const formattedTime = lastSaved 
    ? new Date(lastSaved).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`
              transition-all duration-300 gap-1.5
              ${showSaved ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : ''}
            `}
          >
            {showSaved ? (
              <>
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">Guardado</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>Borrador guardado {timeSince}</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm font-medium">Borrador activo</p>
          <p className="text-xs text-muted-foreground mt-1">
            Último guardado: {formattedTime}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tus cambios se guardan automáticamente cada 10 segundos
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
