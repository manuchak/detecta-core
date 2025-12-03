import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useUpdateAvalPsicometrico } from '@/hooks/useEvaluacionesPsicometricas';
import type { EvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  evaluation: EvaluacionPsicometrica;
}

export function AvalCoordinacionPanel({ evaluation }: Props) {
  const [notas, setNotas] = useState('');
  const updateAval = useUpdateAvalPsicometrico();

  const handleDecision = async (decision: 'aprobado' | 'rechazado') => {
    await updateAval.mutateAsync({
      evaluacionId: evaluation.id,
      decision,
      notas: notas || undefined,
    });
  };

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
          Aval de Coordinación Requerido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Resultado Ámbar (Score: {evaluation.score_global.toFixed(1)})</AlertTitle>
          <AlertDescription>
            Este candidato obtuvo un resultado intermedio en la evaluación psicométrica. 
            Como Coordinador, debe decidir si el candidato puede continuar en el proceso.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="avalNotas">Notas de la decisión (opcional)</Label>
          <Textarea
            id="avalNotas"
            placeholder="Justificación de la decisión..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-red-500/50 text-red-600 hover:bg-red-500/10"
            onClick={() => handleDecision('rechazado')}
            disabled={updateAval.isPending}
          >
            {updateAval.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Rechazar
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleDecision('aprobado')}
            disabled={updateAval.isPending}
          >
            {updateAval.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Aprobar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
