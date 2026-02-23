import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Zap, Globe } from 'lucide-react';
import { firecrawlIncidentApi } from '@/lib/api/firecrawl';

export const TriggerApifyFetch = () => {
  const [loading, setLoading] = useState(false);
  const [firecrawlLoading, setFirecrawlLoading] = useState(false);
  const { toast } = useToast();

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
    try {
      const result = await firecrawlIncidentApi.searchIncidents('qdr:w');

      if (!result.success) {
        throw new Error(result.error || 'Error en búsqueda Firecrawl');
      }

      toast({
        title: '✅ Búsqueda Web completada',
        description: `Resultados: ${result.stats?.total_resultados}, Insertados: ${result.stats?.insertados}, Duplicados: ${result.stats?.duplicados}`
      });
    } catch (error: any) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actualizar Incidentes RRSS</CardTitle>
        <CardDescription>
          Obtén los últimos incidentes desde Apify (Twitter) y Firecrawl (Web)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
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
      </CardContent>
    </Card>
  );
};
