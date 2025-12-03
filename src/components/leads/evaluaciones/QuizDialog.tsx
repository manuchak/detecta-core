import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCapacitacion } from '@/hooks/useCapacitacion';
import { ModuloCapacitacion, PreguntaQuiz, QUIZ_MIN_SCORE } from '@/types/capacitacion';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Trophy,
  RotateCcw
} from 'lucide-react';

interface QuizDialogProps {
  modulo: ModuloCapacitacion;
  candidatoId: string;
  open: boolean;
  onClose: () => void;
}

type QuizState = 'loading' | 'quiz' | 'resultado';

export const QuizDialog = ({ modulo, candidatoId, open, onClose }: QuizDialogProps) => {
  const { fetchPreguntas, enviarQuiz } = useCapacitacion(candidatoId);
  
  const [state, setState] = useState<QuizState>('loading');
  const [preguntas, setPreguntas] = useState<PreguntaQuiz[]>([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Map<string, number>>(new Map());
  const [resultado, setResultado] = useState<{
    puntaje: number;
    aprobado: boolean;
    respuestas_correctas: number;
    total_preguntas: number;
  } | null>(null);

  // Cargar preguntas al abrir
  useEffect(() => {
    if (open) {
      loadPreguntas();
    }
  }, [open, modulo.id]);

  const loadPreguntas = async () => {
    setState('loading');
    try {
      const data = await fetchPreguntas(modulo.id);
      setPreguntas(data);
      setPreguntaActual(0);
      setRespuestas(new Map());
      setResultado(null);
      setState('quiz');
    } catch (error) {
      console.error('Error cargando preguntas:', error);
    }
  };

  const handleSeleccion = (opcionIndex: number) => {
    const nuevasRespuestas = new Map(respuestas);
    nuevasRespuestas.set(preguntas[preguntaActual].id, opcionIndex);
    setRespuestas(nuevasRespuestas);
  };

  const handleEnviar = async () => {
    const respuestasArray = Array.from(respuestas.entries()).map(([pregunta_id, opcion_seleccionada]) => ({
      pregunta_id,
      opcion_seleccionada
    }));

    try {
      const result = await enviarQuiz.mutateAsync({
        moduloId: modulo.id,
        respuestas: respuestasArray
      });
      
      setResultado({
        puntaje: result.puntaje,
        aprobado: result.aprobado,
        respuestas_correctas: result.respuestas_correctas,
        total_preguntas: result.total_preguntas
      });
      setState('resultado');
    } catch (error) {
      console.error('Error enviando quiz:', error);
    }
  };

  const pregunta = preguntas[preguntaActual];
  const respuestaSeleccionada = pregunta ? respuestas.get(pregunta.id) : undefined;
  const todasRespondidas = preguntas.length > 0 && respuestas.size === preguntas.length;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Quiz: {modulo.nombre}
          </DialogTitle>
        </DialogHeader>

        {state === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {state === 'quiz' && pregunta && (
          <div className="space-y-6">
            {/* Progreso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pregunta {preguntaActual + 1} de {preguntas.length}</span>
                <span>{respuestas.size} respondidas</span>
              </div>
              <Progress value={((preguntaActual + 1) / preguntas.length) * 100} className="h-2" />
            </div>

            {/* Pregunta */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">{pregunta.pregunta}</h3>
                
                <div className="space-y-3">
                  {pregunta.opciones.map((opcion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSeleccion(index)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        respuestaSeleccionada === index
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          respuestaSeleccionada === index
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground'
                        }`}>
                          {respuestaSeleccionada === index && (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </div>
                        <span>{opcion.texto}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navegación */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setPreguntaActual(p => p - 1)}
                disabled={preguntaActual === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              {preguntaActual < preguntas.length - 1 ? (
                <Button
                  onClick={() => setPreguntaActual(p => p + 1)}
                  disabled={respuestaSeleccionada === undefined}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleEnviar}
                  disabled={!todasRespondidas || enviarQuiz.isPending}
                >
                  {enviarQuiz.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Enviar Respuestas
                </Button>
              )}
            </div>
          </div>
        )}

        {state === 'resultado' && resultado && (
          <div className="text-center py-8 space-y-6">
            {resultado.aprobado ? (
              <>
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600">¡Felicitaciones!</h3>
                  <p className="text-muted-foreground">Has aprobado el quiz</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-600">No aprobado</h3>
                  <p className="text-muted-foreground">Necesitas {QUIZ_MIN_SCORE}% para aprobar</p>
                </div>
              </>
            )}

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{resultado.puntaje}%</div>
                <div className="text-sm text-muted-foreground">Tu puntaje</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {resultado.respuestas_correctas}/{resultado.total_preguntas}
                </div>
                <div className="text-sm text-muted-foreground">Correctas</div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              {!resultado.aprobado && (
                <Button variant="outline" onClick={loadPreguntas}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              )}
              <Button onClick={onClose}>
                {resultado.aprobado ? 'Continuar' : 'Cerrar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
