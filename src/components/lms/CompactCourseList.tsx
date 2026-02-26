import { useNavigate } from "react-router-dom";
import { PlayCircle, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CursoDisponible } from "@/types/lms";

interface CompactCourseListProps {
  cursos: CursoDisponible[];
  title?: string;
}

export function CompactCourseList({ cursos, title = "Mis Cursos en Progreso" }: CompactCourseListProps) {
  const navigate = useNavigate();

  // Filter in-progress or enrolled courses (not completed)
  const activeCourses = cursos.filter(c =>
    c.inscripcion_id &&
    c.inscripcion_estado !== 'completado'
  );

  if (activeCourses.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {title} ({activeCourses.length})
      </h3>
      <div className="rounded-xl border bg-card divide-y divide-border">
        {activeCourses.map((curso) => {
          const progress = curso.inscripcion_progreso || 0;
          const remaining = Math.max(0, Math.round((curso.duracion_estimada_min || 0) * (1 - progress / 100)));
          const isOverdue = curso.inscripcion_estado === 'vencido';

          return (
            <div
              key={curso.id}
              className={cn(
                "flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",
                isOverdue && "bg-red-50/50 dark:bg-red-950/10"
              )}
              onClick={() => navigate(`/lms/curso/${curso.id}`)}
            >
              {/* Thumbnail or icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                isOverdue
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-primary/10"
              )}>
                {isOverdue ? (
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                ) : (
                  <PlayCircle className="h-5 w-5 text-primary" />
                )}
              </div>

              {/* Title + progress */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{curso.titulo}</span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs shrink-0">Vencido</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={progress} className={cn("h-1.5 flex-1", isOverdue && "[&>div]:bg-red-500")} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap w-10 text-right">{progress}%</span>
                </div>
              </div>

              {/* Time estimate */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3.5 w-3.5" />
                {remaining}m
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
