import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, TestTube, Users, AlertTriangle, Loader2, Info } from 'lucide-react';
import { PsychometricEvaluationTab } from '@/components/recruitment/psychometrics/PsychometricEvaluationTab';
import { ToxicologyTab } from '@/components/recruitment/toxicology/ToxicologyTab';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface EvaluacionesTabProps {
  candidatoId: string | null;
  candidatoNombre: string;
}

/**
 * Hook to find evaluations by name when candidatoId is null.
 * Searches siercp_invitations by lead_nombre and evaluaciones_psicometricas via the linked invitation.
 */
function useEvaluacionesByNombre(nombre: string, enabled: boolean) {
  return useQuery({
    queryKey: ['evaluaciones-by-nombre', nombre],
    queryFn: async () => {
      const nombreUpper = nombre.trim().toUpperCase();
      
      // Search siercp_invitations by name
      const { data: invitations } = await supabase
        .from('siercp_invitations')
        .select('id, status, evaluacion_id, lead_nombre, completed_at, created_at')
        .ilike('lead_nombre', nombreUpper)
        .order('created_at', { ascending: false })
        .limit(10);

      const completedInvitations = (invitations || []).filter(
        inv => inv.status === 'completed' && inv.evaluacion_id
      );

      // Fetch linked evaluaciones_psicometricas
      let evaluaciones: any[] = [];
      if (completedInvitations.length > 0) {
        const evalIds = completedInvitations
          .map(inv => inv.evaluacion_id)
          .filter(Boolean) as string[];

        if (evalIds.length > 0) {
          const { data } = await supabase
            .from('evaluaciones_psicometricas')
            .select('*, evaluador:evaluador_id(display_name)')
            .in('id', evalIds)
            .order('created_at', { ascending: false });
          evaluaciones = data || [];
        }
      }

      return {
        invitations: invitations || [],
        evaluaciones,
        hasData: (invitations || []).length > 0 || evaluaciones.length > 0,
      };
    },
    enabled,
  });
}

export function EvaluacionesTab({ candidatoId, candidatoNombre }: EvaluacionesTabProps) {
  const [activeTab, setActiveTab] = useState('psicometrica');
  
  // Fallback: search by name when no candidatoId
  const { data: fallbackData, isLoading: loadingFallback } = useEvaluacionesByNombre(
    candidatoNombre,
    !candidatoId
  );

  // If no candidatoId but we found evaluations by name, show them
  if (!candidatoId) {
    if (loadingFallback) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Buscando evaluaciones por nombre...</p>
          </CardContent>
        </Card>
      );
    }

    if (fallbackData?.hasData) {
      return (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Evaluaciones encontradas por nombre. Este perfil no tiene un candidato vinculado formalmente.
            </AlertDescription>
          </Alert>

          {/* Show SIERCP invitations summary */}
          {fallbackData.invitations.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Invitaciones SIERCP ({fallbackData.invitations.length})
                </h3>
                <div className="space-y-2">
                  {fallbackData.invitations.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm">
                      <div>
                        <span className="font-medium">{inv.lead_nombre}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(inv.created_at).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        inv.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        inv.status === 'started' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show evaluation results */}
          {fallbackData.evaluaciones.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Resultados Psicométricos
                </h3>
                <div className="space-y-3">
                  {fallbackData.evaluaciones.map((ev: any) => (
                    <div key={ev.id} className="p-4 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Score Global: {ev.score_global?.toFixed(1)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          ev.resultado_semaforo === 'verde' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          ev.resultado_semaforo === 'ambar' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {ev.resultado_semaforo?.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>Integridad: {ev.score_integridad ?? '-'}</span>
                        <span>Violencia: {ev.score_violencia ?? '-'}</span>
                        <span>Veracidad: {ev.score_veracidad ?? '-'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ev.fecha_evaluacion).toLocaleDateString('es-MX')}
                        {ev.evaluador?.display_name && ` · ${ev.evaluador.display_name}`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    // No data found at all
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Este perfil no tiene un candidato asociado</p>
          <p className="text-sm mt-2">
            No se encontraron evaluaciones vinculadas por nombre ni por candidato
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="psicometrica" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Psicométrica</span>
        </TabsTrigger>
        <TabsTrigger value="toxicologica" className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          <span className="hidden sm:inline">Toxicológica</span>
        </TabsTrigger>
        <TabsTrigger value="referencias" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Referencias</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="psicometrica">
        <PsychometricEvaluationTab 
          candidatoId={candidatoId} 
          candidatoNombre={candidatoNombre} 
        />
      </TabsContent>

      <TabsContent value="toxicologica">
        <ToxicologyTab 
          candidatoId={candidatoId} 
          candidatoNombre={candidatoNombre} 
        />
      </TabsContent>

      <TabsContent value="referencias">
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Verificación de referencias en desarrollo</p>
            <p className="text-sm mt-2">
              Próximamente podrás ver el historial de referencias verificadas
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
