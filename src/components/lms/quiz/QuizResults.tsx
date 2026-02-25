import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Trophy, Target, Star } from "lucide-react";
import { useEffect, useState } from "react";
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

function AnimatedCircle({ percentage, aprobado }: { percentage: number; aprobado: boolean }) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={aprobado ? '#22c55e' : '#f59e0b'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{animatedPct}%</span>
      </div>
    </div>
  );
}

function StarsDisplay({ puntaje }: { puntaje: number }) {
  const stars = puntaje >= 90 ? 3 : puntaje >= 70 ? 2 : puntaje >= 50 ? 1 : 0;
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3].map(i => (
        <Star
          key={i}
          className={cn(
            "w-8 h-8 transition-all duration-500",
            i <= stars ? "text-yellow-400 fill-yellow-400 scale-100" : "text-muted scale-75 opacity-40"
          )}
          style={{ transitionDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
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
    <div className="flex flex-col items-center text-center space-y-6 py-6">
      {/* Icon */}
      <div className={cn(
        "w-20 h-20 rounded-full flex items-center justify-center",
        "animate-in zoom-in duration-500",
        aprobado ? "bg-green-100 dark:bg-green-950/50" : "bg-amber-100 dark:bg-amber-950/50"
      )}>
        {aprobado ? <Trophy className="w-10 h-10 text-green-600" /> : <Target className="w-10 h-10 text-amber-600" />}
      </div>

      <div>
        <h2 className={cn("text-2xl font-bold mb-1", aprobado ? "text-green-600" : "text-amber-600")}>
          {aprobado ? '¡Felicidades!' : 'Sigue intentando'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {aprobado ? 'Has aprobado esta evaluación' : `Necesitas ${puntajeMinimo}% para aprobar`}
        </p>
      </div>

      {/* Animated circle */}
      <AnimatedCircle percentage={puntaje} aprobado={aprobado} />

      {/* Stars */}
      <StarsDisplay puntaje={puntaje} />

      <p className="text-sm text-muted-foreground">{puntosObtenidos} de {puntosTotal} puntos</p>

      {/* Best score */}
      {mejorPuntajeAnterior !== undefined && mejorPuntajeAnterior > 0 && (
        <div className={cn(
          "text-sm px-4 py-2 rounded-lg",
          esNuevoRecord
            ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
            : "bg-muted text-muted-foreground"
        )}>
          {esNuevoRecord ? (
            <span className="flex items-center gap-2"><Trophy className="w-4 h-4" /> ¡Nuevo récord! Anterior: {mejorPuntajeAnterior}%</span>
          ) : (
            <span>Tu mejor puntaje: {mejorPuntajeAnterior}%</span>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div className="flex gap-4 justify-center w-full max-w-xs">
        <div className="flex-1 p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{correctas}</p>
          <p className="text-xs text-green-600 dark:text-green-400">Correctas</p>
        </div>
        <div className="flex-1 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-center">
          <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{incorrectas}</p>
          <p className="text-xs text-red-600 dark:text-red-400">Incorrectas</p>
        </div>
      </div>

      {intentosPermitidos > 0 && (
        <p className="text-sm text-muted-foreground">Intento {intentosUsados} de {intentosPermitidos}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        {mostrarRespuestasCorrectas && (
          <Button variant="outline" onClick={onVerRespuestas} className="flex-1">Ver respuestas</Button>
        )}
        {puedeReintentar && !aprobado && (
          <Button variant="outline" onClick={onReintentar} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" /> Reintentar
          </Button>
        )}
        <Button onClick={onContinuar} className={cn("flex-1", aprobado && "bg-green-600 hover:bg-green-700")}>
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
