import { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';

interface DataFreshnessIndicatorProps {
  isLoading?: boolean;
  lastRefetch?: Date;
}

export function DataFreshnessIndicator({ isLoading, lastRefetch }: DataFreshnessIndicatorProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastRefetch) return;
    
    const updateAge = () => {
      const diff = Math.floor((Date.now() - lastRefetch.getTime()) / 1000);
      setSecondsAgo(diff);
    };
    
    updateAge();
    const interval = setInterval(updateAge, 1000);
    return () => clearInterval(interval);
  }, [lastRefetch]);

  const getDisplayText = () => {
    if (isLoading) return 'Actualizando...';
    if (secondsAgo < 5) return 'Datos en vivo';
    if (secondsAgo < 60) return `hace ${secondsAgo}s`;
    if (secondsAgo < 3600) return `hace ${Math.floor(secondsAgo / 60)}m`;
    return `hace ${Math.floor(secondsAgo / 3600)}h`;
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Circle 
        className={`h-2 w-2 ${
          isLoading 
            ? 'text-warning animate-pulse fill-warning' 
            : secondsAgo < 30 
              ? 'text-success fill-success' 
              : 'text-muted-foreground fill-muted-foreground'
        }`} 
      />
      <span>{getDisplayText()}</span>
    </div>
  );
}
