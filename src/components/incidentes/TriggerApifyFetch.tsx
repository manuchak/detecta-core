import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Zap, Globe, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
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
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
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
              step: event.step,
              query: event.query,
              status: event.status,
              found: event.found,
              inserted: event.inserted,
              dupes: event.dupes,
              error: event.error,
            };
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = newStep;
              return updated;
            }
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
        description: `Encontrados: ${finalStats.total_resultados} | Insertados: ${finalStats.insertados} | Duplicados: ${finalStats.duplicados}. El procesamiento AI continúa en background.`
      });
      queryClient.invalidateQueries({ queryKey: ['incidentes-rrss'] });
      queryClient.invalidateQueries({ queryKey: ['incidentes-stats'] });
    } catch (error: any) {
      stopTimer();
      toast({
        title: 'Error Firecrawl',
        description: error.message,
        variant: 'destructive'
      });
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
      case 'searching':
      case 'inserting':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStepLabel = (s: StepState) => {
    const shortQuery = s.query.length > 40 ? s.query.substring(0, 40) + '...' : s.query;
    switch (s.status) {
      case 'searching':
        return `Buscando "${shortQuery}"...`;
      case 'inserting':
        return `Insertando ${s.found || 0} resultados...`;
      case 'done':
        return `"${shortQuery}" — ${s.found || 0} encontrados, ${s.inserted || 0} nuevos`;
      case 'error':
        return `"${shortQuery}" — Error`;
      default:
        return `Pendiente: "${shortQuery}"`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actualizar Incidentes RRSS</CardTitle>
        <CardDescription>
          Obtén los últimos incidentes desde Apify (Twitter) y Firecrawl (Web)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => handleFetch(false)} 
            disabled={isAnyLoading}
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Fetch Último Dataset
          </Button>
          <Button 
            onClick={() => handleFetch(true)} 
            disabled={isAnyLoading}
            variant="outline"
            className="flex-1"
          >
            <Zap className="mr-2 h-4 w-4" />
            Nueva Búsqueda Apify
          </Button>
          <Button
            onClick={handleFirecrawlSearch}
            disabled={isAnyLoading}
            variant="secondary"
            className="flex-1"
          >
            <Globe className="mr-2 h-4 w-4" />
            {firecrawlLoading ? 'Buscando...' : 'Buscar en Web'}
          </Button>
        </div>

        {/* Progress Panel */}
        {(firecrawlLoading || steps.length > 0) && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progreso de búsqueda</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            <Progress value={progressValue} className="h-2" />

            <div className="space-y-1.5">
              {steps.map(s => (
                <div key={s.step} className="flex items-center gap-2 text-sm">
                  {getStepIcon(s.status)}
                  <span className="text-muted-foreground">
                    Paso {s.step}/{totalSteps}:
                  </span>
                  <span className="truncate">{getStepLabel(s)}</span>
                </div>
              ))}
              {/* Pending steps */}
              {firecrawlLoading && steps.length < totalSteps && Array.from({ length: totalSteps - steps.length }).map((_, i) => (
                <div key={`pending-${i}`} className="flex items-center gap-2 text-sm text-muted-foreground/50">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20" />
                  <span>Paso {steps.length + i + 1}/{totalSteps}: Pendiente</span>
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
              <p className="text-xs text-muted-foreground italic">
                El procesamiento AI de los incidentes continúa en background.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
