import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEvaluacionesMidot, EvaluacionMidot } from '@/hooks/useEvaluacionesMidot';
import { MidotResultForm } from './MidotResultForm';
import { MidotBadge } from './MidotBadge';
import { Loader2, Plus, ShieldCheck, ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MidotEvaluationTabProps {
  candidatoId: string;
  candidatoNombre: string;
}

export function MidotEvaluationTab({ candidatoId, candidatoNombre }: MidotEvaluationTabProps) {
  const { data: evaluaciones, isLoading } = useEvaluacionesMidot(candidatoId);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showForm) {
    return <MidotResultForm candidatoId={candidatoId} onSuccess={() => setShowForm(false)} />;
  }

  if (!evaluaciones || evaluaciones.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-1">No hay evaluaciones Midot registradas</p>
          <p className="text-xs text-muted-foreground mb-4">
            Midot evalúa integridad, honestidad y lealtad del candidato
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Evaluación Midot
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Evaluaciones Midot</h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nueva
        </Button>
      </div>

      {evaluaciones.map((ev) => (
        <EvaluacionMidotCard key={ev.id} evaluacion={ev} />
      ))}
    </div>
  );
}

function EvaluacionMidotCard({ evaluacion }: { evaluacion: EvaluacionMidot }) {
  const scores = [
    { label: 'Integridad', value: evaluacion.score_integridad },
    { label: 'Honestidad', value: evaluacion.score_honestidad },
    { label: 'Lealtad', value: evaluacion.score_lealtad },
  ];

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(evaluacion.fecha_evaluacion), 'd MMM yyyy', { locale: es })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tabular-nums">{evaluacion.score_global}</span>
            <MidotBadge resultado={evaluacion.resultado_semaforo} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {scores.map(s => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-muted/40">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-sm font-semibold tabular-nums">{s.value ?? '–'}</div>
            </div>
          ))}
        </div>

        {evaluacion.reporte_pdf_url && (
          <a
            href={evaluacion.reporte_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Ver reporte PDF
          </a>
        )}

        {evaluacion.notas && (
          <p className="text-xs text-muted-foreground border-t pt-2">{evaluacion.notas}</p>
        )}
      </CardContent>
    </Card>
  );
}
