import { useLMSGamificacion, calcularNivel, puntosParaSiguienteNivel } from "@/hooks/useLMSGamificacion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Star, Zap, Target, Award, Medal, Coins, Brain, Crown, Shield, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, React.ComponentType<any>> = {
  Star, Trophy, Award, Target, Flame, Zap, Coins, Medal, Brain, Crown, Shield
};

export const GamificacionWidget = () => {
  const { data, isLoading, error } = useLMSGamificacion();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const { perfil, badges } = data;
  const nivel = calcularNivel(perfil.puntos_totales);
  const puntosParaSiguiente = puntosParaSiguienteNivel(nivel);
  const puntosNivelAnterior = puntosParaSiguienteNivel(nivel - 1);
  const progresoNivel = nivel < 10 
    ? ((perfil.puntos_totales - puntosNivelAnterior) / (puntosParaSiguiente - puntosNivelAnterior)) * 100
    : 100;

  return (
    <Card className="overflow-hidden border-amber-200/50 dark:border-amber-800/30">
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-orange-500/10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-500" />
          Tu Progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Puntos y Nivel */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{perfil.puntos_totales}</p>
            <p className="text-sm text-muted-foreground">puntos totales</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-bold shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
              Nivel {nivel}
            </div>
          </div>
        </div>

        {/* Barra de progreso al siguiente nivel */}
        {nivel < 10 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nivel {nivel}</span>
              <span>{puntosParaSiguiente - perfil.puntos_totales} pts para nivel {nivel + 1}</span>
            </div>
            <Progress value={progresoNivel} className="h-2" />
          </div>
        )}

        {/* Racha */}
        {perfil.racha_actual > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-orange-500/15 to-amber-500/10">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-medium text-orange-700 dark:text-orange-300">{perfil.racha_actual} días de racha</span>
            {perfil.racha_actual >= 7 && (
              <Zap className="h-4 w-4 text-yellow-500 ml-auto" />
            )}
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-200/30 dark:border-emerald-800/20">
            <p className="font-bold text-emerald-700 dark:text-emerald-400">{perfil.cursos_completados}</p>
            <p className="text-xs text-muted-foreground">Cursos completados</p>
          </div>
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-200/30 dark:border-violet-800/20">
            <p className="font-bold text-violet-700 dark:text-violet-400">{perfil.quizzes_perfectos}</p>
            <p className="text-xs text-muted-foreground">Quizzes perfectos</p>
          </div>
        </div>

        {/* Badges recientes */}
        {badges && badges.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Insignias obtenidas</p>
            <div className="flex flex-wrap gap-2">
              {badges.slice(0, 5).map((badge) => {
                const IconComponent = iconMap[badge.icono] || Star;
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-300/30 dark:border-amber-700/30 text-xs"
                    title={badge.descripcion}
                  >
                    <IconComponent className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium">{badge.nombre}</span>
                  </div>
                );
              })}
              {badges.length > 5 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{badges.length - 5} más
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
