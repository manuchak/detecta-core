import { Clock, BookOpen, AlertCircle, CheckCircle2, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CursoDisponible, EstadoInscripcion } from "@/types/lms";
import { differenceInDays, parseISO } from "date-fns";

interface CourseCardProps {
  curso: CursoDisponible;
  onStartCourse: (cursoId: string) => void;
  onEnroll?: (cursoId: string) => void;
  isEnrolling?: boolean;
}

const nivelColors: Record<string, string> = {
  basico: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermedio: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  avanzado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const estadoConfig: Record<EstadoInscripcion, { label: string; color: string; icon: React.ReactNode }> = {
  inscrito: { label: "Inscrito", color: "bg-blue-100 text-blue-800", icon: <BookOpen className="h-3 w-3" /> },
  en_progreso: { label: "En Progreso", color: "bg-yellow-100 text-yellow-800", icon: <Play className="h-3 w-3" /> },
  completado: { label: "Completado", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  vencido: { label: "Vencido", color: "bg-red-100 text-red-800", icon: <AlertCircle className="h-3 w-3" /> },
  abandonado: { label: "Abandonado", color: "bg-gray-100 text-gray-800", icon: null },
};

export function CourseCard({ curso, onStartCourse, onEnroll, isEnrolling }: CourseCardProps) {
  const isEnrolled = !!curso.inscripcion_id;
  const progreso = curso.inscripcion_progreso || 0;
  const estado = curso.inscripcion_estado;
  
  // Calcular días restantes
  const diasRestantes = curso.inscripcion_fecha_limite 
    ? differenceInDays(parseISO(curso.inscripcion_fecha_limite), new Date())
    : null;

  const isUrgent = diasRestantes !== null && diasRestantes <= 3 && diasRestantes >= 0;
  const isOverdue = diasRestantes !== null && diasRestantes < 0;

  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col h-full",
      "border border-border/50 bg-card",
      isUrgent && "ring-2 ring-yellow-400",
      isOverdue && "ring-2 ring-red-400"
    )}>
      {/* Imagen de portada */}
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
        {curso.imagen_portada_url ? (
          <img 
            src={curso.imagen_portada_url} 
            alt={curso.titulo}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-primary/20" />
          </div>
        )}
        
        {/* Badges superpuestos */}
        <div className="absolute top-3 left-3 flex gap-2">
          {curso.es_obligatorio && (
            <Badge variant="destructive" className="text-xs">
              Obligatorio
            </Badge>
          )}
          {estado && estadoConfig[estado] && (
            <Badge className={cn("text-xs gap-1", estadoConfig[estado].color)}>
              {estadoConfig[estado].icon}
              {estadoConfig[estado].label}
            </Badge>
          )}
        </div>

        {/* Nivel */}
        <Badge className={cn("absolute top-3 right-3 text-xs", nivelColors[curso.nivel])}>
          {curso.nivel.charAt(0).toUpperCase() + curso.nivel.slice(1)}
        </Badge>
      </div>

      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        {/* Título y categoría */}
        <div>
          {curso.categoria && (
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {curso.categoria}
            </span>
          )}
          <h3 className="font-semibold text-foreground line-clamp-2 mt-0.5">
            {curso.titulo}
          </h3>
        </div>

        {/* Descripción */}
        {curso.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {curso.descripcion}
          </p>
        )}

        {/* Duración */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{curso.duracion_estimada_min} min</span>
          </div>
          {diasRestantes !== null && !isOverdue && estado !== 'completado' && (
            <div className={cn(
              "flex items-center gap-1",
              isUrgent && "text-yellow-600 font-medium"
            )}>
              <AlertCircle className="h-4 w-4" />
              <span>{diasRestantes} días restantes</span>
            </div>
          )}
          {isOverdue && estado !== 'completado' && (
            <div className="flex items-center gap-1 text-red-600 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Vencido</span>
            </div>
          )}
        </div>

        {/* Barra de progreso (solo si está inscrito) */}
        {isEnrolled && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{Math.round(progreso)}%</span>
            </div>
            <Progress value={progreso} className="h-2" />
          </div>
        )}

        {/* Botón de acción */}
        <div className="pt-2 mt-auto">
          {isEnrolled ? (
            <Button 
              className="w-full"
              onClick={() => onStartCourse(curso.id)}
              variant={estado === 'completado' ? 'outline' : 'default'}
            >
              {estado === 'completado' ? 'Ver de nuevo' : 
               estado === 'inscrito' ? 'Comenzar' : 'Continuar'}
            </Button>
          ) : curso.es_obligatorio ? (
            <Button 
              className="w-full"
              onClick={() => onEnroll?.(curso.id)}
              disabled={isEnrolling}
            >
              {isEnrolling ? 'Inscribiendo...' : 'Comenzar'}
            </Button>
          ) : (
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => onEnroll?.(curso.id)}
              disabled={isEnrolling}
            >
              {isEnrolling ? 'Inscribiendo...' : 'Inscribirme'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
