import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Zap, Globe, Loader2, CheckCircle2, XCircle, Clock, ChevronDown, Database } from 'lucide-react';
import { firecrawlIncidentApi, type FirecrawlProgressEvent } from '@/lib/api/firecrawl';

type StepState = {
  step: number;
  query: string;
  status: 'pending' | 'searching' | 'inserting' | 'done' | 'error';
  found?: number;
  inserted?: number;
  dupes?: number;
  error?: string;
};

export const TriggerApifyFetch = () => {
  const [loading, setLoading] = useState(false);
  const [firecrawlLoading, setFirecrawlLoading] = useState(false);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [partialStats, setPartialStats] = useState({ found: 0, inserted: 0, dupes: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startTimer = useCallback(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handleFetch = async (forceRun: boolean) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('apify-data-fetcher', {
        body: { force_run: forceRun }
      });
      if (error) throw error;
      toast({
        title: '✅ Fetch completado',
        description: `Insertados: ${data.stats.insertados}, Duplicados: ${data.stats.duplicados}, Errores: ${data.stats.errores}`
      });
      queryClient.invalidateQueries({ queryKey: ['incidentes-rrss'] });
      queryClient.invalidateQueries({ queryKey: ['incidentes-stats'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFirecrawlSearch = async () => {
    setFirecrawlLoading(true);
    setSteps([]);
    setPartialStats({ found: 0, inserted: 0, dupes: 0 });
    startTimer();
    try {
      const finalStats = await firecrawlIncidentApi.searchIncidentsWithProgress(
        'qdr:w',
        (event: FirecrawlProgressEvent) => {
          setSteps(prev => {
            const existing = prev.findIndex(s => s.step === event.step);
            const newStep: StepState = {
              step: event.step, query: event.query, status: event.status,
              found: event.found, inserted: event.inserted, dupes: event.dupes, error: event.error,
            };
            if (existing >= 0) { const updated = [...prev]; updated[existing] = newStep; return updated; }
            return [...prev, newStep];
          });
          if (event.status === 'done' && event.found !== undefined) {
            setPartialStats(prev => ({
              found: prev.found + (event.found || 0),
              inserted: prev.inserted + (event.inserted || 0),
              dupes: prev.dupes + (event.dupes || 0),
            }));
          }
        }
      );
      stopTimer();
      toast({
        title: '✅ Búsqueda Web completada',
        description: `Encontrados: ${finalStats.total_resultados} | Insertados: ${finalStats.insertados} | Duplicados: ${finalStats.duplicados}`
      });
      queryClient.invalidateQueries({ queryKey: ['incidentes-rrss'] });
      queryClient.invalidateQueries({ queryKey: ['incidentes-stats'] });
    } catch (error: any) {
      stopTimer();
      toast({ title: 'Error Firecrawl', description: error.message, variant: 'destructive' });
    } finally {
      setFirecrawlLoading(false);
    }
  };

  const isAnyLoading = loading || firecrawlLoading;
  const completedSteps = steps.filter(s => s.status === 'done' || s.status === 'error').length;
  const totalSteps = steps.length > 0 ? (steps[0] as any).total_steps || 4 : 4;
  const progressValue = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getStepIcon = (status: StepState['status']) => {
    switch (status) {
      case 'searching': case 'inserting': return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
      case 'done': return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStepLabel = (s: StepState) => {
    const shortQuery = s.query.length > 35 ? s.query.substring(0, 35) + '...' : s.query;
    switch (s.status) {
      case 'searching': return `Buscando "${shortQuery}"...`;
      case 'inserting': return `Insertando ${s.found || 0} resultados...`;
      case 'done': return `"${shortQuery}" — ${s.found || 0} → ${s.inserted || 0} nuevos`;
      case 'error': return `"${shortQuery}" — Error`;
      default: return `Pendiente: "${shortQuery}"`;
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={isAnyLoading} className="gap-2">
            {isAnyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Fuentes
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-2">
          <div className="space-y-1">
            <button
              onClick={() => handleFetch(false)}
              disabled={isAnyLoading}
              className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Último Dataset</div>
                <div className="text-xs text-muted-foreground">Apify cache</div>
              </div>
            </button>
            <button
              onClick={() => handleFetch(true)}
              disabled={isAnyLoading}
              className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
            >
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Nueva Búsqueda</div>
                <div className="text-xs text-muted-foreground">Apify run</div>
              </div>
            </button>
            <div className="border-t my-1" />
            <button
              onClick={handleFirecrawlSearch}
              disabled={isAnyLoading}
              className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
            >
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Buscar en Web</div>
                <div className="text-xs text-muted-foreground">Firecrawl</div>
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Firecrawl Progress Banner - renders below header when active */}
      {(firecrawlLoading || steps.length > 0) && (
        <FirecrawlProgressBanner
          steps={steps}
          firecrawlLoading={firecrawlLoading}
          completedSteps={completedSteps}
          totalSteps={totalSteps}
          progressValue={progressValue}
          elapsedSeconds={elapsedSeconds}
          partialStats={partialStats}
          formatTime={formatTime}
          getStepIcon={getStepIcon}
          getStepLabel={getStepLabel}
        />
      )}
    </>
  );
};

/** Inline progress banner shown below the header during Firecrawl scraping */
function FirecrawlProgressBanner({
  steps, firecrawlLoading, completedSteps, totalSteps, progressValue,
  elapsedSeconds, partialStats, formatTime, getStepIcon, getStepLabel,
}: {
  steps: StepState[];
  firecrawlLoading: boolean;
  completedSteps: number;
  totalSteps: number;
  progressValue: number;
  elapsedSeconds: number;
  partialStats: { found: number; inserted: number; dupes: number };
  formatTime: (s: number) => string;
  getStepIcon: (status: StepState['status']) => React.ReactNode;
  getStepLabel: (s: StepState) => string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Búsqueda Web en progreso</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(elapsedSeconds)}
        </span>
      </div>
      <Progress value={progressValue} className="h-1.5" />
      <div className="space-y-1">
        {steps.map(s => (
          <div key={s.step} className="flex items-center gap-2 text-xs">
            {getStepIcon(s.status)}
            <span className="text-muted-foreground">{s.step}/{totalSteps}:</span>
            <span className="truncate">{getStepLabel(s)}</span>
          </div>
        ))}
      </div>
      {(partialStats.found > 0 || completedSteps > 0) && (
        <div className="flex gap-4 text-xs text-muted-foreground border-t pt-2">
          <span>Encontrados: <strong className="text-foreground">{partialStats.found}</strong></span>
          <span>Insertados: <strong className="text-foreground">{partialStats.inserted}</strong></span>
          <span>Duplicados: <strong className="text-foreground">{partialStats.dupes}</strong></span>
        </div>
      )}
      {!firecrawlLoading && steps.length > 0 && (
        <p className="text-xs text-muted-foreground italic">Procesamiento AI continúa en background.</p>
      )}
    </div>
  );
}
