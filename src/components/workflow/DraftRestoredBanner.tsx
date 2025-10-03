import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';
import { useState } from 'react';

interface DraftRestoredBannerProps {
  timeSinceSave: string;
  onDismiss: () => void;
  onStartFresh: () => void;
}

export function DraftRestoredBanner({ timeSinceSave, onDismiss, onStartFresh }: DraftRestoredBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Continuando desde tu sesión anterior</span>
            <span className="text-blue-600 dark:text-blue-400 ml-2">• Guardado {timeSinceSave}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartFresh}
            className="h-8 text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900"
          >
            Empezar de nuevo
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-900"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
