import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Zap } from 'lucide-react';

export const TriggerApifyFetch = () => {
  const [loading, setLoading] = useState(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actualizar Incidentes RRSS</CardTitle>
        <CardDescription>
          Obtén los últimos incidentes de transporte de carga desde Apify
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button 
          onClick={() => handleFetch(false)} 
          disabled={loading}
          className="flex-1"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Fetch Último Dataset
        </Button>
        <Button 
          onClick={() => handleFetch(true)} 
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          <Zap className="mr-2 h-4 w-4" />
          Ejecutar Nueva Búsqueda
        </Button>
      </CardContent>
    </Card>
  );
};
