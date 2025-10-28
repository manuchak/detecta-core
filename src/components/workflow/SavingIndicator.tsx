import { CheckCircle, Loader2 } from 'lucide-react';

interface SavingIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  getTimeSinceSave: () => string | null;
}

export function SavingIndicator({ isSaving, lastSaved, getTimeSinceSave }: SavingIndicatorProps) {
  const timeSince = getTimeSinceSave();
  
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-primary font-medium">Guardando...</span>
        </>
      ) : lastSaved ? (
        <>
          <CheckCircle className="h-3 w-3 text-success" />
          <span>Guardado {timeSince}</span>
        </>
      ) : null}
    </div>
  );
}
