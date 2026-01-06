import { useLMSGamificacion, useLMSBadgesDisponibles } from "@/hooks/useLMSGamificacion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (!todosLosBadges || todosLosBadges.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
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
                          ? "bg-primary/10 hover:bg-primary/20"
                          : "bg-muted/30 opacity-50 grayscale hover:opacity-70"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-full",
                          obtenido ? "bg-primary/20" : "bg-muted"
                        )}
                      >
                        {obtenido ? (
                          <IconComponent className="h-6 w-6 text-primary" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs text-center font-medium truncate w-full">
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
                        <p className="text-xs text-primary">
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

        <div className="mt-4 text-sm text-muted-foreground text-center">
          {gamificacion?.badges?.length || 0} de {todosLosBadges.length} insignias obtenidas
        </div>
      </CardContent>
    </Card>
  );
};
