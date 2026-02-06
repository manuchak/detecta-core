import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw, X, FileText, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DraftAutoRestorePromptProps {
  /** Whether to show the prompt */
  visible: boolean;
  /** When the draft was last saved */
  savedAt: Date | null;
  /** Optional preview text to show context */
  previewText?: string;
  /** Name of the module/form for display */
  moduleName: string;
  /** Called when user wants to restore the draft */
  onRestore: () => void;
  /** Called when user wants to discard the draft */
  onDiscard: () => void;
  /** Called when user dismisses the prompt without action */
  onDismiss: () => void;
  /** Optional className for positioning override */
  className?: string;
  /** Position variant */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-bottom';
}

/**
 * A toast-like prompt that appears when an orphan draft is detected.
 * Allows users to restore, discard, or dismiss the draft.
 * 
 * Usage:
 * ```tsx
 * <DraftAutoRestorePrompt
 *   visible={showRestorePrompt}
 *   savedAt={lastSaved}
 *   previewText={previewText}
 *   moduleName={moduleName}
 *   onRestore={acceptRestore}
 *   onDiscard={rejectRestore}
 *   onDismiss={dismissRestorePrompt}
 * />
 * ```
 */
export function DraftAutoRestorePrompt({
  visible,
  savedAt,
  previewText,
  moduleName,
  onRestore,
  onDiscard,
  onDismiss,
  className,
  position = 'bottom-right',
}: DraftAutoRestorePromptProps) {
  if (!visible) return null;

  const timeAgo = savedAt
    ? formatDistanceToNow(savedAt, { addSuffix: true, locale: es })
    : 'hace un momento';

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'center-bottom': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div 
      className={cn(
        'fixed z-50 animate-in slide-in-from-bottom-4 fade-in duration-300',
        positionClasses[position],
        className
      )}
      role="alertdialog"
      aria-labelledby="draft-prompt-title"
      aria-describedby="draft-prompt-description"
    >
      <Card className="w-80 shadow-lg border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle 
              id="draft-prompt-title"
              className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200"
            >
              <FileText className="h-4 w-4" />
              {moduleName}
            </CardTitle>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onDismiss}
              className="h-6 w-6 text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
              aria-label="Cerrar"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p 
            id="draft-prompt-description"
            className="text-xs text-amber-700 dark:text-amber-300"
          >
            Tienes un borrador sin terminar guardado <strong>{timeAgo}</strong>
          </p>
          
          {previewText && (
            <p className="text-xs text-muted-foreground truncate italic border-l-2 border-amber-300 pl-2">
              "{previewText}"
            </p>
          )}
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={onRestore}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restaurar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onDiscard}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Descartar
            </Button>
          </div>
          
          <p className="text-[10px] text-muted-foreground text-center">
            El borrador se eliminará automáticamente en 24h
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inline variant for embedding in forms/dialogs
 */
export function DraftRestoreBanner({
  visible,
  savedAt,
  previewText,
  onRestore,
  onDiscard,
}: Omit<DraftAutoRestorePromptProps, 'moduleName' | 'onDismiss' | 'position' | 'className'>) {
  if (!visible) return null;

  const timeAgo = savedAt
    ? formatDistanceToNow(savedAt, { addSuffix: true, locale: es })
    : 'hace un momento';

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 mb-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Borrador encontrado
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
            Guardado {timeAgo}
          </p>
          {previewText && (
            <p className="text-xs text-muted-foreground truncate mt-1 italic">
              "{previewText}"
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onDiscard}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
          >
            Descartar
          </Button>
          <Button 
            size="sm" 
            onClick={onRestore}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Restaurar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DraftAutoRestorePrompt;
