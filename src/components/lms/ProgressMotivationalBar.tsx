import { Flame, Star, Award, TrendingUp, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLMSCursosDisponibles } from "@/hooks/useLMSCursos";
import { useLMSGamificacion, calcularNivel, puntosParaSiguienteNivel } from "@/hooks/useLMSGamificacion";

export function ProgressMotivationalBar() {
  const { data: cursos } = useLMSCursosDisponibles();
  const { data: gamificacion } = useLMSGamificacion();

  const enrolled = cursos?.filter(c => c.inscripcion_id || c.es_obligatorio) || [];
  const completed = enrolled.filter(c => c.inscripcion_estado === 'completado').length;
  const total = enrolled.length;
  const globalPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalMinutes = enrolled.reduce((sum, c) => sum + (c.duracion_estimada_min || 0), 0);
  const completedMinutes = enrolled
    .filter(c => c.inscripcion_estado === 'completado')
    .reduce((sum, c) => sum + (c.duracion_estimada_min || 0), 0);
  const hoursLearned = Math.round(completedMinutes / 60 * 10) / 10;

  const perfil = gamificacion?.perfil;
  const puntos = perfil?.puntos_totales || 0;
  const racha = perfil?.racha_actual || 0;
  const nivel = calcularNivel(puntos);
  const nextLevelPts = puntosParaSiguienteNivel(nivel);
  const prevLevelPts = puntosParaSiguienteNivel(nivel - 1);
  const ptsToNext = Math.max(0, nextLevelPts - puntos);
  const progresoNivel = nivel >= 10
    ? 100
    : Math.round(((puntos - prevLevelPts) / (nextLevelPts - prevLevelPts)) * 100);

  if (total === 0) return null;

  return (
    <div className="rounded-2xl border bg-gradient-to-r from-amber-500/5 via-card to-orange-500/5 p-5 space-y-4">
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

      {/* Level & XP section */}
      <div className="rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-bold shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
              Nivel {nivel}
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Star className="h-4 w-4" />
              <span className="font-semibold text-sm">{puntos} pts</span>
            </div>
          </div>
          {racha > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">{racha} {racha === 1 ? 'día' : 'días'}</span>
            </div>
          )}
        </div>

        {/* XP progress to next level */}
        {nivel < 10 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nivel {nivel}</span>
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                {ptsToNext} pts para nivel {nivel + 1}
              </span>
            </div>
            <Progress value={progresoNivel} className="h-1.5" />
          </div>
        )}
        {nivel >= 10 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
            🏆 ¡Nivel máximo alcanzado!
          </p>
        )}
      </div>
    </div>
  );
}
