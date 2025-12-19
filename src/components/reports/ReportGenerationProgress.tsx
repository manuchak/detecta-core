import React from 'react';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ModuleProgress } from '@/hooks/useHistoricalReportData';

interface ReportGenerationProgressProps {
  progress: ModuleProgress[];
  completedCount: number;
  totalCount: number;
  error?: string | null;
}

export function ReportGenerationProgress({
  progress,
  completedCount,
  totalCount,
  error,
}: ReportGenerationProgressProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const currentModule = progress.find(p => p.status === 'loading');

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          {error ? 'Error en generación' : 'Generando Informe...'}
        </h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{totalCount} módulos
        </span>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <>
          <Progress value={percentage} className="h-2" />
          
          {currentModule && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Procesando: {currentModule.label}
            </p>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        {progress.map((item) => (
          <div
            key={item.module}
            className={cn(
              'flex items-center gap-2 text-sm py-1.5 px-2 rounded',
              item.status === 'done' && 'text-green-600 bg-green-50 dark:bg-green-950/30',
              item.status === 'loading' && 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
              item.status === 'pending' && 'text-muted-foreground',
              item.status === 'error' && 'text-destructive bg-destructive/10'
            )}
          >
            {item.status === 'done' && <Check className="h-3.5 w-3.5" />}
            {item.status === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {item.status === 'pending' && <Circle className="h-3.5 w-3.5" />}
            {item.status === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {!error && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Tiempo estimado: ~{Math.max(5, (totalCount - completedCount) * 3)} segundos
        </p>
      )}
    </div>
  );
}
