import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, User, AlertTriangle, FileText } from 'lucide-react';
import { SemaforoBadge } from './SemaforoBadge';
import { SIERCPReportDialog } from './SIERCPReportDialog';
import type { EvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  evaluation: EvaluacionPsicometrica;
  isLatest?: boolean;
  candidateName?: string;
}

const moduleLabels: Record<string, string> = {
  score_integridad: 'Integridad',
  score_psicopatia: 'Psicopatía',
  score_violencia: 'Violencia',
  score_agresividad: 'Agresividad',
  score_afrontamiento: 'Afrontamiento',
  score_veracidad: 'Veracidad',
  score_entrevista: 'Entrevista',
};

export function PsychometricResultCard({ evaluation, isLatest, candidateName }: Props) {
  const [reportOpen, setReportOpen] = useState(false);
  const modules = [
    { key: 'score_integridad', value: evaluation.score_integridad },
    { key: 'score_psicopatia', value: evaluation.score_psicopatia },
    { key: 'score_violencia', value: evaluation.score_violencia },
    { key: 'score_agresividad', value: evaluation.score_agresividad },
    { key: 'score_afrontamiento', value: evaluation.score_afrontamiento },
    { key: 'score_veracidad', value: evaluation.score_veracidad },
    { key: 'score_entrevista', value: evaluation.score_entrevista },
  ].filter(m => m.value !== null);

  return (
    <Card className={isLatest ? 'border-primary/50' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isLatest && <Badge variant="secondary">Última</Badge>}
            <Clock className="h-4 w-4" />
            {format(new Date(evaluation.fecha_evaluacion), "d MMM yyyy HH:mm", { locale: es })}
          </span>
          <SemaforoBadge 
            resultado={evaluation.resultado_semaforo} 
            score={evaluation.score_global}
            size="lg"
            avalDecision={evaluation.aval_decision}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Global */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="font-semibold">Score Global</span>
          <span className="text-2xl font-bold">{evaluation.score_global.toFixed(1)}</span>
        </div>

        {/* Scores por módulo */}
        {modules.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {modules.map(({ key, value }) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{moduleLabels[key]}</span>
                  <span className="font-medium">{value?.toFixed(0)}</span>
                </div>
                <Progress 
                  value={value || 0} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        )}

        {/* Interpretación clínica */}
        {evaluation.interpretacion_clinica && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-1">Interpretación Clínica</p>
            <p className="text-sm text-muted-foreground">{evaluation.interpretacion_clinica}</p>
          </div>
        )}

        {/* Risk flags */}
        {evaluation.risk_flags && evaluation.risk_flags.length > 0 && (
          <div className="p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Banderas de Riesgo
            </p>
            <div className="flex flex-wrap gap-1">
              {evaluation.risk_flags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-destructive border-destructive/50">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Info del aval si aplica */}
        {evaluation.resultado_semaforo === 'ambar' && evaluation.aval_decision && evaluation.aval_decision !== 'pendiente' && (
          <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
            <p className="text-sm font-medium mb-1">
              Aval de Coordinación: {evaluation.aval_decision === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}
            </p>
            {evaluation.aval_coordinacion?.display_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {evaluation.aval_coordinacion.display_name}
                {evaluation.fecha_aval && ` • ${format(new Date(evaluation.fecha_aval), "d MMM yyyy", { locale: es })}`}
              </p>
            )}
            {evaluation.aval_notas && (
              <p className="text-sm mt-2">{evaluation.aval_notas}</p>
            )}
          </div>
        )}

        {/* Generar Informe Profesional */}
        {evaluation.score_global != null && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setReportOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generar Informe Profesional
          </Button>
        )}

        {/* Evaluador */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <User className="h-3 w-3" />
          Evaluado por: {evaluation.evaluador?.display_name || 'Usuario'}
        </div>
      </CardContent>

      <SIERCPReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        evaluation={evaluation}
        candidateName={candidateName}
      />
    </Card>
  );
}
