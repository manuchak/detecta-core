import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEvaluacionesMidot, useDeleteMidot, EvaluacionMidot } from '@/hooks/useEvaluacionesMidot';
import { MidotResultForm } from './MidotResultForm';
import { MidotBadge } from './MidotBadge';
import { Loader2, Plus, ShieldCheck, ExternalLink, Calendar, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserRole } from '@/hooks/useUserRole';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MidotEvaluationTabProps {
  candidatoId: string;
  candidatoNombre: string;
}

const ROLES_CON_EDICION = ['supply', 'supply_lead', 'supply_admin', 'admin', 'owner'];

export function MidotEvaluationTab({ candidatoId, candidatoNombre }: MidotEvaluationTabProps) {
  const { data: evaluaciones, isLoading } = useEvaluacionesMidot(candidatoId);
  const { primaryRole } = useUserRole();
  const [showForm, setShowForm] = useState(false);
  const [editingEval, setEditingEval] = useState<EvaluacionMidot | null>(null);

  const canEdit = !!primaryRole && ROLES_CON_EDICION.includes(primaryRole);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showForm || editingEval) {
    return (
      <MidotResultForm
        candidatoId={candidatoId}
        evaluacionExistente={editingEval ?? undefined}
        onSuccess={() => { setShowForm(false); setEditingEval(null); }}
      />
    );
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
        <EvaluacionMidotCard
          key={ev.id}
          evaluacion={ev}
          canEdit={canEdit}
          onEdit={() => setEditingEval(ev)}
        />
      ))}
    </div>
  );
}

function EvaluacionMidotCard({
  evaluacion,
  canEdit,
  onEdit,
}: {
  evaluacion: EvaluacionMidot;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const deleteMidot = useDeleteMidot();
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

        {canEdit && (
          <div className="flex items-center gap-2 border-t pt-2">
            <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 px-2 text-xs">
              <Pencil className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar evaluación Midot?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente esta evaluación.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMidot.mutate({
                      id: evaluacion.id,
                      candidato_id: evaluacion.candidato_id,
                    })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMidot.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
