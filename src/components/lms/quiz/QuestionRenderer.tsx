import type { LMSPregunta, RespuestaQuiz } from "@/types/lms";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { TrueFalseQuestion } from "./TrueFalseQuestion";
import { ShortAnswerQuestion } from "./ShortAnswerQuestion";

interface QuestionRendererProps {
  pregunta: LMSPregunta;
  respuesta: string | string[] | undefined;
  onResponder: (respuesta: string | string[]) => void;
  mostrarResultado?: boolean;
  resultadoRespuesta?: RespuestaQuiz;
  disabled?: boolean;
}

export function QuestionRenderer({
  pregunta,
  respuesta,
  onResponder,
  mostrarResultado = false,
  resultadoRespuesta,
  disabled = false,
}: QuestionRendererProps) {
  const esCorrecta = resultadoRespuesta?.es_correcta ?? false;

  switch (pregunta.tipo) {
    case 'opcion_multiple':
      return (
        <MultipleChoiceQuestion
          opciones={pregunta.opciones}
          respuestaSeleccionada={respuesta as string | undefined}
          onSelect={onResponder}
          mostrarResultado={mostrarResultado}
          disabled={disabled}
        />
      );

    case 'verdadero_falso':
      return (
        <TrueFalseQuestion
          opciones={pregunta.opciones}
          respuestaSeleccionada={respuesta as string | undefined}
          onSelect={onResponder}
          mostrarResultado={mostrarResultado}
          disabled={disabled}
        />
      );

    case 'respuesta_corta':
      return (
        <ShortAnswerQuestion
          opciones={pregunta.opciones}
          respuesta={(respuesta as string) || ''}
          onChange={onResponder}
          mostrarResultado={mostrarResultado}
          esCorrecta={esCorrecta}
          disabled={disabled}
        />
      );

    case 'ordenar':
      // Por ahora, mostrar como múltiple opción
      // TODO: Implementar drag & drop en fase posterior
      return (
        <div className="p-4 bg-muted rounded-xl text-center">
          <p className="text-muted-foreground">
            Pregunta de ordenar (próximamente)
          </p>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-destructive/10 rounded-xl text-center">
          <p className="text-destructive">
            Tipo de pregunta no soportado: {pregunta.tipo}
          </p>
        </div>
      );
  }
}
