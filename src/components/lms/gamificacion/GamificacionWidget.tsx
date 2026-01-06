import { useLMSGamificacion, calcularNivel, puntosParaSiguienteNivel } from "@/hooks/useLMSGamificacion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Star, Zap, Target, Award, Medal, Coins, Brain, Crown, Shield } from "lucide-react";
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Tu Progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Puntos y Nivel */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary">{perfil.puntos_totales}</p>
            <p className="text-sm text-muted-foreground">puntos totales</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Nivel {nivel}
            </Badge>
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
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-medium">{perfil.racha_actual} días de racha</span>
            {perfil.racha_actual >= 7 && (
              <Zap className="h-4 w-4 text-yellow-500 ml-auto" />
            )}
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded bg-muted/50">
            <p className="font-medium">{perfil.cursos_completados}</p>
            <p className="text-xs text-muted-foreground">Cursos completados</p>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <p className="font-medium">{perfil.quizzes_perfectos}</p>
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
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-xs"
                    title={badge.descripcion}
                  >
                    <IconComponent className="h-3 w-3 text-primary" />
                    <span>{badge.nombre}</span>
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
