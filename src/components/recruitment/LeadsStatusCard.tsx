import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

interface CompactLeadMetrics {
  nuevos: number;
  en_proceso: number;
  aprobados: number;
}

const LeadsStatusCard: React.FC = () => {
  const { data: metrics, isLoading, error } = useAuthenticatedQuery(
    ['compact-leads-status'],
    async (): Promise<CompactLeadMetrics> => {
      const { data: candidatos, error: candidatosError } = await supabase
        .from('candidatos_custodios')
        .select('estado_proceso');

      if (candidatosError) throw candidatosError;

      const metrics: CompactLeadMetrics = {
        nuevos: 0,
        en_proceso: 0,
        aprobados: 0
      };

      if (candidatos) {
        candidatos.forEach(candidato => {
          switch (candidato.estado_proceso) {
            case 'lead':
              metrics.nuevos++;
              break;
            case 'contacto_inicial':
            case 'evaluacion':
              metrics.en_proceso++;
              break;
            case 'aprobado':
              metrics.aprobados++;
              break;
            // Ignoramos rechazados y otros estados para esta vista simplificada
          }
        });
      }

      return metrics;
    }
  );

  if (isLoading) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Estados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Estados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Error al cargar datos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Estados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Nuevos:</span>
          <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {metrics.nuevos}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">En proceso:</span>
          <span className="text-sm font-medium bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
            {metrics.en_proceso}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Aprobados:</span>
          <span className="text-sm font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
            {metrics.aprobados}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsStatusCard;