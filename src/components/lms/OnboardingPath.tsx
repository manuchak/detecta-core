import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, Clock, PlayCircle, AlertTriangle, 
  ChevronRight, Calendar, Timer, Trophy 
} from "lucide-react";
import { useLMSOnboardingStatus } from "@/hooks/lms/useLMSInscripcionMasiva";
import { cn } from "@/lib/utils";

const ESTADO_CONFIG = {
  inscrito: { 
    icon: Clock, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Pendiente'
  },
  en_progreso: { 
    icon: PlayCircle, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'En progreso'
  },
  completado: { 
    icon: CheckCircle, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Completado'
  },
  vencido: { 
    icon: AlertTriangle, 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Vencido'
  },
  abandonado: { 
    icon: AlertTriangle, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Abandonado'
  }
};

export function OnboardingPath() {
  const navigate = useNavigate();
  const { data: onboarding, isLoading } = useLMSOnboardingStatus();

  if (isLoading) {
    return (
      <Card className="apple-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!onboarding || onboarding.total_obligatorios === 0) {
    return null;
  }

  const isComplete = onboarding.porcentaje_completado === 100;

  return (
    <Card className="apple-card overflow-hidden">
      {/* Header con progreso general */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isComplete ? (
              <>
                <Trophy className="w-5 h-5 text-yellow-500" />
                ¡Onboarding Completado!
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 text-primary" />
                Tu Ruta de Onboarding
              </>
            )}
          </CardTitle>
          <Badge variant={isComplete ? "default" : "secondary"} className="gap-1">
            {onboarding.completados}/{onboarding.total_obligatorios}
          </Badge>
        </div>
        
        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso general</span>
            <span className="font-medium">{onboarding.porcentaje_completado}%</span>
          </div>
          <Progress 
            value={onboarding.porcentaje_completado} 
            className={cn("h-2", isComplete && "bg-green-100 dark:bg-green-900/30")}
          />
        </div>

        {/* Estadísticas rápidas */}
        {!isComplete && (
          <div className="flex gap-4 mt-4 text-sm">
            {onboarding.vencidos > 0 && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                {onboarding.vencidos} vencido(s)
              </span>
            )}
            {onboarding.pendientes > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {onboarding.pendientes} pendiente(s)
              </span>
            )}
            {onboarding.en_progreso > 0 && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <PlayCircle className="w-4 h-4" />
                {onboarding.en_progreso} en progreso
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {/* Timeline de cursos */}
        <div className="space-y-3">
          {onboarding.cursos?.map((curso, index) => {
            const config = ESTADO_CONFIG[curso.estado as keyof typeof ESTADO_CONFIG] || ESTADO_CONFIG.inscrito;
            const StatusIcon = config.icon;
            const isVencido = curso.estado === 'vencido';
            const diasRestantes = curso.dias_restantes;
            const urgente = diasRestantes !== null && diasRestantes <= 3 && diasRestantes > 0;

            return (
              <div
                key={curso.inscripcion_id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer",
                  "border hover:shadow-md",
                  isVencido && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10",
                  urgente && !isVencido && "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10",
                  curso.estado === 'completado' && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10",
                  !isVencido && !urgente && curso.estado !== 'completado' && "hover:bg-muted/50"
                )}
                onClick={() => navigate(`/lms/curso/${curso.curso_id}`)}
              >
                {/* Icono de estado con timeline */}
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    config.bgColor
                  )}>
                    <StatusIcon className={cn("w-5 h-5", config.color)} />
                  </div>
                  {/* Línea de conexión */}
                  {index < (onboarding.cursos?.length || 0) - 1 && (
                    <div className="absolute top-10 w-0.5 h-8 bg-border" />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium truncate">{curso.titulo}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" />
                          {curso.duracion_estimada_min} min
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {curso.nivel}
                        </Badge>
                      </div>
                    </div>
                    <Badge 
                      variant={isVencido ? "destructive" : urgente ? "secondary" : "outline"}
                      className="shrink-0"
                    >
                      {isVencido ? (
                        'Vencido'
                      ) : diasRestantes !== null ? (
                        diasRestantes === 0 ? 'Vence hoy' :
                        diasRestantes === 1 ? 'Vence mañana' :
                        `${diasRestantes} días`
                      ) : (
                        config.label
                      )}
                    </Badge>
                  </div>

                  {/* Barra de progreso del curso */}
                  {curso.estado !== 'inscrito' && curso.estado !== 'completado' && (
                    <div className="mt-2">
                      <Progress value={curso.progreso_porcentaje} className="h-1.5" />
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>

        {/* CTA para el siguiente curso */}
        {!isComplete && onboarding.cursos && onboarding.cursos.length > 0 && (
          <div className="mt-6">
            <Button 
              className="w-full apple-button-primary"
              onClick={() => {
                const nextCourse = onboarding.cursos?.find(c => 
                  c.estado === 'vencido' || c.estado === 'en_progreso' || c.estado === 'inscrito'
                );
                if (nextCourse) {
                  navigate(`/lms/curso/${nextCourse.curso_id}`);
                }
              }}
            >
              Continuar mi capacitación
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
