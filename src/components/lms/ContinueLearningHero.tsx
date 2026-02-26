import { useNavigate } from "react-router-dom";
import { PlayCircle, AlertTriangle, Clock, ChevronRight, PartyPopper, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLMSCursosDisponibles } from "@/hooks/useLMSCursos";
import { cn } from "@/lib/utils";
import type { CursoDisponible } from "@/types/lms";

function getPriorityCourse(cursos: CursoDisponible[]): CursoDisponible | null {
  const enrolled = cursos.filter(c => c.inscripcion_id || c.es_obligatorio);
  if (enrolled.length === 0) return null;

  // Priority: vencido > en_progreso with deadline > en_progreso > inscrito obligatorio
  const scored = enrolled
    .filter(c => c.inscripcion_estado !== 'completado')
    .map(c => {
      let score = 0;
      if (c.inscripcion_estado === 'vencido') score = 1000;
      else if (c.inscripcion_estado === 'en_progreso' && c.inscripcion_fecha_limite) score = 500;
      else if (c.inscripcion_estado === 'en_progreso') score = 400;
      else if (c.es_obligatorio && !c.inscripcion_id) score = 300;
      else if (c.inscripcion_estado === 'inscrito') score = 200;
      return { curso: c, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.curso || null;
}

function estimateRemainingMinutes(curso: CursoDisponible): number {
  const progress = curso.inscripcion_progreso || 0;
  const total = curso.duracion_estimada_min || 0;
  return Math.max(0, Math.round(total * (1 - progress / 100)));
}

export function ContinueLearningHero() {
  const navigate = useNavigate();
  const { data: cursos, isLoading } = useLMSCursosDisponibles();

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-6 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded mb-4" />
        <div className="h-6 w-72 bg-muted rounded mb-4" />
        <div className="h-3 w-full bg-muted rounded mb-6" />
        <div className="h-10 w-40 bg-muted rounded" />
      </div>
    );
  }

  if (!cursos) return null;

  const nextCourse = getPriorityCourse(cursos);
  const allCompleted = cursos.filter(c => c.inscripcion_id || c.es_obligatorio)
    .every(c => c.inscripcion_estado === 'completado');

  // All done celebration
  if (!nextCourse && allCompleted && cursos.some(c => c.inscripcion_estado === 'completado')) {
    return (
      <div className="rounded-2xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 p-6 text-center">
        <PartyPopper className="h-10 w-10 mx-auto text-green-600 dark:text-green-400 mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">¡Felicidades! Has completado todos tus cursos</h3>
        <p className="text-sm text-muted-foreground mb-4">Explora el catálogo para seguir aprendiendo</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/lms')}>
          <BookOpen className="h-4 w-4 mr-2" />
          Ver catálogo
        </Button>
      </div>
    );
  }

  if (!nextCourse) return null;

  const isOverdue = nextCourse.inscripcion_estado === 'vencido';
  const progress = nextCourse.inscripcion_progreso || 0;
  const remaining = estimateRemainingMinutes(nextCourse);
  const hasStarted = progress > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 transition-all",
        isOverdue
          ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800"
          : "bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Subtitle */}
          <div className="flex items-center gap-2 mb-1">
            {isOverdue ? (
              <Badge variant="destructive" className="gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                Vencido
              </Badge>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {hasStarted ? "Continúa donde te quedaste" : "Siguiente paso"}
            </span>
          </div>

          {/* Course title */}
          <h2 className="text-xl font-bold text-foreground mb-3 truncate">
            {nextCourse.titulo}
          </h2>

          {/* Progress bar + stats */}
          <div className="space-y-2 mb-4">
            <Progress
              value={progress}
              className={cn("h-2.5", isOverdue && "[&>div]:bg-red-500")}
            />
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium">{progress}%</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                ~{remaining} min restantes
              </span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => navigate(`/lms/curso/${nextCourse.id}`)}
            className={cn(
              "gap-2",
              isOverdue
                ? "bg-red-600 hover:bg-red-700 text-white"
                : ""
            )}
          >
            <PlayCircle className="h-4 w-4" />
            {hasStarted ? "Continuar ahora" : "Comenzar"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
