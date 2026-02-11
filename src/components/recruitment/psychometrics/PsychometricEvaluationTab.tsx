import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Plus, Clock, User } from 'lucide-react';
import { useEvaluacionesPsicometricas } from '@/hooks/useEvaluacionesPsicometricas';
import { SemaforoBadge } from './SemaforoBadge';
import { PsychometricResultCard } from './PsychometricResultCard';
import { ApplySIERCPDialog } from './ApplySIERCPDialog';
import { AvalCoordinacionPanel } from './AvalCoordinacionPanel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
}

export function PsychometricEvaluationTab({ candidatoId, candidatoNombre }: Props) {
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const { data: evaluaciones, isLoading } = useEvaluacionesPsicometricas(candidatoId);
  const { userRole } = useAuth();
  
  const isCoordinador = userRole === 'coordinador_operaciones' || userRole === 'admin' || userRole === 'owner';
  const latestEval = evaluaciones?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Evaluaciones Psicométricas (SIERCP)
        </h3>
        <Button onClick={() => setShowApplyDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Aplicar SIERCP
        </Button>
      </div>

      {!evaluaciones || evaluaciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay evaluaciones psicométricas registradas</p>
            <p className="text-sm mt-2">
              Aplique el test SIERCP para evaluar al candidato
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowApplyDialog(true)}
            >
              Aplicar Primera Evaluación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Última evaluación destacada */}
          {latestEval && (
            <PsychometricResultCard evaluation={latestEval} isLatest candidateName={candidatoNombre} />
          )}

          {/* Panel de aval si es coordinador y hay evaluación ámbar pendiente */}
          {isCoordinador && latestEval?.resultado_semaforo === 'ambar' && latestEval?.aval_decision === 'pendiente' && (
            <AvalCoordinacionPanel evaluation={latestEval} />
          )}

          {/* Historial si hay más de una */}
          {evaluaciones.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Historial de Evaluaciones</h4>
              {evaluaciones.slice(1).map((eval_) => (
                <Card key={eval_.id} className="opacity-75">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(eval_.fecha_evaluacion), "d MMM yyyy HH:mm", { locale: es })}
                      </span>
                      <div className="flex items-center gap-2">
                        <SemaforoBadge 
                          resultado={eval_.resultado_semaforo} 
                          score={eval_.score_global}
                          showScore
                          avalDecision={eval_.aval_decision}
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <ApplySIERCPDialog
        isOpen={showApplyDialog}
        onClose={() => setShowApplyDialog(false)}
        candidatoId={candidatoId}
        candidatoNombre={candidatoNombre}
      />
    </div>
  );
}
