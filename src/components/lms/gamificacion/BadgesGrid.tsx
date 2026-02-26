import { useLMSGamificacion, useLMSBadgesDisponibles } from "@/hooks/useLMSGamificacion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, Trophy, Award, Target, Flame, Zap, Coins, Medal, Brain, Crown, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const iconMap: Record<string, React.ComponentType<any>> = {
  Star, Trophy, Award, Target, Flame, Zap, Coins, Medal, Brain, Crown, Shield
};

export const BadgesGrid = () => {
  const { data: gamificacion } = useLMSGamificacion();
  const { data: todosLosBadges } = useLMSBadgesDisponibles();

  const badgesObtenidosIds = new Set(gamificacion?.badges?.map(b => b.id) || []);
  const badgesObtenidosMap = new Map(
    gamificacion?.badges?.map(b => [b.id, b]) || []
  );
  const totalBadges = todosLosBadges?.length || 0;
  const obtainedCount = gamificacion?.badges?.length || 0;
  const badgePercent = totalBadges > 0 ? Math.round((obtainedCount / totalBadges) * 100) : 0;

  if (!todosLosBadges || todosLosBadges.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200/50 dark:border-amber-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Insignias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {todosLosBadges.map((badge) => {
              const obtenido = badgesObtenidosIds.has(badge.id);
              const badgeData = badgesObtenidosMap.get(badge.id);
              const IconComponent = iconMap[badge.icono] || Star;

              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg transition-all cursor-pointer",
                        obtenido
                          ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-300/40 dark:border-amber-700/30 hover:shadow-md hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20 hover:scale-105"
                          : "bg-muted/30 opacity-60 hover:opacity-80 hover:bg-muted/50 hover:scale-105"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-full transition-all",
                          obtenido
                            ? "bg-gradient-to-br from-amber-400/30 to-yellow-400/20"
                            : "bg-muted"
                        )}
                      >
                        {obtenido ? (
                          <IconComponent className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground/60" />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs text-center font-medium truncate w-full",
                        obtenido && "text-amber-800 dark:text-amber-300"
                      )}>
                        {obtenido ? badge.nombre : "???"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <div className="space-y-1">
                      <p className="font-medium">{badge.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {badge.descripcion}
                      </p>
                      {obtenido && badgeData?.fecha_obtencion && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Obtenido: {format(new Date(badgeData.fecha_obtencion), "d MMM yyyy", { locale: es })}
                        </p>
                      )}
                      {(badge as any).puntos_otorga > 0 && (
                        <p className="text-xs">+{(badge as any).puntos_otorga} puntos</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Progress bar instead of plain text */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{obtainedCount} de {totalBadges} insignias</span>
            <span>{badgePercent}%</span>
          </div>
          <Progress value={badgePercent} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
};
