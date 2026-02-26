import { Flame, Star, Award, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLMSCursosDisponibles } from "@/hooks/useLMSCursos";
import { useLMSGamificacion, puntosParaSiguienteNivel } from "@/hooks/useLMSGamificacion";

export function ProgressMotivationalBar() {
  const { data: cursos } = useLMSCursosDisponibles();
  const { data: gamificacion } = useLMSGamificacion();

  const enrolled = cursos?.filter(c => c.inscripcion_id || c.es_obligatorio) || [];
  const completed = enrolled.filter(c => c.inscripcion_estado === 'completado').length;
  const total = enrolled.length;
  const globalPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Estimate total hours from durations
  const totalMinutes = enrolled.reduce((sum, c) => sum + (c.duracion_estimada_min || 0), 0);
  const completedMinutes = enrolled
    .filter(c => c.inscripcion_estado === 'completado')
    .reduce((sum, c) => sum + (c.duracion_estimada_min || 0), 0);
  const hoursLearned = Math.round(completedMinutes / 60 * 10) / 10;

  const perfil = gamificacion?.perfil;
  const puntos = perfil?.puntos_totales || 0;
  const racha = perfil?.racha_actual || 0;
  const nivel = perfil?.nivel || 1;
  const nextLevelPts = puntosParaSiguienteNivel(nivel);
  const ptsToNext = Math.max(0, nextLevelPts - puntos);

  if (total === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      {/* Global progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tu Progreso
          </h3>
          <span className="text-sm text-muted-foreground">
            {completed}/{total} cursos · {hoursLearned} hrs
          </span>
        </div>
        <Progress value={globalPercent} className="h-2.5" />
        <p className="text-xs text-muted-foreground mt-1">{globalPercent}% completado</p>
      </div>

      {/* Gamification stats */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {racha > 0 && (
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <Flame className="h-4 w-4" />
            <span className="font-medium">Racha: {racha} {racha === 1 ? 'día' : 'días'}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
          <Star className="h-4 w-4" />
          <span className="font-medium">{puntos} pts</span>
        </div>
        {ptsToNext < Infinity && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>{ptsToNext} pts para nivel {nivel + 1}</span>
          </div>
        )}
      </div>
    </div>
  );
}
