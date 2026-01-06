import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Send, Clock, HelpCircle, Loader2 } from "lucide-react";
import { useLMSPreguntas, calcularPuntaje, useLMSGuardarQuiz, puedeReintentar } from "@/hooks/useLMSQuiz";
import { QuestionRenderer } from "./quiz/QuestionRenderer";
import { QuizResults } from "./quiz/QuizResults";
import type { LMSContenido, QuizContent, RespuestaQuiz } from "@/types/lms";

interface QuizComponentProps {
  contenido: LMSContenido;
  inscripcionId: string;
  progresoActual?: {
    quiz_intentos?: number;
    quiz_mejor_puntaje?: number;
    quiz_respuestas?: RespuestaQuiz[];
  };
  onComplete?: () => void;
}

type QuizState = 'intro' | 'quiz' | 'review' | 'results';

export function QuizComponent({
  contenido,
  inscripcionId,
  progresoActual,
  onComplete,
}: QuizComponentProps) {
  const quizData = contenido.contenido as QuizContent;
  const [estado, setEstado] = useState<QuizState>('intro');
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string | string[]>>({});
  const [tiempoInicio, setTiempoInicio] = useState<Date | null>(null);
  const [resultado, setResultado] = useState<ReturnType<typeof calcularPuntaje> | null>(null);

  const { data: preguntas, isLoading: cargandoPreguntas } = useLMSPreguntas(quizData.preguntas_ids);
  const guardarQuiz = useLMSGuardarQuiz();

  const intentosUsados = progresoActual?.quiz_intentos ?? 0;
  const mejorPuntaje = progresoActual?.quiz_mejor_puntaje;
  const puedeIntentar = puedeReintentar(intentosUsados, quizData.intentos_permitidos);

  // Aleatorizar preguntas si está configurado
  const preguntasOrdenadas = useMemo(() => {
    if (!preguntas) return [];
    // Por ahora no aleatorizamos, se puede añadir después
    return preguntas;
  }, [preguntas]);

  const handleIniciarQuiz = () => {
    setEstado('quiz');
    setTiempoInicio(new Date());
    setRespuestas({});
    setPreguntaActual(0);
    setResultado(null);
  };

  const handleResponder = (respuesta: string | string[]) => {
    if (!preguntasOrdenadas[preguntaActual]) return;
    setRespuestas(prev => ({
      ...prev,
      [preguntasOrdenadas[preguntaActual].id]: respuesta
    }));
  };

  const handleSiguiente = () => {
    if (preguntaActual < preguntasOrdenadas.length - 1) {
      setPreguntaActual(prev => prev + 1);
    }
  };

  const handleAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(prev => prev - 1);
    }
  };

  const handleEnviar = async () => {
    if (!preguntasOrdenadas.length || !tiempoInicio) return;

    const resultadoCalc = calcularPuntaje(respuestas, preguntasOrdenadas);
    setResultado(resultadoCalc);
    
    const tiempoSegundos = Math.round((new Date().getTime() - tiempoInicio.getTime()) / 1000);
    const aprobado = resultadoCalc.porcentaje >= quizData.puntuacion_minima;

    await guardarQuiz.mutateAsync({
      inscripcionId,
      contenidoId: contenido.id,
      respuestas: resultadoCalc.detalles,
      puntaje: resultadoCalc.porcentaje,
      tiempoSegundos,
      aprobado,
    });

    setEstado('results');

    if (aprobado && onComplete) {
      onComplete();
    }
  };

  const handleReintentar = () => {
    handleIniciarQuiz();
  };

  const handleVerRespuestas = () => {
    setPreguntaActual(0);
    setEstado('review');
  };

  const handleContinuar = () => {
    if (onComplete) {
      onComplete();
    }
  };

  // Loading state
  if (cargandoPreguntas) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No questions
  if (!preguntasOrdenadas.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Este quiz no tiene preguntas configuradas.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Intro screen
  if (estado === 'intro') {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{contenido.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-muted">
              <p className="text-2xl font-bold">{preguntasOrdenadas.length}</p>
              <p className="text-muted-foreground">Preguntas</p>
            </div>
            <div className="p-4 rounded-xl bg-muted">
              <p className="text-2xl font-bold">{quizData.puntuacion_minima}%</p>
              <p className="text-muted-foreground">Para aprobar</p>
            </div>
          </div>

          {quizData.tiempo_limite_min && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Tiempo límite: {quizData.tiempo_limite_min} minutos</span>
            </div>
          )}

          {intentosUsados > 0 && (
            <div className="p-4 rounded-xl bg-muted space-y-1">
              <p className="text-sm text-muted-foreground">
                Intentos: {intentosUsados}
                {quizData.intentos_permitidos > 0 && ` de ${quizData.intentos_permitidos}`}
              </p>
              {mejorPuntaje !== undefined && (
                <p className="text-sm font-medium">
                  Mejor puntaje: {mejorPuntaje}%
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleIniciarQuiz}
            disabled={!puedeIntentar}
            className="w-full"
            size="lg"
          >
            {intentosUsados === 0 ? 'Comenzar Quiz' : 'Reintentar Quiz'}
          </Button>

          {!puedeIntentar && (
            <p className="text-sm text-destructive">
              Has agotado todos los intentos permitidos.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (estado === 'results' && resultado) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <QuizResults
            puntaje={resultado.porcentaje}
            puntajeMinimo={quizData.puntuacion_minima}
            puntosObtenidos={resultado.puntosObtenidos}
            puntosTotal={resultado.puntosTotal}
            detalles={resultado.detalles}
            preguntas={preguntasOrdenadas}
            mejorPuntajeAnterior={mejorPuntaje}
            intentosUsados={intentosUsados + 1}
            intentosPermitidos={quizData.intentos_permitidos}
            mostrarRespuestasCorrectas={quizData.mostrar_respuestas_correctas}
            onReintentar={handleReintentar}
            onContinuar={handleContinuar}
            onVerRespuestas={handleVerRespuestas}
          />
        </CardContent>
      </Card>
    );
  }

  // Quiz / Review screen
  const pregunta = preguntasOrdenadas[preguntaActual];
  const respuestaActual = respuestas[pregunta?.id];
  const progresoPorcentaje = ((preguntaActual + 1) / preguntasOrdenadas.length) * 100;
  const esReview = estado === 'review';
  const resultadoRespuesta = resultado?.detalles.find(d => d.pregunta_id === pregunta?.id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pregunta {preguntaActual + 1} de {preguntasOrdenadas.length}</span>
            <span>{Math.round(progresoPorcentaje)}%</span>
          </div>
          <Progress value={progresoPorcentaje} className="h-2" />
        </div>

        {/* Question indicators */}
        <div className="flex gap-1.5 justify-center pt-4 flex-wrap">
          {preguntasOrdenadas.map((p, idx) => {
            const tieneRespuesta = !!respuestas[p.id];
            const esActual = idx === preguntaActual;
            const resultadoPregunta = resultado?.detalles.find(d => d.pregunta_id === p.id);

            return (
              <button
                key={p.id}
                onClick={() => setPreguntaActual(idx)}
                className={cn(
                  "w-8 h-8 rounded-full text-xs font-medium transition-all",
                  esActual && "ring-2 ring-primary ring-offset-2",
                  !esReview && tieneRespuesta && "bg-primary text-primary-foreground",
                  !esReview && !tieneRespuesta && "bg-muted text-muted-foreground",
                  esReview && resultadoPregunta?.es_correcta && "bg-green-500 text-white",
                  esReview && resultadoPregunta && !resultadoPregunta.es_correcta && "bg-red-500 text-white"
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        {pregunta && (
          <>
            <div className="space-y-2">
              <p className="text-lg font-medium leading-relaxed">
                {pregunta.pregunta}
              </p>
              <p className="text-sm text-muted-foreground">
                {pregunta.puntos} punto{pregunta.puntos !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Answer options */}
            <QuestionRenderer
              pregunta={pregunta}
              respuesta={respuestaActual}
              onResponder={handleResponder}
              mostrarResultado={esReview}
              resultadoRespuesta={resultadoRespuesta}
              disabled={esReview}
            />

            {/* Explanation (only in review) */}
            {esReview && pregunta.explicacion && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Explicación:
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {pregunta.explicacion}
                </p>
              </div>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleAnterior}
            disabled={preguntaActual === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {esReview ? (
            preguntaActual === preguntasOrdenadas.length - 1 ? (
              <Button onClick={() => setEstado('results')}>
                Ver Resultados
              </Button>
            ) : (
              <Button onClick={handleSiguiente}>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )
          ) : (
            preguntaActual === preguntasOrdenadas.length - 1 ? (
              <Button 
                onClick={handleEnviar}
                disabled={guardarQuiz.isPending}
              >
                {guardarQuiz.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar Quiz
              </Button>
            ) : (
              <Button onClick={handleSiguiente}>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
