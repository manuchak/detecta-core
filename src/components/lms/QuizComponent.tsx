import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Send, Clock, HelpCircle, Loader2, Sparkles } from "lucide-react";
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

  const preguntasOrdenadas = useMemo(() => {
    if (!preguntas) return [];
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

    try {
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
    } catch (error) {
      console.error('Error al guardar quiz:', error);
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
      <Card className="max-w-lg mx-auto overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">{contenido.titulo}</CardTitle>
        </div>
        <CardContent className="space-y-6 text-center pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
              <p className="text-3xl font-bold text-blue-600">{preguntasOrdenadas.length}</p>
              <p className="text-blue-600/70 text-sm mt-1">Preguntas</p>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
              <p className="text-3xl font-bold text-amber-600">{quizData.puntuacion_minima}%</p>
              <p className="text-amber-600/70 text-sm mt-1">Para aprobar</p>
            </div>
          </div>

          {quizData.tiempo_limite_min && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Tiempo límite: {quizData.tiempo_limite_min} minutos</span>
            </div>
          )}

          {intentosUsados > 0 && (
            <div className="p-4 rounded-2xl bg-muted space-y-1">
              <p className="text-sm text-muted-foreground">
                Intentos: {intentosUsados}
                {quizData.intentos_permitidos > 0 && ` de ${quizData.intentos_permitidos}`}
              </p>
              {mejorPuntaje !== undefined && (
                <p className="text-sm font-medium">Mejor puntaje: {mejorPuntaje}%</p>
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
            <p className="text-sm text-destructive">Has agotado todos los intentos permitidos.</p>
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
    <Card className="max-w-3xl mx-auto overflow-hidden">
      {/* Header with gradient */}
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-primary">
              Pregunta {preguntaActual + 1} <span className="text-sm font-normal text-muted-foreground">de {preguntasOrdenadas.length}</span>
            </span>
            {pregunta && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                {pregunta.puntos} pto{pregunta.puntos !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Progress
            value={progresoPorcentaje}
            className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/70"
          />
        </div>

        {/* Question indicators */}
        <div className="flex gap-1.5 justify-center pt-3 flex-wrap">
          {preguntasOrdenadas.map((p, idx) => {
            const tieneRespuesta = !!respuestas[p.id];
            const esActual = idx === preguntaActual;
            const resultadoPregunta = resultado?.detalles.find(d => d.pregunta_id === p.id);

            return (
              <button
                key={p.id}
                onClick={() => setPreguntaActual(idx)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200",
                  esActual && "ring-2 ring-primary ring-offset-2 scale-110",
                  !esReview && tieneRespuesta && "bg-primary text-primary-foreground shadow-sm",
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

      <CardContent className="space-y-6 pt-6">
        {/* Question */}
        {pregunta && (
          <>
            <p className="text-xl font-semibold leading-relaxed">
              {pregunta.pregunta}
            </p>

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
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Explicación:</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{pregunta.explicacion}</p>
              </div>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleAnterior} disabled={preguntaActual === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>

          {esReview ? (
            preguntaActual === preguntasOrdenadas.length - 1 ? (
              <Button onClick={() => setEstado('results')}>Ver Resultados</Button>
            ) : (
              <Button onClick={handleSiguiente}>Siguiente <ChevronRight className="w-4 h-4 ml-1" /></Button>
            )
          ) : (
            preguntaActual === preguntasOrdenadas.length - 1 ? (
              <Button onClick={handleEnviar} disabled={guardarQuiz.isPending}>
                {guardarQuiz.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar Quiz
              </Button>
            ) : (
              <Button onClick={handleSiguiente}>Siguiente <ChevronRight className="w-4 h-4 ml-1" /></Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
