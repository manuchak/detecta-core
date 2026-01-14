import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, Check, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface DraftIndicatorProps {
  /** Whether a draft exists */
  hasDraft: boolean;
  
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  
  /** Last saved timestamp */
  lastSaved: Date | null;
  
  /** Function to get time since last save */
  getTimeSinceSave: () => string;
  
  /** Optional: Show restore button when draft exists */
  showRestoreButton?: boolean;
  
  /** Optional: Callback when restore is clicked */
  onRestore?: () => void;
  
  /** Optional: Variant style */
  variant?: 'badge' | 'inline' | 'minimal';
  
  /** Optional: Additional class names */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DraftIndicator({
  hasDraft,
  hasUnsavedChanges,
  lastSaved,
  getTimeSinceSave,
  showRestoreButton = false,
  onRestore,
  variant = 'badge',
  className,
}: DraftIndicatorProps) {
  const [timeSince, setTimeSince] = useState(getTimeSinceSave());
  const [showSaved, setShowSaved] = useState(false);

  // Update time since periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSince(getTimeSinceSave());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [getTimeSinceSave]);

  // Show "Saved" briefly after save
  useEffect(() => {
    if (lastSaved && !hasUnsavedChanges) {
      setShowSaved(true);
      const timeout = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [lastSaved, hasUnsavedChanges]);

  // Don't render if no draft and no unsaved changes
  if (!hasDraft && !hasUnsavedChanges) {
    return null;
  }

  // ==========================================================================
  // RENDER VARIANTS
  // ==========================================================================

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {hasUnsavedChanges ? (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        {showSaved ? (
          <>
            <Check className="h-3 w-3 text-emerald-500" />
            <span>Guardado</span>
          </>
        ) : hasUnsavedChanges ? (
          <>
            <AlertCircle className="h-3 w-3 text-amber-500" />
            <span>Sin guardar</span>
          </>
        ) : hasDraft && timeSince ? (
          <>
            <Clock className="h-3 w-3" />
            <span>Guardado {timeSince}</span>
          </>
        ) : null}
        
        {showRestoreButton && hasDraft && onRestore && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onRestore}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurar
          </Button>
        )}
      </div>
    );
  }

  // Default: badge variant
  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={hasUnsavedChanges ? 'secondary' : 'outline'}
              className={cn(
                'gap-1.5 font-normal transition-all duration-300',
                hasUnsavedChanges && 'bg-amber-500/10 text-amber-600 border-amber-200',
                showSaved && 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
              )}
            >
              {showSaved ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Guardado</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <AlertCircle className="h-3 w-3 animate-pulse" />
                  <span>Sin guardar</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span>Borrador {timeSince}</span>
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">
              {hasUnsavedChanges
                ? 'Hay cambios pendientes de guardar'
                : lastSaved
                  ? `Último guardado: ${lastSaved.toLocaleString('es-MX')}`
                  : 'Borrador guardado automáticamente'
              }
            </p>
          </TooltipContent>
        </Tooltip>

        {showRestoreButton && hasDraft && onRestore && !showSaved && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onRestore}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurar
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}

// =============================================================================
// DRAFT RESTORE BANNER
// =============================================================================

export interface DraftRestoreBannerProps {
  /** Whether a draft exists */
  hasDraft: boolean;
  
  /** Callback when restore is clicked */
  onRestore: () => void;
  
  /** Callback when dismiss is clicked */
  onDismiss: () => void;
  
  /** Time since last save */
  timeSince?: string;
  
  /** Optional class name */
  className?: string;
}

export function DraftRestoreBanner({
  hasDraft,
  onRestore,
  onDismiss,
  timeSince,
  className,
}: DraftRestoreBannerProps) {
  if (!hasDraft) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-3 rounded-lg',
        'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm text-amber-800 dark:text-amber-200">
          Tienes un borrador guardado{timeSince ? ` (${timeSince})` : ''}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          Descartar
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-7 text-xs"
          onClick={onRestore}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Restaurar
        </Button>
      </div>
    </div>
  );
}

export default DraftIndicator;
