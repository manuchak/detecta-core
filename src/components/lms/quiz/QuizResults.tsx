import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Trophy, Target } from "lucide-react";
import type { LMSPregunta, RespuestaQuiz } from "@/types/lms";

interface QuizResultsProps {
  puntaje: number;
  puntajeMinimo: number;
  puntosObtenidos: number;
  puntosTotal: number;
  detalles: RespuestaQuiz[];
  preguntas: LMSPregunta[];
  mejorPuntajeAnterior?: number;
  intentosUsados: number;
  intentosPermitidos: number;
  mostrarRespuestasCorrectas: boolean;
  onReintentar: () => void;
  onContinuar: () => void;
  onVerRespuestas: () => void;
}

export function QuizResults({
  puntaje,
  puntajeMinimo,
  puntosObtenidos,
  puntosTotal,
  detalles,
  preguntas,
  mejorPuntajeAnterior,
  intentosUsados,
  intentosPermitidos,
  mostrarRespuestasCorrectas,
  onReintentar,
  onContinuar,
  onVerRespuestas,
}: QuizResultsProps) {
  const aprobado = puntaje >= puntajeMinimo;
  const correctas = detalles.filter(d => d.es_correcta).length;
  const incorrectas = detalles.length - correctas;
  const puedeReintentar = intentosPermitidos === 0 || intentosUsados < intentosPermitidos;
  const esNuevoRecord = mejorPuntajeAnterior !== undefined && puntaje > mejorPuntajeAnterior;

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-8">
      {/* Result Icon & Score */}
      <div className="space-y-4">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center mx-auto",
          "transition-all duration-500 animate-in zoom-in",
          aprobado 
            ? "bg-green-100 dark:bg-green-950/50" 
            : "bg-amber-100 dark:bg-amber-950/50"
        )}>
          {aprobado ? (
            <Trophy className="w-12 h-12 text-green-600" />
          ) : (
            <Target className="w-12 h-12 text-amber-600" />
          )}
        </div>

        <div>
          <h2 className={cn(
            "text-3xl font-bold mb-2",
            aprobado ? "text-green-600" : "text-amber-600"
          )}>
            {aprobado ? '¡Felicidades!' : 'Sigue intentando'}
          </h2>
          <p className="text-muted-foreground">
            {aprobado 
              ? 'Has aprobado esta evaluación' 
              : `Necesitas ${puntajeMinimo}% para aprobar`}
          </p>
        </div>
      </div>

      {/* Score Display */}
      <div className="w-full max-w-xs space-y-4">
        <div className="text-center">
          <span className="text-5xl font-bold">{puntaje}%</span>
          <p className="text-sm text-muted-foreground mt-1">
            {puntosObtenidos} de {puntosTotal} puntos
          </p>
        </div>

        <Progress 
          value={puntaje} 
          className={cn(
            "h-3",
            aprobado ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500"
          )}
        />

        {/* Best score comparison */}
        {mejorPuntajeAnterior !== undefined && mejorPuntajeAnterior > 0 && (
          <div className={cn(
            "text-sm p-3 rounded-lg",
            esNuevoRecord 
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300" 
              : "bg-muted text-muted-foreground"
          )}>
            {esNuevoRecord ? (
              <span className="flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4" />
                ¡Nuevo récord! Anterior: {mejorPuntajeAnterior}%
              </span>
            ) : (
              <span>Tu mejor puntaje: {mejorPuntajeAnterior}%</span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-8 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold">{correctas}</p>
            <p className="text-xs text-muted-foreground">Correctas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold">{incorrectas}</p>
            <p className="text-xs text-muted-foreground">Incorrectas</p>
          </div>
        </div>
      </div>

      {/* Attempts info */}
      {intentosPermitidos > 0 && (
        <p className="text-sm text-muted-foreground">
          Intento {intentosUsados} de {intentosPermitidos}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        {mostrarRespuestasCorrectas && (
          <Button
            variant="outline"
            onClick={onVerRespuestas}
            className="flex-1"
          >
            Ver respuestas
          </Button>
        )}

        {puedeReintentar && !aprobado && (
          <Button
            variant="outline"
            onClick={onReintentar}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        )}

        <Button
          onClick={onContinuar}
          className={cn(
            "flex-1",
            aprobado && "bg-green-600 hover:bg-green-700"
          )}
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
